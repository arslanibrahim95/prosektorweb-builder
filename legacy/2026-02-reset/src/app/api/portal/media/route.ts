import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const companyId = searchParams.get('companyId');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (companyId) where.companyId = companyId;

    const media = await prisma.siteMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Map to expected format for MediaLibrary component
    const data = media.map((m) => ({
      id: m.id,
      url: m.url,
      originalName: m.filename,
      alt: m.alt,
      size: m.size || 0,
      category: m.category,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Media GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { companyId, filename, url, category, alt, size, mimeType } = body;

    if (!companyId || !filename || !url) {
      return NextResponse.json(
        { success: false, error: 'companyId, filename, and url are required' },
        { status: 400 }
      );
    }

    const media = await prisma.siteMedia.create({
      data: {
        companyId,
        filename,
        url,
        category: category || 'GENERAL',
        alt: alt || null,
        size: size || null,
        mimeType: mimeType || null,
      },
    });

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
    console.error('Media POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
