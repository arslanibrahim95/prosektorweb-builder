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

export interface SiteNavigationLink {
  href: string
  label: string
}

export interface SiteThemeTokens {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  fontHeading: string
  fontBody: string
}

export interface SitePageLayoutConfig {
  sectionOrder: string[]
  hiddenSections: string[]
}

export interface SiteLayoutConfig {
  pages: Record<string, SitePageLayoutConfig>
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
    navigationLinks: SiteNavigationLink[]
    footerLinks: SiteNavigationLink[]
    headerCtaLabel: string | null
    headerCtaHref: string | null
    layoutConfig: SiteLayoutConfig
    sectionVariants: Record<string, string>
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
  'contact',
  'faq',
  'team',
  'stats',
  'gallery',
  'testimonials',
  'content',
])

const DEFAULT_SECTION_ORDER = [
  'hero',
  'services',
  'about',
  'cta',
  'contact',
  'faq',
  'team',
  'stats',
  'gallery',
  'testimonials',
  'content',
]

const EDITABLE_PAGE_SLUGS = ['/', '/hakkimizda', '/hizmetler', '/iletisim', '/blog']

const DEFAULT_SECTION_VARIANTS: Record<string, string> = {
  hero: 'default',
  services: 'cards',
  about: 'default',
  cta: 'banner',
  contact: 'default',
}

const SECTION_VARIANT_OPTIONS: Record<string, string[]> = {
  hero: ['default', 'spotlight', 'compact'],
  services: ['cards', 'list', 'compact'],
  about: ['default', 'card'],
  cta: ['banner', 'minimal'],
  contact: ['default', 'compact'],
}

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const NAVIGATION_LABEL_MAP: Record<string, string> = {
  '/': 'Ana Sayfa',
  '/hakkimizda': 'Hakkimizda',
  '/hizmetler': 'Hizmetler',
  '/blog': 'Blog',
  '/iletisim': 'Iletisim',
}

const DEFAULT_NAVIGATION_ORDER = ['/', '/hakkimizda', '/hizmetler', '/blog', '/iletisim']

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

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeHexColorToken(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return HEX_COLOR_REGEX.test(trimmed) ? trimmed.toLowerCase() : null
}

function normalizeFontToken(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 120)
}

function normalizeSectionType(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  if (!normalized || !ALLOWED_BLOCK_TYPES.has(normalized)) return null
  return normalized
}

function normalizeSectionList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const item of value) {
    const section = normalizeSectionType(item)
    if (!section || seen.has(section)) continue
    seen.add(section)
    normalized.push(section)
  }

  return normalized
}

function normalizePageSlugForLayout(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed === '/' || trimmed === 'home' || trimmed === 'homepage') return '/'
  return normalizeSlug(trimmed)
}

function buildDefaultLayoutConfig(): SiteLayoutConfig {
  return {
    pages: EDITABLE_PAGE_SLUGS.reduce<Record<string, SitePageLayoutConfig>>((acc, slug) => {
      acc[slug] = {
        sectionOrder: [...DEFAULT_SECTION_ORDER],
        hiddenSections: [],
      }
      return acc
    }, {}),
  }
}

function cloneLayoutConfig(layoutConfig: SiteLayoutConfig): SiteLayoutConfig {
  const pages = Object.entries(layoutConfig.pages).reduce<Record<string, SitePageLayoutConfig>>(
    (acc, [slug, pageConfig]) => {
      acc[slug] = {
        sectionOrder: [...pageConfig.sectionOrder],
        hiddenSections: [...pageConfig.hiddenSections],
      }
      return acc
    },
    {}
  )

  return { pages }
}

function normalizePageLayoutConfig(value: unknown): SitePageLayoutConfig {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  const sectionOrder = normalizeSectionList(source.sectionOrder || source.order)
  const hiddenSections = normalizeSectionList(
    source.hiddenSections || source.hidden || source.hidden_blocks
  )

  return {
    sectionOrder: sectionOrder.length > 0 ? sectionOrder : [...DEFAULT_SECTION_ORDER],
    hiddenSections,
  }
}

