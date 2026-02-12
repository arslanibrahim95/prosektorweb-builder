import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { retryCutover } from '@/features/projects/lib/domain-cutover';

function isAdmin(role: unknown): boolean {
  return String(role || '').toUpperCase() === 'ADMIN';
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await retryCutover(id);

    return NextResponse.json({
      success: result.success,
      ready: result.ready,
      message: result.message,
      data: result.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cutover retry başarısız';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
