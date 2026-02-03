-/**
 * AI Website Generation Actions
 * Server actions for managing AI-powered website generation
 */

    'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/server/db';
import { logger, createSafeAction } from '@/shared/lib';
import { z } from 'zod';
import {
    validatePrompt,
    sanitizePrompt,
    hashPrompt,
    checkGenerationRateLimit,
    incrementGenerationRateLimit,
    checkGenerationPermission,
    checkJobAccess,
    canCreateNewVersion,
} from '../lib/validation';
import { GenerationOrchestrator } from '../lib/orchestrator';
import type {
    CreateGenerationRequest,
    CreateGenerationResponse,
    GenerationStatusResponse,
    GalleryResponse,
    GalleryQueryParams,
    CloneWebsiteRequest,
    RollbackRequest,
} from '../types';

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const createGenerationSchema = z.object({
    prompt: z.string().min(20).max(2000),
    templateId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    customSettings: z.record(z.string(), z.any()).optional(),
});

const galleryQuerySchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(50).default(20),
    status: z.enum(['PENDING', 'ANALYZING', 'DESIGNING', 'GENERATING_CONTENT', 'GENERATING_CODE', 'BUILDING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const cloneWebsiteSchema = z.object({
    websiteId: z.string().uuid(),
    newName: z.string().min(3).max(100),
    prompt: z.string().max(2000).optional(),
});

const rollbackSchema = z.object({
    websiteId: z.string().uuid(),
    toVersion: z.number().min(1),
});

// ==========================================
// CREATE GENERATION JOB
// ==========================================

/**
 * Creates a new AI website generation job
 */
export async function createGeneration(
    input: CreateGenerationRequest
): Promise<CreateGenerationResponse> {
    const requestId = crypto.randomUUID();
    const session = await auth();

    // Check authentication
    if (!session?.user) {
        return {
            success: false,
            message: 'Authentication required',
            meta: { requestId },
        };
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    try {
        // Validate input
        const validation = createGenerationSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                message: 'Invalid input: ' + validation.error.issues.map(e => e.message).join(', '),
                meta: { requestId },
            };
        }

        // Check permissions
        const permissionCheck = checkGenerationPermission(userRole);
        if (!permissionCheck.allowed) {
            return {
                success: false,
                message: permissionCheck.reason || 'Permission denied',
                meta: { requestId },
            };
        }

        // Validate prompt
        const promptValidation = validatePrompt(input.prompt);
        if (!promptValidation.valid) {
            return {
                success: false,
                message: 'Prompt validation failed: ' + promptValidation.errors.join(', '),
                meta: { requestId },
            };
        }

        // Check rate limit
        const rateLimitCheck = await checkGenerationRateLimit(userId, userRole);
        if (!rateLimitCheck.allowed) {
            return {
                success: false,
                message: rateLimitCheck.reason || 'Rate limit exceeded',
                meta: { requestId },
            };
        }

        // Sanitize and hash prompt
        const sanitizedPrompt = sanitizePrompt(input.prompt);
        const promptHash = hashPrompt(sanitizedPrompt);

        // Check for duplicate generation
        const existingJob = await prisma.$queryRaw`
      SELECT id, status FROM AIGenerationJob 
      WHERE promptHash = ${promptHash} 
      AND userId = ${userId}
      AND status NOT IN ('FAILED', 'CANCELLED')
      AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      LIMIT 1
    `;

        if (Array.isArray(existingJob) && existingJob.length > 0) {
            return {
                success: false,
                message: 'A similar generation is already in progress or was recently completed',
                meta: { requestId },
            };
        }

        // Create generation job
        const job = await prisma.$queryRaw`
      INSERT INTO AIGenerationJob (
        id, userId, companyId, prompt, promptHash, status, 
        currentStep, progress, stepsCompleted, totalSteps,
        estimatedDuration, isLatest, version, createdAt, updatedAt
      ) VALUES (
        ${crypto.randomUUID()}, ${userId}, ${input.companyId || null}, 
        ${sanitizedPrompt}, ${promptHash}, 'PENDING',
        NULL, 0, 0, 5,
        ${promptValidation.estimatedComplexity === 'COMPLEX' ? 600 : promptValidation.estimatedComplexity === 'MODERATE' ? 400 : 300},
        TRUE, 1, NOW(), NOW()
      )
    `;

        // Get the created job ID
        const createdJob = await prisma.$queryRaw`
      SELECT id FROM AIGenerationJob 
      WHERE userId = ${userId} 
      ORDER BY createdAt DESC 
      LIMIT 1
    `;

        const jobId = Array.isArray(createdJob) && createdJob.length > 0
            ? (createdJob[0] as any).id
            : null;

        if (!jobId) {
            throw new Error('Failed to create generation job');
        }

        // Increment rate limit
        await incrementGenerationRateLimit(userId);

        // Start generation process asynchronously
        const orchestrator = new GenerationOrchestrator();
        orchestrator.startGeneration(jobId, {
            prompt: sanitizedPrompt,
            templateId: input.templateId,
            customSettings: input.customSettings,
        }).catch(error => {
            logger.error({ error, jobId }, 'Generation orchestrator failed');
        });

        // Log activity
        logger.info({
            requestId,
            jobId,
            userId,
            promptLength: sanitizedPrompt.length,
            complexity: promptValidation.estimatedComplexity,
        }, 'Generation job created');

        return {
            success: true,
            jobId,
            message: 'Generation started successfully',
            estimatedDuration: promptValidation.estimatedComplexity === 'COMPLEX' ? 600 : promptValidation.estimatedComplexity === 'MODERATE' ? 400 : 300,
            meta: { requestId },
        };

    } catch (error) {
        logger.error({ error, requestId, userId }, 'Failed to create generation job');
        return {
            success: false,
            message: 'Failed to start generation. Please try again.',
            meta: { requestId },
        };
    }
}

