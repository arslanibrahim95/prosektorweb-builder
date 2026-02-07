import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
    slug: 'services',
    admin: {
        useAsTitle: 'name',
        group: 'Domain Data',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'shortDescription',
            type: 'textarea',
            required: true,
        },
        {
            name: 'keywords',
            type: 'group',
            fields: [
                {
                    name: 'primary',
                    type: 'text',
                    hasMany: true,
                },
                {
                    name: 'secondary',
                    type: 'text',
                    hasMany: true,
                },
                {
                    name: 'longTail',
                    type: 'text',
                    hasMany: true,
                },
            ],
        },
        {
            name: 'locationKeywordPatterns',
            type: 'text',
            hasMany: true,
        },
        {
            name: 'requiredSections',
            type: 'text',
            hasMany: true,
        },
        {
            name: 'targetSectors',
            type: 'text',
            hasMany: true,
        },
        {
            name: 'legalReferences',
            type: 'text',
            hasMany: true,
        },
    ],
}
