import type { CollectionConfig, Access, Where } from 'payload'

const isAdminOrProjectOwner: Access = ({ req: { user } }) => {
    if (user && 'role' in user && user.role === 'admin') return true
    if (user) {
        return {
            'project.owner': {
                equals: user.id,
            },
        }
    }
    return false
}

const isPublishedOrAdmin: Access = (args) => {
    const { user } = args.req
    if (user && 'role' in user && user.role === 'admin') return true
    if (user) {
        return { 'project.owner': { equals: user.id } } as Where
    }
    return { status: { equals: 'published' } } as Where
}

export const BlogPosts: CollectionConfig = {
    slug: 'blog-posts',
    admin: {
        useAsTitle: 'title',
        group: 'Icerik',
    },
    access: {
        read: isPublishedOrAdmin,
        create: isAdminOrProjectOwner,
        update: isAdminOrProjectOwner,
        delete: isAdminOrProjectOwner,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            label: 'Baslik',
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            label: 'URL Slug',
        },
        {
            name: 'excerpt',
            type: 'textarea',
            label: 'Ozet',
        },
        {
            name: 'content',
            type: 'richText',
            label: 'Icerik',
        },
        {
            name: 'coverImage',
            type: 'upload',
            relationTo: 'media',
            label: 'Kapak Gorseli',
        },
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
            label: 'Proje',
        },
        {
            name: 'author',
            type: 'text',
            label: 'Yazar',
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'draft',
            options: [
                { label: 'Taslak', value: 'draft' },
                { label: 'Yayinda', value: 'published' },
            ],
        },
        {
            name: 'publishedAt',
            type: 'date',
            label: 'Yayin Tarihi',
            admin: {
                date: {
                    pickerAppearance: 'dayAndTime',
                },
            },
        },
        {
            name: 'metaTitle',
            type: 'text',
            maxLength: 60,
            label: 'SEO Baslik',
        },
        {
            name: 'metaDescription',
            type: 'textarea',
            maxLength: 160,
            label: 'SEO Aciklama',
        },
        {
            name: 'tags',
            type: 'text',
            hasMany: true,
            label: 'Etiketler',
        },
    ],
}
