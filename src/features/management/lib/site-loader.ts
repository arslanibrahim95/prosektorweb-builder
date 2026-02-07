'use strict';

import { prisma } from '@/lib/prisma';

/**
 * Loads all data required to render a specific project's site.
 * This includes project settings and pages from Payload CMS.
 */
export async function loadSiteData(projectSlug: string) {
    try {
        const { getPayloadInstance } = await import('@/lib/payload');
        const payload = await getPayloadInstance();

        const projects = await payload.find({
            collection: 'projects',
            where: {
                slug: { equals: projectSlug },
            },
            limit: 1,
        });

        if (projects.docs.length === 0) return null;
        const project = projects.docs[0];

        // Fetch pages for this project
        const pages = await payload.find({
            collection: 'pages',
            where: {
                project: { equals: project.id },
            },
            sort: 'createdAt',
        });

        return {
            ...project,
            pages: pages.docs,
        };
    } catch (error) {
        console.error('Failed to load site data from Payload:', error);
        return null;
    }
}

/**
 * Loads a specific page's data from Payload CMS.
 */
export async function loadPageData(projectId: string, pageSlug: string) {
    try {
        const { getPayloadInstance } = await import('@/lib/payload');
        const payload = await getPayloadInstance();

        const pages = await payload.find({
            collection: 'pages',
            where: {
                and: [
                    { project: { equals: projectId } },
                    { slug: { equals: pageSlug.startsWith('/') ? pageSlug : `/${pageSlug}` } }
                ]
            },
            limit: 1,
        });

        return pages.docs[0] || null;
    } catch (error) {
        console.error('Failed to load page data from Payload:', error);
        return null;
    }
}
