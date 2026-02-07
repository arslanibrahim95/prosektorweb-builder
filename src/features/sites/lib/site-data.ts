import type { Project, Page, Service, BlogPost } from '@/payload-types'
import { DashboardPublicSitePayloadSchema } from '@/features/dashboard/contracts'

// ── Types ──────────────────────────────────────────────────────

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
  id: number
  name: string
  slug: string
  shortDescription: string
}

export interface SiteData {
  project: {
    id: number
    name: string
    slug: string
    description: string | null
    industry: string | null
  }
  company: {
    id: number
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

// ── Helper: resolve uploaded media URL ─────────────────────────

function getMediaUrl(media: unknown): string | null {
  if (!media) return null
  if (typeof media === 'object' && media !== null && 'url' in media) {
    return (media as { url: string }).url
  }
  return null
}

const DASHBOARD_PUBLIC_API_BASE = process.env.DASHBOARD_PUBLIC_API_BASE?.replace(/\/$/, '') || ''

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

const normalizeSlug = (value: string | undefined | null): string => {
  if (!value) return '/'
  const cleaned = value
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  if (!cleaned) return '/'
  return `/${cleaned}`
}

const slugToContentKey = (slug: string): string => {
  const normalized = normalizeSlug(slug)
  if (normalized === '/') return 'HOMEPAGE'
  if (normalized === '/hakkimizda') return 'ABOUT'
  if (normalized === '/hizmetler') return 'SERVICES'
  if (normalized === '/iletisim') return 'CONTACT'
  if (normalized === '/blog') return 'BLOG'
  return normalized.replace(/^\//, '').replace(/[/-]+/g, '_').toUpperCase()
}

const toPageBlocks = (page: { puckData?: { content?: Array<{ props?: Record<string, unknown>; type?: string }> | null } | null }): PageBlock[] => {
  const content = Array.isArray(page.puckData?.content) ? page.puckData.content : []
  return content
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const type = typeof entry.type === 'string' ? entry.type : null
      if (!type || !ALLOWED_BLOCK_TYPES.has(type)) return null

      const props =
        entry.props && typeof entry.props === 'object' && !Array.isArray(entry.props)
          ? (entry.props as Record<string, unknown>)
          : {}

      return {
        blockType: type,
        ...props,
      }
    })
    .filter(Boolean) as PageBlock[]
}

const extractMainContent = (blocks: PageBlock[]): string => {
  const contentBlock = blocks.find((block) => block.blockType === 'content')
  if (!contentBlock) return ''
  const value = contentBlock.text
  return typeof value === 'string' ? value : ''
}

const mapSocialLinks = (settings: Array<{ platform?: string | null; url?: string | null }> | null | undefined) => {
  if (!Array.isArray(settings)) return null

  const byPlatform = settings.reduce((acc, link) => {
    const platform = typeof link.platform === 'string' ? link.platform.toLowerCase() : ''
    const url = typeof link.url === 'string' ? link.url : ''
    if (!platform || !url) return acc
    acc[platform] = url
    return acc
  }, {} as Record<string, string>)

  return {
    facebook: byPlatform.facebook,
    instagram: byPlatform.instagram,
    linkedin: byPlatform.linkedin,
    twitter: byPlatform.twitter,
    youtube: byPlatform.youtube,
  }
}

const getDashboardSiteData = async (slug: string): Promise<SiteData | null> => {
  if (!DASHBOARD_PUBLIC_API_BASE) return null

  const endpoint = `${DASHBOARD_PUBLIC_API_BASE}/api/public/sites/${encodeURIComponent(slug)}/pages`

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 30 },
    })

    if (!response.ok) {
      return null
    }

    const rawPayload = await response.json()
    const parsed = DashboardPublicSitePayloadSchema.safeParse(rawPayload)
    if (!parsed.success) {
      console.error('Dashboard public payload schema mismatch:', parsed.error.issues[0]?.message)
      return null
    }

    const payload = parsed.data
    if (payload.ok === false || !payload.site) return null

    const site = payload.site
    const settings = payload.settings ?? {}
    const contact =
      settings.contact && typeof settings.contact === 'object' ? settings.contact : null
    const pagesPayload = (Array.isArray(payload.pages) ? payload.pages : []).filter((page) => {
      const status = typeof page.status === 'string' ? page.status.toLowerCase() : ''
      return status === 'published'
    })

    const pages: SitePageData[] = pagesPayload.map((page) => {
      const normalizedSlug = normalizeSlug(page.slug)
      const blocks = toPageBlocks(page)

      return {
        blocks,
        keywords: [],
        metaDescription: typeof page.seoDescription === 'string' ? page.seoDescription : null,
        metaTitle:
          typeof page.seoTitle === 'string'
            ? page.seoTitle
            : typeof page.puckData?.root?.props?.title === 'string'
              ? page.puckData.root.props.title
              : typeof page.title === 'string'
                ? page.title
                : null,
        slug: normalizedSlug,
        title: typeof page.title === 'string' ? page.title : 'Sayfa',
      }
    })

    const contents = pages.reduce((acc, page) => {
      acc[slugToContentKey(page.slug)] = {
        content: extractMainContent(page.blocks),
        metaDescription: page.metaDescription,
        metaTitle: page.metaTitle,
        title: page.title,
      }
      return acc
    }, {} as SiteData['contents'])

    const homepage = pages.find((page) => page.slug === '/')

    return {
      company: {
        id: site.id || 0,
        logoUrl: null,
        name: site.name || slug,
      },
      contents,
      design: {
        accentColor: site.brandSecondary || '#1d6fa5',
        backgroundColor: '#ffffff',
        faviconUrl: null,
        fontBody: 'Inter',
        fontHeading: 'Inter',
        logoUrl: null,
        primaryColor: site.brandPrimary || '#0f4c81',
        secondaryColor: site.brandSecondary || '#1d6fa5',
      },
      pages,
      project: {
        description: site.description || null,
        id: site.id || 0,
        industry: null,
        name: site.name || slug,
        slug: site.slug || slug,
      },
      services: [],
      settings: {
        address: typeof contact?.address === 'string' ? contact.address : null,
        city: null,
        district: null,
        email: typeof contact?.email === 'string' ? contact.email : null,
        footerDescription: typeof settings.footerText === 'string' ? settings.footerText : null,
        keywords: [],
        mapEmbed: null,
        phone: typeof contact?.phone === 'string' ? contact.phone : null,
        phone2: null,
        siteDescription:
          typeof site.description === 'string'
            ? site.description
            : typeof settings.tagline === 'string'
              ? settings.tagline
              : null,
        siteTitle:
          typeof settings.siteTitle === 'string'
            ? settings.siteTitle
            : homepage?.metaTitle || site.name || slug,
        socialMedia: mapSocialLinks(settings.socialLinks),
        whatsapp: null,
        workingHours: null,
      },
    }
  } catch (error) {
    console.error('getDashboardSiteData error:', error)
    return null
  }
}

