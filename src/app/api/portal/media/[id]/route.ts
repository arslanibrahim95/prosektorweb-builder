import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { auth } from '@/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.siteMedia.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const media = await prisma.siteMedia.findUnique({
      where: { id },
    });

    if (!media) {
      return NextResponse.json({ success: false, error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: media.id,
        url: media.url,
        originalName: media.filename,
        alt: media.alt,
        size: media.size || 0,
        category: media.category,
        createdAt: media.createdAt,
      },
    });
  } catch (error) {
    console.error('Media GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