// ==========================================
// GET GENERATION STATUS
// ==========================================

/**
 * Gets the status of a generation job
 */
export async function getGenerationStatus(
    jobId: string
): Promise<GenerationStatusResponse> {
    const requestId = crypto.randomUUID();
    const session = await auth();

    if (!session?.user) {
        return {
            success: false,
            message: 'Authentication required',
            meta: { requestId },
        };
    }

    try {
        // Check access permissions
        const accessCheck = await checkJobAccess(
            session.user.id,
            session.user.role,
            jobId
        );

        if (!accessCheck.allowed) {
            return {
                success: false,
                message: accessCheck.reason || 'Access denied',
                meta: { requestId },
            };
        }

        // Get job details
        const job = await prisma.$queryRaw`
      SELECT * FROM AIGenerationJob WHERE id = ${jobId} LIMIT 1
    `;

        if (!Array.isArray(job) || job.length === 0) {
            return {
                success: false,
                message: 'Generation job not found',
                meta: { requestId },
            };
        }

        return {
            success: true,
            job: job[0] as any,
            meta: { requestId },
        };

    } catch (error) {
        logger.error({ error, requestId, jobId }, 'Failed to get generation status');
        return {
            success: false,
            message: 'Failed to retrieve generation status',
            meta: { requestId },
        };
    }
}

// ==========================================
// CANCEL GENERATION
// ==========================================

/**
 * Cancels an in-progress generation job
 */
export async function cancelGeneration(
    jobId: string
): Promise<{ success: boolean; message: string }> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, message: 'Authentication required' };
    }

    try {
        const accessCheck = await checkJobAccess(
            session.user.id,
            session.user.role,
            jobId
        );

        if (!accessCheck.allowed) {
            return { success: false, message: accessCheck.reason || 'Access denied' };
        }

        await prisma.$queryRaw`
      UPDATE AIGenerationJob 
      SET status = 'CANCELLED', updatedAt = NOW() 
      WHERE id = ${jobId} 
      AND status IN ('PENDING', 'ANALYZING', 'DESIGNING', 'GENERATING_CONTENT', 'GENERATING_CODE', 'BUILDING')
    `;

        logger.info({ jobId, userId: session.user.id }, 'Generation job cancelled');

        return { success: true, message: 'Generation cancelled successfully' };
    } catch (error) {
        logger.error({ error, jobId }, 'Failed to cancel generation');
        return { success: false, message: 'Failed to cancel generation' };
    }
}

// ==========================================
// GALLERY / LIST GENERATED WEBSITES
// ==========================================

/**
 * Lists generated websites for the gallery view
 */
