'use server';

import prisma from '@/lib/prisma';
import { z } from 'zod';

const createProjectSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    template: z.string(),
    industry: z.string(),
});

interface CreateProjectResult {
    success: boolean;
    projectId?: string;
    error?: string;
}

export async function createProject(formData: FormData): Promise<CreateProjectResult> {
    try {
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            template: formData.get('template') as string,
            industry: formData.get('industry') as string,
        };

        const validated = createProjectSchema.parse(data);

        const project = await prisma.project.create({
            data: {
                name: validated.name,
                description: validated.description,
                template: validated.template,
                industry: validated.industry,
                status: 'DRAFT',
            },
        });

        return { success: true, projectId: project.id };
    } catch (error) {
        console.error('Create project error:', error);
        if (error instanceof z.ZodError) {
            return { success: false, error: 'Geçersiz veri' };
        }
        return { success: false, error: 'Proje oluşturulamadı' };
    }
}
