import type { CollectionConfig, Access, FieldAccess } from 'payload'

const isAdmin: Access = ({ req: { user } }) => {
    return Boolean(user && user.collection === 'users' && user.role === 'admin')
}

const isAdminOrSelf: Access = ({ req: { user } }) => {
    if (user && user.collection === 'users' && user.role === 'admin') return true
    if (user && user.collection === 'users') {
        return {
            id: {
                equals: user.id,
            },
        }
    }
    return false
}

const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => {
    return Boolean(user && user.collection === 'users' && user.role === 'admin')
}

export const Users: CollectionConfig = {
    slug: 'users',
    admin: {
        useAsTitle: 'email',
    },
    auth: true,
    access: {
        read: isAdminOrSelf,
        create: isAdmin,
        update: isAdminOrSelf,
        delete: isAdmin,
    },
    fields: [
        {
            name: 'role',
            type: 'select',
            required: true,
            defaultValue: 'user',
            options: [
                { label: 'Admin', value: 'admin' },
                { label: 'User', value: 'user' },
            ],
            access: {
                update: isAdminFieldLevel, // Only admins can change roles
            },
        },
    ],
}
