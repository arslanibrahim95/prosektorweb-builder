import { cookies, headers } from 'next/headers'
import { z } from 'zod'
import {
  apiErrorResponseSchema,
  listModulesResponseSchema,
  listPageRevisionsResponseSchema,
  listPagesResponseSchema,
  listSitesResponseSchema,
  meResponseSchema,
  moduleInstanceSchema,
  pageRevisionSchema,
  siteSchema,
  siteTokenResponseSchema,
  type ApiErrorResponse,
} from '@prosektor/contracts'

type AuthMode = 'required' | 'optional' | 'none'

interface PanelRequestOptions<TSchema extends z.ZodTypeAny | undefined> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  token?: string | null
  auth?: AuthMode
  body?: unknown
  schema?: TSchema
  cache?: RequestCache
}

export class PanelApiError extends Error {
  status: number
  code: string
  details?: ApiErrorResponse['details']
  rawBody?: unknown

  constructor(params: {
    status: number
    code: string
    message: string
    details?: ApiErrorResponse['details']
    rawBody?: unknown
  }) {
    super(params.message)
    this.name = 'PanelApiError'
    this.status = params.status
    this.code = params.code
    this.details = params.details
    this.rawBody = params.rawBody
  }
}

function extractSingle<TSchema extends z.ZodTypeAny>(
  payload: unknown,
  schema: TSchema
): z.output<TSchema> {
  const candidates: unknown[] = [payload]
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    candidates.push(record.item, record.data, record.doc)
  }

  for (const candidate of candidates) {
    const parsed = schema.safeParse(candidate)
    if (parsed.success) return parsed.data
  }

  throw new PanelApiError({
    status: 502,
    code: 'VALIDATION_ERROR',
    message: 'Panel API tekil yaniti kontrata uymuyor',
    rawBody: payload,
  })
}

function extractList<TSchema extends z.ZodTypeAny>(
  payload: unknown,
  schema: TSchema
): { items: Array<z.output<TSchema>>; total: number } {
  if (payload && typeof payload === 'object') {
    const directParsed = z.object({
      items: z.array(schema),
      total: z.number().optional(),
    }).safeParse(payload)

    if (directParsed.success) {
      return {
        items: directParsed.data.items,
        total: directParsed.data.total ?? directParsed.data.items.length,
      }
    }

    const record = payload as Record<string, unknown>
    const arrayCandidates = [record.docs, record.data, record.items]
    for (const arrayCandidate of arrayCandidates) {
      if (!Array.isArray(arrayCandidate)) continue
      const parsedItems = z.array(schema).safeParse(arrayCandidate)
      if (!parsedItems.success) continue
      const total =
        typeof record.total === 'number'
          ? record.total
          : typeof record.count === 'number'
            ? record.count
            : parsedItems.data.length
      return { items: parsedItems.data, total }
    }
  }

  if (Array.isArray(payload)) {
    const parsedItems = z.array(schema).safeParse(payload)
    if (parsedItems.success) {
      return {
        items: parsedItems.data,
        total: parsedItems.data.length,
      }
    }
  }

  throw new PanelApiError({
    status: 502,
    code: 'VALIDATION_ERROR',
    message: 'Panel API liste yaniti kontrata uymuyor',
    rawBody: payload,
  })
}

const AUTH_TOKEN_COOKIE_CANDIDATES = [
  'sb-access-token',
  'supabase-auth-token',
]

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '')
  if (!trimmed) return trimmed
  if (trimmed.endsWith('/api')) return trimmed
  return `${trimmed}/api`
}

function getPanelApiBaseUrl(): string {
  const base =
    process.env.DASHBOARD_API_HOST ||
    process.env.PANEL_API_HOST ||
    process.env.DASHBOARD_PUBLIC_API_BASE ||
    ''

  const normalized = normalizeBaseUrl(base)
  if (!normalized) {
    throw new PanelApiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'DASHBOARD_API_HOST veya PANEL_API_HOST tanimli degil',
    })
  }

  return normalized
}

function buildApiUrl(path: string): string {
  const base = getPanelApiBaseUrl()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

function extractBearerToken(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!trimmed.toLowerCase().startsWith('bearer ')) return null
  const token = trimmed.slice(7).trim()
  return token || null
}

function parseSupabaseCookieToken(value: string | undefined): string | null {
  if (!value) return null
  const raw = value.trim()
  if (!raw) return null

  if (raw.startsWith('eyJ')) {
    return raw
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed === 'string' && parsed.startsWith('eyJ')) return parsed
    if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0]
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>
      if (typeof record.access_token === 'string') return record.access_token
      if (typeof record.token === 'string') return record.token
    }
  } catch {
    return null
  }

  return null
}

function getServiceAccessToken(): string | null {
  return (
    process.env.PANEL_API_TOKEN?.trim() ||
    process.env.PANEL_API_JWT?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null
  )
}

async function getRequestAccessToken(): Promise<string | null> {
  try {
    const headerStore = await headers()
    const authHeader = headerStore.get('authorization')
    const bearer = extractBearerToken(authHeader)
    if (bearer) return bearer
  } catch {
    // Ignore header access outside request context.
  }

  try {
    const cookieStore = await cookies()
    for (const key of AUTH_TOKEN_COOKIE_CANDIDATES) {
      const token = parseSupabaseCookieToken(cookieStore.get(key)?.value)
      if (token) return token
    }

    for (const cookie of cookieStore.getAll()) {
      if (!cookie.name.includes('auth-token')) continue
      const token = parseSupabaseCookieToken(cookie.value)
      if (token) return token
    }
  } catch {
    // Ignore cookie access outside request context.
  }

  return null
}

