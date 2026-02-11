import { NextResponse } from 'next/server'
import { getProject } from '@/features/projects/lib/project-layer'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const project = await getProject(id)

    if (!project) {
      return NextResponse.json({ success: false, error: 'Proje bulunamadi' }, { status: 404 })
    }

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Get project error:', error)
    const message = error instanceof Error ? error.message : 'Proje yuklenemedi'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
