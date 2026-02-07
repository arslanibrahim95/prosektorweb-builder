import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { auth } from '@/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    const settings = await prisma.siteSettings.findUnique({
      where: { projectId },
    });

    const design = settings?.design as Record<string, unknown> | null;

    return NextResponse.json({
      success: true,
      data: {
        primaryColor: design?.primaryColor || '#2563eb',
        secondaryColor: design?.secondaryColor || '#1e40af',
        accentColor: design?.accentColor || '#f59e0b',
        bgColor: design?.bgColor || design?.backgroundColor || '#ffffff',
        fontHeading: design?.fontHeading || 'Inter',
        fontBody: design?.fontBody || 'Inter',
        logoUrl: design?.logoUrl || null,
        faviconUrl: design?.faviconUrl || null,
      },
    });
  } catch (error) {
    console.error('Design GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();

    const design = {
      primaryColor: body.primaryColor || '#2563eb',
      secondaryColor: body.secondaryColor || '#1e40af',
      accentColor: body.accentColor || '#f59e0b',
      bgColor: body.bgColor || body.backgroundColor || '#ffffff',
      fontHeading: body.fontHeading || 'Inter',
      fontBody: body.fontBody || 'Inter',
      logoUrl: body.logoUrl || null,
      faviconUrl: body.faviconUrl || null,
    };

    await prisma.siteSettings.upsert({
      where: { projectId },
      create: {
        projectId,
        design,
      },
      update: {
        design,
      },
    });

    return NextResponse.json({ success: true, data: design });
  } catch (error) {
    console.error('Design PUT Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
