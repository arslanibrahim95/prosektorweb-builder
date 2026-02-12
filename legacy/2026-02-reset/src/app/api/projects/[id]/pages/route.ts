import { NextResponse } from 'next/server';
import { createProjectPage, listProjectPages } from '@/features/projects/lib/project-layer';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pages = await listProjectPages(id);
    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('List project pages error:', error);
    const message = error instanceof Error ? error.message : 'Sayfalar yüklenemedi';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const page = await createProjectPage(id, body);
    return NextResponse.json({ success: true, page }, { status: 201 });
  } catch (error) {
    console.error('Create project page error:', error);
    const message = error instanceof Error ? error.message : 'Sayfa oluşturulamadı';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
