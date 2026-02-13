const DEFAULT_PROJECT_SLUG_MAX_RETRIES = 10

const SLUG_CONFLICT_CODES = new Set([
  'SITE_SLUG_CONFLICT',
  'DUPLICATE_SLUG',
  'CONFLICT',
])

function parseRetryLimit(raw: string | undefined): number {
  const parsed = Number.parseInt(raw || '', 10)
  if (!Number.isFinite(parsed)) return DEFAULT_PROJECT_SLUG_MAX_RETRIES
  if (parsed < 1) return 1
  if (parsed > 100) return 100
  return parsed
}

function normalizeBaseSlug(value: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : 'site'
}

function readErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code.trim().toUpperCase() : ''
}

function readErrorStatus(error: unknown): number {
  if (!error || typeof error !== 'object') return 0
  const status = (error as { status?: unknown; statusCode?: unknown }).status
  if (typeof status === 'number' && Number.isFinite(status)) return status
  const statusCode = (error as { status?: unknown; statusCode?: unknown }).statusCode
  return typeof statusCode === 'number' && Number.isFinite(statusCode) ? statusCode : 0
}

export class ProjectSlugResolutionError extends Error {
  statusCode = 409
  code = 'PROJECT_SLUG_RESOLUTION_FAILED' as const
  baseSlug: string
  attempts: number

  constructor(baseSlug: string, attempts: number, cause?: unknown) {
    super('Benzersiz proje adresi uretilemedi, lutfen tekrar deneyin.')
    this.name = 'ProjectSlugResolutionError'
    this.baseSlug = baseSlug
    this.attempts = attempts

    if (typeof cause !== 'undefined') {
      ;(this as Error & { cause?: unknown }).cause = cause
    }
  }
}

export function getProjectSlugRetryLimit(): number {
  return parseRetryLimit(process.env.PROJECT_SLUG_MAX_RETRIES)
}

export function nextSiteSlugCandidate(baseSlug: string, taken: Set<string>): string {
  const normalizedBase = normalizeBaseSlug(baseSlug)

  if (!taken.has(normalizedBase)) return normalizedBase

  let suffix = 1
  while (suffix < 100_000) {
    const candidate = `${normalizedBase}-${suffix}`
    if (!taken.has(candidate)) return candidate
    suffix += 1
  }

  return `${normalizedBase}-${Date.now()}`
}

export function isSiteSlugConflictError(error: unknown): boolean {
  const status = readErrorStatus(error)
  const code = readErrorCode(error)
  return status === 409 || SLUG_CONFLICT_CODES.has(code)
}

export async function createWithUniqueSlug<T>(input: {
  baseSlug: string
  initialTaken?: Iterable<string>
  maxAttempts?: number
  create: (slug: string) => Promise<T>
}): Promise<{ slug: string; result: T }> {
  const baseSlug = normalizeBaseSlug(input.baseSlug)
  const maxAttempts =
    typeof input.maxAttempts === 'number' && Number.isFinite(input.maxAttempts)
      ? Math.max(1, Math.min(100, Math.trunc(input.maxAttempts)))
      : getProjectSlugRetryLimit()

  const taken = new Set(
    Array.from(input.initialTaken || []).filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    )
  )

  let attempts = 0
  let lastConflictError: unknown

  while (attempts < maxAttempts) {
    const candidate = nextSiteSlugCandidate(baseSlug, taken)
    attempts += 1

    try {
      const result = await input.create(candidate)
      return {
        slug: candidate,
        result,
      }
    } catch (error) {
      if (!isSiteSlugConflictError(error)) {
        throw error
      }

      lastConflictError = error
      taken.add(candidate)
    }
  }

  throw new ProjectSlugResolutionError(baseSlug, attempts, lastConflictError)
}