function normalizeLayoutConfig(value: unknown, fallback: SiteLayoutConfig): SiteLayoutConfig {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  const pageSource =
    source?.pages && typeof source.pages === 'object' && !Array.isArray(source.pages)
      ? (source.pages as Record<string, unknown>)
      : null

  const next = cloneLayoutConfig(fallback)
  if (!pageSource) return next

  for (const [rawSlug, rawConfig] of Object.entries(pageSource)) {
    const slug = normalizePageSlugForLayout(rawSlug)
    if (!slug || !EDITABLE_PAGE_SLUGS.includes(slug)) continue
    next.pages[slug] = normalizePageLayoutConfig(rawConfig)
  }

  return next
}

function normalizeSectionVariants(value: unknown, fallback: Record<string, string>): Record<string, string> {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  const next: Record<string, string> = { ...fallback }
  if (!source) return next

  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = normalizeSectionType(rawKey)
    if (!key || typeof rawValue !== 'string') continue
    const variant = rawValue.trim().toLowerCase()
    if (!variant) continue
    const allowed = SECTION_VARIANT_OPTIONS[key]
    if (Array.isArray(allowed) && allowed.includes(variant)) {
      next[key] = variant
    }
  }

  return next
}

function mergeSectionVariants(blocks: PageBlock[], sectionVariants: Record<string, string>): PageBlock[] {
  return blocks.map((block) => {
    const blockType = normalizeSectionType(block.blockType)
    if (!blockType) return block

    const variant = sectionVariants[blockType]
    if (!variant) return block
    if (typeof block.variant === 'string' && block.variant.trim()) return block

    return {
      ...block,
      variant,
    }
  })
}

function applyLayoutConfigToBlocks(
  slug: string,
  blocks: PageBlock[],
  layoutConfig: SiteLayoutConfig
): PageBlock[] {
  const pageConfig = layoutConfig.pages[slug]
  if (!pageConfig) return blocks

  const hiddenSet = new Set(pageConfig.hiddenSections)
  const visibleBlocks = blocks.filter((block) => !hiddenSet.has(block.blockType))
  if (visibleBlocks.length <= 1) return visibleBlocks

  const orderMap = new Map<string, number>()
  pageConfig.sectionOrder.forEach((blockType, index) => {
    orderMap.set(blockType, index)
  })

  const withIndex = visibleBlocks.map((block, index) => ({ block, index }))
  withIndex.sort((a, b) => {
    const aOrder = orderMap.get(a.block.blockType)
    const bOrder = orderMap.get(b.block.blockType)
    const aRank = typeof aOrder === 'number' ? aOrder : Number.MAX_SAFE_INTEGER
    const bRank = typeof bOrder === 'number' ? bOrder : Number.MAX_SAFE_INTEGER
    if (aRank !== bRank) return aRank - bRank
    return a.index - b.index
  })

  return withIndex.map((item) => item.block)
}

function normalizeThemeTokens(value: unknown, fallback: SiteThemeTokens): SiteThemeTokens {
  const source =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null

  return {
    primaryColor:
      normalizeHexColorToken(source?.primaryColor) ||
      normalizeHexColorToken(source?.primary_color) ||
      fallback.primaryColor,
    secondaryColor:
      normalizeHexColorToken(source?.secondaryColor) ||
      normalizeHexColorToken(source?.secondary_color) ||
      fallback.secondaryColor,
    accentColor:
      normalizeHexColorToken(source?.accentColor) ||
      normalizeHexColorToken(source?.accent_color) ||
      fallback.accentColor,
    backgroundColor:
      normalizeHexColorToken(source?.backgroundColor) ||
      normalizeHexColorToken(source?.background_color) ||
      fallback.backgroundColor,
    fontHeading:
      normalizeFontToken(source?.fontHeading) ||
      normalizeFontToken(source?.font_heading) ||
      fallback.fontHeading,
    fontBody:
      normalizeFontToken(source?.fontBody) ||
      normalizeFontToken(source?.font_body) ||
      fallback.fontBody,
  }
}

