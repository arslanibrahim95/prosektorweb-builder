import type { User } from '@/payload-types'

type RequestUser = (User & { collection: 'users' }) | null | undefined

export function isUsersCollectionUser(
  user: RequestUser
): user is User & { collection: 'users' } {
  return Boolean(user && user.collection === 'users')
}

export function isAdminUser(
  user: RequestUser
): user is User & { collection: 'users'; role: 'admin' } {
  return isUsersCollectionUser(user) && user.role === 'admin'
}
