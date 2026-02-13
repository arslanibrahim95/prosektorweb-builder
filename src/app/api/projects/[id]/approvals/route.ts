import { NextResponse } from 'next/server'
import { listAgentApprovalRuns } from '@/features/projects/lib/agent-approval.store'

function parseLimit(url: string): number {
  const search = new URL(url).searchParams
  const raw = search.get('limit')
  const parsed = Number.parseInt(raw || '', 10)
  if (!Number.isFinite(parsed)) return 20
  if (parsed < 1) return 1
  if (parsed > 100) return 100
  return parsed
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const limit = parseLimit(request.url)
    const approvals = await listAgentApprovalRuns(id, limit)

    return NextResponse.json({
      success: true,
      approvals,
    })
  } catch (error) {
    console.error('List approvals error:', error)
    const message = error instanceof Error ? error.message : 'Approval kayitlari alinamadi'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
