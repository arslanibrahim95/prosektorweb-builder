import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, fullName, email, phone, position, coverLetter } = body;

        if (!projectId || !fullName || !email) {
            return NextResponse.json(
                { success: false, error: 'Zorunlu alanlar eksik' },
                { status: 400 }
            );
        }

        const { getPayloadInstance } = await import('@/lib/payload');
        const payload = await getPayloadInstance();

        await payload.create({
            collection: 'job-applications',
            data: {
                fullName,
                email,
                phone: phone || '',
                position: position || '',
                coverLetter: coverLetter || '',
                project: projectId,
                status: 'new',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Job application submission error:', error);
        return NextResponse.json(
            { success: false, error: 'Başvuru kaydedilemedi' },
            { status: 500 }
        );
    }
}
