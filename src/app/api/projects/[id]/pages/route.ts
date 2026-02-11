import { NextResponse } from 'next/server'
import { listProjectPages } from '@/features/projects/lib/project-layer'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pages = await listProjectPages(id)
    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error('List project pages error:', error)
    const message = error instanceof Error ? error.message : 'Sayfalar yuklenemedi'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
