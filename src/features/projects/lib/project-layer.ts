import { z } from 'zod'
import {
  createRevisionRequestSchema,
  pageRevisionSchema,
  pageSchema,
  pageStatusSchema,
  siteSchema,
} from '@prosektor/contracts'
import {
  getPanelPageRevision,
  getPanelSiteById,
  listPanelPageRevisions,
  listPanelPages,
  listPanelSites,
  requestPanel,
} from '@/features/site-engine/lib/panel-client'
import {
  createWebhookTraceId,
  dispatchDemoPublishWebhook,
  normalizeSiteSlug,
  type DemoPublishDispatchResult,
} from '@/features/site-engine/lib/publish-webhook'
import {
  evaluatePublishQualityGate,
  type EscalationLevel,
  type PublishQualityGateResult,
} from '@/features/projects/lib/quality-gate'
import {
  DEFAULT_OSGB_TEMPLATE,
  OSGB_INDUSTRY,
  mapTemplateToTheme,
  normalizeOsgbTemplateId,
} from '@/features/projects/lib/osgb'

const projectCreateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  template: z.string().trim().max(80).optional(),
  industry: z.string().trim().max(80).optional(),
  contact: z
    .object({
      phone: z.string().trim().max(40).optional().or(z.literal('')),
      email: z.string().trim().max(120).optional().or(z.literal('')),
      address: z.string().trim().max(400).optional().or(z.literal('')),
      city: z.string().trim().max(80).optional().or(z.literal('')),
      district: z.string().trim().max(80).optional().or(z.literal('')),
    })
    .optional(),
})

const generationSchema = z.object({
  companyName: z.string().trim().min(2),
  description: z.string().trim().min(10),
  services: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  address: z.string().trim().optional(),
})

const pageCreateSchema = z.object({
  site_id: z.string().min(1),
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(1),
  status: pageStatusSchema.optional().default('draft'),
  seo: z
    .object({
      title: z.string().trim().max(220).optional(),
      description: z.string().trim().max(600).optional(),
    })
    .optional(),
})

const pagePatchSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    slug: z.string().trim().min(1).optional(),
    status: pageStatusSchema.optional(),
    seo: z
      .object({
        title: z.string().trim().max(220).optional(),
        description: z.string().trim().max(600).optional(),
      })
      .optional(),
    draft_revision_id: z.string().optional(),
    staging_revision_id: z.string().optional(),
    published_revision_id: z.string().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Bos patch gonderilemez')

const pageStatusDraftOrPublishedSchema = z.enum(['draft', 'published'])

type PanelSite = z.infer<typeof siteSchema>
type PanelPage = z.infer<typeof pageSchema>

type SiteSettingsRecord = Record<string, unknown>

type RevisionBlock = {
  id?: string
  type: string
  props: Record<string, unknown>
}

interface GeneratedPageTemplate {
  title: string
  slug: string
  seoTitle: string
  seoDescription: string
  blocks: Array<{ blockType: string; [key: string]: unknown }>
}

export interface ProjectListItem {
  id: string
  name: string
  description: string | null
  template: string | null
  industry: string | null
  status: string
  updatedAt: string
}

export interface ProjectDetail {
  id: string
  name: string
  slug: string
  description: string | null
  template: string | null
  industry: string | null
  contact: ProjectContactInfo
  status: string
  progress: number
  createdAt: string
  updatedAt: string
  domain: { id: string; name: string } | null
  pagesCount: number
  generatedContentsCount: number
}

export interface ProjectContactInfo {
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  district: string | null
}

export interface ProjectEditorPage {
  id: string
  name: string
  slug: string
  content: string
  updatedAt: string
}

export interface PublishProjectResult {
  project: ProjectDetail
  pagesPublished: number
  webhook: DemoPublishDispatchResult
  qualityGate: PublishQualityGateResult
}

export interface PublishProjectOptions {
  qaScore?: number
  escalationLevel?: EscalationLevel
  force?: boolean
  minQaScore?: number
  requireQaScore?: boolean
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

  throw new Error('Panel API tekil yaniti kontrata uymuyor')
}

