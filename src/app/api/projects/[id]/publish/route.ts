import { z } from 'zod'
import { auth } from '@/auth'
import {
  AgentApprovalAccessError,
  AgentApprovalRejectedError,
} from '@/features/projects/lib/agent-approval'
import { publishProject } from '@/features/projects/lib/project-layer'
import { apiError, apiSuccess } from '@/shared/lib/api-contract'

const publishRequestSchema = z.object({
  qaScore: z.number().min(0).max(100).optional(),
  escalationLevel: z.enum(['none', 'low', 'medium', 'high']).optional(),
  force: z.boolean().optional(),
  minQaScore: z.number().min(0).max(100).optional(),
  requireQaScore: z.boolean().optional(),
})

interface SessionUser {
  id?: string
  role?: string
  email?: string | null
  name?: string | null
}

function toStatusCode(error: unknown): number {
  if (error instanceof AgentApprovalAccessError) return error.statusCode
  if (error instanceof AgentApprovalRejectedError) return error.statusCode
  return 400
}

function toErrorCode(error: unknown): string {
  if (error instanceof AgentApprovalAccessError) return 'FORBIDDEN_FORCE_OVERRIDE'
  if (error instanceof AgentApprovalRejectedError) {
    return error.statusCode === 504 ? 'AGENT_APPROVAL_TIMEOUT' : 'AGENT_APPROVAL_REJECTED'
  }
  return 'PROJECT_PUBLISH_FAILED'
}

async function parsePublishRequestBody(request: Request): Promise<z.infer<typeof publishRequestSchema>> {
  const contentType = (request.headers.get('content-type') || '').toLowerCase()
  if (!contentType.includes('application/json')) {
    return {}
  }

  try {
    const json = await request.json()
    return publishRequestSchema.parse(json)
  } catch {
    return {}
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bodyData = await parsePublishRequestBody(request)
    const session = await auth()
    const user = (session?.user || {}) as SessionUser

    const result = await publishProject(id, {
      ...bodyData,
      actor: {
        userId: user.id || null,
        role: user.role || null,
        email: user.email || null,
        name: user.name || null,
      },
    })

    return apiSuccess({
      project: result.project,
      pagesPublished: result.pagesPublished,
      webhook: result.webhook,
      qualityGate: result.qualityGate,
      approval: result.approval,
    })
  } catch (error) {
    console.error('Publish project error:', error)
    const message = error instanceof Error ? error.message : 'Yayinlama basarisiz'

    if (error instanceof AgentApprovalRejectedError) {
      return apiError({
        status: toStatusCode(error),
        code: toErrorCode(error),
        error: message,
        extra: {
          approval: error.approval,
        },
      })
    }

    return apiError({
      status: toStatusCode(error),
      code: toErrorCode(error),
      error: message,
    })
  }
}
