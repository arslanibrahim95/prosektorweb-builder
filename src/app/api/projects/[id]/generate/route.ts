import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  AgentApprovalAccessError,
  AgentApprovalRejectedError,
} from '@/features/projects/lib/agent-approval'
import { generateProjectPages } from '@/features/projects/lib/project-layer'

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

    return NextResponse.json({ success: true, pages: result.pages, approval: result.approval })
  } catch (error) {
    console.error('Generate project pages error:', error)
    const message = error instanceof Error ? error.message : 'Icerik uretimi basarisiz'

    if (error instanceof AgentApprovalRejectedError) {
      return NextResponse.json(
        {
          success: false,
          error: message,
          approval: error.approval,
        },
        { status: toStatusCode(error) }
      )
    }

    return NextResponse.json({ success: false, error: message }, { status: toStatusCode(error) })
  }
}
