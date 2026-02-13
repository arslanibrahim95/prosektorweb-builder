import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { publishWebhookBodySchema } from '@prosektor/contracts'
import {
  PUBLISH_SIGNATURE_MAX_SKEW_SECONDS,
  collectWarmupPaths,
  normalizeSiteSlug,
  verifyPublishWebhookSignature,
} from '@/features/site-engine/lib/publish-webhook'
import { webhookError, webhookSuccess } from '@/shared/lib/api-contract'

const legacyPublishBodySchema = z.object({
  siteSlug: z.string().min(1),
  siteId: z.string().optional(),
  pages: z.array(z.string()).optional(),
  publishedAt: z.string().datetime(),
  traceId: z.string().min(8),
  source: z.string().min(1),
  event: z.enum(['publish', 'unpublish', 'page_update', 'site_update']).optional(),
})

const REPLAY_WINDOW_SECONDS = PUBLISH_SIGNATURE_MAX_SKEW_SECONDS
const TRACE_ID_TTL_SECONDS = 3600
const DEFAULT_WARMUP_TIMEOUT_MS = 6000
const DEFAULT_WARMUP_RETRY_COUNT = 3
const DEFAULT_WARMUP_RETRY_BACKOFF_MS = 200

type ReplayStore = Map<string, number>

declare global {
  var __siteEnginePublishReplayStore: ReplayStore | undefined
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

function parseIntegerEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getWarmupTimeoutMs(): number {
  return parseIntegerEnv(process.env.DEMO_WARMUP_TIMEOUT_MS, DEFAULT_WARMUP_TIMEOUT_MS)
}

function getWarmupRetryCount(): number {
  return parseIntegerEnv(process.env.DEMO_WARMUP_RETRY_COUNT, DEFAULT_WARMUP_RETRY_COUNT)
}

function getWarmupRetryBackoffMs(): number {
  return parseIntegerEnv(process.env.DEMO_WARMUP_RETRY_BACKOFF_MS, DEFAULT_WARMUP_RETRY_BACKOFF_MS)
}

function getReplayStore(): ReplayStore {
  if (!globalThis.__siteEnginePublishReplayStore) {
    globalThis.__siteEnginePublishReplayStore = new Map()
  }
  return globalThis.__siteEnginePublishReplayStore
}

function pruneReplayStore(nowSeconds: number): void {
  const store = getReplayStore()
  for (const [traceId, seenAt] of store.entries()) {
    if (nowSeconds - seenAt > TRACE_ID_TTL_SECONDS) {
      store.delete(traceId)
    }
  }
}

function registerTraceId(traceId: string, nowSeconds: number): boolean {
  const store = getReplayStore()
  pruneReplayStore(nowSeconds)
  const seenAt = store.get(traceId)
  if (typeof seenAt === 'number' && nowSeconds - seenAt <= REPLAY_WINDOW_SECONDS) {
    return false
  }
  store.set(traceId, nowSeconds)
  return true
}

type RedisReplayConfig = {
  baseUrl: string
  token: string
  keyPrefix: string
}

function getRedisReplayConfig(): RedisReplayConfig | null {
  const baseUrl = (process.env.DEMO_REPLAY_REDIS_REST_URL || '').trim().replace(/\/+$/, '')
  const token = (process.env.DEMO_REPLAY_REDIS_REST_TOKEN || '').trim()
  if (!baseUrl || !token) return null

  return {
    baseUrl,
    token,
    keyPrefix: (process.env.DEMO_REPLAY_REDIS_KEY_PREFIX || 'demo:publish:replay').trim(),
  }
}

function buildRedisKey(config: RedisReplayConfig, traceId: string): string {
  return `${config.keyPrefix}:${traceId}`
}

async function redisSetReplayKey(
  config: RedisReplayConfig,
  traceId: string,
  nowSeconds: number
): Promise<'created' | 'exists' | 'error'> {
  const key = encodeURIComponent(buildRedisKey(config, traceId))
  const value = encodeURIComponent(String(nowSeconds))
  const ttl = encodeURIComponent(String(TRACE_ID_TTL_SECONDS))
  const url = `${config.baseUrl}/set/${key}/${value}?EX=${ttl}&NX=true`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) return 'error'

    const bodyData = (await response.json()) as { result?: unknown }
    return bodyData?.result === 'OK' ? 'created' : 'exists'
  } catch {
    return 'error'
  }
}

async function registerTraceIdWithRedis(
  traceId: string,
  nowSeconds: number
): Promise<{ accepted: boolean; store: 'redis' | 'memory'; warning?: string }> {
  const config = getRedisReplayConfig()
  if (!config) {
    return {
      accepted: registerTraceId(traceId, nowSeconds),
      store: 'memory',
    }
  }

  const redisResult = await redisSetReplayKey(config, traceId, nowSeconds)
  if (redisResult === 'created') return { accepted: true, store: 'redis' }
  if (redisResult === 'exists') return { accepted: false, store: 'redis' }

  return {
    accepted: registerTraceId(traceId, nowSeconds),
    store: 'memory',
    warning: 'Redis replay store kullanılamadi, memory fallback aktif',
  }
}

