import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

const SIGNATURE_PREFIX = 'sha256=';

export const PUBLISH_SIGNATURE_MAX_SKEW_SECONDS = 300;

export interface PublishWebhookPayload {
  event: 'publish' | 'unpublish' | 'page_update' | 'site_update';
  site: {
    id: string;
    slug: string;
    status: 'draft' | 'staging' | 'published';
  };
  pages: string[];
  publishedAt: string;
  traceId: string;
  source: string;
}

export interface WarmupPathResult {
  path: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface DemoPublishDispatchResult {
  ok: boolean;
  skipped?: boolean;
  traceId: string;
  statusCode?: number;
  warning?: string;
  revalidated?: string[];
  warmed?: WarmupPathResult[];
}

export interface VerifySignatureInput {
  rawBody: string;
  signature: string;
  timestamp: string;
  secret: string;
  nowSeconds?: number;
  maxSkewSeconds?: number;
}

function stripQueryAndHash(pathname: string): string {
  return pathname.split(/[?#]/, 1)[0] || '/';
}

function normalizeLeadingSlash(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed || trimmed === '/') return '/';
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';
}

function normalizeSignature(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.startsWith(SIGNATURE_PREFIX)) {
    return trimmed.slice(SIGNATURE_PREFIX.length);
  }
  return trimmed;
}

function secureEqualHex(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export function createWebhookTraceId(): string {
  return randomUUID();
}

export function normalizeSiteSlug(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildSignedWebhookSignature(
  rawBody: string,
  secret: string,
  timestamp: string | number
): string {
  const ts = String(timestamp);
  const digest = createHmac('sha256', secret)
    .update(`${ts}.${rawBody}`)
    .digest('hex');
  return `${SIGNATURE_PREFIX}${digest}`;
}

export function verifyPublishWebhookSignature(input: VerifySignatureInput): {
  ok: boolean;
  error?: string;
} {
  const signature = normalizeSignature(input.signature);
  if (!signature) {
    return { ok: false, error: 'Eksik imza' };
  }

  const parsedTimestamp = Number.parseInt(input.timestamp, 10);
  if (!Number.isFinite(parsedTimestamp)) {
    return { ok: false, error: 'Gecersiz timestamp' };
  }

  const maxSkew = input.maxSkewSeconds ?? PUBLISH_SIGNATURE_MAX_SKEW_SECONDS;
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - parsedTimestamp) > maxSkew) {
    return { ok: false, error: 'Timestamp window disinda' };
  }

  const expected = normalizeSignature(
    buildSignedWebhookSignature(input.rawBody, input.secret, parsedTimestamp)
  );

  if (!expected || !secureEqualHex(signature, expected)) {
    return { ok: false, error: 'Imza dogrulanamadi' };
  }

  return { ok: true };
}

export function toSiteRoutePath(siteSlug: string, pagePath?: string): string {
  const normalizedSlug = normalizeSiteSlug(siteSlug);
  if (!normalizedSlug) return '/';

  const sanitizedPage = normalizeLeadingSlash(stripQueryAndHash(pagePath || '/'));
  if (sanitizedPage === '/' || sanitizedPage === `/${normalizedSlug}`) {
    return `/${normalizedSlug}`;
  }

  if (sanitizedPage.startsWith(`/${normalizedSlug}/`)) {
    return sanitizedPage;
  }

  return `/${normalizedSlug}${sanitizedPage === '/' ? '' : sanitizedPage}`;
}

export function collectWarmupPaths(siteSlug: string, pages?: string[]): string[] {
  const normalizedSlug = normalizeSiteSlug(siteSlug);
  if (!normalizedSlug) return ['/'];

  const defaults = ['/', '/hakkimizda', '/hizmetler', '/iletisim', '/blog'];
  const set = new Set<string>();

  for (const page of defaults) {
    set.add(toSiteRoutePath(normalizedSlug, page));
  }

  for (const page of pages || []) {
    if (!page || typeof page !== 'string') continue;
    set.add(toSiteRoutePath(normalizedSlug, page));
  }

  return Array.from(set);
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.error === 'string' && record.error) return record.error;
  if (typeof record.message === 'string' && record.message) return record.message;
  if (Array.isArray(record.warnings) && record.warnings.length > 0) {
    const firstWarning = record.warnings[0];
    if (typeof firstWarning === 'string') return firstWarning;
  }
  return null;
}

export async function dispatchDemoPublishWebhook(input: {
  siteSlug: string;
  siteId?: string | number;
  pages?: string[];
  event?: 'publish' | 'unpublish' | 'page_update' | 'site_update';
  siteStatus?: 'draft' | 'staging' | 'published';
  source?: string;
  traceId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
}): Promise<DemoPublishDispatchResult> {
  const normalizedSlug = normalizeSiteSlug(input.siteSlug);
  const traceId = input.traceId || createWebhookTraceId();

  if (!normalizedSlug) {
    return {
      ok: false,
      traceId,
      warning: 'Site slug gecersiz',
    };
  }

  const webhookUrl = (input.webhookUrl || process.env.DEMO_PUBLISH_WEBHOOK_URL || '').trim();
  const webhookSecret = (input.webhookSecret || process.env.DEMO_PUBLISH_WEBHOOK_SECRET || '').trim();

  if (!webhookUrl || !webhookSecret) {
    return {
      ok: false,
      skipped: true,
      traceId,
      warning: 'Demo publish webhook ayarlari eksik',
    };
  }

  const payload: PublishWebhookPayload = {
    event: input.event || 'publish',
    site: {
      id:
        typeof input.siteId === 'number'
          ? String(input.siteId)
          : typeof input.siteId === 'string'
            ? input.siteId
            : normalizedSlug,
      slug: normalizedSlug,
      status: input.siteStatus || 'published',
    },
    pages: collectWarmupPaths(normalizedSlug, input.pages),
    publishedAt: new Date().toISOString(),
    traceId,
    source: input.source || 'panel',
  };

  const rawBody = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = buildSignedWebhookSignature(rawBody, webhookSecret, timestamp);

  let response: Response;
  try {
    response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
        'x-timestamp': timestamp,
        'x-trace-id': traceId,
      },
      body: rawBody,
      cache: 'no-store',
    });
  } catch (error) {
    return {
      ok: false,
      traceId,
      warning: `Webhook erisimi basarisiz: ${error instanceof Error ? error.message : 'network error'}`,
    };
  }

  let parsedBody: unknown = null;
  try {
    parsedBody = await response.json();
  } catch {
    parsedBody = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      traceId,
      statusCode: response.status,
      warning: extractErrorMessage(parsedBody) || `Webhook hatasi: HTTP ${response.status}`,
    };
  }

  const parsedRecord = parsedBody && typeof parsedBody === 'object'
    ? (parsedBody as Record<string, unknown>)
    : {};

  return {
    ok: true,
    traceId,
    statusCode: response.status,
    warning: extractErrorMessage(parsedBody) || undefined,
    revalidated: Array.isArray(parsedRecord.revalidated)
      ? (parsedRecord.revalidated.filter((v): v is string => typeof v === 'string'))
      : undefined,
    warmed: Array.isArray(parsedRecord.warmed)
      ? (parsedRecord.warmed.filter((value): value is WarmupPathResult => {
          if (!value || typeof value !== 'object') return false;
          const row = value as Record<string, unknown>;
          return typeof row.path === 'string' && typeof row.ok === 'boolean';
        }))
      : undefined,
  };
}
