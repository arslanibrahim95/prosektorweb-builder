'use strict';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Updates a specific section's content or metadata.
 */
export async function updateSection(sectionId: string, data: {
    title?: string;
    content?: string;
    metadata?: any;
    order?: number;
}) {
    try {
        const updatedSection = await prisma.section.update({
            where: { id: sectionId },
            data: {
                ...data,
                updatedAt: new Date(),
            },
            include: {
                page: {
                    select: {
                        projectId: true,
                        slug: true
                    }
                }
            }
        });

        revalidatePath(`/builder/${updatedSection.page.projectId}`);
        return { success: true, data: updatedSection };
    } catch (error) {
        console.error('Failed to update section:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}

/**
 * Reorders sections within a page.
 */
export async function reorderSections(pageId: string, sectionOrders: { id: string; order: number }[]) {
    try {
        const updates = sectionOrders.map((item) =>
            prisma.section.update({
                where: { id: item.id },
                data: { order: item.order },
            })
        );

        await prisma.$transaction(updates);

        const page = await prisma.page.findUnique({
            where: { id: pageId },
            select: { projectId: true }
        });

        if (page) {
            revalidatePath(`/builder/${page.projectId}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to reorder sections:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}

/**
 * Creates a new page for a project.
 */
export async function createPage(projectId: string, data: {
    name: string;
    slug: string;
}) {
    try {
        const newPage = await prisma.page.create({
            data: {
                projectId,
                name: data.name,
                slug: data.slug,
            },
        });

        revalidatePath(`/builder/${projectId}`);
        return { success: true, data: newPage };
    } catch (error) {
        console.error('Failed to create page:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}

/**
 * Deletes a page and its sections.
 */
export async function deletePage(pageId: string) {
    try {
        const deletedPage = await prisma.page.delete({
            where: { id: pageId },
            select: { projectId: true }
        });

        revalidatePath(`/builder/${deletedPage.projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete page:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}
