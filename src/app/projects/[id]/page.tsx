'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Sparkles,
  Upload,
  RefreshCcw,
  CircleCheck,
  CircleAlert,
  Globe,
  FileText,
  Phone,
  Mail,
} from 'lucide-react'
import { getOsgbTemplateLabel, OSGB_INDUSTRY } from '@/features/projects/lib/osgb'

interface ProjectDetail {
  id: string
  name: string
  slug: string
  description: string | null
  template: string | null
  industry: string | null
  contact?: {
    phone: string | null
    email: string | null
    address: string | null
    city: string | null
    district: string | null
  }
  status: string
  progress: number
  createdAt: string
  updatedAt: string
  domain: { id: string; name: string } | null
  pagesCount: number
  generatedContentsCount: number
  uiSettings: ProjectUiSettings
}

interface ProjectNavigationLink {
  label: string
  href: string
}

interface ProjectThemeTokens {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  fontHeading: string
  fontBody: string
}

interface ProjectPageLayoutConfig {
  sectionOrder: string[]
  hiddenSections: string[]
}

interface ProjectLayoutConfig {
  pages: Record<string, ProjectPageLayoutConfig>
}

interface ProjectUiSettings {
  navigationLinks: ProjectNavigationLink[]
  footerLinks: ProjectNavigationLink[]
  headerCtaLabel: string | null
  headerCtaHref: string | null
  themeTokens: ProjectThemeTokens
  layoutConfig: ProjectLayoutConfig
  sectionVariants: Record<string, string>
}

interface ProjectUiDraft {
  navigationLinks: ProjectNavigationLink[]
  footerLinks: ProjectNavigationLink[]
  headerCtaLabel: string
  headerCtaHref: string
  themeTokens: ProjectThemeTokens
  layoutConfig: ProjectLayoutConfig
  sectionVariants: Record<string, string>
}

interface ProjectPage {
  id: string
  name: string
  slug: string
  content: string
  updatedAt: string
}

interface PublishResponse {
  success: boolean
  version?: string
  code?: string
  error?: string
  project?: ProjectDetail
  pagesPublished?: number
  qualityGate?: {
    qaScore: number
    threshold: number
    escalationLevel: 'none' | 'low' | 'medium' | 'high'
    forced: boolean
  }
  approval?: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'
    approvedVotes: number
    receivedVotes: number
    threshold: number
    reason?: string | null
  }
  webhook?: {
    ok: boolean
    skipped?: boolean
    warning?: string
    traceId?: string
  }
}

const DEFAULT_NAVIGATION_LINKS: ProjectNavigationLink[] = [
  { label: 'Ana Sayfa', href: '/' },
  { label: 'Hakkimizda', href: '/hakkimizda' },
  { label: 'Hizmetler', href: '/hizmetler' },
  { label: 'Blog', href: '/blog' },
  { label: 'Iletisim', href: '/iletisim' },
]

const EDITABLE_PAGE_SLUGS = ['/', '/hakkimizda', '/hizmetler', '/iletisim', '/blog']
const SECTION_TYPE_ORDER = [
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

const SECTION_VARIANT_OPTIONS: Record<string, string[]> = {
  hero: ['default', 'spotlight', 'compact'],
  services: ['cards', 'list', 'compact'],
  about: ['default', 'card'],
  cta: ['banner', 'minimal'],
  contact: ['default', 'compact'],
}

const DEFAULT_THEME_TOKENS: ProjectThemeTokens = {
  primaryColor: '#0f6ad7',
  secondaryColor: '#0b4ca4',
  accentColor: '#f59e0b',
  backgroundColor: '#f6f8fb',
  fontHeading: 'Sora',
  fontBody: 'Manrope',
}

const DEFAULT_SECTION_VARIANTS: Record<string, string> = {
  hero: 'default',
  services: 'cards',
  about: 'default',
  cta: 'banner',
  contact: 'default',
}

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function buildDefaultLayoutConfig(): ProjectLayoutConfig {
  return {
    pages: EDITABLE_PAGE_SLUGS.reduce<Record<string, ProjectPageLayoutConfig>>((acc, slug) => {
      acc[slug] = {
        sectionOrder: [...SECTION_TYPE_ORDER],
        hiddenSections: [],
      }
      return acc
    }, {}),
  }
}

function cloneLinks(links: ProjectNavigationLink[]): ProjectNavigationLink[] {
  return links.map((link) => ({ ...link }))
}

function cloneLayoutConfig(layoutConfig: ProjectLayoutConfig): ProjectLayoutConfig {
  const pages = Object.entries(layoutConfig.pages).reduce<Record<string, ProjectPageLayoutConfig>>(
    (acc, [slug, value]) => {
      acc[slug] = {
        sectionOrder: [...value.sectionOrder],
        hiddenSections: [...value.hiddenSections],
      }
      return acc
    },
    {}
  )
  return { pages }
}

function sanitizeHref(value: string): string {
  const raw = value.trim()
  if (!raw) return ''
  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:')
  ) {
    return raw
  }
  if (raw.startsWith('#')) return raw
  if (raw === '/') return '/'
  if (raw.startsWith('/')) return raw
  return `/${raw.replace(/^\/+/, '')}`
}

