import type { CollectionConfig } from 'payload'
import { isUsersCollectionUser } from './access'

export const Customers: CollectionConfig = {
    slug: 'customers',
    admin: {
        useAsTitle: 'companyName',
        group: 'Client Portal',
        defaultColumns: ['companyName', 'email', 'project', 'status'],
    },
    auth: true, // Enable Authentication for this collection
    access: {
        // Admin can do everything
        create: ({ req: { user } }) => Boolean(isUsersCollectionUser(user)),
        delete: ({ req: { user } }) => Boolean(isUsersCollectionUser(user)),
        // Customers can read/update their own profile
        read: ({ req: { user } }) => {
            if (isUsersCollectionUser(user)) return true // OSGB Admin can read
            if (user?.collection === 'customers') {
                return {
                    id: { equals: user.id },
                }
            }
            return false
        },
        update: ({ req: { user } }) => {
            if (isUsersCollectionUser(user)) return true
            if (user?.collection === 'customers') {
                return {
                    id: { equals: user.id },
                }
            }
            return false
        },
    },
    fields: [
        {
            name: 'companyName',
            type: 'text',
            required: true,
            label: 'Firma Adı',
        },
        {
            name: 'authorizedPerson',
            type: 'text',
            label: 'Yetkili Kişi',
        },
        {
            name: 'phone',
            type: 'text',
        },
        {
            name: 'taxNumber',
            type: 'text',
            label: 'Vergi No',
        },
        {
            name: 'project',
            type: 'relationship',
            relationTo: 'projects',
            required: true,
            label: 'Bağlı Olduğu OSGB Projesi',
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'active',
            options: [
                { label: 'Aktif', value: 'active' },
                { label: 'Pasif', value: 'inactive' },
            ],
        },
    ],
}
