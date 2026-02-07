import type { CollectionConfig } from 'payload'

export const ClientDocuments: CollectionConfig = {
    slug: 'client-documents',
    admin: {
        useAsTitle: 'title',
        group: 'Client Portal',
    },
    upload: {
        staticDir: 'client-docs',
        mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
    },
    access: {
        // Only logged in users (Admins or Customers) can read
        read: ({ req: { user } }) => {
            if (!user) return false

            // Admin/OSGB User can see all documents linked to their projects
            if (user.collection === 'users') return true // Simplified: Admin sees all

            // Customer can ONLY see documents assigned to them AND explicitly "published"
            if (user.collection === 'customers') {
                return {
                    and: [
                        {
                            customer: { equals: user.id },
                        },
                        {
                            status: { equals: 'published' },
                        },
                    ],
                } as any // Cast to any to bypass type check before generation
            }
            return false
        },
        // Only Admins can upload/manage documents
        create: ({ req: { user } }) => Boolean(user?.collection === 'users'),
        update: ({ req: { user } }) => Boolean(user?.collection === 'users'),
        delete: ({ req: { user } }) => Boolean(user?.collection === 'users'),
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
            label: 'Belge Adı',
        },
        {
            name: 'category',
            type: 'select',
            options: [
                { label: 'İSG Raporu', value: 'report' },
                { label: 'Risk Analizi', value: 'risk-analysis' },
                { label: 'Eğitim Katılım Belgesi', value: 'training-cert' },
                { label: 'Fatura/Sözleşme', value: 'contract' },
                { label: 'Diğer', value: 'other' },
            ],
            required: true,
        },
        {
            name: 'customer',
            type: 'relationship',
            relationTo: 'customers' as any,
            required: true,
            hasMany: false,
            label: 'İlgili Müşteri (Firma)',
        },
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
            admin: {
                readOnly: true, // Should be auto-populated based on Customer selection ideally, or manual for now
                description: 'Bu belge hangi OSGB projesine ait?',
            },
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'draft',
            options: [
                { label: 'Taslak (Görünmez)', value: 'draft' },
                { label: 'Yayında (Müşteri Görebilir)', value: 'published' },
            ],
        },
        {
            name: 'validUntil',
            type: 'date',
            label: 'Geçerlilik Tarihi',
        },
    ],
}
