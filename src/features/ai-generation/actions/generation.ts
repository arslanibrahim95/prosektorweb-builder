/**
 * AI Website Generation Actions
 * Server actions for managing AI-powered website generation
 */

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/server/db'
import { logger } from '@/shared/lib'
import { z } from 'zod'
import {
    validatePrompt,
    sanitizePrompt,
    hashPrompt,
    checkGenerationRateLimit,
    incrementGenerationRateLimit,
    checkGenerationPermission,
    checkJobAccess,
    canCreateNewVersion,
} from '../lib/validation'
import { GenerationOrchestrator } from '../lib/orchestrator'
import type {
    CreateGenerationRequest,
    CreateGenerationResponse,
    GenerationStatusResponse,
    GalleryResponse,
    GalleryQueryParams,
    CloneWebsiteRequest,
    RollbackRequest,
} from '../types'

type LegacyRow = Record<string, unknown>

type LegacyJobRow = LegacyRow & {
    id: string
    userId?: string
    status?: string
}

type LegacyWebsiteRow = LegacyRow & {
    id: string
    userId?: string
    companyId?: string | null
    jobId?: string
    name?: string
    slug?: string
    version?: number
}

const LEGACY_AI_STORAGE_MESSAGE =
    'AI generation depolama altyapısı henüz yapılandırılmadı. İlgili migrationları çalıştırın.'
const AI_GENERATION_PATH = '/admin/ai-generation'

const GALLERY_SORT_COLUMNS = {
    createdAt: 'gw."createdAt"',
    updatedAt: 'gw."updatedAt"',
    name: 'gw."name"',
} as const

const createGenerationSchema = z.object({
    prompt: z.string().min(20).max(2000),
    templateId: z.string().min(1).optional(),
    companyId: z.string().min(1).optional(),
    customSettings: z.record(z.string(), z.unknown()).optional(),
})

const galleryQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z
        .enum([
            'PENDING',
            'ANALYZING',
            'DESIGNING',
            'GENERATING_CONTENT',
            'GENERATING_CODE',
            'BUILDING',
            'COMPLETED',
            'FAILED',
            'CANCELLED',
        ])
        .optional(),
    search: z.string().trim().max(120).optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

const cloneWebsiteSchema = z.object({
    websiteId: z.string().min(1),
    newName: z.string().min(3).max(100),
    prompt: z.string().max(2000).optional(),
})

const rollbackSchema = z.object({
    websiteId: z.string().min(1),
    toVersion: z.number().int().min(1),
})

function isMissingRelationError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    return (
        (message.includes('relation') && message.includes('does not exist')) ||
        (message.includes('table') && message.includes('does not exist')) ||
        message.includes('no such table') ||
        (message.includes('column') && message.includes('does not exist'))
    )
}

function getErrorMessage(defaultMessage: string, error: unknown): string {
    if (isMissingRelationError(error)) return LEGACY_AI_STORAGE_MESSAGE
    return defaultMessage
}

function estimateDuration(complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'): number {
    if (complexity === 'COMPLEX') return 600
    if (complexity === 'MODERATE') return 400
    return 300
}

async function queryLegacyRows<T extends LegacyRow = LegacyRow>(
    sqlVariants: string[],
    values: unknown[] = []
): Promise<T[]> {
    let lastError: unknown

    for (const query of sqlVariants) {
        try {
            return await prisma.$queryRawUnsafe<T[]>(query, ...values)
        } catch (error) {
            lastError = error
            if (!isMissingRelationError(error)) throw error
        }
    }

    if (lastError) throw lastError
    return []
}

