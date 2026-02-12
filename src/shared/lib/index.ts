import { auth } from '@/auth'
import { cn } from '@/lib/utils'

type LoggerFn = (meta?: unknown, message?: string) => void

const createLogger = (level: 'debug' | 'info' | 'warn' | 'error'): LoggerFn => {
  return (meta?: unknown, message?: string) => {
    const prefix = `[${level.toUpperCase()}]`
    if (message !== undefined) {
      console[level](prefix, message, meta ?? '')
      return
    }
    console[level](prefix, meta ?? '')
  }
}

export const logger = {
  debug: createLogger('debug'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
}

export { cn }

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Bilinmeyen hata'
}

export function getZodErrorMessage(error: { issues?: Array<{ message: string }> }): string {
  if (!error.issues?.length) return 'Geçersiz veri'
  return error.issues.map((issue) => issue.message).join(', ')
}

export function validatePagination(page = 1, limit = 20, maxLimit = 100) {
  const normalizedPage = Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(maxLimit, Math.trunc(limit)))
    : 20
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  }
}

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  return 'code' in error && (error as { code?: string }).code === 'P2002'
}

export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  baseDelayMs = 300
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt === retries) break
      const delay = baseDelayMs * (attempt + 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError instanceof Error ? lastError : new Error(getErrorMessage(lastError))
}

export async function requireAuth(roles?: string[]) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  if (roles?.length) {
    const userRole = String((session.user as { role?: string }).role || '').toUpperCase()
    const allowed = roles.some((role) => role.toUpperCase() === userRole)
    if (!allowed) {
      throw new Error('Forbidden')
    }
  }

  return session
}

export async function logAudit(bodyData: unknown) {
  logger.info(bodyData, 'audit')
}

export async function createAuditLog(bodyData: unknown) {
  logger.info(bodyData, 'audit')
}

export function createSafeAction<TArgs extends unknown[], TResult>(
  actionName: string,
  handler: (...args: TArgs) => Promise<TResult> | TResult
) {
  return async (...args: TArgs): Promise<TResult> => {
    try {
      return await handler(...args)
    } catch (error) {
      logger.error({ actionName, error }, `${actionName} failed`)
      throw error
    }
  }
}
