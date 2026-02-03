'use server'

import { getCloudflareService, getDefaultServerIp } from '@/server/integrations/cloudflare'
import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

// ==========================================
// TYPES
// ==========================================

export interface DomainSearchResult {
    domain: string
    tld: string
    available: boolean
    premium: boolean
    registerPrice?: number
    renewPrice?: number
    currency?: string
    error?: string
}

export interface RegistrationResult {
    success: boolean
    domain?: any
    error?: string
}

// ==========================================
// HELPERS
// ==========================================
async function requireAdmin() {
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required')
    }
}

// ==========================================
// DOMAIN AVAILABILITY CHECK WITH PRICING
// ==========================================

import { createSafeAction } from '@/shared/lib'
import { checkRateLimit, getClientIp } from '@/shared/lib/rate-limit'

export async function searchDomainsWithPricing(query: string): Promise<{
    success: boolean
    results: DomainSearchResult[]
    error?: string
}> {
    const ip = await getClientIp()
    const limit = await checkRateLimit(`domain_search:${ip}`, { limit: 20, windowSeconds: 3600 }) // 20 attempts per hour

    if (!limit.success) {
        return { success: false, results: [], error: 'Saatlik arama limitine ulaştınız.' }
    }
    try {
        // Search public access? Let's limit it to authenticated users at least
        const session = await auth()
        if (!session) {
            return { success: false, results: [], error: 'Oturum açmanız gerekiyor' }
        }

        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, results: [], error: 'Cloudflare yapılandırılmamış' }
        }

        // Clean query
        let cleanQuery = query.toLowerCase().trim()
        cleanQuery = cleanQuery.replace(/\.(com|net|org|io|co)$/i, '')
        cleanQuery = cleanQuery.replace(/^www\./i, '')
        cleanQuery = cleanQuery.replace(/[^a-z0-9-]/g, '')

        if (cleanQuery.length < 2) {
            return { success: false, results: [], error: 'En az 2 karakter giriniz.' }
        }

        // Check multiple TLDs
        const tlds = ['com', 'net', 'org']

        const results = await Promise.all(
            tlds.map(async (tld): Promise<DomainSearchResult> => {
                const fullDomain = `${cleanQuery}.${tld}`

                try {
                    // Check availability
                    const availResult = await cf.checkDomainAvailability(fullDomain)

                    // Get pricing
                    const priceResult = await cf.getDomainPricing(tld)

                    return {
                        domain: fullDomain,
                        tld: `.${tld}`,
                        available: availResult.available,
                        premium: availResult.premium,
                        registerPrice: priceResult.registerPrice,
                        renewPrice: priceResult.renewPrice,
                        currency: priceResult.currency,
                        error: availResult.error || priceResult.error,
                    }
                } catch (error) {
                    return {
                        domain: fullDomain,
                        tld: `.${tld}`,
                        available: false,
                        premium: false,
                        error: 'Kontrol edilemedi',
                    }
                }
            })
        )

        return { success: true, results }
    } catch (error) {
        console.error('searchDomainsWithPricing error:', error)
        return { success: false, results: [], error: 'Arama hatası' }
    }
}

// ==========================================
// REGISTER DOMAIN
// ==========================================

const purchaseDomainHandler = async ({ domain, contactInfo, companyId }: {
    domain: string,
    contactInfo: {
        firstName: string
        lastName: string
        address: string
        city: string
        postalCode: string
        country: string
        phone: string
        email: string
    },
    companyId?: string
}) => {
    await requireAdmin()

    const cf = await getCloudflareService()
    if (!cf) {
        throw new Error('Cloudflare yapılandırılmamış')
    }

    // Pre-flight Check: Verify availability and Premium status again
    const availability = await cf.checkDomainAvailability(domain)
    if (!availability.available) {
        throw new Error('Alan adı artık müsait değil.')
    }

    // Block Premium domains for safety
    if (availability.premium) {
        throw new Error('Premium alan adları şu an otomatik satın alınamaz.')
    }

    // Register domain via Cloudflare
    const result = await cf.registerDomain(domain, 1, contactInfo)

    if (!result.success || !result.domain) {
        throw new Error(result.error || 'Domain kaydı alınamadı')
    }

    // Save to our database
    const serverIp = getDefaultServerIp()
    const tld = '.' + domain.split('.').slice(1).join('.')
    const expiresAt = result.domain.expires_at
        ? new Date(result.domain.expires_at)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

    await prisma.domain.create({
        data: {
            name: domain,
            extension: tld,
            status: 'ACTIVE',
            registrar: 'Cloudflare',
            serverIp: serverIp || null,
            registeredAt: new Date(),
            expiresAt,
            companyId: companyId || null,
            notes: 'Cloudflare üzerinden satın alındı',
        },
    })

    // Create DNS zone
    if (serverIp) {
        try {
            await cf.createZone(domain)
            const zone = await cf.getZoneByName(domain)
            if (zone) {
                await cf.createStandardWebsiteDns(zone.id, domain, serverIp)
            }
        } catch (e) {
            console.log('DNS setup warning:', e)
        }
    }

    // Log Domain Purchase
    const auditLib = await import('@/shared/lib')
    const authLib = await import('@/auth')
    const session = await authLib.auth()

    await auditLib.createAuditLog({
        action: 'DOMAIN_PURCHASE',
        entity: 'Domain',
        entityId: domain,
        details: { companyId, registrar: 'Cloudflare', price: 'Standard' },
        userId: session?.user?.id
    })

    revalidatePath('/admin/domains')
    return result.domain
}

export const purchaseDomain = createSafeAction('purchaseDomain', purchaseDomainHandler)

// ==========================================
// GET TLD PRICING
// ==========================================

export async function getAllTldPricing(): Promise<{
    success: boolean
    pricing: Array<{ tld: string; register: number; renew: number }>
    error?: string
}> {
    try {
        const session = await auth()
        if (!session) {
            return { success: false, pricing: [], error: 'Oturum açmanız gerekiyor' }
        }

        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, pricing: [], error: 'Cloudflare yapılandırılmamış' }
        }

        const accountId = await cf.getAccountId()
        if (!accountId) {
            return { success: false, pricing: [], error: 'Hesap bulunamadı' }
        }

        // Get pricing for popular TLDs
        const tlds = ['com', 'net', 'org', 'io', 'co', 'dev', 'app']
        const pricing: Array<{ tld: string; register: number; renew: number }> = []

        for (const tld of tlds) {
            const result = await cf.getDomainPricing(tld)
            if (result.registerPrice) {
                pricing.push({
                    tld: `.${tld}`,
                    register: result.registerPrice,
                    renew: result.renewPrice || result.registerPrice,
                })
            }
        }

        return { success: true, pricing }
    } catch (error) {
        console.error('getAllTldPricing error:', error)
        return { success: false, pricing: [], error: 'Fiyat alınamadı' }
    }
}
