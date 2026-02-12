'use server'

import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { z } from 'zod'
import { slugify } from '@/shared/lib'
import { AuditAction } from '@prisma/client'

type PackageTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'

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

const CompanyDataSchema = z.object({
    companyId: z.string().optional(),
    companyName: z.string().min(2, 'Firma adı en az 2 karakter olmalı'),
    phone: z.string().optional(),
    email: z.string().email('Geçerli e-posta adresi giriniz').optional().or(z.literal('')),
    address: z.string().optional(),
    naceCode: z.string().optional(),
})

const PackageDataSchema = z.object({
    tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
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

const TIER_CONFIG: Record<PackageTier, { maxPages: number; maxRevisions: number; price: number }> = {
    STARTER: { maxPages: 5, maxRevisions: 1, price: 7500 },
    PROFESSIONAL: { maxPages: 10, maxRevisions: 2, price: 15000 },
    ENTERPRISE: { maxPages: 999, maxRevisions: 3, price: 35000 },
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

function buildNotes(content: z.infer<typeof ContentDataSchema>, addOnFeatures: string[]): string | null {
    const lines: string[] = []

    if (content.slogan) lines.push(`Slogan: ${content.slogan}`)
    if (content.services) lines.push(`Hizmetler: ${content.services}`)
    if (content.references) lines.push(`Referanslar: ${content.references}`)
    if (content.certifications) lines.push(`Sertifikalar: ${content.certifications}`)
    if (addOnFeatures.length > 0) lines.push(`Ek Özellikler: ${addOnFeatures.join(', ')}`)

    return lines.length > 0 ? lines.join('\n') : null
}

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
        const tierConfig = TIER_CONFIG[packageData.tier as PackageTier]

        const result = await prisma.$transaction(async (tx) => {
            let companyId = companyData.companyId

            if (companyId) {
                await tx.company.update({
                    where: { id: companyId },
                    data: {
                        name: companyData.companyName,
                        phone: companyData.phone || undefined,
                        email: companyData.email || undefined,
                        address: companyData.address || undefined,
                    },
                })
            } else {
                const newCompany = await tx.company.create({
                    data: {
                        name: companyData.companyName,
                        phone: companyData.phone || null,
                        email: companyData.email || null,
                        address: companyData.address || null,
                    },
                })
                companyId = newCompany.id
            }

            const slugBase = slugify(`${companyData.companyName}-osgb`)
            const existingSlug = await tx.webProject.findUnique({ where: { slug: slugBase } })
            const slug = existingSlug ? `${slugBase}-${Date.now().toString(36)}` : slugBase

            const project = await tx.webProject.create({
                data: {
                    name: `${companyData.companyName} Web Sitesi`,
                    companyId: companyId!,
                    slug,
                    template: packageData.tier.toLowerCase(),
                    industry: 'OSGB',
                    status: 'DRAFT',
                    price: tierConfig.price,
                    notes: buildNotes(contentData, packageData.addOnFeatures),
                },
            })

            await tx.siteSettings.create({
                data: {
                    projectId: project.id,
                    workingHours: contentData.workingHours || null,
                    siteTitle: `${companyData.companyName} | OSGB`,
                    siteDescription: contentData.slogan || contentData.services || null,
                    keywords: ['osgb', 'isg', 'is sagligi', 'is guvenligi'],
                    design: {
                        primaryColor: contentData.colorPreference || '#0F766E',
                        logoUrl: contentData.logoUrl || null,
                    },
                },
            })

            await tx.projectTask.create({
                data: {
                    projectId: project.id,
                    title: `Kickoff: ${packageData.tier} paket kurulumu`,
                    status: 'TODO',
                },
            })

            return {
                projectId: project.id,
                companyId: companyId!,
                packageId: project.id,
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

    const companies = await prisma.company.findMany({
        select: { id: true, name: true, phone: true, email: true, address: true },
        orderBy: { name: 'asc' },
    })

    return companies.map(company => ({
        ...company,
        naceCode: null,
    }))
}
