import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    try {
        const { getPayloadInstance } = await import('@/lib/payload');
        const payload = await getPayloadInstance();

        // Aggregation in Mongo/Postgres would be better, but Payload Local API find is easiest for now
        // Limit to last 1000 events for demo performance
        const events = await payload.find({
            collection: 'analytics-events',
            where: {
                project: { equals: projectId },
            },
            limit: 1000,
        });

        const totalViews = events.docs.filter(e => e.eventType === 'page_view').length;
        // Count unique sessionIds
        const uniqueVisitors = new Set(events.docs.map(e => e.sessionId)).size;
        const clicks = events.docs.filter(e => e.eventType === 'click').length || 0;

        return NextResponse.json({
            totalViews,
            uniqueVisitors,
            clicks,
            // Pass raw data for charts if needed, or aggregate here
        });

    } catch (error) {
        console.error('Stats fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
