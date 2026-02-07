import type { CollectionConfig } from 'payload'
import { isAdminUser } from './access'

export const QuoteRequests: CollectionConfig = {
    slug: 'quote-requests',
    admin: {
        useAsTitle: 'companyName',
        group: 'Form Submissions',
        defaultColumns: ['companyName', 'contactName', 'email', 'status', 'createdAt'],
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
            name: 'companyName',
            type: 'text',
            required: true,
            label: 'Firma Adı',
        },
        {
            name: 'contactName',
            type: 'text',
            required: true,
            label: 'İletişim Kişisi',
        },
        {
            name: 'email',
            type: 'email',
            required: true,
        },
        {
            name: 'phone',
            type: 'text',
            required: true,
        },
        {
            name: 'employeeCount',
            type: 'number',
            label: 'Çalışan Sayısı',
        },
        {
            name: 'hazardClass',
            type: 'select',
            label: 'Tehlike Sınıfı',
            options: [
                { label: 'Az Tehlikeli', value: 'low' },
                { label: 'Tehlikeli', value: 'medium' },
                { label: 'Çok Tehlikeli', value: 'high' },
                { label: 'Bilmiyorum', value: 'unknown' },
            ],
        },
        {
            name: 'servicesRequested',
            type: 'relationship',
            relationTo: 'services',
            hasMany: true,
            label: 'İstenen Hizmetler',
        },
        {
            name: 'message',
            type: 'textarea',
            label: 'Ek Bilgi / Notlar',
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
            defaultValue: 'pending',
            options: [
                { label: 'Bekliyor', value: 'pending' },
                { label: 'Teklif Hazırlandı', value: 'quoted' },
                { label: 'Görüşmede', value: 'negotiating' },
                { label: 'Kazanıldı', value: 'won' },
                { label: 'Kaybedildi', value: 'lost' },
            ],
        },
        {
            name: 'quotedAmount',
            type: 'number',
            label: 'Teklif Tutarı (TL)',
            admin: {
                condition: (data) => data?.status !== 'pending',
            },
        },
        {
            name: 'notes',
            type: 'textarea',
            admin: {
                description: 'Internal sales notes',
            },
        },
    ],
}
