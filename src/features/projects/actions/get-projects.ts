'use server';

import prisma from '@/lib/prisma';

interface Project {
    id: string;
    name: string;
    description: string | null;
    template: string;
    industry: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

interface GetProjectsResult {
    success: boolean;
    projects?: Project[];
    error?: string;
}

export async function getProjects(): Promise<GetProjectsResult> {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return { success: true, projects };
    } catch (error) {
        console.error('Get projects error:', error);
        return { success: false, error: 'Projeler yüklenemedi' };
    }
}

export async function getProjectById(id: string): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
        const project = await prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            return { success: false, error: 'Proje bulunamadı' };
        }

        return { success: true, project };
    } catch (error) {
        console.error('Get project error:', error);
        return { success: false, error: 'Proje yüklenemedi' };
    }
}