async function logGenerationActivity(data: {
    jobId?: string
    websiteId?: string
    userId: string
    activityType: string
    details?: Record<string, unknown>
}): Promise<void> {
    try {
        await queryLegacyRows(
            [
                `INSERT INTO "GenerationActivity" ("id", "jobId", "websiteId", "userId", "activityType", "details", "createdAt")
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING "id"`,
                `INSERT INTO GenerationActivity (id, jobId, websiteId, userId, activityType, details, createdAt)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id`,
            ],
            [
                crypto.randomUUID(),
                data.jobId || null,
                data.websiteId || null,
                data.userId,
                data.activityType,
                data.details ? JSON.stringify(data.details) : null,
            ]
        )
    } catch (error) {
        if (!isMissingRelationError(error)) {
            logger.warn({ error, data }, 'Failed to insert generation activity')
        }
    }
}

export async function createGeneration(input: CreateGenerationRequest): Promise<CreateGenerationResponse> {
    const requestId = crypto.randomUUID()
    const session = await auth()

    if (!session?.user) {
        return {
            success: false,
            message: 'Authentication required',
            meta: { requestId },
        }
    }

    const parsed = createGenerationSchema.safeParse(input)
    if (!parsed.success) {
        return {
            success: false,
            message: 'Invalid input: ' + parsed.error.issues.map((issue) => issue.message).join(', '),
            meta: { requestId },
        }
    }

    const userId = session.user.id
    const userRole = session.user.role
    const promptValidation = validatePrompt(parsed.data.prompt)

    if (!promptValidation.valid) {
        return {
            success: false,
            message: 'Prompt validation failed: ' + promptValidation.errors.join(', '),
            meta: { requestId },
        }
    }

    const permissionCheck = checkGenerationPermission(userRole)
    if (!permissionCheck.allowed) {
        return {
            success: false,
            message: permissionCheck.reason || 'Permission denied',
            meta: { requestId },
        }
    }

    const rateLimitCheck = await checkGenerationRateLimit(userId, userRole)
    if (!rateLimitCheck.allowed) {
        return {
            success: false,
            message: rateLimitCheck.reason || 'Rate limit exceeded',
            meta: { requestId },
        }
    }

    const sanitizedPrompt = sanitizePrompt(parsed.data.prompt)
    const promptHash = hashPrompt(sanitizedPrompt)
    const estimatedDuration = estimateDuration(promptValidation.estimatedComplexity)

    try {
        const existingJob = await queryLegacyRows<LegacyJobRow>(
            [
                `SELECT "id", "status"
                 FROM "AIGenerationJob"
                 WHERE "promptHash" = $1
                   AND "userId" = $2
                   AND "status" NOT IN ('FAILED', 'CANCELLED')
                   AND "createdAt" > NOW() - INTERVAL '24 hours'
                 LIMIT 1`,
                `SELECT id, status
                 FROM AIGenerationJob
                 WHERE promptHash = $1
                   AND userId = $2
                   AND status NOT IN ('FAILED', 'CANCELLED')
                   AND createdAt > NOW() - INTERVAL '24 hours'
                 LIMIT 1`,
            ],
            [promptHash, userId]
        )

        if (existingJob.length > 0) {
            return {
                success: false,
                message: 'A similar generation is already in progress or was recently completed',
                meta: { requestId },
            }
        }

        const insertedJob = await queryLegacyRows<{ id: string }>(
            [
                `INSERT INTO "AIGenerationJob"
                 ("id", "userId", "companyId", "prompt", "promptHash", "status",
                  "currentStep", "progress", "stepsCompleted", "totalSteps",
                  "estimatedDuration", "isLatest", "version", "createdAt", "updatedAt")
                 VALUES
                 ($1, $2, $3, $4, $5, 'PENDING',
                  NULL, 0, 0, 5,
                  $6, TRUE, 1, NOW(), NOW())
                 RETURNING "id"`,
                `INSERT INTO AIGenerationJob
                 (id, userId, companyId, prompt, promptHash, status,
                  currentStep, progress, stepsCompleted, totalSteps,
                  estimatedDuration, isLatest, version, createdAt, updatedAt)
                 VALUES
                 ($1, $2, $3, $4, $5, 'PENDING',
                  NULL, 0, 0, 5,
                  $6, TRUE, 1, NOW(), NOW())
                 RETURNING id`,
            ],
            [crypto.randomUUID(), userId, parsed.data.companyId || null, sanitizedPrompt, promptHash, estimatedDuration]
        )

        const jobId = insertedJob[0]?.id
        if (!jobId) throw new Error('Failed to create generation job')

        await incrementGenerationRateLimit(userId)

        const orchestrator = new GenerationOrchestrator()
        orchestrator
            .startGeneration(jobId, {
                prompt: sanitizedPrompt,
                templateId: parsed.data.templateId,
                customSettings: parsed.data.customSettings,
            })
            .catch((error) => {
                logger.error({ error, jobId }, 'Generation orchestrator failed')
            })

        logger.info(
            {
                requestId,
                jobId,
                userId,
                promptLength: sanitizedPrompt.length,
                complexity: promptValidation.estimatedComplexity,
            },
            'Generation job created'
        )

        return {
            success: true,
            jobId,
            message: 'Generation started successfully',
            estimatedDuration,
            meta: { requestId },
        }
    } catch (error) {
        logger.error({ error, requestId, userId }, 'Failed to create generation job')
        return {
            success: false,
            message: getErrorMessage('Failed to start generation. Please try again.', error),
            meta: { requestId },
        }
    }
}

