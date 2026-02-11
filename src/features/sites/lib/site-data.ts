import type { PanelPage, PanelRevision, PanelSite } from '@/features/site-engine/lib/panel-client'
import {
  getPanelPageRevision,
  getPanelSiteById,
  listPanelModules,
  listPanelPageRevisions,
  listPanelPages,
  listPanelSites,
} from '@/features/site-engine/lib/panel-client'
import { getSiteTheme } from '@/features/sites/themes/registry'
import { normalizeSiteThemeId } from '@/features/sites/themes/types'

export interface SitePageData {
  slug: string
  title: string
  metaTitle: string | null
  metaDescription: string | null
  keywords: string[]
  blocks: PageBlock[]
}

export interface PageBlock {
  blockType: string
  [key: string]: unknown
}

export interface SiteServiceData {
  id: string
  name: string
  slug: string
  shortDescription: string
}

export interface SiteBlogPost {
  id: string
  slug: string
  title: string
  excerpt?: string | null
  content?: {
    root: {
      children: Array<Record<string, unknown>>
    }
  } | null
  coverImage?: { url?: string } | null
  publishedAt?: string | null
  createdAt: string
}

export interface SiteData {
  project: {
    id: string
    name: string
    slug: string
    description: string | null
    industry: string | null
  }
  company: {
    id: string
    name: string
    logoUrl: string | null
  }
  settings: {
    phone: string | null
    phone2: string | null
    whatsapp: string | null
    email: string | null
    address: string | null
    city: string | null
    district: string | null
    workingHours: string | null
    mapEmbed: string | null
    socialMedia: {
      facebook?: string
      instagram?: string
      linkedin?: string
      twitter?: string
      youtube?: string
    } | null
    siteTitle: string | null
    siteDescription: string | null
    keywords: string[]
    footerDescription: string | null
  }
  design: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    theme: string
    fontHeading: string
    fontBody: string
    logoUrl: string | null
    faviconUrl: string | null
  }
  pages: SitePageData[]
  services: SiteServiceData[]
  contents: {
    [key: string]: {
      title: string | null
      content: string
      metaTitle: string | null
      metaDescription: string | null
    }
  }
}

type ContactModuleSettings = {
  recipients?: string[]
  address?: string
  phones?: string[]
  emails?: string[]
  map_embed_url?: string
  kvkk_legal_text_id?: string
  success_message?: string
  working_hours?: string
  social_media?: Record<string, string>
}

const ALLOWED_BLOCK_TYPES = new Set([
  'hero',
  'services',
  'about',
  'cta',
  'faq',
  'team',
  'stats',
  'gallery',
  'testimonials',
  'content',
])

function slugifyValue(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeSlug(value: string | undefined | null): string {
  if (!value) return '/'
  const trimmed = value.trim()
  if (!trimmed || trimmed === '/') return '/'
  const cleaned = trimmed.replace(/^\/+/, '').replace(/\/+$/, '')
  return cleaned ? `/${cleaned}` : '/'
}

function stripProtocolHost(value: string): string {
  const raw = value.trim()
  if (!raw) return ''
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
    return parsed.host.toLowerCase()
  } catch {
    return raw.toLowerCase()
  }
}

function slugToContentKey(slug: string): string {
  const normalized = normalizeSlug(slug)
  if (normalized === '/') return 'HOMEPAGE'
  if (normalized === '/hakkimizda') return 'ABOUT'
  if (normalized === '/hizmetler') return 'SERVICES'
  if (normalized === '/iletisim') return 'CONTACT'
  if (normalized === '/blog') return 'BLOG'
  return normalized.replace(/^\//, '').replace(/[/-]+/g, '_').toUpperCase()
}

function lexicalText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const root = (value as { root?: { children?: unknown[] } }).root
  if (!root || !Array.isArray(root.children)) return ''

  const pieces: string[] = []

  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const record = node as Record<string, unknown>
    if (typeof record.text === 'string' && record.text.trim()) {
      pieces.push(record.text.trim())
    }
    if (Array.isArray(record.children)) {
      for (const child of record.children) walk(child)
    }
  }

  for (const child of root.children) {
    walk(child)
  }

  return pieces.join(' ').trim()
}

function extractTextContent(value: unknown): string {
  if (typeof value === 'string') return value
  return lexicalText(value)
}

function normalizeKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

