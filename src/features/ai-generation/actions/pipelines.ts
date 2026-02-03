'use server'

import { prisma } from '@/server/db'
import { requireAuth, logAudit, getErrorMessage, getZodErrorMessage } from '@/shared/lib'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
    requireCompanyAccess,
    TenantAccessError,
    UnauthorizedError
} from '@/features/system/lib/guards/tenant-guard'
import {
    createPipelineRunner,
    PipelineState,
    PipelineStage,
    PIPELINE_STAGES,
    STAGE_METADATA,
    generateQuote,
    QuoteRequest,
    GeneratedQuote,
    formatQuoteAsText,
    quoteToProposalData,
    PRICING_TIERS,
    ADD_ON_FEATURES,
    AI_PROVIDERS,
    STAGE_AI_CONFIG
} from '@/features/ai-generation/lib/pipeline'

// ==========================================
// TYPES
// ==========================================

export interface PipelineActionResult {
    success: boolean
    data?: unknown
    error?: string
}

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const CreatePipelineSchema = z.object({
    projectId: z.string().uuid('Gecersiz proje ID'),
    vibeMode: z.boolean().optional().default(false),
})

const UpdateStageSchema = z.object({
    pipelineRunId: z.string().uuid('Gecersiz pipeline ID'),
    stage: z.enum(PIPELINE_STAGES),
    output: z.record(z.string(), z.unknown()),
})

// ==========================================
// PIPELINE CRUD
// ==========================================

/**
 * Create a new pipeline run for a project
 */
export async function createPipelineRun(
    projectId: string,
    vibeMode: boolean = false
): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        // Validate input
        const validated = CreatePipelineSchema.parse({ projectId, vibeMode })

        // Get project and verify access
        const project = await prisma.webProject.findUnique({
            where: { id: validated.projectId },
            include: { company: true }
        })

        if (!project) {
            return { success: false, error: 'Proje bulunamadi' }
        }

        // Tenant isolation
        await requireCompanyAccess(project.companyId)

        // Check if there's already an active pipeline
        const existingRun = await prisma.pipelineRun.findFirst({
            where: {
                projectId: validated.projectId,
                status: { in: ['PENDING', 'RUNNING'] }
            }
        })

        if (existingRun) {
            return { success: false, error: 'Bu proje icin aktif bir pipeline calisiyoru' }
        }

        // Create pipeline run
        const pipelineRun = await prisma.pipelineRun.create({
            data: {
                projectId: validated.projectId,
                status: 'PENDING',
                currentStage: 'INPUT',
                vibeMode: validated.vibeMode,
                progress: 0,
                stages: {},
            }
        })

        await logAudit({
            action: 'CREATE',
            entity: 'PipelineRun',
            entityId: pipelineRun.id,
            details: { projectId: validated.projectId, vibeMode: validated.vibeMode }
        })

        revalidatePath(`/admin/projects/${validated.projectId}`)
        return { success: true, data: pipelineRun }
    } catch (error: unknown) {
        console.error('createPipelineRun error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        if (error instanceof z.ZodError) {
            return { success: false, error: getZodErrorMessage(error) }
        }
        return { success: false, error: 'Pipeline olusturulurken hata olustu' }
    }
}

/**
 * Get pipeline run by ID
 */
export async function getPipelineRun(id: string): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        const pipelineRun = await prisma.pipelineRun.findUnique({
            where: { id },
            include: {
                project: {
                    include: { company: true }
                }
            }
        })

        if (!pipelineRun) {
            return { success: false, error: 'Pipeline bulunamadi' }
        }

        // Tenant isolation
        await requireCompanyAccess(pipelineRun.project.companyId)

        return { success: true, data: pipelineRun }
    } catch (error: unknown) {
        console.error('getPipelineRun error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Pipeline alinirken hata olustu' }
    }
}

/**
 * Get pipeline runs for a project
 */
export async function getProjectPipelineRuns(projectId: string): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        const project = await prisma.webProject.findUnique({
            where: { id: projectId },
        })

        if (!project) {
            return { success: false, error: 'Proje bulunamadi' }
        }

        // Tenant isolation
        await requireCompanyAccess(project.companyId)

        const pipelineRuns = await prisma.pipelineRun.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: pipelineRuns }
    } catch (error: unknown) {
        console.error('getProjectPipelineRuns error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Pipeline listesi alinirken hata olustu' }
    }
}

/**
 * Start a pipeline run
 */
