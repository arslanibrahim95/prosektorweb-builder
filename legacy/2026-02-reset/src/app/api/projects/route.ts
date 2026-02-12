import { NextResponse } from 'next/server';
import { createProject, listProjects } from '@/features/projects/lib/project-layer';

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('Projects list error:', error);
    const message = error instanceof Error ? error.message : 'Projeler yüklenemedi';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const project = await createProject(body);
    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    const message = error instanceof Error ? error.message : 'Proje oluşturulamadı';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
