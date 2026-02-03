'use server'

import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getErrorMessage, getZodErrorMessage, isPrismaUniqueConstraintError, logger } from '@/shared/lib'
import { checkRateLimit, getClientIp } from '@/shared/lib/rate-limit'
import { encrypt } from '@/features/auth/lib/crypto'
import { z } from 'zod'
import { AuditAction, DomainStatus } from '@prisma/client'

export interface DomainInput {
    name: string
    companyId?: string
    registrar?: string
    serverIp?: string
    expiresAt?: Date
    autoRenew?: boolean
    price?: number
    notes?: string
}

export interface ActionResult {
    success: boolean
    error?: string
    data?: any
}

export interface DomainCheckResult {
    domain: string
    extension: string
    available: boolean
    error?: string
}

export interface DomainSearchResult {
    success: boolean
    results: DomainCheckResult[]
    error?: string
}

const DomainSchema = z.object({
    name: z.string().min(3, 'Domain adı en az 3 karakter olmalı'),
    extension: z.string().min(2),
    companyId: z.string().optional(),
    registrar: z.string().optional(),
    serverIp: z.string().optional(),
    expiresAt: z.string().optional(),
    notes: z.string().optional(),
})

// Stats
export async function getDomainStats() {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') return { total: 0, active: 0, pending: 0, suspended: 0, expired: 0, expiringSoon: 0 }

        const [total, active, pending, suspended, expired] = await Promise.all([
            prisma.domain.count({ where: { deletedAt: null } }),
            prisma.domain.count({ where: { status: 'ACTIVE', deletedAt: null } }),
            prisma.domain.count({ where: { status: 'PENDING', deletedAt: null } }),
            prisma.domain.count({ where: { status: 'SUSPENDED', deletedAt: null } }),
            prisma.domain.count({ where: { status: 'EXPIRED', deletedAt: null } }),
        ])

        // Expiring Soon (Next 30 days)
        const next30Days = new Date()
        next30Days.setDate(next30Days.getDate() + 30)

        const expiringSoon = await prisma.domain.count({
            where: {
                status: 'ACTIVE',
                expiresAt: {
                    lte: next30Days,
                    gte: new Date()
                },
                deletedAt: null
            }
        })

        return {
            total,
            active,
            pending,
            suspended,
            expired,
            expiringSoon
        }
    } catch (e) {
        return { total: 0, active: 0, pending: 0, suspended: 0, expired: 0, expiringSoon: 0 }
    }
}

async function logActivity(action: AuditAction, entity: string, entityId: string, details?: any) {
    const session = await auth()
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                details: details ? JSON.stringify(details) : undefined,
                userId: session?.user?.id,
                userEmail: session?.user?.email,
                userName: session?.user?.name
            }
        })
    } catch (e) {
        console.error('Audit Log Failed:', e)
    }
}

import { CursorPaginatedResponse } from '@/shared/lib/action-types'

export async function getDomains(cursor?: string, limit: number = 20, search?: string): Promise<CursorPaginatedResponse<any>> {
    try {
        const session = await auth()
        if (!session?.user) return { data: [], meta: { nextCursor: null, limit } }

        const where: any = {
            deletedAt: null
        }

        // AuthZ: Non-admins can only see their own company's domains
        if (session.user.role !== 'ADMIN') {
            if (!session.user.companyId) return { data: [], meta: { nextCursor: null, limit } }
            where.companyId = session.user.companyId
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { company: { name: { contains: search } } }
            ]
        }

        const data = await prisma.domain.findMany({
            where,
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { expiresAt: 'asc' }, // Prioritize expiration
            include: {
                company: { select: { id: true, name: true } },
                _count: { select: { dnsRecords: true } }
            }
        })

        let nextCursor: string | null = null
        if (data.length > limit) {
            const nextItem = data.pop()
            nextCursor = nextItem?.id || null
        }

        return {
            data,
            meta: {
                nextCursor,
                limit
            }
        }
    } catch (e) {
        console.error('getDomains Error:', e)
        return { data: [], meta: { nextCursor: null, limit } }
    }
}

export async function getDomain(id: string) {
    try {
        const session = await auth()
        if (!session?.user) return null

        const domain = await prisma.domain.findUnique({
            where: { id },
            include: {
                company: true,
                dnsRecords: true,
                webProjects: true
            }
        })

        if (!domain) return null

        // AuthZ: ADMIN or USER who belongs to this company
        if (session.user.role !== 'ADMIN' && session.user.companyId !== domain.companyId) {
            return null
        }

        return domain
    } catch (e) {
        return null
    }
}