export async function getGenerationStatus(jobId: string): Promise<GenerationStatusResponse> {
    const requestId = crypto.randomUUID()
    const session = await auth()

    if (!session?.user) {
        return {
            success: false,
            message: 'Authentication required',
            meta: { requestId },
        }
    }

    try {
        const accessCheck = await checkJobAccess(session.user.id, session.user.role, jobId)
        if (!accessCheck.allowed) {
            return {
                success: false,
                message: accessCheck.reason || 'Access denied',
                meta: { requestId },
            }
        }

        const jobs = await queryLegacyRows<LegacyJobRow>(
            [
                `SELECT * FROM "AIGenerationJob" WHERE "id" = $1 LIMIT 1`,
                `SELECT * FROM AIGenerationJob WHERE id = $1 LIMIT 1`,
            ],
            [jobId]
        )

        if (jobs.length === 0) {
            return {
                success: false,
                message: 'Generation job not found',
                meta: { requestId },
            }
        }

        return {
            success: true,
            job: jobs[0] as any,
            meta: { requestId },
        }
    } catch (error) {
        logger.error({ error, requestId, jobId }, 'Failed to get generation status')
        return {
            success: false,
            message: getErrorMessage('Failed to retrieve generation status', error),
            meta: { requestId },
        }
    }
}

export async function cancelGeneration(jobId: string): Promise<{ success: boolean; message: string }> {
    const session = await auth()
    if (!session?.user) {
        return { success: false, message: 'Authentication required' }
    }

    try {
        const accessCheck = await checkJobAccess(session.user.id, session.user.role, jobId)
        if (!accessCheck.allowed) {
            return { success: false, message: accessCheck.reason || 'Access denied' }
        }

        const cancelled = await queryLegacyRows<{ id: string }>(
            [
                `UPDATE "AIGenerationJob"
                 SET "status" = 'CANCELLED', "updatedAt" = NOW()
                 WHERE "id" = $1
                   AND "status" IN ('PENDING', 'ANALYZING', 'DESIGNING', 'GENERATING_CONTENT', 'GENERATING_CODE', 'BUILDING')
                 RETURNING "id"`,
                `UPDATE AIGenerationJob
                 SET status = 'CANCELLED', updatedAt = NOW()
                 WHERE id = $1
                   AND status IN ('PENDING', 'ANALYZING', 'DESIGNING', 'GENERATING_CONTENT', 'GENERATING_CODE', 'BUILDING')
                 RETURNING id`,
            ],
            [jobId]
        )

        if (cancelled.length === 0) {
            return { success: false, message: 'Generation is not cancelable in current state' }
        }

        logger.info({ jobId, userId: session.user.id }, 'Generation job cancelled')
        return { success: true, message: 'Generation cancelled successfully' }
    } catch (error) {
        logger.error({ error, jobId }, 'Failed to cancel generation')
        return { success: false, message: getErrorMessage('Failed to cancel generation', error) }
    }
}

