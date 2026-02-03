'use server'

import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/shared/lib'

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[ğ]/g, 'g')
        .replace(/[ü]/g, 'u')
        .replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i')
        .replace(/[ö]/g, 'o')
        .replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

export async function getPortfolios(publishedOnly = false) {
    const where = publishedOnly ? { isPublished: true } : {}

    return await prisma.portfolio.findMany({
        where,
        include: {
            webProject: {
                select: {
                    name: true,
                    siteUrl: true,
                    company: { select: { name: true } }
                }
            }
        },
        orderBy: [
            { isFeatured: 'desc' },
            { displayOrder: 'asc' },
            { publishedAt: 'desc' }
        ]
    })
}

export async function getPortfolioBySlug(slug: string) {
    return await prisma.portfolio.findUnique({
        where: { slug, isPublished: true },
        include: {
            webProject: {
                select: {
                    name: true,
                    siteUrl: true,
                    company: { select: { name: true } }
                }
            }
        }
    })
}

interface CreatePortfolioInput {
    webProjectId: string
    title: string
    description: string
    coverImage?: string
    technologies?: string[]
    clientQuote?: string
    clientName?: string
    results?: string
}

export async function createPortfolio(input: CreatePortfolioInput) {
    try {
        await requireAuth(['ADMIN'])
        // Check if project already has portfolio
        const existing = await prisma.portfolio.findUnique({
            where: { webProjectId: input.webProjectId }
        })

        if (existing) {
            return { success: false, error: 'Bu proje zaten portfolyoya ekli' }
        }

        const slug = generateSlug(input.title) + '-' + Date.now().toString(36)

        const portfolio = await prisma.portfolio.create({
            data: {
                webProjectId: input.webProjectId,
                title: input.title,
                slug,
                description: input.description,
                coverImage: input.coverImage,
                technologies: input.technologies,
                clientQuote: input.clientQuote,
                clientName: input.clientName,
                results: input.results
            }
        })

        revalidatePath('/admin/portfolio')
        revalidatePath('/portfolio')
        return { success: true, data: portfolio }
    } catch (error) {
        console.error('createPortfolio error:', error)
        return { success: false, error: 'Portfolyo oluşturulamadı' }
    }
}

export async function updatePortfolio(id: string, data: Partial<{
    title: string
    description: string
    coverImage: string
    technologies: string[]
    clientQuote: string
    clientName: string
    results: string
    isFeatured: boolean
    isPublished: boolean
    displayOrder: number
}>) {
    try {
        await requireAuth(['ADMIN'])
        const updateData: any = { ...data }

        // Update publishedAt when publishing
        if (data.isPublished === true) {
            const existing = await prisma.portfolio.findUnique({ where: { id } })
            if (!existing?.publishedAt) {
                updateData.publishedAt = new Date()
            }
        }

        await prisma.portfolio.update({
            where: { id },
            data: updateData
        })

        revalidatePath('/admin/portfolio')
        revalidatePath('/portfolio')
        return { success: true }
    } catch (error) {
        console.error('updatePortfolio error:', error)
        return { success: false, error: 'Güncellenemedi' }
    }
}

export async function deletePortfolio(id: string) {
    try {
        await requireAuth(['ADMIN'])
        await prisma.portfolio.delete({ where: { id } })
        revalidatePath('/admin/portfolio')
        revalidatePath('/portfolio')
        return { success: true }
    } catch (error) {
        console.error('deletePortfolio error:', error)
        return { success: false, error: 'Silinemedi' }
    }
}

export async function getProjectsForPortfolio() {
    // Get completed projects that don't have a portfolio yet
    return await prisma.webProject.findMany({
        where: {
            status: 'LIVE',
            portfolio: null
        },
        select: {
            id: true,
            name: true,
            siteUrl: true,
            company: { select: { name: true } }
        },
        orderBy: { completedAt: 'desc' }
    })
}
