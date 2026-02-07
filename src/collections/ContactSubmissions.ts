import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'

export const ContactSubmissions: CollectionConfig = {
    slug: 'contact-submissions',
    admin: {
        useAsTitle: 'name',
        group: 'Form Submissions',
        defaultColumns: ['name', 'email', 'subject', 'project', 'createdAt'],
    },
    access: {
        read: ({ req: { user } }) => {
            if (isAdminUser(user)) return true
            if (user) {
                return {
                    'project.owner': { equals: user.id },
                }
            }
            return false
        },
        create: () => true, // Public form submission
        update: ({ req: { user } }) => Boolean(isAdminUser(user)),
        delete: ({ req: { user } }) => Boolean(isAdminUser(user)),
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'email',
            type: 'email',
            required: true,
        },
        {
            name: 'phone',
            type: 'text',
        },
        {
            name: 'subject',
            type: 'text',
        },
        {
            name: 'message',
            type: 'textarea',
            required: true,
        },
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'unread',
            options: [
                { label: 'Okunmadı', value: 'unread' },
                { label: 'Okundu', value: 'read' },
                { label: 'Yanıtlandı', value: 'replied' },
                { label: 'Arşivlendi', value: 'archived' },
            ],
        },
        {
            name: 'notes',
            type: 'textarea',
            admin: {
                description: 'Internal notes about this contact',
            },
        },
    ],
}
