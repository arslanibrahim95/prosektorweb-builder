import type { CollectionConfig, Access, Block } from 'payload'

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

// ── Block Definitions ──────────────────────────────────────────

const heroBlock: Block = {
    slug: 'hero',
    labels: { singular: 'Hero', plural: 'Hero Bloklar' },
    fields: [
        { name: 'title', type: 'text' },
        { name: 'subtitle', type: 'textarea' },
        { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
        { name: 'ctaText', type: 'text', label: 'CTA Buton Metni' },
        { name: 'ctaLink', type: 'text', label: 'CTA Buton Linki' },
        {
            name: 'stats',
            type: 'array',
            label: 'Istatistikler',
            fields: [
                { name: 'value', type: 'text', required: true },
                { name: 'label', type: 'text', required: true },
                { name: 'icon', type: 'text' },
            ],
        },
    ],
}

const servicesBlock: Block = {
    slug: 'services',
    labels: { singular: 'Hizmetler', plural: 'Hizmet Bloklari' },
    fields: [
        { name: 'sectionTitle', type: 'text', label: 'Baslik' },
        { name: 'sectionSubtitle', type: 'textarea', label: 'Alt Baslik' },
        {
            name: 'items',
            type: 'array',
            label: 'Hizmetler',
            fields: [
                { name: 'icon', type: 'text' },
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
                { name: 'features', type: 'text', hasMany: true },
            ],
        },
    ],
}

const aboutBlock: Block = {
    slug: 'about',
    labels: { singular: 'Hakkinda', plural: 'Hakkinda Bloklari' },
    fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'richText' },
        { name: 'highlights', type: 'text', hasMany: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'experienceYears', type: 'number', label: 'Deneyim Yili' },
    ],
}

const ctaBlock: Block = {
    slug: 'cta',
    labels: { singular: 'CTA', plural: 'CTA Bloklari' },
    fields: [
        { name: 'title', type: 'text' },
        { name: 'subtitle', type: 'textarea' },
        { name: 'buttonText', type: 'text', label: 'Buton Metni' },
        { name: 'buttonLink', type: 'text', label: 'Buton Linki' },
        { name: 'showPhone', type: 'checkbox', label: 'Telefonu Goster', defaultValue: true },
    ],
}

const contactBlock: Block = {
    slug: 'contact',
    labels: { singular: 'Iletisim', plural: 'Iletisim Bloklari' },
    fields: [
        { name: 'title', type: 'text', label: 'Baslik' },
        { name: 'subtitle', type: 'textarea', label: 'Alt Baslik' },
        { name: 'showMap', type: 'checkbox', label: 'Haritayi Goster', defaultValue: true },
    ],
}

const faqBlock: Block = {
    slug: 'faq',
    labels: { singular: 'SSS', plural: 'SSS Bloklari' },
    fields: [
        { name: 'sectionTitle', type: 'text', label: 'Baslik' },
        {
            name: 'items',
            type: 'array',
            label: 'Sorular',
            fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
            ],
        },
    ],
}

const teamBlock: Block = {
    slug: 'team',
    labels: { singular: 'Ekip', plural: 'Ekip Bloklari' },
    fields: [
        { name: 'sectionTitle', type: 'text', label: 'Baslik' },
        {
            name: 'members',
            type: 'array',
            label: 'Ekip Uyeleri',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'role', type: 'text' },
                { name: 'image', type: 'upload', relationTo: 'media' },
                { name: 'bio', type: 'textarea' },
            ],
        },
    ],
}

const statsBlock: Block = {
    slug: 'stats',
    labels: { singular: 'Istatistikler', plural: 'Istatistik Bloklari' },
    fields: [
        {
            name: 'items',
            type: 'array',
            label: 'Istatistikler',
            fields: [
                { name: 'value', type: 'text', required: true },
                { name: 'label', type: 'text', required: true },
                { name: 'icon', type: 'text' },
            ],
        },
    ],
}

const galleryBlock: Block = {
    slug: 'gallery',
    labels: { singular: 'Galeri', plural: 'Galeri Bloklari' },
    fields: [
        { name: 'sectionTitle', type: 'text', label: 'Baslik' },
        {
            name: 'images',
            type: 'array',
            label: 'Gorseller',
            fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'caption', type: 'text' },
            ],
        },
    ],
}

const testimonialsBlock: Block = {
    slug: 'testimonials',
    labels: { singular: 'Referanslar', plural: 'Referans Bloklari' },
    fields: [
        { name: 'sectionTitle', type: 'text', label: 'Baslik' },
        {
            name: 'items',
            type: 'array',
            label: 'Yorumlar',
            fields: [
                { name: 'quote', type: 'textarea', required: true },
                { name: 'author', type: 'text', required: true },
                { name: 'company', type: 'text' },
                { name: 'image', type: 'upload', relationTo: 'media' },
            ],
        },
    ],
}

const contentBlock: Block = {
    slug: 'content',
    labels: { singular: 'Icerik', plural: 'Icerik Bloklari' },
    fields: [
        { name: 'text', type: 'richText' },
    ],
}

// ── Collection Config ──────────────────────────────────────────

export const Pages: CollectionConfig = {
    slug: 'pages',
    admin: {
        useAsTitle: 'title',
    },
    access: {
        read: isAdminOrProjectOwner,
        update: isAdminOrProjectOwner,
        delete: isAdminOrProjectOwner,
        create: ({ req: { user } }) => Boolean(user),
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
        },
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
        },
        // SEO fields
        {
            name: 'metaTitle',
            type: 'text',
            maxLength: 60,
            label: 'SEO Baslik',
            admin: { description: 'Maks 60 karakter' },
        },
        {
            name: 'metaDescription',
            type: 'textarea',
            maxLength: 160,
            label: 'SEO Aciklama',
            admin: { description: 'Maks 160 karakter' },
        },
        {
            name: 'ogImage',
            type: 'upload',
            relationTo: 'media',
            label: 'OG Image',
        },
        {
            name: 'keywords',
            type: 'text',
            hasMany: true,
            label: 'Anahtar Kelimeler',
        },
        // Block content
        {
            name: 'content',
            type: 'blocks',
            blocks: [
                heroBlock,
                servicesBlock,
                aboutBlock,
                ctaBlock,
                contactBlock,
                faqBlock,
                teamBlock,
                statsBlock,
                galleryBlock,
                testimonialsBlock,
                contentBlock,
            ],
        },
    ],
}
