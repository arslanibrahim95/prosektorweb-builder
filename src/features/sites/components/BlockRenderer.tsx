import type { SiteData, PageBlock } from '../lib/site-data'
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

interface BlockRendererProps {
  block: PageBlock
  slug: string
  siteData: SiteData
}

export function BlockRenderer({ block, slug, siteData }: BlockRendererProps) {
  const { company, settings } = siteData
  const normalizeHighlights = (value: unknown): string[] | undefined => {
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

  const normalizeGalleryImages = (
    value: unknown,
  ): Array<{
    image: { url: string }
    caption?: string
  }> => {
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
