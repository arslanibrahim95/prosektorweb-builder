import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            projectId,
            companyName,
            contactName,
            email,
            phone,
            employeeCount,
            hazardClass,
            servicesRequested,
            message,
        } = body;

        if (!projectId || !companyName || !contactName || !email || !phone) {
            return NextResponse.json(
                { success: false, error: 'Zorunlu alanlar eksik' },
                { status: 400 }
            );
        }

        const { getPayloadInstance } = await import('@/lib/payload');
        const payload = await getPayloadInstance();

        await payload.create({
            collection: 'quote-requests',
            data: {
                companyName,
                contactName,
                email,
                phone,
                employeeCount: employeeCount || null,
                hazardClass: hazardClass || 'unknown',
                servicesRequested: servicesRequested || [],
                message: message || '',
                project: projectId,
                status: 'pending',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Quote request submission error:', error);
        return NextResponse.json(
            { success: false, error: 'Teklif talebi gönderilemedi' },
            { status: 500 }
        );
    }
}
