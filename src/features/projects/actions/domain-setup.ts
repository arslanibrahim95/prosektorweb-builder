'use server'

import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { AuditAction } from '@prisma/client'

interface DeployResult {
    success: boolean
    error?: string
    data?: {
        domainId: string
        siteUrl: string
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
                userName: session?.user?.name,
            },
        })
    } catch (e) {
        console.error('Audit Log Failed:', e)
    }
}

export async function deploySiteToCustomDomain(
    projectId: string,
    domainName: string
): Promise<DeployResult> {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
            return { success: false, error: 'Yetkiniz yok' }
        }

        const project = await prisma.webProject.findUnique({
            where: { id: projectId },
            include: { company: true, sitePackage: true },
        })

        if (!project) return { success: false, error: 'Proje bulunamadi' }
        if (!project.isPaid) return { success: false, error: 'Proje odemesi yapilmamis' }

        // Normalize domain
        const cleanDomain = domainName.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
        const extension = cleanDomain.includes('.com.tr') ? '.com.tr' : `.${cleanDomain.split('.').pop()}`

        const result = await prisma.$transaction(async (tx) => {
            // 1. Domain record
            let domain = await tx.domain.findUnique({ where: { name: cleanDomain } })
            if (!domain) {
                domain = await tx.domain.create({
                    data: {
                        name: cleanDomain,
                        extension,
                        companyId: project.companyId,
                        status: 'PENDING',
                        registeredAt: new Date(),
                        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        autoRenew: true,
                    },
                })
            }

            // 2. DNS records (A records for domain and www)
            const apiConfig = await tx.apiConfig.findFirst({
                where: { provider: 'CLOUDFLARE', isActive: true },
            })
            const serverIp = apiConfig?.defaultIp || '0.0.0.0'

            // Create A record for root
            await tx.dnsRecord.create({
                data: {
                    domainId: domain.id,
                    type: 'A',
                    name: '@',
                    value: serverIp,
                    ttl: 3600,
                    isActive: true,
                },
            })

            // Create A record for www
            await tx.dnsRecord.create({
                data: {
                    domainId: domain.id,
                    type: 'A',
                    name: 'www',
                    value: serverIp,
                    ttl: 3600,
                    isActive: true,
                },
            })

            // 3. Update domain with server IP and SSL
            await tx.domain.update({
                where: { id: domain.id },
                data: {
                    serverIp,
                    sslEnabled: true,
                    status: 'ACTIVE',
                },
            })

            // 4. Update WebProject
            const siteUrl = `https://${cleanDomain}`
            await tx.webProject.update({
                where: { id: projectId },
                data: {
                    siteUrl,
                    status: 'LIVE',
                    domainId: domain.id,
                    completedAt: new Date(),
                },
            })

            // 5. Create service records
            const renewDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

            // Domain service
            await tx.service.create({
                data: {
                    companyId: project.companyId,
                    name: `${cleanDomain} - Domain`,
                    type: 'DOMAIN',
                    price: 350,
                    billingCycle: 'YEARLY',
                    startDate: new Date(),
                    renewDate,
                    status: 'ACTIVE',
                },
            })

            // Site fee (one-time)
            const tierPrice = project.price || project.sitePackage?.tier === 'ENTERPRISE'
                ? 35000
                : project.sitePackage?.tier === 'PROFESSIONAL'
                    ? 15000
                    : 7500

            await tx.service.create({
                data: {
                    companyId: project.companyId,
                    name: `${project.company.name} - Web Sitesi`,
                    type: 'OTHER',
                    price: typeof tierPrice === 'object' ? 7500 : tierPrice,
                    billingCycle: 'ONETIME',
                    startDate: new Date(),
                    renewDate: new Date(),
                    status: 'ACTIVE',
                    webProjects: { connect: { id: projectId } },
                },
            })

            // 6. Update company status to CUSTOMER
            await tx.company.update({
                where: { id: project.companyId },
                data: { status: 'CUSTOMER' },
            })

            return { domainId: domain.id, siteUrl }
        })

        await logActivity('UPDATE', 'WebProject', projectId, {
            action: 'deploy',
            domain: cleanDomain,
        })

        revalidatePath('/admin/projects')
        revalidatePath(`/admin/projects/${projectId}`)

        return { success: true, data: result }
    } catch (error: any) {
        console.error('Deploy error:', error)
        return { success: false, error: error.message || 'Deploy sirasinda hata olustu' }
    }
}