export async function getGeneratedWebsites(
    params: GalleryQueryParams = {}
): Promise<GalleryResponse> {
    const requestId = crypto.randomUUID();
    const session = await auth();

    if (!session?.user) {
        return {
            success: false,
            websites: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            meta: { requestId },
        };
    }

    try {
        const { page = 1, limit = 20, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;
        const skip = (page - 1) * limit;

        // Build query conditions
        let whereClause = `WHERE gw.userId = '${session.user.id}'`;

        if (session.user.role === 'ADMIN') {
            whereClause = ''; // Admins can see all
        }

        if (status) {
            whereClause += whereClause ? ` AND aj.status = '${status}'` : `WHERE aj.status = '${status}'`;
        }

        if (search) {
            whereClause += whereClause
                ? ` AND (gw.name LIKE '%${search}%' OR gw.description LIKE '%${search}%')`
                : `WHERE (gw.name LIKE '%${search}%' OR gw.description LIKE '%${search}%')`;
        }

        // Get total count
        const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total 
      FROM GeneratedWebsite gw
      LEFT JOIN AIGenerationJob aj ON gw.jobId = aj.id
      ${whereClause ? prisma.$queryRawUnsafe(whereClause) : ''}
    `;

        const total = Array.isArray(countResult) && countResult.length > 0
            ? Number((countResult[0] as any).total)
            : 0;

        // Get websites
        const websites = await prisma.$queryRaw`
      SELECT gw.*, aj.status as jobStatus, aj.progress as jobProgress
      FROM GeneratedWebsite gw
      LEFT JOIN AIGenerationJob aj ON gw.jobId = aj.id
      ${whereClause ? prisma.$queryRawUnsafe(whereClause) : ''}
      ORDER BY gw.${sortBy} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}
      LIMIT ${limit} OFFSET ${skip}
    `;

        return {
            success: true,
            websites: Array.isArray(websites) ? websites as any[] : [],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            meta: { requestId },
        };

    } catch (error) {
        logger.error({ error, requestId }, 'Failed to get generated websites');
        return {
            success: false,
            websites: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
            meta: { requestId },
        };
    }
}

// ==========================================
// CLONE WEBSITE
// ==========================================

/**
 * Clones an existing generated website
 */
export async function cloneWebsite(
    input: CloneWebsiteRequest
): Promise<{ success: boolean; message: string; jobId?: string }> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, message: 'Authentication required' };
    }

    try {
        const validation = cloneWebsiteSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                message: 'Invalid input: ' + validation.error.issues.map(e => e.message).join(', '),
            };
        }

        // Get original website
        const original = await prisma.$queryRaw`
      SELECT * FROM GeneratedWebsite WHERE id = ${input.websiteId} LIMIT 1
    `;

        if (!Array.isArray(original) || original.length === 0) {
            return { success: false, message: 'Website not found' };
        }

        const originalWebsite = original[0] as any;

        // Check permissions
        if (originalWebsite.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return { success: false, message: 'Permission denied' };
        }

        // Check rate limit
        const rateLimitCheck = await checkGenerationRateLimit(session.user.id, session.user.role);
        if (!rateLimitCheck.allowed) {
            return { success: false, message: rateLimitCheck.reason || 'Rate limit exceeded' };
        }

        // Create new prompt based on original
        const clonePrompt = input.prompt ||
            `Clone of ${originalWebsite.name} with similar design and structure`;

        // Create new generation job
        const result = await createGeneration({
            prompt: clonePrompt,
            companyId: originalWebsite.companyId,
        });

        if (result.success && result.jobId) {
            // Mark as clone in activity log
            await prisma.$queryRaw`
        INSERT INTO GenerationActivity (id, jobId, websiteId, userId, activityType, details, createdAt)
        VALUES (
          ${crypto.randomUUID()}, 
          ${result.jobId}, 
          ${input.websiteId}, 
          ${session.user.id}, 
          'CLONED',
          ${JSON.stringify({ originalName: originalWebsite.name, newName: input.newName })},
          NOW()
        )
      `;

            return {
                success: true,
                message: 'Website clone started successfully',
                jobId: result.jobId,
            };
        }

        return { success: false, message: result.message };

    } catch (error) {
        logger.error({ error, input }, 'Failed to clone website');
        return { success: false, message: 'Failed to clone website' };
    }
}

// ==========================================
// ROLLBACK WEBSITE
// ==========================================

/**
 * Rolls back a website to a previous version
 */
export async function rollbackWebsite(
    input: RollbackRequest
): Promise<{ success: boolean; message: string }> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, message: 'Authentication required' };
    }

    try {
        const validation = rollbackSchema.safeParse(input);
        if (!validation.success) {
            return {
                success: false,
                message: 'Invalid input: ' + validation.error.issues.map(e => e.message).join(', '),
            };
        }

        // Get current website
        const current = await prisma.$queryRaw`
      SELECT * FROM GeneratedWebsite WHERE id = ${input.websiteId} LIMIT 1
    `;

        if (!Array.isArray(current) || current.length === 0) {
            return { success: false, message: 'Website not found' };
        }

        const currentWebsite = current[0] as any;

        // Check permissions
        if (currentWebsite.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return { success: false, message: 'Permission denied' };
        }

        // Get target version
        const target = await prisma.$queryRaw`
      SELECT * FROM GeneratedWebsite 
      WHERE slug = ${currentWebsite.slug} 
      AND version = ${input.toVersion}
      AND canRollback = TRUE
      LIMIT 1
    `;

        if (!Array.isArray(target) || target.length === 0) {
            return { success: false, message: `Version ${input.toVersion} not found or cannot be rolled back to` };
        }

        const targetVersion = target[0] as any;

        // Deactivate current version
        await prisma.$queryRaw`
      UPDATE GeneratedWebsite 
      SET isActive = FALSE, updatedAt = NOW() 
      WHERE id = ${input.websiteId}
    `;

        // Activate target version
        await prisma.$queryRaw`
      UPDATE GeneratedWebsite 
      SET isActive = TRUE, updatedAt = NOW() 
      WHERE id = ${targetVersion.id}
    `;

        // Log activity
        await prisma.$queryRaw`
      INSERT INTO GenerationActivity (id, jobId, websiteId, userId, activityType, details, createdAt)
      VALUES (
        ${crypto.randomUUID()}, 
        ${targetVersion.jobId}, 
        ${input.websiteId}, 
        ${session.user.id}, 
        'ROLLED_BACK',
        ${JSON.stringify({ fromVersion: currentWebsite.version, toVersion: input.toVersion })},
        NOW()
      )
    `;

        revalidatePath('/admin/ai-generation');

        return {
            success: true,
            message: `Successfully rolled back to version ${input.toVersion}`,
        };

    } catch (error) {
        logger.error({ error, input }, 'Failed to rollback website');
        return { success: false, message: 'Failed to rollback website' };
    }
}

// ==========================================
// DELETE WEBSITE
// ==========================================

/**
 * Deletes a generated website
 */
export async function deleteWebsite(
    websiteId: string
): Promise<{ success: boolean; message: string }> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, message: 'Authentication required' };
    }

    try {
        const website = await prisma.$queryRaw`
      SELECT * FROM GeneratedWebsite WHERE id = ${websiteId} LIMIT 1
    `;

        if (!Array.isArray(website) || website.length === 0) {
            return { success: false, message: 'Website not found' };
        }

        const websiteData = website[0] as any;

        if (websiteData.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return { success: false, message: 'Permission denied' };
        }

        // Soft delete - mark as deleted
        await prisma.$queryRaw`
      UPDATE GeneratedWebsite 
      SET isActive = FALSE, updatedAt = NOW() 
      WHERE id = ${websiteId}
    `;

        // Log activity
        await prisma.$queryRaw`
      INSERT INTO GenerationActivity (id, websiteId, userId, activityType, createdAt)
      VALUES (${crypto.randomUUID()}, ${websiteId}, ${session.user.id}, 'DELETED', NOW())
    `;

        revalidatePath('/admin/ai-generation');

        return { success: true, message: 'Website deleted successfully' };

    } catch (error) {
        logger.error({ error, websiteId }, 'Failed to delete website');
        return { success: false, message: 'Failed to delete website' };
    }
}

// ==========================================
// GET TEMPLATES
// ==========================================

/**
 * Gets available generation templates
 */
export async function getGenerationTemplates(): Promise<{
    success: boolean;
    templates: any[];
    message?: string;
}> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, templates: [], message: 'Authentication required' };
    }

    try {
        const templates = await prisma.$queryRaw`
      SELECT * FROM GenerationTemplate 
      WHERE isActive = TRUE 
      AND (isPublic = TRUE OR createdBy = ${session.user.id})
      ORDER BY usageCount DESC, name ASC
    `;

        return {
            success: true,
            templates: Array.isArray(templates) ? templates : [],
        };

    } catch (error) {
        logger.error({ error }, 'Failed to get generation templates');
        return { success: false, templates: [], message: 'Failed to load templates' };
    }
}
