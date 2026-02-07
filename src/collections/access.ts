import type { Customer, User } from '@/payload-types'

type RequestUser =
  | (User & { collection: 'users' })
  | (Customer & { collection: 'customers' })
  | null
  | undefined

export function isUsersCollectionUser(
  user: RequestUser
): user is User & { collection: 'users' } {
  return Boolean(user && user.collection === 'users')
}

export function isAdminUser(user: RequestUser): user is User & { collection: 'users' } {
  return isUsersCollectionUser(user) && user.role === 'admin'
}