function normalizeBlockFromContracts(value: unknown): PageBlock | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  if (typeof record.type === 'string') {
    if (!ALLOWED_BLOCK_TYPES.has(record.type)) return null
    const props =
      record.props && typeof record.props === 'object' && !Array.isArray(record.props)
        ? (record.props as Record<string, unknown>)
        : {}
    return {
      blockType: record.type,
      ...props,
    }
  }

  if (typeof record.blockType === 'string') {
    if (!ALLOWED_BLOCK_TYPES.has(record.blockType)) return null
    return record as PageBlock
  }

  return null
}

function normalizeBlocks(value: unknown): PageBlock[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => normalizeBlockFromContracts(entry))
    .filter((entry): entry is PageBlock => Boolean(entry))
}

function extractMainContent(blocks: PageBlock[]): string {
  const contentBlock = blocks.find((block) => block.blockType === 'content')
  if (!contentBlock) return ''
  return extractTextContent(contentBlock.text)
}

function deriveSiteSlugCandidates(site: PanelSite): string[] {
  const candidates = new Set<string>()
  const rawPrimary = typeof site.primary_domain === 'string' ? site.primary_domain : ''
  const primaryHost = stripProtocolHost(rawPrimary)

  if (primaryHost) {
    candidates.add(primaryHost)
    candidates.add(primaryHost.replace(/^www\./, ''))
    const firstPart = primaryHost.replace(/^www\./, '').split('.')[0]
    if (firstPart) candidates.add(firstPart)
  }

  const settings = site.settings || {}
  const fromSettings = [
    settings.site_slug,
    settings.slug as string | undefined,
    settings.siteSlug as string | undefined,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

  for (const value of fromSettings) {
    candidates.add(slugifyValue(value))
  }

  if (site.name) {
    candidates.add(slugifyValue(site.name))
  }

  return Array.from(candidates)
}

function selectSiteBySlug(items: PanelSite[], slug: string): PanelSite | null {
  const normalizedSlug = slugifyValue(slug)
  for (const site of items) {
    const candidates = deriveSiteSlugCandidates(site)
    if (candidates.some((candidate) => slugifyValue(candidate) === normalizedSlug)) {
      return site
    }
  }
  return null
}

async function resolvePageBlocks(page: PanelPage): Promise<PageBlock[]> {
  const fromPage = normalizeBlocks((page as Record<string, unknown>).blocks)
  if (fromPage.length > 0) return fromPage

  const fromContent = normalizeBlocks((page as Record<string, unknown>).content)
  if (fromContent.length > 0) return fromContent

  const revisionId =
    page.published_revision_id ||
    page.staging_revision_id ||
    page.draft_revision_id ||
    null

  if (!revisionId) return []

  const revisionsResponse = await listPanelPageRevisions(page.id).catch(() => null)
  if (revisionsResponse) {
    const found = revisionsResponse.items.find((revision) => revision.id === revisionId)
    if (found) {
      const fromRevision = normalizeBlocks((found as PanelRevision).blocks)
      if (fromRevision.length > 0) return fromRevision
    }
  }

  const revision = await getPanelPageRevision(page.id, revisionId).catch(() => null)
  if (!revision) return []

  return normalizeBlocks(revision.blocks)
}

function buildServicesFromBlocks(pages: SitePageData[]): SiteServiceData[] {
  const map = new Map<string, SiteServiceData>()
  for (const page of pages) {
    for (const block of page.blocks) {
      if (block.blockType !== 'services') continue
      const items = Array.isArray(block.items) ? block.items : []
      for (const item of items) {
        if (!item || typeof item !== 'object') continue
        const title = (item as { title?: unknown }).title
        if (typeof title !== 'string' || !title.trim()) continue
        const key = slugifyValue(title)
        if (!key || map.has(key)) continue
        map.set(key, {
          id: key,
          name: title,
          slug: key,
          shortDescription:
            typeof (item as { description?: unknown }).description === 'string'
              ? ((item as { description?: string }).description as string)
              : '',
        })
      }
    }
  }
  return Array.from(map.values())
}

function parseContactSettings(value: unknown): ContactModuleSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as ContactModuleSettings
}

function computeSiteTitle(site: PanelSite): string {
  const defaults = site.settings?.seo_defaults
  if (defaults?.title_suffix) {
    return `${site.name}${defaults.title_suffix}`
  }
  return site.name
}

