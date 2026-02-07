import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'

export const JobApplications: CollectionConfig = {
    slug: 'job-applications',
    admin: {
        useAsTitle: 'fullName',
        group: 'Form Submissions',
        defaultColumns: ['fullName', 'email', 'position', 'project', 'createdAt'],
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
            name: 'fullName',
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
            name: 'position',
            type: 'text',
        },
        {
            name: 'coverLetter',
            type: 'textarea',
        },
        {
            name: 'resumeUrl',
            type: 'text',
            admin: {
                description: 'URL to uploaded resume file',
            },
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
            defaultValue: 'new',
            options: [
                { label: 'Yeni', value: 'new' },
                { label: 'İnceleniyor', value: 'reviewing' },
                { label: 'Mülakat', value: 'interview' },
                { label: 'Kabul', value: 'accepted' },
                { label: 'Red', value: 'rejected' },
            ],
        },
        {
            name: 'notes',
            type: 'textarea',
            admin: {
                description: 'Internal notes about this application',
            },
        },
    ],
}