function extractList<TSchema extends z.ZodTypeAny>(
  payload: unknown,
  schema: TSchema
): Array<z.output<TSchema>> {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const direct = z
      .object({
        items: z.array(schema),
      })
      .safeParse(payload)

    if (direct.success) return direct.data.items

    for (const key of ['docs', 'data', 'items']) {
      if (!Array.isArray(record[key])) continue
      const parsed = z.array(schema).safeParse(record[key])
      if (parsed.success) return parsed.data
    }
  }

  if (Array.isArray(payload)) {
    const parsed = z.array(schema).safeParse(payload)
    if (parsed.success) return parsed.data
  }

  throw new Error('Panel API liste yaniti kontrata uymuyor')
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function cleanUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.entries(input).reduce((acc, [key, value]) => {
    if (typeof value === 'undefined') return acc
    acc[key as keyof T] = value as T[keyof T]
    return acc
  }, {} as T)
}

function slugify(input: string): string {
  const turkishMap: Record<string, string> = {
    İ: 'i',
    I: 'i',
    ı: 'i',
    Ş: 's',
    ş: 's',
    Ğ: 'g',
    ğ: 'g',
    Ü: 'u',
    ü: 'u',
    Ö: 'o',
    ö: 'o',
    Ç: 'c',
    ç: 'c',
  }

  const mapped = input
    .trim()
    .replace(/[İIıŞşĞğÜüÖöÇç]/g, (char) => turkishMap[char] || char)
    .toLowerCase()

  return mapped
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizePageSlug(value: string | null | undefined): string {
  if (!value) return '/'
  const cleaned = value.trim().replace(/^\/+/, '').replace(/\/+$/, '')
  if (!cleaned) return '/'
  return `/${cleaned}`
}

function toEditorSlug(value: string | null | undefined): string {
  const normalized = normalizePageSlug(value)
  return normalized === '/' ? '' : normalized.replace(/^\//, '')
}

function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'DRAFT'
  return status.toUpperCase()
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

function getSiteSettings(site: PanelSite): SiteSettingsRecord {
  if (!site.settings || typeof site.settings !== 'object') return {}
  return site.settings as SiteSettingsRecord
}

function deriveSiteSlugCandidates(site: PanelSite): string[] {
  const candidates = new Set<string>()
  const settings = getSiteSettings(site)

  const primaryDomain = typeof site.primary_domain === 'string' ? site.primary_domain : ''
  const host = stripProtocolHost(primaryDomain)
  if (host) {
    candidates.add(host)
    candidates.add(host.replace(/^www\./, ''))
    const firstPart = host.replace(/^www\./, '').split('.')[0]
    if (firstPart) candidates.add(firstPart)
  }

  for (const field of ['site_slug', 'siteSlug', 'slug']) {
    const value = settings[field]
    if (typeof value !== 'string' || !value.trim()) continue
    candidates.add(slugify(value))
  }

  if (site.name) {
    candidates.add(slugify(site.name))
  }

  return Array.from(candidates).filter(Boolean)
}

function getPrimaryProjectSlug(site: PanelSite): string {
  const settings = getSiteSettings(site)
  const explicit =
    (typeof settings.site_slug === 'string' && settings.site_slug) ||
    (typeof settings.siteSlug === 'string' && settings.siteSlug) ||
    (typeof settings.slug === 'string' && settings.slug) ||
    null

  if (explicit) return slugify(explicit) || normalizeSiteSlug(explicit)

  const fromCandidates = deriveSiteSlugCandidates(site)[0]
  if (fromCandidates) return slugify(fromCandidates) || normalizeSiteSlug(fromCandidates)

  return normalizeSiteSlug(site.name) || normalizeSiteSlug(site.id)
}

function parseContactFromSettings(settings: SiteSettingsRecord): ProjectContactInfo {
  const nested =
    settings.contact && typeof settings.contact === 'object' && !Array.isArray(settings.contact)
      ? (settings.contact as Record<string, unknown>)
      : null

  return {
    phone: normalizeNullableString(nested?.phone ?? settings.phone),
    email: normalizeNullableString(nested?.email ?? settings.email),
    address: normalizeNullableString(nested?.address ?? settings.address),
    city: normalizeNullableString(nested?.city ?? settings.city),
    district: normalizeNullableString(nested?.district ?? settings.district),
  }
}

function mapSiteToProjectListItem(site: PanelSite): ProjectListItem {
  const settings = getSiteSettings(site)
  const template = normalizeNullableString(settings.template)
  const industry = normalizeNullableString(settings.industry)

  return {
    id: site.id,
    name: site.name,
    description:
      normalizeNullableString(site.settings?.seo_defaults?.description) ||
      normalizeNullableString(settings.description),
    template,
    industry: industry || OSGB_INDUSTRY,
    status: normalizeStatus(site.status),
    updatedAt: site.updated_at || new Date().toISOString(),
  }
}

async function mapSiteToProjectDetail(site: PanelSite): Promise<ProjectDetail> {
  const settings = getSiteSettings(site)
  const pages = await listPanelPages(site.id)

  return {
    id: site.id,
    name: site.name,
    slug: getPrimaryProjectSlug(site),
    description:
      normalizeNullableString(site.settings?.seo_defaults?.description) ||
      normalizeNullableString(settings.description),
    template: normalizeNullableString(settings.template),
    industry: normalizeNullableString(settings.industry) || OSGB_INDUSTRY,
    contact: parseContactFromSettings(settings),
    status: normalizeStatus(site.status),
    progress: pages.items.length > 0 ? 65 : 0,
    createdAt: site.created_at || new Date().toISOString(),
    updatedAt: site.updated_at || new Date().toISOString(),
    domain: site.primary_domain ? { id: site.id, name: site.primary_domain } : null,
    pagesCount: pages.items.length,
    generatedContentsCount: pages.items.length,
  }
}

function lexicalText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const root = (value as { root?: { children?: unknown[] } }).root
  if (!root || !Array.isArray(root.children)) return ''

  const parts: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const rec = node as Record<string, unknown>
    if (typeof rec.text === 'string' && rec.text.trim()) {
      parts.push(rec.text.trim())
    }
    if (Array.isArray(rec.children)) {
      for (const child of rec.children) walk(child)
    }
  }

  for (const child of root.children) walk(child)
  return parts.join(' ').trim()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function extractHtmlFromBlocks(blocks: RevisionBlock[]): string {
  const contentBlock = blocks.find((block) => block.type === 'content')
  if (!contentBlock) {
    const hero = blocks.find((block) => block.type === 'hero')
    if (hero) {
      const title = typeof hero.props.title === 'string' ? hero.props.title : ''
      const subtitle = typeof hero.props.subtitle === 'string' ? hero.props.subtitle : ''
      return [title, subtitle].filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join('\n')
    }
    return ''
  }

  const text = contentBlock.props.text
  if (typeof text === 'string') return text

  const lexical = lexicalText(text)
  if (!lexical) return ''
  return `<p>${escapeHtml(lexical)}</p>`
}

function normalizeRevisionBlocks(value: unknown): RevisionBlock[] {
  if (!Array.isArray(value)) return []

  const normalized: RevisionBlock[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue

    const rec = item as Record<string, unknown>
    if (typeof rec.type !== 'string' || !rec.type.trim()) continue

    const props =
      rec.props && typeof rec.props === 'object' && !Array.isArray(rec.props)
        ? (rec.props as Record<string, unknown>)
        : {}

    const block: RevisionBlock = {
      type: rec.type,
      props,
    }

    if (typeof rec.id === 'string' && rec.id.trim()) {
      block.id = rec.id
    }

    normalized.push(block)
  }

  return normalized
}

async function resolvePageBlocks(page: PanelPage): Promise<RevisionBlock[]> {
  const fromPageBlocks = normalizeRevisionBlocks((page as Record<string, unknown>).blocks)
  if (fromPageBlocks.length > 0) return fromPageBlocks

  const fromPageContent = normalizeRevisionBlocks((page as Record<string, unknown>).content)
  if (fromPageContent.length > 0) return fromPageContent

  const revisionId =
    page.published_revision_id || page.staging_revision_id || page.draft_revision_id || null
  if (!revisionId) return []

  const revisions = await listPanelPageRevisions(page.id).catch(() => null)
  if (revisions) {
    const found = revisions.items.find((revision) => revision.id === revisionId)
    if (found) {
      const normalized = normalizeRevisionBlocks(found.blocks)
      if (normalized.length > 0) return normalized
    }
  }

  const singleRevision = await getPanelPageRevision(page.id, revisionId).catch(() => null)
  if (!singleRevision) return []

  return normalizeRevisionBlocks(singleRevision.blocks)
}

function mapPageForEditor(page: PanelPage, blocks: RevisionBlock[]): ProjectEditorPage {
  return {
    id: page.id,
    name: page.title,
    slug: toEditorSlug(page.slug),
    content: extractHtmlFromBlocks(blocks),
    updatedAt: new Date().toISOString(),
  }
}

async function buildUniqueSiteSlug(name: string): Promise<string> {
  const base = slugify(name) || 'site'
  const sites = await listPanelSites()
  const taken = new Set(
    sites.items.flatMap((site) => deriveSiteSlugCandidates(site).map((candidate) => slugify(candidate)))
  )

  if (!taken.has(base)) return base

  let suffix = 1
  while (suffix < 1000) {
    const candidate = `${base}-${suffix}`
    if (!taken.has(candidate)) return candidate
    suffix += 1
  }

  return `${base}-${Date.now()}`
}

async function createPanelSite(input: {
  name: string
  slug: string
  description?: string | null
  template: string
  industry: string
  contact: ProjectContactInfo
}): Promise<PanelSite> {
  const settings = cleanUndefined({
    site_slug: input.slug,
    template: input.template,
    industry: input.industry,
    theme: mapTemplateToTheme(input.template),
    description: input.description || undefined,
    contact: cleanUndefined({
      phone: input.contact.phone || undefined,
      email: input.contact.email || undefined,
      address: input.contact.address || undefined,
      city: input.contact.city || undefined,
      district: input.contact.district || undefined,
    }),
    seo_defaults: cleanUndefined({
      description: input.description || undefined,
    }),
  })

  const payload = cleanUndefined({
    name: input.name,
    primary_domain: null,
    settings,
  })

  const createPayload = z
    .object({
      name: z.string(),
      primary_domain: z.string().nullable().optional(),
      settings: z.record(z.unknown()).optional(),
    })
    .parse(payload)

  const raw = await requestPanel('/sites', {
    method: 'POST',
    body: createPayload,
  })

  return extractSingle(raw, siteSchema)
}

async function updatePanelSite(siteId: string, patch: {
  name?: string
  settings?: Record<string, unknown>
  primary_domain?: string | null
  status?: 'draft' | 'staging' | 'published'
}): Promise<PanelSite> {
  const parsed = z
    .object({
      name: z.string().optional(),
      settings: z.record(z.unknown()).optional(),
      primary_domain: z.string().nullable().optional(),
      status: z.enum(['draft', 'staging', 'published']).optional(),
    })
    .parse(cleanUndefined(patch))

  const raw = await requestPanel(`/sites/${encodeURIComponent(siteId)}`, {
    method: 'PATCH',
    body: parsed,
  })

  return extractSingle(raw, siteSchema)
}

async function createPanelPage(input: z.input<typeof pageCreateSchema>): Promise<PanelPage> {
  const payload = pageCreateSchema.parse({
    ...input,
    slug: normalizePageSlug(input.slug),
  })

  const raw = await requestPanel('/pages', {
    method: 'POST',
    body: payload,
  })

  return extractSingle(raw, pageSchema)
}

async function updatePanelPage(
  pageId: string,
  patch: z.input<typeof pagePatchSchema>
): Promise<PanelPage> {
  const payload = pagePatchSchema.parse({
    ...patch,
    slug: typeof patch.slug === 'string' ? normalizePageSlug(patch.slug) : undefined,
  })

  const raw = await requestPanel(`/pages/${encodeURIComponent(pageId)}`, {
    method: 'PATCH',
    body: payload,
  })

  return extractSingle(raw, pageSchema)
}

async function createPageRevision(
  pageId: string,
  blocks: Array<{ blockType: string; [key: string]: unknown }>
): Promise<z.output<typeof pageRevisionSchema>> {
  const normalizedBlocks = blocks.map((block) => {
    const { blockType, ...props } = block
    return {
      type: blockType,
      props,
    }
  })

  const payload = createRevisionRequestSchema.parse({
    blocks: normalizedBlocks,
  })

  const raw = await requestPanel(`/pages/${encodeURIComponent(pageId)}/revisions`, {
    method: 'POST',
    body: payload,
  })

  return extractSingle(raw, pageRevisionSchema)
}

function buildDefaultPages(input: z.infer<typeof generationSchema>): GeneratedPageTemplate[] {
  const companyName = input.companyName.trim()
  const description = input.description.trim()

  const serviceItems = (input.services || '')
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8)

  const services =
    serviceItems.length > 0
      ? serviceItems
      : ['Is Guvenligi Uzmanligi', 'Is Yeri Hekimligi', 'Risk Degerlendirmesi', 'ISG Egitimi']

  const serviceCards = services.map((title) => ({
    icon:
      title.toLowerCase().includes('hekim')
        ? 'Stethoscope'
        : title.toLowerCase().includes('egitim')
          ? 'GraduationCap'
          : title.toLowerCase().includes('risk')
            ? 'FileCheck'
            : 'Shield',
    title,
    description: 'Mevzuata uygun planlama, saha uygulamasi ve duzenli raporlama hizmeti.',
  }))

  const serviceListHtml = services.map((service) => `<li>${escapeHtml(service)}</li>`).join('\n')

  const homepageHtml = `<p>${escapeHtml(description)}</p>
<h2>Hizmet Kapsami</h2>
<ul>
${serviceListHtml}
</ul>
<p>Isletmenize uygun OSGB sureclerini hizli ve izlenebilir sekilde yonetiyoruz.</p>`

  const aboutHtml = `<p>${escapeHtml(companyName)} olarak sahada uygulanabilir ve denetime hazir ISG surecleri kuruyoruz.</p>
<p>${escapeHtml(description)}</p>
<h2>Misyon</h2>
<p>Calisan sagligini koruyan ve is kazalarini azaltan sistemleri kalici hale getirmek.</p>`

  const servicesHtml = `<p>Hizmetlerimizi sektor, tehlike sinifi ve calisan sayisina gore planlariz.</p>
<ul>
${serviceListHtml}
</ul>`

  const contactHtml = `<p>Detayli bilgi ve teklif icin bize ulasin.</p>
<p><strong>Telefon:</strong> ${escapeHtml(input.phone || 'Belirtilmedi')}</p>
<p><strong>E-posta:</strong> ${escapeHtml(input.email || 'Belirtilmedi')}</p>
<p><strong>Adres:</strong> ${escapeHtml(input.address || 'Belirtilmedi')}</p>`

  return [
    {
      title: 'Ana Sayfa',
      slug: '/',
      seoTitle: `${companyName} | Ana Sayfa`,
      seoDescription: description,
      blocks: [
        {
          blockType: 'hero',
          title: companyName,
          subtitle: description,
          ctaText: 'Ucretsiz Danismanlik',
          ctaLink: '/iletisim',
          stats: [
            { value: '15+', label: 'Yil Deneyim', icon: 'Award' },
            { value: '1000+', label: 'Is Yeri', icon: 'Shield' },
            { value: '50000+', label: 'Calisan', icon: 'Users' },
          ],
        },
        {
          blockType: 'services',
          sectionTitle: 'Hizmetlerimiz',
          sectionSubtitle: 'OSGB surecleriniz icin uc uca destek',
          items: serviceCards,
        },
        {
          blockType: 'about',
          title: `${companyName} Hakkinda`,
          description: aboutHtml,
          highlights: [
            'Mevzuata uyum odakli surec',
            'Sahada uygulanabilir planlar',
            'Duzenli raporlama ve takip',
          ],
          experienceYears: 15,
        },
        {
          blockType: 'cta',
          title: 'Denetime Hazir Surecler',
          subtitle: 'Isletmenize uygun yol haritasi icin hemen iletisime gecin.',
          buttonText: 'Teklif Al',
        },
        {
          blockType: 'content',
          text: homepageHtml,
        },
      ],
    },
    {
      title: 'Hakkimizda',
      slug: '/hakkimizda',
      seoTitle: `${companyName} | Hakkimizda`,
      seoDescription: `${companyName} hakkinda bilgiler`,
      blocks: [
        {
          blockType: 'hero',
          title: 'Hakkimizda',
          subtitle: `${companyName} hakkinda daha fazla bilgi`,
          ctaText: 'Iletisim',
          ctaLink: '/iletisim',
        },
        {
          blockType: 'content',
          text: aboutHtml,
        },
      ],
    },
    {
      title: 'Hizmetler',
      slug: '/hizmetler',
      seoTitle: `${companyName} | Hizmetler`,
      seoDescription: `${companyName} hizmet detaylari`,
      blocks: [
        {
          blockType: 'hero',
          title: 'Hizmetlerimiz',
          subtitle: 'Isletmenize ozel planlanan OSGB kapsamimiz',
          ctaText: 'Teklif Al',
          ctaLink: '/iletisim',
        },
        {
          blockType: 'services',
          sectionTitle: 'Hizmet Basliklari',
          sectionSubtitle: 'Ihtiyaciniza gore olceklendirilebilir kapsama sahip',
          items: serviceCards,
        },
        {
          blockType: 'content',
          text: servicesHtml,
        },
      ],
    },
    {
      title: 'Iletisim',
      slug: '/iletisim',
      seoTitle: `${companyName} | Iletisim`,
      seoDescription: `${companyName} ile iletisime gecin`,
      blocks: [
        {
          blockType: 'hero',
          title: 'Iletisim',
          subtitle: 'Sorulariniz ve teklif talepleriniz icin bize ulasin',
          ctaText: 'Hemen Ulasin',
          ctaLink: '/iletisim',
        },
        {
          blockType: 'content',
          text: contactHtml,
        },
      ],
    },
  ]
}