function sanitizeLinks(
  links: ProjectNavigationLink[],
  sectionName: string
): { links: ProjectNavigationLink[]; error: string | null } {
  const normalized = links
    .map((link, index) => {
      const label = link.label.trim()
      const href = sanitizeHref(link.href)
      if (!label) {
        throw new Error(`${sectionName} satir ${index + 1}: Baslik bos olamaz.`)
      }
      if (!href) {
        throw new Error(`${sectionName} satir ${index + 1}: Link bos olamaz.`)
      }
      return { label, href }
    })
    .filter((link) => Boolean(link.label && link.href))

  if (normalized.length === 0) {
    return { links: [], error: `${sectionName} icin en az bir link girin.` }
  }

  return { links: normalized, error: null }
}

function normalizeThemeTokens(value: ProjectThemeTokens | null | undefined): ProjectThemeTokens {
  if (!value) return { ...DEFAULT_THEME_TOKENS }
  return {
    primaryColor: value.primaryColor || DEFAULT_THEME_TOKENS.primaryColor,
    secondaryColor: value.secondaryColor || DEFAULT_THEME_TOKENS.secondaryColor,
    accentColor: value.accentColor || DEFAULT_THEME_TOKENS.accentColor,
    backgroundColor: value.backgroundColor || DEFAULT_THEME_TOKENS.backgroundColor,
    fontHeading: value.fontHeading || DEFAULT_THEME_TOKENS.fontHeading,
    fontBody: value.fontBody || DEFAULT_THEME_TOKENS.fontBody,
  }
}

function normalizeLayoutConfig(value: ProjectLayoutConfig | null | undefined): ProjectLayoutConfig {
  const fallback = buildDefaultLayoutConfig()
  if (!value?.pages) return fallback

  const pages = { ...fallback.pages }
  for (const slug of EDITABLE_PAGE_SLUGS) {
    const page = value.pages[slug]
    if (!page) continue
    const sectionOrder = page.sectionOrder.filter((item) => SECTION_TYPE_ORDER.includes(item))
    const hiddenSections = page.hiddenSections.filter((item) => SECTION_TYPE_ORDER.includes(item))
    pages[slug] = {
      sectionOrder: sectionOrder.length > 0 ? sectionOrder : [...SECTION_TYPE_ORDER],
      hiddenSections,
    }
  }
  return { pages }
}

function createUiDraftFromSettings(uiSettings?: ProjectUiSettings): ProjectUiDraft {
  return {
    navigationLinks: cloneLinks(uiSettings?.navigationLinks?.length ? uiSettings.navigationLinks : DEFAULT_NAVIGATION_LINKS),
    footerLinks: cloneLinks(uiSettings?.footerLinks?.length ? uiSettings.footerLinks : DEFAULT_NAVIGATION_LINKS),
    headerCtaLabel: uiSettings?.headerCtaLabel || '',
    headerCtaHref: uiSettings?.headerCtaHref || '/iletisim',
    themeTokens: normalizeThemeTokens(uiSettings?.themeTokens),
    layoutConfig: normalizeLayoutConfig(uiSettings?.layoutConfig),
    sectionVariants: {
      ...DEFAULT_SECTION_VARIANTS,
      ...(uiSettings?.sectionVariants || {}),
    },
  }
}