export async function getSiteData(siteSlug: string): Promise<SiteData | null> {
  try {
    const sitesResponse = await listPanelSites()
    const matchedSite = selectSiteBySlug(sitesResponse.items, siteSlug)
    if (!matchedSite) return null

    const site = await getPanelSiteById(matchedSite.id).catch(() => matchedSite)
    const [pagesResponse, modulesResponse] = await Promise.all([
      listPanelPages(site.id),
      listPanelModules(site.id).catch(() => ({ items: [], total: 0 })),
    ])

    const allPages = pagesResponse.items
      .filter((page) => !page.deleted_at)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

    const publishedPages = allPages.filter((page) => page.status === 'published')
    const selectedPages = publishedPages.length > 0 ? publishedPages : allPages

    const pages: SitePageData[] = await Promise.all(
      selectedPages.map(async (page) => {
        const blocks = await resolvePageBlocks(page)
        return {
          slug: normalizeSlug(page.slug),
          title: page.title,
          metaTitle: page.seo?.title || null,
          metaDescription: page.seo?.description || null,
          keywords: normalizeKeywords(page.seo?.keywords),
          blocks,
        }
      })
    )

    const contents: SiteData['contents'] = {}
    for (const page of pages) {
      contents[slugToContentKey(page.slug)] = {
        title: page.title,
        content: extractMainContent(page.blocks),
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
      }
    }

    const contactModule = modulesResponse.items.find(
      (module) => module.module_key === 'contact' && module.enabled
    )
    const contactSettings = parseContactSettings(contactModule?.settings)
    const socialMedia =
      contactSettings.social_media && Object.keys(contactSettings.social_media).length > 0
        ? {
            facebook: contactSettings.social_media.facebook,
            instagram: contactSettings.social_media.instagram,
            linkedin: contactSettings.social_media.linkedin,
            twitter: contactSettings.social_media.twitter,
            youtube: contactSettings.social_media.youtube,
          }
        : null

    const keywords = normalizeKeywords(site.settings?.seo_defaults?.keywords)

    const derivedServices = buildServicesFromBlocks(pages)
    const resolvedThemeId = normalizeSiteThemeId(
      typeof site.settings?.theme === 'string' ? site.settings.theme : undefined
    )
    const resolvedTheme = getSiteTheme(resolvedThemeId)
    const projectDescription =
      typeof site.settings?.seo_defaults?.description === 'string'
        ? site.settings.seo_defaults.description
        : null

    return {
      project: {
        id: site.id,
        name: site.name,
        slug: siteSlug,
        description: projectDescription,
        industry: 'OSGB',
      },
      company: {
        id: site.id,
        name: site.name,
        logoUrl: site.settings?.logo_url || null,
      },
      settings: {
        phone: Array.isArray(contactSettings.phones) ? contactSettings.phones[0] || null : null,
        phone2: Array.isArray(contactSettings.phones) ? contactSettings.phones[1] || null : null,
        whatsapp: null,
        email: Array.isArray(contactSettings.emails) ? contactSettings.emails[0] || null : null,
        address: contactSettings.address || null,
        city: null,
        district: null,
        workingHours: contactSettings.working_hours || null,
        mapEmbed: contactSettings.map_embed_url || null,
        socialMedia,
        siteTitle: computeSiteTitle(site),
        siteDescription: projectDescription,
        keywords,
        footerDescription:
          typeof site.settings?.footer_description === 'string'
            ? site.settings.footer_description
            : null,
      },
      design: {
        primaryColor: site.settings?.brand_color || resolvedTheme.tokens.primaryColor,
        secondaryColor: site.settings?.secondary_color || resolvedTheme.tokens.secondaryColor,
        accentColor: site.settings?.accent_color || resolvedTheme.tokens.accentColor,
        backgroundColor:
          typeof site.settings?.background_color === 'string'
            ? site.settings.background_color
            : resolvedTheme.tokens.backgroundColor,
        theme: resolvedTheme.id,
        fontHeading: site.settings?.font_heading || resolvedTheme.tokens.fontHeading,
        fontBody: site.settings?.font_body || resolvedTheme.tokens.fontBody,
        logoUrl: site.settings?.logo_url || null,
        faviconUrl: site.settings?.favicon_url || null,
      },
      pages,
      services: derivedServices,
      contents,
    }
  } catch (error) {
    console.error('getSiteData error:', error)
    return null
  }
}

// `blog_posts` migrationi tamamlanana kadar blog verisi bos doner.
export async function getSiteBlogPosts(
  _projectId: string,
  _limit?: number
): Promise<SiteBlogPost[]> {
  return []
}

export async function getSiteBlogPost(
  _projectId: string,
  _postSlug: string
): Promise<SiteBlogPost | undefined> {
  return undefined
}