async function getPagePreferredRevisionId(page: PanelPage): Promise<string | null> {
  if (page.draft_revision_id) return page.draft_revision_id
  if (page.staging_revision_id) return page.staging_revision_id
  if (page.published_revision_id) return page.published_revision_id

  const revisions = await listPanelPageRevisions(page.id).catch(() => null)
  if (!revisions || revisions.items.length === 0) return null
  return revisions.items[0]?.id || null
}

function statusForPanel(value: string | null | undefined): z.infer<typeof pageStatusDraftOrPublishedSchema> {
  const normalized = (value || '').toLowerCase()
  return normalized === 'published' ? 'published' : 'draft'
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const sites = await listPanelSites()
  return sites.items.map(mapSiteToProjectListItem)
}

export async function createProject(input: unknown): Promise<ProjectDetail> {
  const payload = projectCreateSchema.parse(input)
  const slug = await buildUniqueSiteSlug(payload.name)
  const template = normalizeOsgbTemplateId(payload.template || DEFAULT_OSGB_TEMPLATE)

  const contact: ProjectContactInfo = {
    phone: normalizeNullableString(payload.contact?.phone),
    email: normalizeNullableString(payload.contact?.email),
    address: normalizeNullableString(payload.contact?.address),
    city: normalizeNullableString(payload.contact?.city),
    district: normalizeNullableString(payload.contact?.district),
  }

  const site = await createPanelSite({
    name: payload.name,
    slug,
    description: normalizeNullableString(payload.description),
    template,
    industry: payload.industry || OSGB_INDUSTRY,
    contact,
  })

  return mapSiteToProjectDetail(site)
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const site = await getPanelSiteById(id).catch(() => null)
  if (!site) return null
  return mapSiteToProjectDetail(site)
}

