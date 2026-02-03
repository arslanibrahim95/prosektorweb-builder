'use server'

import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { RevisionStatus, AuditAction } from '@prisma/client'

interface ActionResult {
    success: boolean
    error?: string
    data?: any
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

export async function getSitePackage(projectId: string) {
    const session = await auth()
    if (!session?.user) return null

    return prisma.sitePackage.findUnique({
        where: { webProjectId: projectId },
        include: {
            revisions: { orderBy: { revisionNumber: 'asc' } },
        },
    })
}

export async function requestRevision(
    projectId: string,
    description: string,
    affectedPages: string[]
): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user) return { success: false, error: 'Oturum bulunamadi' }

        const pkg = await prisma.sitePackage.findUnique({
            where: { webProjectId: projectId },
            include: { revisions: true },
        })

        if (!pkg) return { success: false, error: 'Site paketi bulunamadi' }

        if (pkg.usedRevisions >= pkg.maxRevisions) {
            return { success: false, error: 'Revizyon hakkiniz dolmustur. Ek revizyon satin alabilirsiniz.' }
        }

        const revisionNumber = pkg.revisions.length + 1

        const revision = await prisma.siteRevision.create({
            data: {
                packageId: pkg.id,
                revisionNumber,
                description,
                affectedPages: affectedPages.length > 0 ? affectedPages : undefined,
                status: 'REQUESTED',
            },
        })

        await logActivity('CREATE', 'SiteRevision', revision.id, { projectId, description })
        revalidatePath(`/admin/projects/${projectId}`)
        revalidatePath(`/portal/projects/${projectId}`)

        return { success: true, data: revision }
    } catch (error: any) {
        return { success: false, error: error.message || 'Bir hata olustu' }
    }
}

export async function approveRevision(revisionId: string): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
            return { success: false, error: 'Yetkiniz yok' }
        }

        const revision = await prisma.siteRevision.update({
            where: { id: revisionId },
            data: { status: 'IN_PROGRESS' },
            include: { package: { include: { webProject: true } } },
        })

        await logActivity('UPDATE', 'SiteRevision', revisionId, { status: 'IN_PROGRESS' })
        revalidatePath(`/admin/projects/${revision.package.webProject.id}`)

        return { success: true, data: revision }
    } catch (error: any) {
        return { success: false, error: error.message || 'Bir hata olustu' }
    }
}

export async function completeRevision(revisionId: string): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
            return { success: false, error: 'Yetkiniz yok' }
        }

        const revision = await prisma.$transaction(async (tx) => {
            const rev = await tx.siteRevision.update({
                where: { id: revisionId },
                data: { status: 'COMPLETED', completedAt: new Date() },
                include: { package: true },
            })

            await tx.sitePackage.update({
                where: { id: rev.packageId },
                data: { usedRevisions: { increment: 1 } },
            })

            return rev
        })

        await logActivity('UPDATE', 'SiteRevision', revisionId, { status: 'COMPLETED' })

        const pkg = await prisma.sitePackage.findUnique({
            where: { id: revision.packageId },
            include: { webProject: true },
        })
        if (pkg) {
            revalidatePath(`/admin/projects/${pkg.webProject.id}`)
            revalidatePath(`/portal/projects/${pkg.webProject.id}`)
        }

        return { success: true, data: revision }
    } catch (error: any) {
        return { success: false, error: error.message || 'Bir hata olustu' }
    }
}

export async function rejectRevision(revisionId: string, reason: string): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user || session.user.role !== 'ADMIN') {
            return { success: false, error: 'Yetkiniz yok' }
        }

        const revision = await prisma.siteRevision.update({
            where: { id: revisionId },
            data: { status: 'REJECTED', adminNotes: reason },
            include: { package: { include: { webProject: true } } },
        })

        await logActivity('UPDATE', 'SiteRevision', revisionId, { status: 'REJECTED', reason })
        revalidatePath(`/admin/projects/${revision.package.webProject.id}`)
        revalidatePath(`/portal/projects/${revision.package.webProject.id}`)

        return { success: true, data: revision }
    } catch (error: any) {
        return { success: false, error: error.message || 'Bir hata olustu' }
    }
}
