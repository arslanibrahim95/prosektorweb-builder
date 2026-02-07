'use server'

import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { AuditAction } from '@prisma/client'

interface ActionResult {
    success: boolean
    error?: string
    data?: any
}

interface RevisionView {
    id: string
    revisionNumber: number
    description: string
    affectedPages: string[]
    status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
    adminNotes: string | null
    completedAt: string | null
    createdAt: string
}

const REVISION_PREFIX = '[REVISION]'
const DEFAULT_MAX_REVISIONS = 5

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

function normalizeRevisionStatus(status: string): RevisionView['status'] {
    if (status === 'IN_PROGRESS' || status === 'COMPLETED' || status === 'REJECTED') {
        return status
    }
    return 'REQUESTED'
}

function toRevisionView(
    task: { id: string; title: string; status: string; createdAt: Date; updatedAt: Date },
    revisionNumber: number
): RevisionView {
    const description = task.title.startsWith(REVISION_PREFIX)
        ? task.title.slice(REVISION_PREFIX.length).trim()
        : task.title
    const status = normalizeRevisionStatus(task.status)

    return {
        id: task.id,
        revisionNumber,
        description,
        affectedPages: [],
        status,
        adminNotes: null,
        completedAt: status === 'COMPLETED' ? task.updatedAt.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
    }
}

export async function getSitePackage(projectId: string) {
    const session = await auth()
    if (!session?.user) return null

    const tasks = await prisma.projectTask.findMany({
        where: {
            projectId,
            title: { startsWith: REVISION_PREFIX },
        },
        orderBy: { createdAt: 'asc' },
    })

    const revisions = tasks.map((task, index) => toRevisionView(task, index + 1))
    const usedRevisions = revisions.filter(revision => revision.status === 'COMPLETED').length

    return {
        id: `task-revisions-${projectId}`,
        webProjectId: projectId,
        maxRevisions: DEFAULT_MAX_REVISIONS,
        usedRevisions,
        revisions,
    }
}

export async function requestRevision(
    projectId: string,
    description: string,
    affectedPages: string[]
): Promise<ActionResult> {
    try {
        const session = await auth()
        if (!session?.user) return { success: false, error: 'Oturum bulunamadi' }

        const existingCount = await prisma.projectTask.count({
            where: {
                projectId,
                title: { startsWith: REVISION_PREFIX },
            },
        })

        if (existingCount >= DEFAULT_MAX_REVISIONS) {
            return { success: false, error: 'Revizyon hakkiniz dolmustur. Ek revizyon satin alabilirsiniz.' }
        }

        const safeDescription = description.trim().slice(0, 500)
        const title = `${REVISION_PREFIX} ${safeDescription}`

        const revisionTask = await prisma.projectTask.create({
            data: {
                projectId,
                title,
                status: 'REQUESTED',
            },
        })

        await logActivity('CREATE', 'ProjectTask', revisionTask.id, {
            projectId,
            description: safeDescription,
            affectedPages,
        })

        revalidatePath(`/admin/projects/${projectId}`)
        revalidatePath(`/portal/projects/${projectId}`)

        return {
            success: true,
            data: toRevisionView(revisionTask, existingCount + 1),
        }
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

        const revision = await prisma.projectTask.update({
            where: { id: revisionId },
            data: { status: 'IN_PROGRESS' },
            include: { project: true },
        })

        await logActivity('UPDATE', 'ProjectTask', revisionId, { status: 'IN_PROGRESS' })
        revalidatePath(`/admin/projects/${revision.projectId}`)

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

        const revision = await prisma.projectTask.update({
            where: { id: revisionId },
            data: { status: 'COMPLETED' },
            include: { project: true },
        })

        await logActivity('UPDATE', 'ProjectTask', revisionId, { status: 'COMPLETED' })
        revalidatePath(`/admin/projects/${revision.projectId}`)
        revalidatePath(`/portal/projects/${revision.projectId}`)

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

        const revision = await prisma.projectTask.update({
            where: { id: revisionId },
            data: { status: 'REJECTED' },
            include: { project: true },
        })

        await logActivity('UPDATE', 'ProjectTask', revisionId, { status: 'REJECTED', reason })
        revalidatePath(`/admin/projects/${revision.projectId}`)
        revalidatePath(`/portal/projects/${revision.projectId}`)

        return { success: true, data: revision }
    } catch (error: any) {
        return { success: false, error: error.message || 'Bir hata olustu' }
    }
}
