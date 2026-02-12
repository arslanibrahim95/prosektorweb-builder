'use server'

import { prisma } from '@/server/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { getErrorMessage, getZodErrorMessage, validatePagination, logger, slugify } from '@/shared/lib'
import { z } from 'zod'
import { getUserCompanyId, requireCompanyAccess, requireTenantAccess } from '@/features/system/lib/guards/tenant-guard'
import { AuditAction, ProjectStatus, ProjectPriority, Prisma } from '@prisma/client'

export interface ProjectInput {
    companyId: string
    name: string
    description?: string
    status: ProjectStatus
    priority: ProjectPriority
    domainId?: string
    price?: number
    isPaid?: boolean
    notes?: string
    startDate?: Date | string
    endDate?: Date | string
    serviceId?: string
}

const ProjectSchema = z.object({
    name: z.string().min(3, 'Proje adı en az 3 karakter olmalı'),
    companyId: z.string().min(1, 'Firma seçimi zorunlu'),
    domainId: z.string().optional(),
    price: z.coerce.number().optional(),
    notes: z.string().optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
    priority: z.nativeEnum(ProjectPriority).optional(),
})

export interface ActionResult {
    success: boolean
    error?: string
    data?: unknown
}

async function logActivity(action: AuditAction, entity: string, entityId: string, details?: Record<string, unknown>) {
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

export async function getProjects(page: number = 1, limit: number = 20, search?: string, status?: string) {
    try {
        const session = await auth()
        if (!session?.user) return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }

        const skip = (page - 1) * limit
        const where: Prisma.WebProjectWhereInput = {
            deletedAt: null
        }

        // AuthZ: Non-admins can only see their own company's projects
        if (session.user.role !== 'ADMIN') {
            if (!session.user.companyId) return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
            where.companyId = session.user.companyId
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { company: { name: { contains: search } } }
            ]
        }

        if (status) {
            where.status = status as ProjectStatus
        }

        const [data, total] = await Promise.all([
            prisma.webProject.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    company: { select: { id: true, name: true } },
                    service: { select: { id: true, name: true } },
                    domain: { select: { id: true, name: true } }, // Included domain relation
                    _count: { select: { tasks: true } }
                }
            }),
            prisma.webProject.count({ where })
        ])

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        }
    } catch (e) {
        console.error('getProjects Error:', e)
        return { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }
    }
}

export async function getProject(id: string) {
    try {
        const session = await auth()
        if (!session?.user) return null

        const project = await prisma.webProject.findUnique({
            where: { id },
            include: {
                company: true,
                service: true,
                tasks: { orderBy: { createdAt: 'desc' } }
            }
        })

        if (!project) return null

        // AuthZ: ADMIN or USER who belongs to this company
        if (session.user.role !== 'ADMIN' && session.user.companyId !== project.companyId) {
            return null
        }

        return project
    } catch (e) {
        return null
    }
}

export async function createProject(input: ProjectInput | FormData): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' }

        const rawData = input instanceof FormData ? {
            name: input.get('name') as string,
            companyId: input.get('companyId') as string,
            domainId: input.get('domainId') as string || undefined,
            price: input.get('budget') || input.get('price'), // Handle both budget and price field names
            notes: input.get('notes') as string || undefined,
            status: input.get('status') as ProjectStatus || 'DRAFT',
            priority: input.get('priority') as ProjectPriority || 'MEDIUM',
        } : input

        const validated = ProjectSchema.parse(rawData)

        // Tenant isolation
        await requireCompanyAccess(validated.companyId)

        // Construct STRICT strictly typed create input
        const createData: Prisma.WebProjectUncheckedCreateInput = {
            name: validated.name,
            slug: slugify(validated.name) + '-' + Math.random().toString(36).substring(2, 7),
            companyId: validated.companyId,
            domainId: validated.domainId || null,
            price: validated.price ? Number(validated.price) : null,
            notes: validated.notes || null,
            status: validated.status || 'DRAFT',
            priority: validated.priority || 'MEDIUM',
            progress: 0,
            // Initialize required fields if any (based on schema)
        }

        const project = await prisma.webProject.create({
            data: createData
        })

        await logActivity('CREATE', 'WebProject', project.id, { name: project.name })
        revalidatePath('/admin/projects')
        return { success: true, data: project }
    } catch (e) {
        if (e instanceof z.ZodError) return { success: false, error: getZodErrorMessage(e) }
        logger.error({ error: e }, 'createProject Error')
        return { success: false, error: 'Proje oluşturulamadı' }
    }
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' }
        }

        const project = await prisma.webProject.update({
            where: { id },
            data: { status }
        })

        await logActivity('UPDATE', 'WebProject', id, { status })
        revalidatePath('/admin/projects')
        return { success: true }
    } catch (e) {
        return { success: false, error: 'Güncelleme başarısız' }
    }
}

