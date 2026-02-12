import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'site-media';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'GENERAL';
    const companyId = formData.get('companyId') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const filename = `${companyId}/${category.toLowerCase()}/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    // Save to database
    const media = await prisma.siteMedia.create({
      data: {
        companyId,
        filename: file.name,
        url: urlData.publicUrl,
        category,
        size: file.size,
        mimeType: file.type,
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
    console.error('Media upload error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
