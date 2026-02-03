'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';
import { ApplicationStatus } from '@prisma/client';

export async function getJobApplications(projectId: string) {
    await requireAuth();

    return prisma.jobApplication.findMany({
        where: { webProjectId: projectId },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getJobApplicationCount(projectId: string) {
    await requireAuth();

    return prisma.jobApplication.count({
        where: { webProjectId: projectId },
    });
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
    await requireAuth();

    const validStatuses: ApplicationStatus[] = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
        throw new Error('Geçersiz durum');
    }

    const application = await prisma.jobApplication.update({
        where: { id },
        data: { status },
        select: { webProjectId: true },
    });

    revalidatePath(`/admin/projects/${application.webProjectId}/applications`);
    return { success: true };
}