export async function startPipelineRun(id: string): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        const pipelineRun = await prisma.pipelineRun.findUnique({
            where: { id },
            include: { project: true }
        })

        if (!pipelineRun) {
            return { success: false, error: 'Pipeline bulunamadi' }
        }

        // Tenant isolation
        await requireCompanyAccess(pipelineRun.project.companyId)

        if (pipelineRun.status !== 'PENDING') {
            return { success: false, error: 'Pipeline baslatilabilir durumda degil' }
        }

        // Update status to running
        const updatedRun = await prisma.pipelineRun.update({
            where: { id },
            data: {
                status: 'RUNNING',
                startedAt: new Date(),
            }
        })

        await logAudit({
            action: 'UPDATE',
            entity: 'PipelineRun',
            entityId: id,
            details: { action: 'start' }
        })

        revalidatePath(`/admin/projects/${pipelineRun.projectId}`)
        return { success: true, data: updatedRun }
    } catch (error: unknown) {
        console.error('startPipelineRun error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Pipeline baslatilirken hata olustu' }
    }
}

/**
 * Update a pipeline stage
 */
export async function updatePipelineStage(
    pipelineRunId: string,
    stage: PipelineStage,
    output: Record<string, unknown>
): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        const pipelineRun = await prisma.pipelineRun.findUnique({
            where: { id: pipelineRunId },
            include: { project: true }
        })

        if (!pipelineRun) {
            return { success: false, error: 'Pipeline bulunamadi' }
        }

        // Tenant isolation
        await requireCompanyAccess(pipelineRun.project.companyId)

        // Get current stages from JSON
        const currentStages = (pipelineRun.stages as Record<string, unknown>) || {}

        // Update the specific stage
        const updatedStages = {
            ...currentStages,
            [stage]: {
                status: 'completed',
                completedAt: new Date().toISOString(),
                output,
            }
        }

        // Calculate next stage
        const stageIndex = PIPELINE_STAGES.indexOf(stage)
        const nextStage = stageIndex < PIPELINE_STAGES.length - 1
            ? PIPELINE_STAGES[stageIndex + 1]
            : stage

        // Calculate progress
        const completedStages = Object.keys(updatedStages).filter(
            (s) => (updatedStages[s] as Record<string, unknown>)?.status === 'completed'
        ).length
        const progress = Math.round((completedStages / PIPELINE_STAGES.length) * 100)

        // Check if pipeline is complete
        const isComplete = completedStages === PIPELINE_STAGES.length

        const updatedRun = await prisma.pipelineRun.update({
            where: { id: pipelineRunId },
            data: {
                stages: updatedStages,
                currentStage: nextStage.toUpperCase() as any,
                progress,
                status: isComplete ? 'COMPLETED' : 'RUNNING',
                completedAt: isComplete ? new Date() : null,
            }
        })

        await logAudit({
            action: 'UPDATE',
            entity: 'PipelineRun',
            entityId: pipelineRunId,
            details: { stage, action: 'complete_stage' }
        })

        revalidatePath(`/admin/projects/${pipelineRun.projectId}`)
        return { success: true, data: updatedRun }
    } catch (error: unknown) {
        console.error('updatePipelineStage error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Pipeline asamasi guncellenirken hata olustu' }
    }
}

/**
 * Fail a pipeline stage
 */
export async function failPipelineStage(
    pipelineRunId: string,
    stage: PipelineStage,
    errorMessage: string,
    errorCode?: string
): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        const pipelineRun = await prisma.pipelineRun.findUnique({
            where: { id: pipelineRunId },
            include: { project: true }
        })

        if (!pipelineRun) {
            return { success: false, error: 'Pipeline bulunamadi' }
        }

        // Tenant isolation
        await requireCompanyAccess(pipelineRun.project.companyId)

        // Get current stages from JSON
        const currentStages = (pipelineRun.stages as Record<string, unknown>) || {}

        // Update the specific stage with error
        const updatedStages = {
            ...currentStages,
            [stage]: {
                status: 'failed',
                error: {
                    message: errorMessage,
                    code: errorCode || 'STAGE_ERROR',
                    recoverable: STAGE_METADATA[stage].canRetry,
                },
                failedAt: new Date().toISOString(),
            }
        }

        const updatedRun = await prisma.pipelineRun.update({
            where: { id: pipelineRunId },
            data: {
                stages: updatedStages,
                status: 'FAILED',
                error: errorMessage,
                errorCode: errorCode || 'STAGE_ERROR',
            }
        })

        await logAudit({
            action: 'UPDATE',
            entity: 'PipelineRun',
            entityId: pipelineRunId,
            details: { stage, action: 'fail_stage', error: errorMessage }
        })

        revalidatePath(`/admin/projects/${pipelineRun.projectId}`)
        return { success: true, data: updatedRun }
    } catch (error: unknown) {
        console.error('failPipelineStage error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Pipeline hatasi kaydedilirken hata olustu' }
    }
}

