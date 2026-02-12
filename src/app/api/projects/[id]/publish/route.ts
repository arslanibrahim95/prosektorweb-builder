import { NextResponse } from 'next/server'
import { z } from 'zod'
import { publishProject } from '@/features/projects/lib/project-layer'

const publishRequestSchema = z.object({
  qaScore: z.number().min(0).max(100).optional(),
  escalationLevel: z.enum(['none', 'low', 'medium', 'high']).optional(),
  force: z.boolean().optional(),
  minQaScore: z.number().min(0).max(100).optional(),
  requireQaScore: z.boolean().optional(),
})

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
    const result = await publishProject(id, bodyData)

    return NextResponse.json({
      success: true,
      project: result.project,
      pagesPublished: result.pagesPublished,
      webhook: result.webhook,
      qualityGate: result.qualityGate,
    })
  } catch (error) {
    console.error('Publish project error:', error)
    const message = error instanceof Error ? error.message : 'Yayinlama basarisiz'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
