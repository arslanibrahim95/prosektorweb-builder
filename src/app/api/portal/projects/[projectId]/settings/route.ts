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

    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          phone: '',
          email: '',
          address: '',
          workingHours: '',
          mapEmbed: '',
          socialMedia: {},
          siteTitle: '',
          siteDescription: '',
          keywords: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
        workingHours: settings.workingHours || '',
        mapEmbed: settings.mapEmbed || '',
        socialMedia: settings.socialMedia || {},
        siteTitle: settings.siteTitle || '',
        siteDescription: settings.siteDescription || '',
        keywords: settings.keywords || [],
      },
    });
  } catch (error) {
    console.error('Settings GET Error:', error);
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

    const socialMedia = {
      facebook: body.facebook || null,
      instagram: body.instagram || null,
      linkedin: body.linkedin || null,
      twitter: body.twitter || null,
      youtube: body.youtube || null,
    };

    const data = {
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      workingHours: body.workingHours || null,
      mapEmbed: body.mapEmbed || null,
      socialMedia,
      siteTitle: body.siteTitle || null,
      siteDescription: body.siteDescription || null,
      keywords: body.keywords || [],
    };

    await prisma.siteSettings.upsert({
      where: { projectId },
      create: {
        projectId,
        ...data,
      },
      update: data,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Settings PUT Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
