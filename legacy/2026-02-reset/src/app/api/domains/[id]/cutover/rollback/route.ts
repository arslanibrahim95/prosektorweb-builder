import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rollbackCutover } from '@/features/projects/lib/domain-cutover';

function isAdmin(role: unknown): boolean {
  return String(role || '').toUpperCase() === 'ADMIN';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    let reason = 'Manuel rollback';

    try {
      const body = (await request.json()) as { reason?: unknown };
      if (typeof body.reason === 'string' && body.reason.trim()) {
        reason = body.reason.trim();
      }
    } catch {
      // request body optional
    }

    const result = await rollbackCutover(id, reason);

    return NextResponse.json({
      success: result.success,
      ready: result.ready,
      message: result.message,
      data: result.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Rollback başarısız';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
