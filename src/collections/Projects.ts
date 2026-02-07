import type { CollectionConfig, Access } from 'payload'

const isAdminOrOwner: Access = ({ req: { user } }) => {
    if (user && 'role' in user && user.role === 'admin') return true
    if (user) {
        return {
            owner: {
                equals: user.id,
            },
        }
    }
    return false
}

export const Projects: CollectionConfig = {
    slug: 'projects',
    admin: {
        useAsTitle: 'name',
    },
    access: {
        read: isAdminOrOwner,
        update: isAdminOrOwner,
        delete: isAdminOrOwner,
        create: ({ req: { user } }) => Boolean(user), // Authenticated users can create
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
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'draft',
            options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Published', value: 'published' },
            ],
        },
        {
            name: 'owner',
            type: 'relationship',
            relationTo: 'users',
            required: true,
        },
        {
            name: 'company',
            type: 'group',
            label: 'Firma Bilgileri',
            fields: [
                { name: 'name', type: 'text', label: 'Firma Adı' },
                {
                    name: 'logo',
                    type: 'upload',
                    relationTo: 'media',
                    label: 'Logo',
                },
                { name: 'sector', type: 'text', label: 'Sektör' },
                { name: 'taxNumber', type: 'text', label: 'Vergi No' },
            ],
        },
        {
            name: 'contact',
            type: 'group',
            label: 'İletişim Bilgileri',
            fields: [
                { name: 'phone', type: 'text', label: 'Telefon' },
                { name: 'phone2', type: 'text', label: 'Telefon 2' },
                { name: 'whatsapp', type: 'text', label: 'WhatsApp' },
                { name: 'email', type: 'text', label: 'E-posta' },
                { name: 'email2', type: 'text', label: 'E-posta 2' },
                { name: 'address', type: 'textarea', label: 'Adres' },
                { name: 'city', type: 'text', label: 'Şehir' },
                { name: 'district', type: 'text', label: 'İlçe' },
                { name: 'workingHours', type: 'text', label: 'Çalışma Saatleri' },
                { name: 'mapEmbed', type: 'textarea', label: 'Google Maps Embed Kodu' },
            ],
        },
        {
            name: 'social',
            type: 'group',
            label: 'Sosyal Medya',
            fields: [
                { name: 'facebook', type: 'text', label: 'Facebook URL' },
                { name: 'instagram', type: 'text', label: 'Instagram URL' },
                { name: 'linkedin', type: 'text', label: 'LinkedIn URL' },
                { name: 'twitter', type: 'text', label: 'Twitter/X URL' },
                { name: 'youtube', type: 'text', label: 'YouTube URL' },
            ],
        },
        {
            name: 'design',
            type: 'group',
            fields: [
                { name: 'primaryColor', type: 'text', defaultValue: '#2563eb' },
                { name: 'secondaryColor', type: 'text', defaultValue: '#1e40af' },
                { name: 'accentColor', type: 'text', defaultValue: '#f59e0b' },
                { name: 'backgroundColor', type: 'text', defaultValue: '#ffffff' },
                { name: 'fontHeading', type: 'text', defaultValue: 'Inter' },
                { name: 'fontBody', type: 'text', defaultValue: 'Inter' },
            ],
        },
        // Services relationship
        {
            name: 'services',
            type: 'relationship',
            relationTo: 'services',
            hasMany: true,
            label: 'Sunulan Hizmetler',
        },
        // SEO fields
        {
            name: 'seoTitle',
            type: 'text',
            label: 'SEO Baslik',
            admin: { description: 'Site basligini override eder' },
        },
        {
            name: 'seoDescription',
            type: 'textarea',
            label: 'SEO Aciklama',
        },
        {
            name: 'seoKeywords',
            type: 'text',
            hasMany: true,
            label: 'SEO Anahtar Kelimeler',
        },
        {
            name: 'faviconUrl',
            type: 'text',
            label: 'Favicon URL',
        },
        {
            name: 'footerDescription',
            type: 'textarea',
            label: 'Footer Aciklama Metni',
        },
    ],
}