export async function createDomain(input: DomainInput | FormData): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' }
        }

        const rawData = input instanceof FormData ? {
            name: input.get('name') as string,
            extension: input.get('extension') as string,
            companyId: input.get('companyId') as string || undefined,
            registrar: input.get('registrar') as string || undefined,
            serverIp: input.get('serverIp') as string || undefined,
            expiresAt: input.get('expiresAt') as string || undefined,
            notes: input.get('notes') as string || undefined,
        } : input

        const validated = DomainSchema.parse(rawData)

        // Combine name with extension if extension provided explicitly in form
        let fullDomain = validated.name.toLowerCase().replace(/\s/g, '')
        if (validated.extension && !fullDomain.endsWith(validated.extension)) {
            fullDomain += validated.extension
        }

        const domain = await prisma.domain.create({
            data: {
                name: fullDomain,
                extension: validated.extension || (fullDomain.includes('.') ? '.' + fullDomain.split('.').pop() : '.com'),
                companyId: validated.companyId || null,
                registrar: validated.registrar || null,
                serverIp: validated.serverIp || null,
                expiresAt: validated.expiresAt ? new Date(validated.expiresAt) : null,
                notes: validated.notes || null,
                status: 'ACTIVE',
                registeredAt: new Date(),
            },
        })

        await logActivity('CREATE', 'Domain', domain.id, { name: domain.name })
        revalidatePath('/admin/domains')
        return { success: true, data: domain }
    } catch (e: any) {
        if (isPrismaUniqueConstraintError(e)) {
            return { success: false, error: 'Bu domain zaten kayıtlı.' }
        }
        if (e instanceof z.ZodError) {
            return { success: false, error: getZodErrorMessage(e) }
        }
        return { success: false, error: 'Domain oluşturulamadı' }
    }
}

export async function updateDomain(id: string, data: Partial<DomainInput>): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' }
        }

        const domain = await prisma.domain.update({
            where: { id },
            data
        })

        await logActivity('UPDATE', 'Domain', id, data)
        revalidatePath('/admin/domains')
        revalidatePath(`/admin/domains/${id}`)
        return { success: true, data: domain }
    } catch (e) {
        return { success: false, error: 'Güncelleme başarısız' }
    }
}

export async function deleteDomain(id: string): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' }
        }

        await prisma.domain.update({
            where: { id },
            data: { deletedAt: new Date() }
        })

        await logActivity('DELETE', 'Domain', id)
        revalidatePath('/admin/domains')
        return { success: true }
    } catch (e) {
        return { success: false, error: 'Silme işlemi başarısız' }
    }
}

// ==========================================
// DNS RECORDS
// ==========================================

export async function createDnsRecord(formData: FormData): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' }

        const domainId = formData.get('domainId') as string
        const type = formData.get('type') as any
        const name = formData.get('name') as string
        const value = formData.get('value') as string
        const ttl = parseInt(formData.get('ttl') as string) || 3600
        const priority = formData.get('priority') ? parseInt(formData.get('priority') as string) : undefined

        const record = await prisma.dnsRecord.create({
            data: {
                domainId,
                type,
                name,
                value,
                ttl,
                priority
            }
        })

        await logActivity('CREATE', 'DnsRecord', record.id, { name, type, domainId })
        revalidatePath(`/admin/domains/${domainId}`)
        return { success: true, data: record }
    } catch (e) {
        return { success: false, error: 'DNS kaydı oluşturulamadı' }
    }
}

export async function deleteDnsRecord(id: string, domainId: string): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' }

        await prisma.dnsRecord.delete({ where: { id } })

        await logActivity('DELETE', 'DnsRecord', id, { domainId })
        revalidatePath(`/admin/domains/${domainId}`)
        return { success: true }
    } catch (e) {
        return { success: false, error: 'Silme başarısız' }
    }
}

// ==========================================
// API CONFIG
// ==========================================

export async function getApiConfigs() {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') return []

        const configs = await prisma.apiConfig.findMany({ orderBy: { name: 'asc' } })

        // Mask
        return configs.map(config => ({
            ...config,
            apiKey: config.apiKey ? '••••••••' + (config.apiKey.slice(-4) || '') : null,
            apiSecret: config.apiSecret ? '••••••••' + (config.apiSecret.slice(-4) || '') : null,
            hasApiKey: !!config.apiKey,
            hasApiSecret: !!config.apiSecret,
        }))
    } catch (e) {
        return []
    }
}

