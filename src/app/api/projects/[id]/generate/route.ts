import { auth } from '@/auth'
import {
  AgentApprovalAccessError,
  AgentApprovalRejectedError,
} from '@/features/projects/lib/agent-approval'
import { generateProjectPages } from '@/features/projects/lib/project-layer'
import { apiError, apiSuccess } from '@/shared/lib/api-contract'

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
  return 'PROJECT_GENERATE_FAILED'
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const session = await auth()
    const user = (session?.user || {}) as SessionUser

    const result = await generateProjectPages(id, body, {
      force: body && typeof body === 'object' ? (body as Record<string, unknown>).force === true : false,
      actor: {
        userId: user.id || null,
        role: user.role || null,
        email: user.email || null,
        name: user.name || null,
      },
    })

    return apiSuccess({ pages: result.pages, approval: result.approval })
  } catch (error) {
    console.error('Generate project pages error:', error)
    const message = error instanceof Error ? error.message : 'Icerik uretimi basarisiz'

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
