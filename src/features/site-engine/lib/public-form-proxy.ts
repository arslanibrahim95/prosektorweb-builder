import { z } from 'zod'
import {
  publicContactSubmitSchema,
  publicJobApplySchema,
  publicOfferSubmitSchema,
  type ApiErrorResponse,
} from '@prosektor/contracts'
import {
  getPanelSiteToken,
  PanelApiError,
  submitPanelPublic,
} from '@/features/site-engine/lib/panel-client'

type SiteTokenCacheRecord = {
  siteToken: string
  expiresAt: number
}

declare global {
  var __siteEngineSiteTokenCache: Map<string, SiteTokenCacheRecord> | undefined
}

function getSiteTokenCache(): Map<string, SiteTokenCacheRecord> {
  if (!globalThis.__siteEngineSiteTokenCache) {
    globalThis.__siteEngineSiteTokenCache = new Map()
  }
  return globalThis.__siteEngineSiteTokenCache
}

function parseExpiresAt(expiresAt: string | undefined): number {
  if (!expiresAt) return Date.now() + 15 * 60 * 1000
  const parsed = Date.parse(expiresAt)
  if (!Number.isFinite(parsed)) return Date.now() + 15 * 60 * 1000
  return parsed
}

async function resolveSiteToken(siteId: string, existing?: string): Promise<string> {
  if (existing && existing.trim()) return existing.trim()

  const cache = getSiteTokenCache()
  const cached = cache.get(siteId)
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.siteToken
  }

  const response = await getPanelSiteToken(siteId)
  cache.set(siteId, {
    siteToken: response.site_token,
    expiresAt: parseExpiresAt(response.expires_at),
  })

  return response.site_token
}

export function toPanelErrorResponse(error: unknown): {
  status: number
  body: ApiErrorResponse
} {
  if (error instanceof PanelApiError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    }
  }

  if (error instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        code: 'VALIDATION_ERROR',
        message: 'Gecersiz form verisi',
        details: error.flatten().fieldErrors as Record<string, string[]>,
      },
    }
  }

  return {
    status: 500,
    body: {
      code: 'INTERNAL_ERROR',
      message: 'Beklenmeyen bir hata olustu',
    },
  }
}

export async function submitContactForm(input: unknown) {
  const parsed = publicContactSubmitSchema.parse(input)
  const siteId = parsed.site_id
  if (!parsed.site_token && !siteId) {
    throw new PanelApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'site_id veya site_token zorunlu',
    })
  }

  const siteToken = await resolveSiteToken(siteId || '', parsed.site_token)

  return submitPanelPublic('/public/contact/submit', {
    site_token: siteToken,
    full_name: parsed.full_name,
    email: parsed.email,
    phone: parsed.phone,
    subject: parsed.subject,
    message: parsed.message,
    kvkk_consent: parsed.kvkk_consent,
    honeypot: parsed.honeypot,
  })
}

export async function submitOfferForm(input: unknown) {
  const parsed = publicOfferSubmitSchema.parse(input)
  const siteId = parsed.site_id
  if (!parsed.site_token && !siteId) {
    throw new PanelApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'site_id veya site_token zorunlu',
    })
  }

  const siteToken = await resolveSiteToken(siteId || '', parsed.site_token)

  return submitPanelPublic('/public/offer/submit', {
    site_token: siteToken,
    company_name: parsed.company_name,
    contact_name: parsed.contact_name,
    email: parsed.email,
    phone: parsed.phone,
    employee_count: parsed.employee_count,
    hazard_class: parsed.hazard_class,
    services_requested: parsed.services_requested,
    message: parsed.message,
    kvkk_consent: parsed.kvkk_consent,
    honeypot: parsed.honeypot,
  })
}

export async function submitJobApplicationForm(input: unknown) {
  const parsed = publicJobApplySchema.parse(input)
  const siteId = parsed.site_id
  if (!parsed.site_token && !siteId) {
    throw new PanelApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'site_id veya site_token zorunlu',
    })
  }

  const siteToken = await resolveSiteToken(siteId || '', parsed.site_token)

  return submitPanelPublic('/public/hr/apply', {
    site_token: siteToken,
    full_name: parsed.full_name,
    email: parsed.email,
    phone: parsed.phone,
    job_post_id: parsed.job_post_id,
    position: parsed.position,
    cover_letter: parsed.cover_letter,
    kvkk_consent: parsed.kvkk_consent,
    honeypot: parsed.honeypot,
  })
}