/**
 * Skip a pipeline stage (if allowed)
 */
export async function skipPipelineStage(
    pipelineRunId: string,
    stage: PipelineStage
): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        // Check if stage can be skipped
        if (!STAGE_METADATA[stage].canSkip) {
            return { success: false, error: `${STAGE_METADATA[stage].name} asamasi atlanamaz` }
        }

        const pipelineRun = await prisma.pipelineRun.findUnique({
            where: { id: pipelineRunId },
            include: { project: true }
        })

        if (!pipelineRun) {
            return { success: false, error: 'Pipeline bulunamadi' }
        }

        // Tenant isolation
        await requireCompanyAccess(pipelineRun.project.companyId)

        // Get current stages from JSON
        const currentStages = (pipelineRun.stages as Record<string, unknown>) || {}

        // Update the specific stage as skipped
        const updatedStages = {
            ...currentStages,
            [stage]: {
                status: 'skipped',
                skippedAt: new Date().toISOString(),
            }
        }

        // Calculate next stage
        const stageIndex = PIPELINE_STAGES.indexOf(stage)
        const nextStage = stageIndex < PIPELINE_STAGES.length - 1
            ? PIPELINE_STAGES[stageIndex + 1]
            : stage

        // Calculate progress (skipped counts as complete)
        const completedStages = Object.keys(updatedStages).filter(
            (s) => ['completed', 'skipped'].includes(
                ((updatedStages[s] as Record<string, unknown>)?.status as string) || ''
            )
        ).length
        const progress = Math.round((completedStages / PIPELINE_STAGES.length) * 100)

        const updatedRun = await prisma.pipelineRun.update({
            where: { id: pipelineRunId },
            data: {
                stages: updatedStages,
                currentStage: nextStage.toUpperCase() as any,
                progress,
            }
        })

        await logAudit({
            action: 'UPDATE',
            entity: 'PipelineRun',
            entityId: pipelineRunId,
            details: { stage, action: 'skip_stage' }
        })

        revalidatePath(`/admin/projects/${pipelineRun.projectId}`)
        return { success: true, data: updatedRun }
    } catch (error: unknown) {
        console.error('skipPipelineStage error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Pipeline asamasi atlanirken hata olustu' }
    }
}

/**
 * Retry a failed pipeline stage
 */
export async function retryPipelineStage(
    pipelineRunId: string,
    stage: PipelineStage
): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        // Check if stage can be retried
        if (!STAGE_METADATA[stage].canRetry) {
            return { success: false, error: `${STAGE_METADATA[stage].name} asamasi yeniden denenemez` }
        }

        const pipelineRun = await prisma.pipelineRun.findUnique({
            where: { id: pipelineRunId },
            include: { project: true }
        })

        if (!pipelineRun) {
            return { success: false, error: 'Pipeline bulunamadi' }
        }

        // Tenant isolation
        await requireCompanyAccess(pipelineRun.project.companyId)

        // Get current stages from JSON
        const currentStages = (pipelineRun.stages as Record<string, unknown>) || {}

        // Reset the specific stage
        const updatedStages = {
            ...currentStages,
            [stage]: {
                status: 'pending',
                retryAt: new Date().toISOString(),
            }
        }

        const updatedRun = await prisma.pipelineRun.update({
            where: { id: pipelineRunId },
            data: {
                stages: updatedStages,
                currentStage: stage.toUpperCase() as any,
                status: 'RUNNING',
                error: null,
                errorCode: null,
            }
        })

        await logAudit({
            action: 'UPDATE',
            entity: 'PipelineRun',
            entityId: pipelineRunId,
            details: { stage, action: 'retry_stage' }
        })

        revalidatePath(`/admin/projects/${pipelineRun.projectId}`)
        return { success: true, data: updatedRun }
    } catch (error: unknown) {
        console.error('retryPipelineStage error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Pipeline asamasi yeniden denenirken hata olustu' }
    }
}

/**
 * Cancel a pipeline run
 */