export async function listProjectPages(projectId: string): Promise<ProjectEditorPage[]> {
  const pages = await listPanelPages(projectId)

  return Promise.all(
    pages.items
      .filter((page) => !page.deleted_at)
      .map(async (page) => {
        const blocks = await resolvePageBlocks(page)
        return mapPageForEditor(page, blocks)
      })
  )
}

export async function generateProjectPages(
  projectId: string,
  input: unknown
): Promise<ProjectEditorPage[]> {
  const payload = generationSchema.parse(input)
  const site = await getPanelSiteById(projectId).catch(() => null)

  if (!site) {
    throw new Error('Proje bulunamadi')
  }

  const templates = buildDefaultPages(payload)
  const existingPages = await listPanelPages(projectId)
  const pageBySlug = new Map(existingPages.items.map((page) => [normalizePageSlug(page.slug), page]))

  for (const template of templates) {
    const slug = normalizePageSlug(template.slug)
    const existing = pageBySlug.get(slug)

    const seo = cleanUndefined({
      title: template.seoTitle,
      description: template.seoDescription,
    })

    let page: PanelPage
    if (existing) {
      page = await updatePanelPage(existing.id, {
        title: template.title,
        slug,
        status: 'draft',
        seo,
      })
    } else {
      page = await createPanelPage({
        site_id: projectId,
        title: template.title,
        slug,
        status: 'draft',
        seo,
      })
      pageBySlug.set(slug, page)
    }

    const revision = await createPageRevision(page.id, template.blocks)

    await updatePanelPage(page.id, {
      status: 'draft',
      draft_revision_id: revision.id,
    }).catch(() => undefined)
  }

  await updatePanelSite(projectId, {
    status: 'draft',
  }).catch(() => undefined)

  return listProjectPages(projectId)
}