export async function saveApiConfig(formData: FormData): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' }

        const provider = formData.get('provider') as string
        const name = formData.get('name') as string
        const apiKey = formData.get('apiKey') as string
        const apiSecret = formData.get('apiSecret') as string
        const apiEndpoint = formData.get('apiEndpoint') as string

        // Encrypt sensitive keys
        const encryptedApiKey = apiKey ? encrypt(apiKey) : undefined
        const encryptedApiSecret = apiSecret ? encrypt(apiSecret) : undefined

        await prisma.apiConfig.upsert({
            where: { provider },
            update: {
                name,
                apiKey: encryptedApiKey, // Only update if provided
                apiSecret: encryptedApiSecret,
                apiEndpoint,
                isActive: true
            },
            create: {
                provider,
                name,
                apiKey: encryptedApiKey || '',
                apiSecret: encryptedApiSecret || '',
                apiEndpoint,
                isActive: true
            }
        })

        await logActivity('UPDATE', 'ApiConfig', provider, { name })
        revalidatePath('/admin/domains/settings')
        return { success: true }
    } catch (e) {
        return { success: false, error: 'Kaydedilemedi' }
    }
}

// ==========================================
// SEARCH LOGIC (RDAP/DNS)
// ==========================================

async function checkDomainAvailability(domain: string): Promise<boolean> {
    try {
        const existing = await prisma.domain.findUnique({ where: { name: domain } })
        if (existing) return false

        const fetchWithTimeout = async (url: string, timeoutMs: number) => {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), timeoutMs)
            try {
                return await fetch(url, { signal: controller.signal })
            } finally {
                clearTimeout(timeout)
            }
        }

        if (domain.endsWith('.com') && !domain.endsWith('.com.tr')) {
            const response = await fetchWithTimeout(
                `https://rdap.verisign.com/com/v1/domain/${domain}`,
                5000
            )
            return response.status === 404
        }

        const dnsResponse = await fetchWithTimeout(
            `https://dns.google/resolve?name=${domain}&type=NS`,
            5000
        )
        const data = await dnsResponse.json()
        return data.Status === 3 || !data.Answer
    } catch (e) {
        return false
    }
}

function isValidLabel(label: string): boolean {
    if (label.length < 1 || label.length > 63) return false
    if (label.startsWith('-') || label.endsWith('-')) return false
    return true
}

export async function searchDomains(query: string): Promise<DomainSearchResult> {
    try {
        const session = await auth()
        if (!session) {
            return { success: false, results: [], error: 'Arama yapmak için giriş yapmalısınız.' }
        }

        const ip = await getClientIp()
        const rateKey = session.user?.id || ip
        const limit = await checkRateLimit(`domain_search:${rateKey}`, { limit: 30, windowSeconds: 3600 })

        if (!limit.success) {
            return { success: false, results: [], error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyiniz.' }
        }

        let cleanQuery = query.toLowerCase().trim()
        cleanQuery = cleanQuery.replace(/\.(com|net|org|tr|com\.tr)$/i, '')
        cleanQuery = cleanQuery.replace(/^www\./i, '')

        if (!/^[a-z0-9-]+$/.test(cleanQuery)) {
            return { success: false, results: [], error: 'Geçersiz karakterler. Sadece harf, rakam ve tire kullanınız.' }
        }

        if (cleanQuery.length < 2) return { success: false, results: [], error: 'En az 2 karakter.' }
        if (!isValidLabel(cleanQuery)) return { success: false, results: [], error: 'Geçersiz format.' }

        const extensions = ['.com', '.com.tr']
        const results = await Promise.all(
            extensions.map(async (ext): Promise<DomainCheckResult> => {
                const fullDomain = `${cleanQuery}${ext}`
                try {
                    const available = await checkDomainAvailability(fullDomain)
                    return { domain: fullDomain, extension: ext, available }
                } catch {
                    return { domain: fullDomain, extension: ext, available: false, error: 'Hata' }
                }
            })
        )

        return { success: true, results }
    } catch (error) {
        console.error('searchDomains error:', error)
        return { success: false, results: [], error: 'Arama hatası.' }
    }
}
