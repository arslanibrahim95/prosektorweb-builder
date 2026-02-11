import Link from 'next/link'
import type { SiteData, PageBlock } from '../lib/site-data'
import { normalizeSiteThemeId } from '@/features/sites/themes/types'
import { HeroSection } from './sections/HeroSection'
import { ServicesSection } from './sections/ServicesSection'
import { AboutSection } from './sections/AboutSection'
import { CTASection } from './sections/CTASection'
import { FAQSection } from './sections/FAQSection'
import { TeamSection } from './sections/TeamSection'
import { StatsSection } from './sections/StatsSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { GallerySection } from './sections/GallerySection'
import { ContentBlock } from './sections/ContentBlock'
import { RichText } from './RichText'

interface BlockRendererProps {
  block: PageBlock
  slug: string
  siteData: SiteData
  themeId?: string
}

function normalizeHighlights(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const normalized = value
    .map((entry) => {
      if (typeof entry === 'string') return entry
      if (entry && typeof entry === 'object' && 'text' in entry) {
        const text = (entry as { text?: unknown }).text
        return typeof text === 'string' ? text : ''
      }
      return ''
    })
    .filter((entry) => entry.length > 0)

  return normalized.length > 0 ? normalized : undefined
}

function normalizeGalleryImages(
  value: unknown
): Array<{
  image: { url: string }
  caption?: string
}> {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null

      const imageFromNested =
        (entry as { image?: { url?: unknown } }).image?.url &&
        typeof (entry as { image?: { url?: unknown } }).image?.url === 'string'
          ? ((entry as { image?: { url: string } }).image as { url: string })
          : null

      if (imageFromNested) {
        return {
          caption:
            typeof (entry as { caption?: unknown }).caption === 'string'
              ? ((entry as { caption?: string }).caption as string)
              : undefined,
          image: imageFromNested,
        }
      }

      const imageUrl =
        typeof (entry as { imageUrl?: unknown }).imageUrl === 'string'
          ? ((entry as { imageUrl?: string }).imageUrl as string)
          : null

      if (!imageUrl) return null

      return {
        caption:
          typeof (entry as { caption?: unknown }).caption === 'string'
            ? ((entry as { caption?: string }).caption as string)
            : undefined,
        image: { url: imageUrl },
      }
    })
    .filter(Boolean) as Array<{ image: { url: string }; caption?: string }>
}

function toCtaLink(slug: string, raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return `/${slug}/iletisim`
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  if (raw.startsWith('/')) return `/${slug}${raw}`
  return `/${slug}/${raw.replace(/^\/+/, '')}`
}