// ── Main: getSiteData ──────────────────────────────────────────

export async function getSiteData(slug: string): Promise<SiteData | null> {
  const dashboardData = await getDashboardSiteData(slug)
  if (dashboardData) return dashboardData

  try {
    const { getPayloadInstance } = await import('@/lib/payload')
    const payload = await getPayloadInstance()

    const projects = await payload.find({
      collection: 'projects',
      where: {
        slug: { equals: slug },
      },
      limit: 1,
      depth: 2,
    })

    if (projects.docs.length === 0) return null
    const project = projects.docs[0] as Project

    // Fetch pages with blocks
    const pagesResult = await payload.find({
      collection: 'pages',
      where: {
        project: { equals: project.id },
      },
      depth: 2,
    })

    // Map pages to SitePageData
    const pages: SitePageData[] = pagesResult.docs.map((page: Page) => ({
      slug: page.slug,
      title: page.title,
      metaTitle: page.metaTitle || null,
      metaDescription: page.metaDescription || null,
      keywords: page.keywords || [],
      blocks: (page.content || []) as PageBlock[],
    }))

    // Backward-compatible contents map
    const contents: SiteData['contents'] = {}
    for (const page of pagesResult.docs) {
      const p = page as Page
      const mainContent = p.content?.find(b => b.blockType === 'content') as
        | { text?: unknown }
        | undefined

      contents[p.slug.toUpperCase().replace('/', '') || 'HOMEPAGE'] = {
        title: p.title,
        content: (mainContent?.text as string) || '',
        metaTitle: p.metaTitle || p.title,
        metaDescription: p.metaDescription || '',
      }
    }

    // Fetch linked services
    const services: SiteServiceData[] = []
    const projectServices = project.services
    if (Array.isArray(projectServices) && projectServices.length > 0) {
      const serviceIds = projectServices.map(s =>
        typeof s === 'number' ? s : (s as Service).id
      )
      const servicesResult = await payload.find({
        collection: 'services',
        where: { id: { in: serviceIds } },
        limit: 50,
      })
      for (const svc of servicesResult.docs) {
        const s = svc as Service
        services.push({
          id: s.id,
          name: s.name,
          slug: s.slug,
          shortDescription: s.shortDescription,
        })
      }
    }

    return {
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description || null,
        industry: project.company?.sector || null,
      },
      company: {
        id: project.id,
        name: project.company?.name || project.name,
        logoUrl: getMediaUrl(project.company?.logo),
      },
      settings: {
        phone: project.contact?.phone || null,
        phone2: project.contact?.phone2 || null,
        whatsapp: project.contact?.whatsapp || null,
        email: project.contact?.email || null,
        address: project.contact?.address || null,
        city: project.contact?.city || null,
        district: project.contact?.district || null,
        workingHours: project.contact?.workingHours || null,
        mapEmbed: project.contact?.mapEmbed || null,
        socialMedia: {
          facebook: project.social?.facebook || undefined,
          instagram: project.social?.instagram || undefined,
          linkedin: project.social?.linkedin || undefined,
          twitter: project.social?.twitter || undefined,
          youtube: project.social?.youtube || undefined,
        },
        siteTitle: project.seoTitle || project.name,
        siteDescription: project.seoDescription || project.description || null,
        keywords: project.seoKeywords || [],
        footerDescription: project.footerDescription || null,
      },
      design: {
        primaryColor: project.design?.primaryColor || '#2563eb',
        secondaryColor: project.design?.secondaryColor || '#1e40af',
        accentColor: project.design?.accentColor || '#f59e0b',
        backgroundColor: project.design?.backgroundColor || '#ffffff',
        fontHeading: project.design?.fontHeading || 'Inter',
        fontBody: project.design?.fontBody || 'Inter',
        logoUrl: getMediaUrl(project.company?.logo),
        faviconUrl: project.faviconUrl || null,
      },
      pages,
      services,
      contents,
    }
  } catch (error) {
    console.error('getSiteData error (Payload):', error)
    return null
  }
}

// ── Blog Functions (Payload) ───────────────────────────────────

export async function getSiteBlogPosts(projectId: number | string, limit?: number) {
  try {
    const { getPayloadInstance } = await import('@/lib/payload')
    const payload = await getPayloadInstance()

    const result = await payload.find({
      collection: 'blog-posts',
      where: {
        project: { equals: Number(projectId) },
        status: { equals: 'published' },
      },
      sort: '-publishedAt',
      limit: limit || 10,
      depth: 1,
    })

    return result.docs as BlogPost[]
  } catch (error) {
    console.error('getSiteBlogPosts error:', error)
    return []
  }
}

export async function getSiteBlogPost(projectId: number | string, postSlug: string) {
  try {
    const { getPayloadInstance } = await import('@/lib/payload')
    const payload = await getPayloadInstance()

    const result = await payload.find({
      collection: 'blog-posts',
      where: {
        project: { equals: Number(projectId) },
        slug: { equals: postSlug },
        status: { equals: 'published' },
      },
      limit: 1,
      depth: 1,
    })

    return result.docs[0] as BlogPost | undefined
  } catch (error) {
    console.error('getSiteBlogPost error:', error)
    return undefined
  }
}
