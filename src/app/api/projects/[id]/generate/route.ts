import { NextResponse } from 'next/server'
import { generateProjectPages } from '@/features/projects/lib/project-layer'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const pages = await generateProjectPages(id, body)

    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error('Generate project pages error:', error)
    const message = error instanceof Error ? error.message : 'Icerik uretimi basarisiz'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
}
