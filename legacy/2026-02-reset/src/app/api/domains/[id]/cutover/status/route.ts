import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCutoverStatus } from '@/features/projects/lib/domain-cutover';

function isAdmin(role: unknown): boolean {
  return String(role || '').toUpperCase() === 'ADMIN';
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const status = await getCutoverStatus(id);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cutover durumu alınamadı';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