export async function cancelPipelineRun(id: string): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        const pipelineRun = await prisma.pipelineRun.findUnique({
            where: { id },
            include: { project: true }
        })

        if (!pipelineRun) {
            return { success: false, error: 'Pipeline bulunamadi' }
        }

        // Tenant isolation
        await requireCompanyAccess(pipelineRun.project.companyId)

        if (pipelineRun.status === 'COMPLETED') {
            return { success: false, error: 'Tamamlanmis pipeline iptal edilemez' }
        }

        const updatedRun = await prisma.pipelineRun.update({
            where: { id },
            data: {
                status: 'FAILED',
                error: 'Kullanici tarafindan iptal edildi',
                errorCode: 'USER_CANCELLED',
            }
        })

        await logAudit({
            action: 'UPDATE',
            entity: 'PipelineRun',
            entityId: id,
            details: { action: 'cancel' }
        })

        revalidatePath(`/admin/projects/${pipelineRun.projectId}`)
        return { success: true, data: updatedRun }
    } catch (error: unknown) {
        console.error('cancelPipelineRun error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        return { success: false, error: 'Pipeline iptal edilirken hata olustu' }
    }
}

/**
 * Get pipeline stage metadata
 */
export async function getPipelineStageMetadata(): Promise<PipelineActionResult> {
    return {
        success: true,
        data: {
            stages: PIPELINE_STAGES,
            metadata: STAGE_METADATA,
        }
    }
}

// ==========================================
// QUOTE GENERATION
// ==========================================

const QuoteRequestSchema = z.object({
    companyName: z.string().min(2, 'Firma adi en az 2 karakter olmali'),
    industry: z.string().optional(),
    pageCount: z.number().min(1).max(100),
    features: z.array(z.string()),
    preferredTier: z.string().optional(),
    hasExistingSite: z.boolean(),
    needsDomain: z.boolean(),
    needsHosting: z.boolean(),
    urgency: z.enum(['normal', 'fast', 'urgent']),
    notes: z.string().optional(),
})

/**
 * Generate a price quote for a web project
 */
export async function generateProjectQuote(
    request: QuoteRequest
): Promise<PipelineActionResult> {
    try {
        // Validate request
        const validated = QuoteRequestSchema.parse(request)

        // Generate quote
        const quote = generateQuote(validated)

        return { success: true, data: quote }
    } catch (error: unknown) {
        console.error('generateProjectQuote error:', error)
        if (error instanceof z.ZodError) {
            return { success: false, error: getZodErrorMessage(error) }
        }
        return { success: false, error: 'Teklif olusturulurken hata olustu' }
    }
}

/**
 * Generate quote and create proposal in database
 */
export async function generateAndSaveQuote(
    request: QuoteRequest,
    companyId: string
): Promise<PipelineActionResult> {
    try {
        await requireAuth()

        // Tenant isolation
        await requireCompanyAccess(companyId)

        // Validate request
        const validated = QuoteRequestSchema.parse(request)

        // Generate quote
        const quote = generateQuote(validated)

        // Convert to proposal data
        const proposalData = quoteToProposalData(quote)

        // Create proposal in database
        const proposal = await prisma.proposal.create({
            data: {
                companyId,
                subject: proposalData.title,
                subtotal: proposalData.subtotal.toString(),
                taxAmount: proposalData.tax.toString(),
                total: proposalData.total.toString(),
                validUntil: proposalData.validUntil,
                notes: `${proposalData.description}\n\n${proposalData.notes}`,
                status: 'DRAFT',
                items: {
                    create: proposalData.items.map(item => ({
                        description: `${item.name} - ${item.description}`,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.unitPrice * item.quantity,
                    }))
                }
            }
        })

        await logAudit({
            action: 'CREATE',
            entity: 'Proposal',
            entityId: proposal.id,
            details: { quoteId: quote.id, companyId }
        })

        revalidatePath('/admin/proposals')
        return {
            success: true,
            data: {
                quote,
                proposal,
                formattedQuote: formatQuoteAsText(quote)
            }
        }
    } catch (error: unknown) {
        console.error('generateAndSaveQuote error:', error)
        if (error instanceof TenantAccessError || error instanceof UnauthorizedError) {
            return { success: false, error: error.message }
        }
        if (error instanceof z.ZodError) {
            return { success: false, error: getZodErrorMessage(error) }
        }
        return { success: false, error: 'Teklif olusturulurken hata olustu' }
    }
}

/**
 * Get pricing tiers and add-on features
 */
export async function getPricingOptions(): Promise<PipelineActionResult> {
    return {
        success: true,
        data: {
            tiers: PRICING_TIERS,
            addOns: ADD_ON_FEATURES,
        }
    }
}

/**
 * Get AI provider configuration
 */
export async function getAIProviderConfig(): Promise<PipelineActionResult> {
    return {
        success: true,
        data: {
            providers: AI_PROVIDERS,
            stageConfig: STAGE_AI_CONFIG,
        }
    }
}