export async function getGeneratedWebsites(params: GalleryQueryParams = {}): Promise<GalleryResponse> {
    const requestId = crypto.randomUUID()
    const session = await auth()

    if (!session?.user) {
        return {
            success: false,
            websites: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            meta: { requestId },
        }
    }

    const parsedParams = galleryQuerySchema.safeParse(params)
    if (!parsedParams.success) {
        return {
            success: false,
            websites: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            meta: { requestId },
        }
    }

    const { page, limit, status, search, sortBy, sortOrder } = parsedParams.data
    const skip = (page - 1) * limit
    const conditions: string[] = []
    const values: unknown[] = []

    if (session.user.role !== 'ADMIN') {
        values.push(session.user.id)
        conditions.push(`gw."userId" = $${values.length}`)
    }

    if (status) {
        values.push(status)
        conditions.push(`aj."status" = $${values.length}`)
    }

    if (search) {
        values.push(`%${search}%`)
        const searchPlaceholder = `$${values.length}`
        conditions.push(`(gw."name" ILIKE ${searchPlaceholder} OR COALESCE(gw."description", '') ILIKE ${searchPlaceholder})`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const sortColumn = GALLERY_SORT_COLUMNS[sortBy]
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC'

    try {
        const countRows = await queryLegacyRows<{ total: number | string }>(
            [
                `SELECT COUNT(*)::int AS "total"
                 FROM "GeneratedWebsite" gw
                 LEFT JOIN "AIGenerationJob" aj ON gw."jobId" = aj."id"
                 ${whereClause}`,
                `SELECT COUNT(*)::int AS total
                 FROM GeneratedWebsite gw
                 LEFT JOIN AIGenerationJob aj ON gw.jobId = aj.id
                 ${whereClause}`,
            ],
            values
        )

        const listRows = await queryLegacyRows<LegacyWebsiteRow>(
            [
                `SELECT gw.*, aj."status" AS "jobStatus", aj."progress" AS "jobProgress"
                 FROM "GeneratedWebsite" gw
                 LEFT JOIN "AIGenerationJob" aj ON gw."jobId" = aj."id"
                 ${whereClause}
                 ORDER BY ${sortColumn} ${sortDirection}
                 LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
                `SELECT gw.*, aj.status AS jobStatus, aj.progress AS jobProgress
                 FROM GeneratedWebsite gw
                 LEFT JOIN AIGenerationJob aj ON gw.jobId = aj.id
                 ${whereClause}
                 ORDER BY ${sortColumn} ${sortDirection}
                 LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
            ],
            [...values, limit, skip]
        )

        const total = Number(countRows[0]?.total ?? 0)

        return {
            success: true,
            websites: listRows as any[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            meta: { requestId },
        }
    } catch (error) {
        logger.error({ error, requestId }, 'Failed to get generated websites')
        return {
            success: false,
            websites: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
            meta: { requestId },
        }
    }
}

export async function cloneWebsite(
    input: CloneWebsiteRequest
): Promise<{ success: boolean; message: string; jobId?: string }> {
    const session = await auth()
    if (!session?.user) {
        return { success: false, message: 'Authentication required' }
    }

    const validation = cloneWebsiteSchema.safeParse(input)
    if (!validation.success) {
        return {
            success: false,
            message: 'Invalid input: ' + validation.error.issues.map((issue) => issue.message).join(', '),
        }
    }

    try {
        const websites = await queryLegacyRows<LegacyWebsiteRow>(
            [
                `SELECT * FROM "GeneratedWebsite" WHERE "id" = $1 LIMIT 1`,
                `SELECT * FROM GeneratedWebsite WHERE id = $1 LIMIT 1`,
            ],
            [validation.data.websiteId]
        )

        if (websites.length === 0) {
            return { success: false, message: 'Website not found' }
        }

        const originalWebsite = websites[0]
        const ownerUserId = String(originalWebsite.userId || '')

        if (session.user.role !== 'ADMIN' && ownerUserId !== session.user.id) {
            return { success: false, message: 'Permission denied' }
        }

        const versionCheck = await canCreateNewVersion(validation.data.websiteId)
        if (!versionCheck.allowed) {
            return { success: false, message: versionCheck.reason || 'Version limit reached' }
        }

        const rateLimitCheck = await checkGenerationRateLimit(session.user.id, session.user.role)
        if (!rateLimitCheck.allowed) {
            return { success: false, message: rateLimitCheck.reason || 'Rate limit exceeded' }
        }

        const clonePrompt =
            validation.data.prompt ||
            `Clone of ${String(originalWebsite.name || 'website')} with similar design and structure`

        const result = await createGeneration({
            prompt: clonePrompt,
            companyId:
                typeof originalWebsite.companyId === 'string' && originalWebsite.companyId.length > 0
                    ? originalWebsite.companyId
                    : undefined,
        })

        if (result.success && result.jobId) {
            await logGenerationActivity({
                jobId: result.jobId,
                websiteId: validation.data.websiteId,
                userId: session.user.id,
                activityType: 'CLONED',
                details: {
                    originalName: originalWebsite.name,
                    newName: validation.data.newName,
                },
            })

            return {
                success: true,
                message: 'Website clone started successfully',
                jobId: result.jobId,
            }
        }

        return { success: false, message: result.message }
    } catch (error) {
        logger.error({ error, input }, 'Failed to clone website')
        return { success: false, message: getErrorMessage('Failed to clone website', error) }
    }
}

export async function rollbackWebsite(input: RollbackRequest): Promise<{ success: boolean; message: string }> {
    const session = await auth()
    if (!session?.user) {
        return { success: false, message: 'Authentication required' }
    }

    const validation = rollbackSchema.safeParse(input)
    if (!validation.success) {
        return {
            success: false,
            message: 'Invalid input: ' + validation.error.issues.map((issue) => issue.message).join(', '),
        }
    }

    try {
        const currentRows = await queryLegacyRows<LegacyWebsiteRow>(
            [
                `SELECT * FROM "GeneratedWebsite" WHERE "id" = $1 LIMIT 1`,
                `SELECT * FROM GeneratedWebsite WHERE id = $1 LIMIT 1`,
            ],
            [validation.data.websiteId]
        )

        if (currentRows.length === 0) {
            return { success: false, message: 'Website not found' }
        }

        const currentWebsite = currentRows[0]
        const ownerUserId = String(currentWebsite.userId || '')
        if (session.user.role !== 'ADMIN' && ownerUserId !== session.user.id) {
            return { success: false, message: 'Permission denied' }
        }

        const targetRows = await queryLegacyRows<LegacyWebsiteRow>(
            [
                `SELECT * FROM "GeneratedWebsite"
                 WHERE "slug" = $1
                   AND "version" = $2
                   AND "canRollback" = TRUE
                 LIMIT 1`,
                `SELECT * FROM GeneratedWebsite
                 WHERE slug = $1
                   AND version = $2
                   AND canRollback = TRUE
                 LIMIT 1`,
            ],
            [currentWebsite.slug, validation.data.toVersion]
        )

        if (targetRows.length === 0) {
            return {
                success: false,
                message: `Version ${validation.data.toVersion} not found or cannot be rolled back to`,
            }
        }

        const targetVersion = targetRows[0]

        await queryLegacyRows(
            [
                `UPDATE "GeneratedWebsite"
                 SET "isActive" = FALSE, "updatedAt" = NOW()
                 WHERE "id" = $1
                 RETURNING "id"`,
                `UPDATE GeneratedWebsite
                 SET isActive = FALSE, updatedAt = NOW()
                 WHERE id = $1
                 RETURNING id`,
            ],
            [validation.data.websiteId]
        )

        await queryLegacyRows(
            [
                `UPDATE "GeneratedWebsite"
                 SET "isActive" = TRUE, "updatedAt" = NOW()
                 WHERE "id" = $1
                 RETURNING "id"`,
                `UPDATE GeneratedWebsite
                 SET isActive = TRUE, updatedAt = NOW()
                 WHERE id = $1
                 RETURNING id`,
            ],
            [targetVersion.id]
        )

        await logGenerationActivity({
            jobId: typeof targetVersion.jobId === 'string' ? targetVersion.jobId : undefined,
            websiteId: validation.data.websiteId,
            userId: session.user.id,
            activityType: 'ROLLED_BACK',
            details: {
                fromVersion: currentWebsite.version,
                toVersion: validation.data.toVersion,
            },
        })

        revalidatePath(AI_GENERATION_PATH)

        return {
            success: true,
            message: `Successfully rolled back to version ${validation.data.toVersion}`,
        }
    } catch (error) {
        logger.error({ error, input }, 'Failed to rollback website')
        return { success: false, message: getErrorMessage('Failed to rollback website', error) }
    }
}

export async function deleteWebsite(websiteId: string): Promise<{ success: boolean; message: string }> {
    const session = await auth()
    if (!session?.user) {
        return { success: false, message: 'Authentication required' }
    }

    try {
        const websites = await queryLegacyRows<LegacyWebsiteRow>(
            [
                `SELECT * FROM "GeneratedWebsite" WHERE "id" = $1 LIMIT 1`,
                `SELECT * FROM GeneratedWebsite WHERE id = $1 LIMIT 1`,
            ],
            [websiteId]
        )

        if (websites.length === 0) {
            return { success: false, message: 'Website not found' }
        }

        const website = websites[0]
        const ownerUserId = String(website.userId || '')
        if (session.user.role !== 'ADMIN' && ownerUserId !== session.user.id) {
            return { success: false, message: 'Permission denied' }
        }

        await queryLegacyRows(
            [
                `UPDATE "GeneratedWebsite"
                 SET "isActive" = FALSE, "updatedAt" = NOW()
                 WHERE "id" = $1
                 RETURNING "id"`,
                `UPDATE GeneratedWebsite
                 SET isActive = FALSE, updatedAt = NOW()
                 WHERE id = $1
                 RETURNING id`,
            ],
            [websiteId]
        )

        await logGenerationActivity({
            websiteId,
            userId: session.user.id,
            activityType: 'DELETED',
        })

        revalidatePath(AI_GENERATION_PATH)
        return { success: true, message: 'Website deleted successfully' }
    } catch (error) {
        logger.error({ error, websiteId }, 'Failed to delete website')
        return { success: false, message: getErrorMessage('Failed to delete website', error) }
    }
}

export async function getGenerationTemplates(): Promise<{
    success: boolean
    templates: any[]
    message?: string
}> {
    const session = await auth()
    if (!session?.user) {
        return { success: false, templates: [], message: 'Authentication required' }
    }

    try {
        const templates = await queryLegacyRows(
            [
                `SELECT *
                 FROM "GenerationTemplate"
                 WHERE "isActive" = TRUE
                   AND ("isPublic" = TRUE OR "createdBy" = $1)
                 ORDER BY "usageCount" DESC, "name" ASC`,
                `SELECT *
                 FROM GenerationTemplate
                 WHERE isActive = TRUE
                   AND (isPublic = TRUE OR createdBy = $1)
                 ORDER BY usageCount DESC, name ASC`,
            ],
            [session.user.id]
        )

        return {
            success: true,
            templates: Array.isArray(templates) ? templates : [],
        }
    } catch (error) {
        logger.error({ error }, 'Failed to get generation templates')
        return {
            success: false,
            templates: [],
            message: getErrorMessage('Failed to load templates', error),
        }
    }
}