function toNavigationHref(value: unknown): string | null {
  const raw = normalizeText(value)
  if (!raw) return null
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('#')) return raw
  const normalized = normalizeSlug(raw)
  return normalized === '/' ? '' : normalized
}

function toNavigationLabel(href: string, value?: unknown): string {
  const explicitLabel = normalizeText(value)
  if (explicitLabel) return explicitLabel

  const normalizedHref = href === '' ? '/' : href
  if (NAVIGATION_LABEL_MAP[normalizedHref]) {
    return NAVIGATION_LABEL_MAP[normalizedHref]
  }

  const slugPart = normalizedHref.split('/').filter(Boolean).pop() || ''
  if (!slugPart) return 'Sayfa'
  return slugPart
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizeNavigationLink(value: unknown): SiteNavigationLink | null {
  if (typeof value === 'string') {
    const href = toNavigationHref(value)
    if (!href) return null
    return { href, label: toNavigationLabel(href) }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const href =
    toNavigationHref(record.href) ||
    toNavigationHref(record.path) ||
    toNavigationHref(record.url) ||
    toNavigationHref(record.slug)

  if (!href) return null

  return {
    href,
    label: toNavigationLabel(href, record.label || record.title || record.name),
  }
}

function dedupeNavigationLinks(value: SiteNavigationLink[]): SiteNavigationLink[] {
  const seen = new Set<string>()
  const result: SiteNavigationLink[] = []
  for (const item of value) {
    const key = item.href.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }
  return result
}

function buildDefaultNavigationLinks(pages: SitePageData[]): SiteNavigationLink[] {
  const fromPagesMap = new Map<string, SiteNavigationLink>()

  for (const page of pages) {
    const href = page.slug === '/' ? '' : page.slug
    if (fromPagesMap.has(href)) continue
    fromPagesMap.set(href, {
      href,
      label: toNavigationLabel(href, page.title),
    })
  }

  if (fromPagesMap.size === 0) {
    return DEFAULT_NAVIGATION_ORDER.map((slug) => {
      const href = slug === '/' ? '' : slug
      return { href, label: toNavigationLabel(href) }
    })
  }

  const ordered: SiteNavigationLink[] = []
  for (const slug of DEFAULT_NAVIGATION_ORDER) {
    const href = slug === '/' ? '' : slug
    const link = fromPagesMap.get(href)
    if (!link) continue
    ordered.push(link)
    fromPagesMap.delete(href)
  }

  for (const link of fromPagesMap.values()) {
    ordered.push(link)
  }

  return dedupeNavigationLinks(ordered)
}

function normalizeNavigationLinks(
  value: unknown,
  fallback: SiteNavigationLink[]
): SiteNavigationLink[] {
  if (!Array.isArray(value)) return fallback
  const parsed = value
    .map((item) => normalizeNavigationLink(item))
    .filter((item): item is SiteNavigationLink => Boolean(item))
  if (parsed.length === 0) return fallback
  return dedupeNavigationLinks(parsed)
}

function normalizeBlockFromContracts(value: unknown): PageBlock | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  if (typeof record.type === 'string') {
    const blockType = normalizeSectionType(record.type)
    if (!blockType) return null
    const props =
      record.props && typeof record.props === 'object' && !Array.isArray(record.props)
        ? (record.props as Record<string, unknown>)
        : {}
    return {
      blockType,
      ...props,
    }
  }

  if (typeof record.blockType === 'string') {
    const blockType = normalizeSectionType(record.blockType)
    if (!blockType) return null
    return {
      ...record,
      blockType,
    } as PageBlock
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
    const settingsRecord =
      site.settings && typeof site.settings === 'object'
        ? (site.settings as Record<string, unknown>)
        : {}
    const resolvedThemeId = normalizeSiteThemeId(
      typeof site.settings?.theme === 'string' ? site.settings.theme : undefined
    )
    const resolvedTheme = getSiteTheme(resolvedThemeId)
    const themeTokens = normalizeThemeTokens(
      settingsRecord.theme_tokens || settingsRecord.themeTokens,
      {
        primaryColor:
          normalizeHexColorToken(settingsRecord.brand_color) || resolvedTheme.tokens.primaryColor,
        secondaryColor:
          normalizeHexColorToken(settingsRecord.secondary_color) ||
          resolvedTheme.tokens.secondaryColor,
        accentColor:
          normalizeHexColorToken(settingsRecord.accent_color) || resolvedTheme.tokens.accentColor,
        backgroundColor:
          normalizeHexColorToken(settingsRecord.background_color) ||
          resolvedTheme.tokens.backgroundColor,
        fontHeading:
          normalizeFontToken(settingsRecord.font_heading) || resolvedTheme.tokens.fontHeading,
        fontBody: normalizeFontToken(settingsRecord.font_body) || resolvedTheme.tokens.fontBody,
      }
    )
    const layoutConfig = normalizeLayoutConfig(
      settingsRecord.layout_config || settingsRecord.layoutConfig,
      buildDefaultLayoutConfig()
    )
    const sectionVariants = normalizeSectionVariants(
      settingsRecord.section_variants || settingsRecord.sectionVariants,
      DEFAULT_SECTION_VARIANTS
    )

    const pages: SitePageData[] = await Promise.all(
      selectedPages.map(async (page) => {
        const pageSlug = normalizeSlug(page.slug)
        const blocks = mergeSectionVariants(
          applyLayoutConfigToBlocks(pageSlug, await resolvePageBlocks(page), layoutConfig),
          sectionVariants
        )
        return {
          slug: pageSlug,
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
    const projectDescription =
      typeof site.settings?.seo_defaults?.description === 'string'
        ? site.settings.seo_defaults.description
        : null
    const defaultNavigationLinks = buildDefaultNavigationLinks(pages)
    const navigationLinks = normalizeNavigationLinks(
      settingsRecord.navigation_links ||
        settingsRecord.navigationLinks ||
        settingsRecord.nav_links ||
        settingsRecord.navLinks ||
        settingsRecord.header_links ||
        settingsRecord.menu_links,
      defaultNavigationLinks
    )
    const footerLinks = normalizeNavigationLinks(
      settingsRecord.footer_links ||
        settingsRecord.footerLinks ||
        settingsRecord.footer_navigation_links ||
        settingsRecord.footerNavigationLinks,
      navigationLinks
    )
    const headerCtaLabel =
      normalizeText(settingsRecord.header_cta_label) ||
      normalizeText(settingsRecord.headerCtaLabel) ||
      normalizeText(settingsRecord.cta_label) ||
      normalizeText(settingsRecord.ctaLabel)
    const headerCtaHref =
      toNavigationHref(settingsRecord.header_cta_href) ||
      toNavigationHref(settingsRecord.headerCtaHref) ||
      toNavigationHref(settingsRecord.cta_href) ||
      toNavigationHref(settingsRecord.ctaHref) ||
      '/iletisim'

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
        navigationLinks,
        footerLinks,
        headerCtaLabel,
        headerCtaHref,
        layoutConfig,
        sectionVariants,
      },
      design: {
        primaryColor: themeTokens.primaryColor,
        secondaryColor: themeTokens.secondaryColor,
        accentColor: themeTokens.accentColor,
        backgroundColor: themeTokens.backgroundColor,
        theme: resolvedTheme.id,
        fontHeading: themeTokens.fontHeading,
        fontBody: themeTokens.fontBody,
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
