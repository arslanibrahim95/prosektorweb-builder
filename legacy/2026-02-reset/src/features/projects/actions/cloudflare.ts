'use server'

import { prisma } from '@/server/db'
import { getCloudflareService } from '@/server/integrations/cloudflare'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/shared/lib'

// ==========================================
// TYPES
// ==========================================

export interface CloudflareActionResult {
    success: boolean
    data?: any
    error?: string
}

// ==========================================
// TOKEN VERIFICATION
// ==========================================

export async function verifyCloudflareToken(): Promise<CloudflareActionResult> {
    try {
        await requireAuth(['ADMIN'])
        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, error: 'Cloudflare API anahtarı yapılandırılmamış' }
        }

        const result = await cf.verifyToken()
        return { success: result.valid, error: result.error }
    } catch (error) {
        console.error('verifyCloudflareToken error:', error)
        return { success: false, error: 'Token doğrulama hatası' }
    }
}

// ==========================================
// ZONE MANAGEMENT
// ==========================================

export async function listCloudflareZones(): Promise<CloudflareActionResult> {
    try {
        await requireAuth(['ADMIN'])
        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, error: 'Cloudflare yapılandırılmamış' }
        }

        const zones = await cf.listZones()
        return { success: true, data: zones }
    } catch (error) {
        console.error('listCloudflareZones error:', error)
        return { success: false, error: 'Zone listesi alınamadı' }
    }
}

export async function addDomainToCloudflare(domainId: string): Promise<CloudflareActionResult> {
    try {
        await requireAuth(['ADMIN'])
        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, error: 'Cloudflare yapılandırılmamış' }
        }

        // Get domain from database
        const domain = await prisma.domain.findUnique({ where: { id: domainId } })
        if (!domain) {
            return { success: false, error: 'Domain bulunamadı' }
        }

        // Check if zone already exists
        const existingZone = await cf.getZoneByName(domain.name)
        if (existingZone) {
            // Update domain with zone info
            await prisma.domain.update({
                where: { id: domainId },
                data: {
                    registrar: 'Cloudflare',
                    notes: `Zone ID: ${existingZone.id}\nNameservers: ${existingZone.name_servers.join(', ')}`
                },
            })
            revalidatePath(`/admin/domains/${domainId}`)
            return {
                success: true,
                data: {
                    message: 'Zone zaten mevcut',
                    nameServers: existingZone.name_servers
                }
            }
        }

        // Create new zone
        const result = await cf.createZone(domain.name)
        if (!result.success) {
            return { success: false, error: result.error }
        }

        // Update domain with zone info
        await prisma.domain.update({
            where: { id: domainId },
            data: {
                registrar: 'Cloudflare',
                notes: `Zone ID: ${result.zone!.id}\nNameservers: ${result.zone!.name_servers.join(', ')}`
            },
        })

        revalidatePath(`/admin/domains/${domainId}`)
        return {
            success: true,
            data: {
                message: 'Zone oluşturuldu',
                nameServers: result.zone!.name_servers
            }
        }
    } catch (error) {
        console.error('addDomainToCloudflare error:', error)
        return { success: false, error: 'Cloudflare zone oluşturma hatası' }
    }
}

// ==========================================
// DNS SYNC
// ==========================================

export async function syncDnsToCloudflare(domainId: string): Promise<CloudflareActionResult> {
    try {
        await requireAuth(['ADMIN'])
        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, error: 'Cloudflare yapılandırılmamış' }
        }

        // Get domain with DNS records
        const domain = await prisma.domain.findUnique({
            where: { id: domainId },
            include: { dnsRecords: true },
        })
        if (!domain) {
            return { success: false, error: 'Domain bulunamadı' }
        }

        // Get Cloudflare zone
        const zone = await cf.getZoneByName(domain.name)
        if (!zone) {
            return { success: false, error: 'Cloudflare zone bulunamadı. Önce zone oluşturun.' }
        }

        // Sync each DNS record
        const results: string[] = []
        for (const record of domain.dnsRecords) {
            const result = await cf.createDnsRecord(
                zone.id,
                record.type,
                record.name === '@' ? domain.name : `${record.name}.${domain.name}`,
                record.value,
                record.ttl,
                record.priority || undefined,
                true // proxied
            )

            if (result.success) {
                results.push(`✅ ${record.type} ${record.name} → ${record.value}`)
            } else {
                results.push(`❌ ${record.type} ${record.name}: ${result.error}`)
            }
        }

        return { success: true, data: { results } }
    } catch (error) {
        console.error('syncDnsToCloudflare error:', error)
        return { success: false, error: 'DNS senkronizasyon hatası' }
    }
}

// ==========================================
// QUICK SETUP - Standard Website
// ==========================================

export async function setupStandardDns(domainId: string): Promise<CloudflareActionResult> {
    try {
        await requireAuth(['ADMIN'])
        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, error: 'Cloudflare yapılandırılmamış' }
        }

        // Get domain
        const domain = await prisma.domain.findUnique({ where: { id: domainId } })
        if (!domain) {
            return { success: false, error: 'Domain bulunamadı' }
        }

        if (!domain.serverIp) {
            return { success: false, error: 'Sunucu IP adresi belirtilmemiş' }
        }

        // Get or create zone
        let zone = await cf.getZoneByName(domain.name)
        if (!zone) {
            const createResult = await cf.createZone(domain.name)
            if (!createResult.success) {
                return { success: false, error: createResult.error }
            }
            zone = createResult.zone!
        }

        // Create standard DNS records
        const result = await cf.createStandardWebsiteDns(zone.id, domain.name, domain.serverIp)

        if (result.success) {
            // Also save to local database
            await prisma.dnsRecord.createMany({
                data: [
                    { domainId, type: 'A', name: '@', value: domain.serverIp, ttl: 3600 },
                    { domainId, type: 'A', name: 'www', value: domain.serverIp, ttl: 3600 },
                ],
                skipDuplicates: true,
            })

            await prisma.domain.update({
                where: { id: domainId },
                data: {
                    registrar: 'Cloudflare',
                    notes: `Zone ID: ${zone.id}\nNameservers: ${zone.name_servers.join(', ')}`
                },
            })

            revalidatePath(`/admin/domains/${domainId}`)
            return {
                success: true,
                data: {
                    message: 'DNS kayıtları oluşturuldu',
                    nameServers: zone.name_servers
                }
            }
        }

        return { success: false, error: result.error }
    } catch (error) {
        console.error('setupStandardDns error:', error)
        return { success: false, error: 'DNS kurulum hatası' }
    }
}

// ==========================================
// GET CLOUDFLARE STATUS
// ==========================================

export async function getCloudflareStatus(): Promise<CloudflareActionResult> {
    try {
        await requireAuth(['ADMIN'])
        const config = await prisma.apiConfig.findUnique({
            where: { provider: 'CLOUDFLARE' },
        })

        if (!config?.apiKey) {
            return { success: false, error: 'API anahtarı yapılandırılmamış' }
        }

        const cf = await getCloudflareService()
        if (!cf) {
            return { success: false, error: 'Servis oluşturulamadı' }
        }

        const tokenResult = await cf.verifyToken()
        if (!tokenResult.valid) {
            return { success: false, error: 'API anahtarı geçersiz' }
        }

        const zones = await cf.listZones()
        return {
            success: true,
            data: {
                connected: true,
                zoneCount: zones.length,
                zones: zones.map(z => ({ name: z.name, status: z.status }))
            }
        }
    } catch (error) {
        console.error('getCloudflareStatus error:', error)
        return { success: false, error: 'Durum kontrolü hatası' }
    }
}
