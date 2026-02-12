import { NextResponse } from 'next/server';
import { updateProjectPage } from '@/features/projects/lib/project-layer';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { id, pageId } = await params;
    const body = await request.json();
    const page = await updateProjectPage(id, pageId, body);

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('Update project page error:', error);
    const message = error instanceof Error ? error.message : 'Sayfa kaydedilemedi';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
