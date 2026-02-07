import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, name, email, phone, subject, message } = body;

        if (!projectId || !name || !email || !message) {
            return NextResponse.json(
                { success: false, error: 'Zorunlu alanlar eksik' },
                { status: 400 }
            );
        }

        const { getPayloadInstance } = await import('@/lib/payload');
        const payload = await getPayloadInstance();

        await payload.create({
            collection: 'contact-submissions',
            data: {
                name,
                email,
                phone: phone || '',
                subject: subject || '',
                message,
                project: projectId,
                status: 'unread',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Contact submission error:', error);
        return NextResponse.json(
            { success: false, error: 'Mesaj gönderilemedi' },
            { status: 500 }
        );
    }
}