async function warmPath(origin: string, path: string): Promise<{
  path: string
  ok: boolean
  status?: number
  error?: string
  attempts: number
}> {
  const timeoutMs = getWarmupTimeoutMs()
  const maxAttempts = getWarmupRetryCount()
  const baseBackoffMs = getWarmupRetryBackoffMs()

  let lastStatus: number | undefined
  let lastError: string | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${origin}${path}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'x-site-engine-warmup': '1',
        },
      })

      if (response.ok) {
        return {
          path,
          ok: true,
          status: response.status,
          attempts: attempt,
        }
      }

      lastStatus = response.status
      lastError = `HTTP ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'warmup failed'
    } finally {
      clearTimeout(timeout)
    }

    if (attempt < maxAttempts) {
      const backoff = baseBackoffMs * Math.pow(2, attempt - 1)
      await sleep(backoff)
    }
  }

  return {
    path,
    ok: false,
    status: lastStatus,
    error: lastError || 'warmup failed',
    attempts: maxAttempts,
  }
}

function normalizeBody(input: unknown): {
  version: string
  event: 'publish' | 'unpublish' | 'page_update' | 'site_update'
  traceId: string
  publishedAt: string
  siteSlug: string
  pages: string[]
  source: string
} | null {
  const modern = publishWebhookBodySchema.safeParse(input)
  if (modern.success) {
    return {
      version: modern.data.version,
      event: modern.data.event,
      traceId: modern.data.traceId,
      publishedAt: modern.data.publishedAt,
      siteSlug: modern.data.site.slug,
      pages: modern.data.pages || [],
      source: modern.data.source,
    }
  }

  const legacy = legacyPublishBodySchema.safeParse(input)
  if (legacy.success) {
    return {
      version: '1.0',
      event: legacy.data.event || 'publish',
      traceId: legacy.data.traceId,
      publishedAt: legacy.data.publishedAt,
      siteSlug: legacy.data.siteSlug,
      pages: legacy.data.pages || [],
      source: legacy.data.source,
    }
  }

  return null
}

export async function handleRevalidateWebhook(request: NextRequest) {
  const startedAt = Date.now()
  const secret =
    process.env.WEBHOOK_SECRET?.trim() ||
    process.env.INTERNAL_PUBLISH_SECRET?.trim() ||
    process.env.DEMO_PUBLISH_WEBHOOK_SECRET?.trim()

  if (!secret) {
    return webhookError({
      status: 500,
      code: 'WEBHOOK_SECRET_MISSING',
      error: 'WEBHOOK_SECRET tanimli degil',
    })
  }

  const signature = request.headers.get('x-signature') || ''
  const timestamp = request.headers.get('x-timestamp') || ''
  const headerTraceId = request.headers.get('x-trace-id') || ''
  const rawBody = await request.text()

  const verification = verifyPublishWebhookSignature({
    rawBody,
    signature,
    timestamp,
    secret,
  })
  if (!verification.ok) {
    return webhookError({
      status: 401,
      code: 'SIGNATURE_INVALID',
      error: verification.error || 'Imza dogrulanamadi',
    })
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return webhookError({
      status: 400,
      code: 'INVALID_JSON',
      error: 'JSON parse hatasi',
    })
  }

  const bodyData = normalizeBody(parsedBody)
  if (!bodyData) {
    return webhookError({
      status: 400,
      code: 'PAYLOAD_INVALID',
      error: 'BodyData kontrata uymuyor',
    })
  }

  const siteSlug = normalizeSiteSlug(bodyData.siteSlug)
  if (!siteSlug) {
    return webhookError({
      status: 400,
      code: 'SITE_SLUG_INVALID',
      error: 'Site slug gecersiz',
    })
  }

  if (!headerTraceId) {
    return webhookError({
      status: 400,
      code: 'TRACE_HEADER_REQUIRED',
      error: 'x-trace-id zorunlu',
    })
  }

  if (headerTraceId !== bodyData.traceId) {
    return webhookError({
      status: 400,
      code: 'TRACE_ID_MISMATCH',
      error: 'TraceId uyusmuyor',
    })
  }

  const replayRegistration = await registerTraceIdWithRedis(
    bodyData.traceId,
    Math.floor(Date.now() / 1000)
  )

  if (!replayRegistration.accepted) {
    return webhookSuccess(
      {
        skipped: true,
        traceId: bodyData.traceId,
      },
      { status: 200 }
    )
  }

  const warmupPaths = collectWarmupPaths(siteSlug, bodyData.pages)
  for (const path of warmupPaths) {
    revalidatePath(path)
  }

  const origin = request.nextUrl.origin
  const warmed = await Promise.all(warmupPaths.map((path) => warmPath(origin, path)))
  const warnings = warmed
    .filter((item) => !item.ok)
    .map((item) => `${item.path} warmup basarisiz${item.status ? ` (${item.status})` : ''}`)

  if (replayRegistration.warning) warnings.push(replayRegistration.warning)

  const durationMs = Date.now() - startedAt
  console.info('[site-engine revalidate] completed', {
    traceId: bodyData.traceId,
    siteSlug,
    event: bodyData.event,
    revalidatedCount: warmupPaths.length,
    warmupFailures: warnings.length,
    durationMs,
  })

  return webhookSuccess({
    traceId: bodyData.traceId,
    event: bodyData.event,
    siteSlug,
    source: bodyData.source,
    payloadVersion: bodyData.version,
    revalidated: warmupPaths,
    warmed,
    warnings,
  })
}
