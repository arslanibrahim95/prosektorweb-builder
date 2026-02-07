import { auth } from '@/auth'
import { prisma } from '@/server/db'

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class TenantAccessError extends Error {
  constructor(message = 'Tenant access denied') {
    super(message)
    this.name = 'TenantAccessError'
  }
}

export async function getUserCompanyId(): Promise<string | null> {
  const session = await auth()
  if (!session?.user) return null
  return (session.user as { companyId?: string }).companyId || null
}

export async function requireCompanyAccess(companyId?: string | null) {
  const session = await auth()
  if (!session?.user) {
    throw new UnauthorizedError()
  }

  const user = session.user as { role?: string; companyId?: string }
  if (String(user.role || '').toUpperCase() === 'ADMIN') return true

  if (!companyId || !user.companyId || user.companyId !== companyId) {
    throw new TenantAccessError()
  }

  return true
}

export async function requireTenantAccess(entity: string, id: string) {
  if (entity === 'project') {
    const project = await prisma.webProject.findUnique({
      where: { id },
      select: { companyId: true },
    })
    if (!project) {
      throw new TenantAccessError('Project not found')
    }
    return requireCompanyAccess(project.companyId)
  }

  const session = await auth()
  if (!session?.user) {
    throw new UnauthorizedError()
  }

  return true
}