function renderIndustrialBlock(block: PageBlock, slug: string, siteData: SiteData) {
  const { company, settings } = siteData

  switch (block.blockType) {
    case 'hero': {
      const title = typeof block.title === 'string' ? block.title : company.name
      const subtitle =
        typeof block.subtitle === 'string'
          ? block.subtitle
          : `${company.name} ile saha odakli is sagligi ve guvenligi surecleri.`

      return (
        <section className="relative overflow-hidden border-b border-white/10 bg-[#050b16] text-slate-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(14,165,233,0.28),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(249,115,22,0.2),transparent_35%)]" />
          <div className="container relative mx-auto px-4 py-24 md:py-28">
            <div className="max-w-3xl">
              <p className="mb-4 inline-flex rounded-md border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-200">
                OSGB Operational Layer
              </p>
              <h1 className="mb-5 text-4xl font-semibold leading-tight md:text-6xl">{title}</h1>
              <p className="mb-8 max-w-2xl text-lg text-slate-300">{subtitle}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={toCtaLink(slug, block.ctaLink)}
                  className="rounded-md bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {typeof block.ctaText === 'string' ? block.ctaText : 'Teklif Al'}
                </Link>
                <Link
                  href={`/${slug}/hizmetler`}
                  className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Hizmetleri Gor
                </Link>
              </div>
            </div>
          </div>
        </section>
      )
    }

    case 'services': {
      const services = Array.isArray(block.items)
        ? block.items
        : siteData.services.map((service) => ({ title: service.name, description: service.shortDescription }))

      return (
        <section className="bg-[#0b1220] py-20 text-slate-100">
          <div className="container mx-auto px-4">
            <div className="mb-10">
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                {typeof block.sectionTitle === 'string' ? block.sectionTitle : 'Hizmetlerimiz'}
              </h2>
              <p className="mt-3 max-w-2xl text-slate-300">
                {typeof block.sectionSubtitle === 'string'
                  ? block.sectionSubtitle
                  : 'Saha denetimleri, hekimlik ve mevzuat takibini tek cizgide yonetiyoruz.'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((item, index) => {
                const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
                const title = typeof record.title === 'string' ? record.title : `Hizmet ${index + 1}`
                const description = typeof record.description === 'string' ? record.description : ''

                return (
                  <article
                    key={`${title}-${index}`}
                    className="rounded-lg border border-white/10 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]/60"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                      OSGB
                    </p>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    {description && <p className="mt-2 text-sm text-slate-300">{description}</p>}
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )
    }

    case 'about': {
      const title = typeof block.title === 'string' ? block.title : `${company.name} Hakkinda`
      const description = block.description
      const highlights = normalizeHighlights(block.highlights)

      return (
        <section className="bg-[#111827] py-20 text-slate-100">
          <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article>
              <h2 className="mb-4 text-3xl font-semibold text-white md:text-4xl">{title}</h2>
              {description ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <RichText content={description} className="richtext max-w-none text-slate-100" />
                </div>
              ) : (
                <p className="text-slate-300">
                  {company.name} isletmelere uygun surecler kurgular, saha ve dokuman takibini duzenli raporlar.
                </p>
              )}
            </article>

            <article className="rounded-lg border border-white/10 bg-black/20 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">Saha Notlari</p>
              {highlights && highlights.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm text-slate-200">
                  {highlights.map((item) => (
                    <li key={item} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-300">Yasal uyum, denetim hazirligi ve surekli takip odakli calisma duzeni.</p>
              )}
              {settings.phone && (
                <p className="mt-6 text-sm text-slate-200">
                  Hizli erisim: <a className="font-semibold text-white" href={`tel:${settings.phone}`}>{settings.phone}</a>
                </p>
              )}
            </article>
          </div>
        </section>
      )
    }

    case 'cta': {
      return (
        <section className="bg-[#050b16] py-16 text-slate-100">
          <div className="container mx-auto px-4">
            <div className="rounded-xl border border-white/15 bg-[linear-gradient(120deg,rgba(249,115,22,0.14),rgba(14,165,233,0.12))] p-8 md:flex md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {typeof block.title === 'string' ? block.title : 'Denetime Hazir Surecler'}
                </h2>
                {typeof block.subtitle === 'string' && <p className="mt-2 text-slate-200">{block.subtitle}</p>}
              </div>
              <Link
                href={toCtaLink(slug, block.buttonLink || block.ctaLink)}
                className="mt-5 inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 md:mt-0"
              >
                {typeof block.buttonText === 'string' ? block.buttonText : 'Iletisime Gec'}
              </Link>
            </div>
          </div>
        </section>
      )
    }

    case 'content': {
      return (
        <section className="bg-[#0b1220] py-16 text-slate-100">
          <div className="container mx-auto px-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <RichText content={block.text} className="richtext max-w-none text-slate-100" />
            </div>
          </div>
        </section>
      )
    }

    default:
      return null
  }
}

function renderEditorialBlock(block: PageBlock, slug: string, siteData: SiteData) {
  const { company } = siteData

  switch (block.blockType) {
    case 'hero': {
      return (
        <section className="bg-[#fdfcf8] py-20">
          <div className="mx-auto max-w-5xl px-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{company.name}</p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-900 md:text-6xl">
              {typeof block.title === 'string' ? block.title : `${company.name} OSGB Hizmetleri`}
            </h1>
            <p className="mt-6 max-w-3xl text-lg text-slate-600">
              {typeof block.subtitle === 'string'
                ? block.subtitle
                : 'Is sagligi ve guvenligi sureclerini sakin, okunabilir ve olculebilir bir yapida sunuyoruz.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={toCtaLink(slug, block.ctaLink)}
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {typeof block.ctaText === 'string' ? block.ctaText : 'Bilgi Al'}
              </Link>
              <Link
                href={`/${slug}/hizmetler`}
                className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-800 hover:border-slate-500"
              >
                Hizmetler
              </Link>
            </div>
          </div>
        </section>
      )
    }

    case 'services': {
      const services = Array.isArray(block.items)
        ? block.items
        : siteData.services.map((service) => ({ title: service.name, description: service.shortDescription }))

      return (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-10 border-b border-slate-200 pb-6">
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                {typeof block.sectionTitle === 'string' ? block.sectionTitle : 'Hizmetler'}
              </h2>
              {typeof block.sectionSubtitle === 'string' && (
                <p className="mt-3 max-w-2xl text-slate-600">{block.sectionSubtitle}</p>
              )}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {services.map((item, index) => {
                const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
                const title = typeof record.title === 'string' ? record.title : `Hizmet ${index + 1}`
                const description = typeof record.description === 'string' ? record.description : ''

                return (
                  <article key={`${title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )
    }

    case 'about': {
      return (
        <section className="bg-[#fdfcf8] py-20">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              {typeof block.title === 'string' ? block.title : `${company.name} Hakkinda`}
            </h2>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              {block.description ? (
                <RichText content={block.description} className="prose max-w-none" />
              ) : (
                <p className="text-slate-600">
                  {company.name}, isletmelerin ihtiyacina gore planlanan is sagligi ve guvenligi hizmetleri sunar.
                </p>
              )}
            </div>
          </div>
        </section>
      )
    }

    case 'cta': {
      return (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">
                {typeof block.title === 'string' ? block.title : 'Iletisime Gecin'}
              </h2>
              {typeof block.subtitle === 'string' && <p className="mx-auto mt-2 max-w-2xl text-slate-600">{block.subtitle}</p>}
              <Link
                href={toCtaLink(slug, block.buttonLink || block.ctaLink)}
                className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
              >
                {typeof block.buttonText === 'string' ? block.buttonText : 'Mesaj Gonder'}
              </Link>
            </div>
          </div>
        </section>
      )
    }

    case 'content': {
      return (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-4xl px-4">
            <RichText content={block.text} className="prose max-w-none" />
          </div>
        </section>
      )
    }

    default:
      return null
  }
}

function renderDefaultBlock(block: PageBlock, slug: string, siteData: SiteData) {
  const { company, settings } = siteData

  switch (block.blockType) {
    case 'hero':
      return (
        <HeroSection
          slug={slug}
          companyName={company.name}
          title={block.title as string}
          subtitle={block.subtitle as string}
          ctaText={block.ctaText as string}
          ctaLink={block.ctaLink as string}
          stats={block.stats as Array<{ value: string; label: string; icon?: string }>}
        />
      )

    case 'services':
      return (
        <ServicesSection
          slug={slug}
          sectionTitle={block.sectionTitle as string}
          sectionSubtitle={block.sectionSubtitle as string}
          services={block.items as Array<{
            icon?: string
            title: string
            description?: string
            features?: string[]
          }>}
        />
      )

    case 'about':
      return (
        <AboutSection
          companyName={company.name}
          title={block.title as string}
          description={block.description}
          highlights={normalizeHighlights(block.highlights)}
          experienceYears={block.experienceYears as number}
        />
      )

    case 'cta':
      return (
        <CTASection
          slug={slug}
          phone={settings.phone}
          title={block.title as string}
          subtitle={block.subtitle as string}
          buttonText={block.buttonText as string}
        />
      )

    case 'faq':
      return (
        <FAQSection
          sectionTitle={block.sectionTitle as string}
          items={block.items as Array<{ question: string; answer: string }>}
        />
      )

    case 'team':
      return (
        <TeamSection
          sectionTitle={block.sectionTitle as string}
          members={block.members as Array<{
            name: string
            role?: string
            image?: { url: string } | null
            bio?: string
          }>}
        />
      )

    case 'stats':
      return (
        <StatsSection
          items={block.items as Array<{ value: string; label: string; icon?: string }>}
        />
      )

    case 'testimonials':
      return (
        <TestimonialsSection
          sectionTitle={block.sectionTitle as string}
          items={block.items as Array<{
            quote: string
            author: string
            company?: string
            image?: { url: string } | null
          }>}
        />
      )

    case 'gallery':
      return (
        <GallerySection
          sectionTitle={block.sectionTitle as string}
          images={normalizeGalleryImages(block.images)}
        />
      )

    case 'content':
      return <ContentBlock content={block.text} />

    default:
      return null
  }
}

export function BlockRenderer({ block, slug, siteData, themeId }: BlockRendererProps) {
  const resolvedTheme = normalizeSiteThemeId(themeId || siteData.design.theme)

  if (resolvedTheme === 'industrial-bold') {
    return renderIndustrialBlock(block, slug, siteData) || renderDefaultBlock(block, slug, siteData)
  }

  if (resolvedTheme === 'minimal-editorial') {
    return renderEditorialBlock(block, slug, siteData) || renderDefaultBlock(block, slug, siteData)
  }

  return renderDefaultBlock(block, slug, siteData)
}