function pageSlugLabel(slug: string): string {
  const labels: Record<string, string> = {
    '/': 'Ana Sayfa',
    '/hakkimizda': 'Hakkimizda',
    '/hizmetler': 'Hizmetler',
    '/iletisim': 'Iletisim',
    '/blog': 'Blog',
  }
  return labels[slug] || slug
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const projectId = params.id

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [pages, setPages] = useState<ProjectPage[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [savingUiSettings, setSavingUiSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [uiDraft, setUiDraft] = useState<ProjectUiDraft>(() => createUiDraftFromSettings())

  const publishedCount = useMemo(
    () => pages.filter((page) => page.content && page.content.trim().length > 0).length,
    [pages]
  )

  function updateLink(
    section: 'navigationLinks' | 'footerLinks',
    index: number,
    field: 'label' | 'href',
    value: string
  ) {
    setUiDraft((current) => {
      const links = current[section].map((item) => ({ ...item }))
      if (!links[index]) return current
      links[index] = {
        ...links[index],
        [field]: value,
      }
      return {
        ...current,
        [section]: links,
      }
    })
  }

  function addLink(section: 'navigationLinks' | 'footerLinks') {
    setUiDraft((current) => ({
      ...current,
      [section]: [...current[section], { label: '', href: '' }],
    }))
  }

  function removeLink(section: 'navigationLinks' | 'footerLinks', index: number) {
    setUiDraft((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function updateThemeToken(field: keyof ProjectThemeTokens, value: string) {
    setUiDraft((current) => ({
      ...current,
      themeTokens: {
        ...current.themeTokens,
        [field]: value,
      },
    }))
  }

  function moveSection(slug: string, sectionType: string, direction: -1 | 1) {
    setUiDraft((current) => {
      const pageConfig = current.layoutConfig.pages[slug]
      if (!pageConfig) return current

      const order = [...pageConfig.sectionOrder]
      const index = order.indexOf(sectionType)
      if (index < 0) return current
      const targetIndex = index + direction
      if (targetIndex < 0 || targetIndex >= order.length) return current
      ;[order[index], order[targetIndex]] = [order[targetIndex], order[index]]

      return {
        ...current,
        layoutConfig: {
          ...current.layoutConfig,
          pages: {
            ...current.layoutConfig.pages,
            [slug]: {
              ...pageConfig,
              sectionOrder: order,
            },
          },
        },
      }
    })
  }

  function toggleHiddenSection(slug: string, sectionType: string) {
    setUiDraft((current) => {
      const pageConfig = current.layoutConfig.pages[slug]
      if (!pageConfig) return current
      const hiddenSet = new Set(pageConfig.hiddenSections)
      if (hiddenSet.has(sectionType)) {
        hiddenSet.delete(sectionType)
      } else {
        hiddenSet.add(sectionType)
      }

      return {
        ...current,
        layoutConfig: {
          ...current.layoutConfig,
          pages: {
            ...current.layoutConfig.pages,
            [slug]: {
              ...pageConfig,
              hiddenSections: Array.from(hiddenSet),
            },
          },
        },
      }
    })
  }

  function updateSectionVariant(sectionType: string, variant: string) {
    setUiDraft((current) => ({
      ...current,
      sectionVariants: {
        ...current.sectionVariants,
        [sectionType]: variant,
      },
    }))
  }

  async function loadData() {
    const [projectRes, pagesRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`, { cache: 'no-store' }),
      fetch(`/api/projects/${projectId}/pages`, { cache: 'no-store' }),
    ])

    const [projectJson, pagesJson] = await Promise.all([projectRes.json(), pagesRes.json()])

    if (!projectRes.ok || !projectJson.success) {
      throw new Error(projectJson.error || 'Proje yuklenemedi')
    }

    if (!pagesRes.ok || !pagesJson.success) {
      throw new Error(pagesJson.error || 'Sayfalar yuklenemedi')
    }

    setProject(projectJson.project)
    setPages(Array.isArray(pagesJson.pages) ? pagesJson.pages : [])
  }

  useEffect(() => {
    let active = true

    async function run() {
      try {
        await loadData()
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Veriler yuklenemedi')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      active = false
    }
  }, [projectId])

  useEffect(() => {
    if (!project) return

    setUiDraft(createUiDraftFromSettings(project.uiSettings))
  }, [project])

  async function handleRefresh() {
    try {
      setRefreshing(true)
      setError(null)
      await loadData()
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Veriler yuklenemedi')
    } finally {
      setRefreshing(false)
    }
  }

  async function handlePublish() {
    try {
      setPublishing(true)
      setError(null)
      setMessage(null)

      const response = await fetch(`/api/projects/${projectId}/publish`, {
        method: 'POST',
      })

      const result = (await response.json()) as PublishResponse

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Yayinlama basarisiz')
      }

      if (result.project) {
        setProject(result.project)
      }

      await handleRefresh()

      const qaNote = result.qualityGate
        ? `QA ${result.qualityGate.qaScore}/${result.qualityGate.threshold} (${result.qualityGate.escalationLevel})`
        : 'QA notu yok'

      const webhookNote = result.webhook?.ok
        ? 'Webhook tamamlandi'
        : result.webhook?.warning || 'Webhook atlandi'

      const approvalNote = result.approval
        ? `AI approval ${result.approval.status} (${result.approval.approvedVotes}/${result.approval.receivedVotes}, esik=${result.approval.threshold})`
        : 'AI approval bilgisi yok'

      setMessage(`Yayinlama tamamlandi (${result.pagesPublished ?? 0} sayfa). ${qaNote}. ${approvalNote}. ${webhookNote}.`)
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'Yayinlama basarisiz')
    } finally {
      setPublishing(false)
    }
  }

  async function handleSaveUiSettings() {
    try {
      setSavingUiSettings(true)
      setError(null)
      setMessage(null)

      const navigation = sanitizeLinks(uiDraft.navigationLinks, 'Header menu')
      if (navigation.error) {
        throw new Error(navigation.error)
      }

      const footer = sanitizeLinks(uiDraft.footerLinks, 'Footer menu')
      if (footer.error) {
        throw new Error(footer.error)
      }

      for (const [label, color] of Object.entries({
        primaryColor: uiDraft.themeTokens.primaryColor,
        secondaryColor: uiDraft.themeTokens.secondaryColor,
        accentColor: uiDraft.themeTokens.accentColor,
        backgroundColor: uiDraft.themeTokens.backgroundColor,
      })) {
        if (!HEX_COLOR_REGEX.test(color.trim())) {
          throw new Error(`${label} icin gecerli HEX renk girin (ornek: #0f6ad7).`)
        }
      }

      if (!uiDraft.themeTokens.fontHeading.trim() || !uiDraft.themeTokens.fontBody.trim()) {
        throw new Error('Font alanlari bos birakilamaz.')
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uiSettings: {
            navigationLinks: navigation.links,
            footerLinks: footer.links,
            headerCtaLabel: uiDraft.headerCtaLabel.trim() || null,
            headerCtaHref: uiDraft.headerCtaHref.trim() || null,
            themeTokens: {
              ...uiDraft.themeTokens,
              primaryColor: uiDraft.themeTokens.primaryColor.trim(),
              secondaryColor: uiDraft.themeTokens.secondaryColor.trim(),
              accentColor: uiDraft.themeTokens.accentColor.trim(),
              backgroundColor: uiDraft.themeTokens.backgroundColor.trim(),
              fontHeading: uiDraft.themeTokens.fontHeading.trim(),
              fontBody: uiDraft.themeTokens.fontBody.trim(),
            },
            layoutConfig: cloneLayoutConfig(uiDraft.layoutConfig),
            sectionVariants: { ...uiDraft.sectionVariants },
          },
        }),
      })

      const result = (await response.json()) as {
        success: boolean
        error?: string
        project?: ProjectDetail
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'UI ayarlari kaydedilemedi')
      }

      if (result.project) {
        setProject(result.project)
      }

      setMessage('UI ayarlari kaydedildi. Degisiklikler publish sonrasi canliya yansir.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'UI ayarlari kaydedilemedi')
    } finally {
      setSavingUiSettings(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f172a] px-4 py-10 text-slate-200">
        Proje yukleniyor...
      </main>
    )
  }

  if (error && !project) {
    return (
      <main className="min-h-screen bg-[#0f172a] px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100">
          {error}
        </div>
      </main>
    )
  }

  if (!project) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Projelere don
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
            <p className="max-w-3xl text-slate-300">
              {project.description || 'Aciklama bulunmuyor.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/projects/${projectId}/generate`}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              <Sparkles className="h-4 w-4" />
              Icerik Uret
            </Link>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {publishing ? 'Yayinlaniyor...' : 'Yayinla'}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-500 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700/60"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Yenile
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-5 rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Sablon</p>
            <p className="mt-2 font-semibold text-white">{getOsgbTemplateLabel(project.template)}</p>
          </article>
          <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Sektor</p>
            <p className="mt-2 font-semibold text-white">{project.industry || OSGB_INDUSTRY}</p>
          </article>
          <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Sayfalar</p>
            <p className="mt-2 font-semibold text-white">{pages.length} toplam, {publishedCount} icerikli</p>
          </article>
          <article className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Durum</p>
            <p className="mt-2 font-semibold text-white">{project.status}</p>
          </article>
        </section>

        <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="mb-4 text-lg font-semibold">Iletisim Bilgileri</h2>
          <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-2">
            <p className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-cyan-300" />
              {project.contact?.phone || '-'}
            </p>
            <p className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-300" />
              {project.contact?.email || '-'}
            </p>
            <p className="inline-flex items-center gap-2 md:col-span-2">
              <Globe className="h-4 w-4 text-emerald-300" />
              {project.domain?.name || `${project.slug}.ornek-domain.com`}
            </p>
          </div>
        </section>

        <section className="mb-6 rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Panel UI Ayarlari</h2>
              <p className="text-xs text-slate-300">Menu, tema tokenlari ve sayfa yerlesimini bu panelden yonetin.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/projects/docs"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-500 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700/60"
              >
                Panel Docs
              </Link>
              <button
                onClick={handleSaveUiSettings}
                disabled={savingUiSettings}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
              >
                {savingUiSettings ? 'Kaydediliyor...' : 'UI Ayarlarini Kaydet'}
              </button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Header Menu Linkleri</h3>
                <button
                  type="button"
                  onClick={() => addLink('navigationLinks')}
                  className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800"
                >
                  Link Ekle
                </button>
              </div>
              <div className="space-y-2">
                {uiDraft.navigationLinks.map((link, index) => (
                  <div key={`nav-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(event) => updateLink('navigationLinks', index, 'label', event.target.value)}
                      className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                      placeholder="Baslik"
                    />
                    <input
                      type="text"
                      value={link.href}
                      onChange={(event) => updateLink('navigationLinks', index, 'href', event.target.value)}
                      className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                      placeholder="/hizmetler"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink('navigationLinks', index)}
                      disabled={uiDraft.navigationLinks.length <= 1}
                      className="rounded-lg border border-rose-400/40 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Footer Linkleri</h3>
                <button
                  type="button"
                  onClick={() => addLink('footerLinks')}
                  className="rounded-lg border border-slate-600 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-800"
                >
                  Link Ekle
                </button>
              </div>
              <div className="space-y-2">
                {uiDraft.footerLinks.map((link, index) => (
                  <div key={`footer-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(event) => updateLink('footerLinks', index, 'label', event.target.value)}
                      className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                      placeholder="Baslik"
                    />
                    <input
                      type="text"
                      value={link.href}
                      onChange={(event) => updateLink('footerLinks', index, 'href', event.target.value)}
                      className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                      placeholder="/iletisim"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink('footerLinks', index)}
                      disabled={uiDraft.footerLinks.length <= 1}
                      className="rounded-lg border border-rose-400/40 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-200">Header CTA Metni</span>
              <input
                type="text"
                value={uiDraft.headerCtaLabel}
                onChange={(event) =>
                  setUiDraft((current) => ({ ...current, headerCtaLabel: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                placeholder="Teklif Al"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-200">Header CTA Linki</span>
              <input
                type="text"
                value={uiDraft.headerCtaHref}
                onChange={(event) =>
                  setUiDraft((current) => ({ ...current, headerCtaHref: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                placeholder="/iletisim"
              />
            </label>
          </div>

          <article className="mt-5 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-100">Tema Tokenlari</h3>
            <div className="grid gap-3 lg:grid-cols-2">
              {(
                [
                  ['primaryColor', 'Ana Renk'],
                  ['secondaryColor', 'Ikincil Renk'],
                  ['accentColor', 'Vurgu Rengi'],
                  ['backgroundColor', 'Arkaplan'],
                ] as Array<[keyof ProjectThemeTokens, string]>
              ).map(([field, label]) => (
                <label key={field} className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
                  <span className="text-xs text-slate-300">{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={uiDraft.themeTokens[field]}
                      onChange={(event) => updateThemeToken(field, event.target.value)}
                      className="h-9 w-12 rounded border border-slate-600 bg-transparent"
                    />
                    <input
                      type="text"
                      value={uiDraft.themeTokens[field]}
                      onChange={(event) => updateThemeToken(field, event.target.value)}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                      placeholder="#0f6ad7"
                    />
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs text-slate-300">Heading Font</span>
                <input
                  type="text"
                  value={uiDraft.themeTokens.fontHeading}
                  onChange={(event) => updateThemeToken('fontHeading', event.target.value)}
                  className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                  placeholder="Sora"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs text-slate-300">Body Font</span>
                <input
                  type="text"
                  value={uiDraft.themeTokens.fontBody}
                  onChange={(event) => updateThemeToken('fontBody', event.target.value)}
                  className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                  placeholder="Manrope"
                />
              </label>
            </div>
          </article>

          <article className="mt-5 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-100">Sayfa Yerlesim Konfigi</h3>
            <div className="grid gap-4 lg:grid-cols-2">
              {EDITABLE_PAGE_SLUGS.map((slug) => {
                const pageConfig = uiDraft.layoutConfig.pages[slug] || {
                  sectionOrder: [...SECTION_TYPE_ORDER],
                  hiddenSections: [],
                }
                return (
                  <article key={slug} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                    <h4 className="mb-2 text-sm font-semibold text-white">{pageSlugLabel(slug)}</h4>
                    <div className="space-y-2">
                      {pageConfig.sectionOrder.map((sectionType, index) => (
                        <div
                          key={`${slug}-${sectionType}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-700 px-2.5 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium text-slate-100">{sectionType}</p>
                            {pageConfig.hiddenSections.includes(sectionType) && (
                              <p className="text-[11px] text-amber-300">Gizli</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => moveSection(slug, sectionType, -1)}
                              disabled={index === 0}
                              className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                            >
                              Yukari
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSection(slug, sectionType, 1)}
                              disabled={index === pageConfig.sectionOrder.length - 1}
                              className="rounded-md border border-slate-600 px-2 py-1 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                            >
                              Asagi
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleHiddenSection(slug, sectionType)}
                              className={`rounded-md border px-2 py-1 ${
                                pageConfig.hiddenSections.includes(sectionType)
                                  ? 'border-amber-300/60 text-amber-200'
                                  : 'border-slate-600 text-slate-200'
                              }`}
                            >
                              {pageConfig.hiddenSections.includes(sectionType) ? 'Goster' : 'Gizle'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </article>

          <article className="mt-5 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-100">Bolum Varyantlari</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(SECTION_VARIANT_OPTIONS).map(([sectionType, options]) => (
                <label key={sectionType} className="flex flex-col gap-2">
                  <span className="text-xs text-slate-300">{sectionType}</span>
                  <select
                    value={uiDraft.sectionVariants[sectionType] || options[0]}
                    onChange={(event) => updateSectionVariant(sectionType, event.target.value)}
                    className="rounded-lg border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                  >
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </article>

          <p className="mt-3 text-xs text-slate-400">
            Detayli kullanim: <code>docs/panel/site-settings-ui.md</code> ve panelde <code>/projects/docs</code>
          </p>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
          <h2 className="mb-4 text-lg font-semibold">Sayfalar</h2>
          {pages.length === 0 ? (
            <p className="text-sm text-slate-300">Sayfa bulunamadi. Icerik uretimi adimini calistirin.</p>
          ) : (
            <div className="space-y-2">
              {pages.map((page) => (
                <div key={page.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5">
                  <div>
                    <p className="font-medium text-white">{page.name}</p>
                    <p className="text-xs text-slate-400">/{page.slug || ''}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {page.content && page.content.trim().length > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">
                        <CircleCheck className="h-3.5 w-3.5" />
                        Icerik var
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-amber-100">
                        <CircleAlert className="h-3.5 w-3.5" />
                        Bos
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700 px-2 py-1 text-slate-200">
                      <FileText className="h-3.5 w-3.5" />
                      {new Date(page.updatedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