export async function updateProject(id: string, input: Partial<ProjectInput> | FormData, version?: number): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Unauthorized' }

        // Tenant isolation
        await requireTenantAccess('project', id)

        const rawData = input instanceof FormData ? {
            name: input.get('name') as string,
            status: input.get('status') as ProjectStatus,
            price: input.get('price') ? parseFloat(input.get('price') as string) : undefined,
            isPaid: input.get('isPaid') === 'true' || input.get('isPaid') === 'on',
            notes: input.get('notes') as string,
        } : input

        // 1. Fetch existing project FOR DATE LOGIC ONLY
        const existing = await prisma.webProject.findUnique({ where: { id } })
        if (!existing) return { success: false, error: 'Proje bulunamadı' }

        // 2. Prepare STRICT update object
        const updateData: Prisma.WebProjectUpdateInput = {
            ...(rawData.name && { name: rawData.name }),
            ...(rawData.status && { status: rawData.status }),
            ...(rawData.price !== undefined && { price: rawData.price }),
            ...(rawData.isPaid !== undefined && { isPaid: rawData.isPaid }),
            ...(rawData.notes !== undefined && { notes: rawData.notes }),
        }

        // 3. Conditional Date Logic (Strictly Typed)
        if (rawData.status === 'DESIGNING' || rawData.status === 'DEVELOPMENT') {
            if (!existing.startedAt) {
                updateData.startedAt = new Date()
            }
        }
        if (rawData.status === 'LIVE') {
            updateData.completedAt = new Date()
        }
        if (rawData.isPaid === true && !existing.paidAt) {
            updateData.paidAt = new Date()
        }

        // 4. Handle Versioning
        const where: Prisma.WebProjectWhereUniqueInput = { id }

        // Optimistic Concurrency Control
        // If version is provided, we MUST check it. If not, we just update by ID.
        // Prisma doesn't support "increment AND check" in one go easily without exact match on where.
        if (typeof version === 'number') {
            where.version = version
            updateData.version = { increment: 1 }
        }

        const project = await prisma.webProject.update({
            where,
            data: updateData
        })

        await logActivity('UPDATE', 'WebProject', id, rawData)
        revalidatePath('/admin/projects')
        revalidatePath(`/admin/projects/${id}`)
        return { success: true, data: project }
    } catch (e) {
        logger.error({ error: e }, 'updateProject Error')
        if (e instanceof Error && 'code' in e && e.code === 'P2025') {
            return { success: false, error: 'Kayıt güncel değil, lütfen yenileyin.' }
        }
        return { success: false, error: 'Güncelleme başarısız' }
    }
}


export async function deleteProject(id: string): Promise<ActionResult> {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' }
        }

        await prisma.webProject.update({
            where: { id },
            data: { deletedAt: new Date() }
        })

        await logActivity('DELETE', 'WebProject', id)
        revalidatePath('/admin/projects')
        return { success: true }
    } catch (e) {
        return { success: false, error: 'Silme işlemi başarısız' }
    }
}

export async function getProjectStats() {
    try {
        const session = await auth()
        if (session?.user?.role !== 'ADMIN') return { total: 0, draft: 0, inProgress: 0, review: 0, live: 0, totalRevenue: 0, pendingPayment: 0 }

        const [total, draft, inProgress, review, live, revenue, pending] = await Promise.all([
            prisma.webProject.count({ where: { deletedAt: null } }),
            prisma.webProject.count({ where: { status: 'DRAFT', deletedAt: null } }),
            prisma.webProject.count({ where: { status: 'DEVELOPMENT', deletedAt: null } }),
            prisma.webProject.count({ where: { status: 'REVIEW', deletedAt: null } }),
            prisma.webProject.count({ where: { status: 'LIVE', deletedAt: null } }),
            // Revenue calc might need join with Invoices or specific field
            // Assuming price field covers it for now or we sum paid invoices linked to projects
            prisma.webProject.aggregate({ where: { isPaid: true, deletedAt: null }, _sum: { price: true } }),
            prisma.webProject.aggregate({ where: { isPaid: false, deletedAt: null }, _sum: { price: true } })
        ])

        return {
            total,
            draft,
            inProgress,
            review,
            live,
            totalRevenue: Number(revenue._sum.price || 0),
            pendingPayment: Number(pending._sum.price || 0)
        }
    } catch (e) {
        return { total: 0, draft: 0, inProgress: 0, review: 0, live: 0, totalRevenue: 0, pendingPayment: 0 }
    }
}
