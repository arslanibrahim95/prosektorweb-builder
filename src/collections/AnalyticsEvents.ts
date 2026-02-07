import type { CollectionConfig } from 'payload'
import { isAdminUser, isUsersCollectionUser } from './access'

export const AnalyticsEvents: CollectionConfig = {
    slug: 'analytics-events',
    admin: {
        useAsTitle: 'eventType',
        group: 'Analytics',
        defaultColumns: ['eventType', 'path', 'project', 'createdAt'],
    },
    access: {
        create: () => true, // Open for tracking (rate limiting should be applied in API route)
        read: ({ req: { user } }) => Boolean(isAdminUser(user) || isUsersCollectionUser(user)),
        update: () => false, // Immutable events
        delete: ({ req: { user } }) => Boolean(isAdminUser(user)),
    },
    fields: [
        {
            name: 'eventType',
            type: 'select',
            options: [
                { label: 'Page View', value: 'page_view' },
                { label: 'Button Click', value: 'click' },
                { label: 'Form Submission', value: 'form_submit' },
            ],
            required: true,
            defaultValue: 'page_view',
        },
        {
            name: 'path',
            type: 'text',
            required: true,
        },
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
            index: true,
        },
        {
            name: 'sessionId',
            type: 'text',
            index: true,
        },
        {
            name: 'deviceType',
            type: 'select',
            options: [
                { label: 'Desktop', value: 'desktop' },
                { label: 'Mobile', value: 'mobile' },
                { label: 'Tablet', value: 'tablet' },
                { label: 'Unknown', value: 'unknown' },
            ],
        },
        {
            name: 'referrer',
            type: 'text',
        },
    ],
}