export async function resolvePanelAccessToken(explicit?: string | null): Promise<string | null> {
  if (explicit && explicit.trim()) return explicit.trim()
  const requestToken = await getRequestAccessToken()
  if (requestToken) return requestToken
  return getServiceAccessToken()
}

async function parseJsonBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function normalizeErrorResponse(status: number, body: unknown): PanelApiError {
  const parsed = apiErrorResponseSchema.safeParse(body)
  if (parsed.success) {
    return new PanelApiError({
      status,
      code: parsed.data.code,
      message: parsed.data.message,
      details: parsed.data.details,
      rawBody: body,
    })
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>
    const message =
      (typeof record.message === 'string' && record.message) ||
      (typeof record.error === 'string' && record.error) ||
      `Panel API HTTP ${status}`
    return new PanelApiError({
      status,
      code: 'INTERNAL_ERROR',
      message,
      rawBody: body,
    })
  }

  return new PanelApiError({
    status,
    code: 'INTERNAL_ERROR',
    message: `Panel API HTTP ${status}`,
    rawBody: body,
  })
}

export async function requestPanel<TSchema extends z.ZodTypeAny | undefined = undefined>(
  path: string,
  options: PanelRequestOptions<TSchema> = {}
): Promise<TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown> {
  const method = options.method || 'GET'
  const authMode = options.auth || 'required'

  const token = authMode === 'none' ? null : await resolvePanelAccessToken(options.token)
  if (authMode === 'required' && !token) {
    throw new PanelApiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Panel API icin erisim tokeni bulunamadi',
    })
  }

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
  }

  if (options.body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildApiUrl(path), {
    method,
    headers: requestHeaders,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: options.cache || 'no-store',
  })

  const body = await parseJsonBody(response)
  if (!response.ok) {
    throw normalizeErrorResponse(response.status, body)
  }

  if (!options.schema) {
    return body as TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown
  }

  const parsed = options.schema.safeParse(body)
  if (!parsed.success) {
    throw new PanelApiError({
      status: 502,
      code: 'VALIDATION_ERROR',
      message: `Panel API yaniti kontrata uymuyor: ${parsed.error.issues[0]?.message || 'unknown'}`,
      rawBody: body,
    })
  }

  return parsed.data as TSchema extends z.ZodTypeAny ? z.infer<TSchema> : unknown
}

export async function getPanelMe(token?: string | null) {
  const payload = await requestPanel('/me', {
    token,
  })
  return extractSingle(payload, meResponseSchema)
}

export async function listPanelSites(token?: string | null) {
  const payload = await requestPanel('/sites', {
    token,
  })
  return extractList(payload, siteSchema)
}

export async function getPanelSiteById(siteId: string, token?: string | null) {
  const payload = await requestPanel(`/sites/${encodeURIComponent(siteId)}`, {
    token,
  })
  return extractSingle(payload, siteSchema)
}

export async function listPanelPages(siteId: string, token?: string | null) {
  const payload = await requestPanel(`/pages?site_id=${encodeURIComponent(siteId)}`, {
    token,
  })
  return extractList(payload, listPagesResponseSchema.shape.items.element)
}

export async function listPanelPageRevisions(pageId: string, token?: string | null) {
  const payload = await requestPanel(`/pages/${encodeURIComponent(pageId)}/revisions`, {
    token,
  })
  return extractList(payload, listPageRevisionsResponseSchema.shape.items.element)
}

export async function getPanelPageRevision(
  pageId: string,
  revisionId: string,
  token?: string | null
) {
  const payload = await requestPanel(
    `/pages/${encodeURIComponent(pageId)}/revisions/${encodeURIComponent(revisionId)}`,
    {
      token,
    }
  )
  return extractSingle(payload, pageRevisionSchema)
}

export async function listPanelModules(siteId: string, token?: string | null) {
  const payload = await requestPanel(`/modules?site_id=${encodeURIComponent(siteId)}`, {
    token,
  })
  return extractList(payload, listModulesResponseSchema.shape.items.element)
}

export async function getPanelContactModule(siteId: string, token?: string | null) {
  const response = await listPanelModules(siteId, token)
  return response.items.find((module) => module.module_key === 'contact') || null
}

export async function getPanelSiteToken(siteId: string, token?: string | null) {
  const payload = await requestPanel(`/sites/${encodeURIComponent(siteId)}/site-token`, {
    token,
  })
  return extractSingle(payload, siteTokenResponseSchema)
}

export async function submitPanelPublic(path: string, body: unknown) {
  return requestPanel(path, {
    method: 'POST',
    auth: 'none',
    body,
  })
}

export type PanelSite = z.infer<typeof siteSchema>
export type PanelPage = z.infer<typeof listPagesResponseSchema>['items'][number]
export type PanelRevision = z.infer<typeof listPageRevisionsResponseSchema>['items'][number]
export type PanelModule = z.infer<typeof moduleInstanceSchema>
