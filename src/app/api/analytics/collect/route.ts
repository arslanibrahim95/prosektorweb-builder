import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, path, eventType, sessionId, referrer } = body;

        // Basic validation
        if (!projectId || !path) {
            return NextResponse.json({ success: false }, { status: 400 });
        }

        // Determine device type from User-Agent (simple check)
        const headerList = await headers();
        const userAgent = headerList.get('user-agent') || '';
        const isMobile = /mobile/i.test(userAgent);
        const deviceType = isMobile ? 'mobile' : 'desktop';

        const { getPayloadInstance } = await import('@/lib/payload');
        const payload = await getPayloadInstance();

        // Fire and forget (don't await strictly if performance matters, but here we await for safety)
        await payload.create({
            collection: 'analytics-events',
            data: {
                project: projectId,
                path,
                eventType: eventType || 'page_view',
                sessionId: sessionId || 'anonymous',
                deviceType,
                referrer: referrer || '',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics error:', error);
        // Don't leak error details to client, just fail silently or 500
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