export async function publishProject(
  projectId: string,
  options: PublishProjectOptions = {}
): Promise<PublishProjectResult> {
  const site = await getPanelSiteById(projectId).catch(() => null)
  if (!site) {
    throw new Error('Proje bulunamadi')
  }

  const pages = await listPanelPages(projectId)

  const pagesForQuality = await Promise.all(
    pages.items.map(async (page) => {
      const blocks = await resolvePageBlocks(page)
      return {
        slug: page.slug,
        status: page.status,
        content: extractHtmlFromBlocks(blocks),
      }
    })
  )

  const qualityGate = evaluatePublishQualityGate({
    qaScore: options.qaScore,
    threshold: options.minQaScore,
    force: options.force,
    requireScore: options.requireQaScore,
    escalationLevel: options.escalationLevel,
    pages: pagesForQuality,
  })

  if (!qualityGate.passed) {
    throw new Error(
      `${qualityGate.reason || 'Kalite kapisi gecilemedi'} (qaScore=${qualityGate.qaScore}, esik=${qualityGate.threshold})`
    )
  }

  let pagesPublished = 0
  const warmupPages: string[] = []

  for (const page of pages.items) {
    if (page.deleted_at) continue

    const revisionId = await getPagePreferredRevisionId(page)
    const currentStatus = statusForPanel(page.status)

    warmupPages.push(normalizePageSlug(page.slug))

    if (currentStatus === 'published' && page.published_revision_id) {
      continue
    }

    await updatePanelPage(page.id, {
      status: 'published',
      published_revision_id: revisionId || undefined,
    })

    pagesPublished += 1
  }

  const updatedSite = await updatePanelSite(projectId, {
    status: 'published',
  }).catch(() => site)

  const siteSlug = getPrimaryProjectSlug(updatedSite)
  const traceId = createWebhookTraceId()

  const webhook = await dispatchDemoPublishWebhook({
    siteSlug,
    siteId: updatedSite.id,
    pages: warmupPages,
    source: 'dashboard',
    traceId,
    siteStatus: 'published',
  })

  return {
    project: await mapSiteToProjectDetail(updatedSite),
    pagesPublished,
    webhook,
    qualityGate,
  }
}

export async function debugListRawPages(projectId: string): Promise<Array<z.output<typeof pageSchema>>> {
  const payload = await requestPanel(`/pages?site_id=${encodeURIComponent(projectId)}`)
  return extractList(payload, pageSchema)
}
