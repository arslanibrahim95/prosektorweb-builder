'use server'

import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { z } from 'zod'
import { slugify } from '@/shared/lib'
import { PackageTier, AuditAction } from '@prisma/client'

// ================================
// TYPES
// ================================

export interface SiteCreationResult {
    success: boolean
    error?: string
    data?: {
        projectId: string
        companyId: string
        packageId: string
        pipelineRunId?: string
    }
}

// ================================
// VALIDATION
// ================================

const CompanyDataSchema = z.object({
    companyId: z.string().optional(),
    companyName: z.string().min(2, 'Firma adı en az 2 karakter olmalı'),
    phone: z.string().optional(),
    email: z.string().email('Geçerli e-posta adresi giriniz').optional().or(z.literal('')),
    address: z.string().optional(),
    naceCode: z.string().optional(),
})

const PackageDataSchema = z.object({
    tier: z.nativeEnum(PackageTier),
    addOnFeatures: z.array(z.string()).default([]),
})

const ContentDataSchema = z.object({
    services: z.string().optional(),
    references: z.string().optional(),
    certifications: z.string().optional(),
    workingHours: z.string().optional(),
    colorPreference: z.string().optional(),
    logoUrl: z.string().optional(),
    slogan: z.string().optional(),
})

const SiteCreationSchema = z.object({
    company: CompanyDataSchema,
    package: PackageDataSchema,
    content: ContentDataSchema,
})

export type SiteCreationInput = z.infer<typeof SiteCreationSchema>

// ================================
// TIER CONFIGURATION
// ================================

const TIER_CONFIG: Record<PackageTier, { maxPages: number; maxRevisions: number; price: number }> = {
    STARTER: { maxPages: 5, maxRevisions: 1, price: 7500 },
    PROFESSIONAL: { maxPages: 10, maxRevisions: 2, price: 15000 },
    ENTERPRISE: { maxPages: 999, maxRevisions: 3, price: 35000 },
}

// ================================
// HELPERS
// ================================

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

// ================================
// MAIN ACTION
// ================================

export async function createSiteFromWizard(input: SiteCreationInput): Promise<SiteCreationResult> {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
            return { success: false, error: 'Yetkiniz yok' }
        }

        const parsed = SiteCreationSchema.safeParse(input)
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') }
        }

        const { company: companyData, package: packageData, content: contentData } = parsed.data
        const tierConfig = TIER_CONFIG[packageData.tier]

        // Run everything in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Company: create or update
            let companyId = companyData.companyId
            if (companyId) {
                await tx.company.update({
                    where: { id: companyId },
                    data: {
                        name: companyData.companyName,
                        phone: companyData.phone || undefined,
                        email: companyData.email || undefined,
                        address: companyData.address || undefined,
                        naceCode: companyData.naceCode || undefined,
                    },
                })
            } else {
                const newCompany = await tx.company.create({
                    data: {
                        name: companyData.companyName,
                        phone: companyData.phone || null,
                        email: companyData.email || null,
                        address: companyData.address || null,
                        naceCode: companyData.naceCode || null,
                        status: 'PROSPECT',
                    },
                })
                companyId = newCompany.id
            }

            // 2. WebProject
            const slug = slugify(companyData.companyName + '-osgb')
            // Check slug uniqueness
            const existingSlug = await tx.webProject.findUnique({ where: { slug } })
            const finalSlug = existingSlug ? `${slug}-${Date.now().toString(36)}` : slug

            const project = await tx.webProject.create({
                data: {
                    name: `${companyData.companyName} Web Sitesi`,
                    companyId: companyId!,
                    slug: finalSlug,
                    status: 'DRAFT',
                    price: tierConfig.price,
                    notes: contentData.slogan
                        ? `Slogan: ${contentData.slogan}\n${contentData.services ? `Hizmetler: ${contentData.services}` : ''}`
                        : contentData.services || null,
                    previewEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                },
            })

            // 3. SitePackage
            const sitePackage = await tx.sitePackage.create({
                data: {
                    webProjectId: project.id,
                    tier: packageData.tier,
                    maxRevisions: tierConfig.maxRevisions,
                    maxPages: tierConfig.maxPages,
                    hostingStartDate: new Date(),
                    hostingEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                    isHostingActive: true,
                },
            })

            // 4. PipelineRun
            const pipelineRun = await tx.pipelineRun.create({
                data: {
                    projectId: project.id,
                    status: 'PENDING',
                    currentStage: 'INPUT',
                    stages: {
                        input: {
                            companyName: companyData.companyName,
                            phone: companyData.phone,
                            email: companyData.email,
                            address: companyData.address,
                            naceCode: companyData.naceCode,
                            tier: packageData.tier,
                            addOnFeatures: packageData.addOnFeatures,
                            services: contentData.services,
                            references: contentData.references,
                            certifications: contentData.certifications,
                            workingHours: contentData.workingHours,
                            colorPreference: contentData.colorPreference,
                            logoUrl: contentData.logoUrl,
                            slogan: contentData.slogan,
                        },
                    },
                },
            })

            // 5. Service record (HOSTING)
            const renewDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            await tx.service.create({
                data: {
                    companyId: companyId!,
                    name: `${companyData.companyName} - Web Hosting`,
                    type: 'HOSTING',
                    price: 1200,
                    billingCycle: 'YEARLY',
                    startDate: new Date(),
                    renewDate,
                    status: 'ACTIVE',
                    webProjects: { connect: { id: project.id } },
                },
            })

            return {
                projectId: project.id,
                companyId: companyId!,
                packageId: sitePackage.id,
                pipelineRunId: pipelineRun.id,
            }
        })

        await logActivity('CREATE', 'WebProject', result.projectId, {
            tier: packageData.tier,
            companyName: companyData.companyName,
        })

        revalidatePath('/admin/projects')
        return { success: true, data: result }
    } catch (error: any) {
        console.error('Site creation error:', error)
        return { success: false, error: error.message || 'Bir hata oluştu' }
    }
}

export async function getCompaniesForWizard() {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') return []

    return prisma.company.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, phone: true, email: true, address: true, naceCode: true },
        orderBy: { name: 'asc' },
    })
}
