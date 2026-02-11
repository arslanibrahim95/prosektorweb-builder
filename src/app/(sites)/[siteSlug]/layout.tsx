import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getSiteData } from '@/features/sites/lib/site-data'
import { ThemedSiteHeader } from '@/features/sites/components/layout/ThemedSiteHeader'
import { ThemedSiteFooter } from '@/features/sites/components/layout/ThemedSiteFooter'
import { getSiteTheme } from '@/features/sites/themes/registry'

interface SiteLayoutProps {
  children: React.ReactNode
  params: Promise<{ siteSlug: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteSlug: string }>
}): Promise<Metadata> {
  const { siteSlug } = await params
  const siteData = await getSiteData(siteSlug)

  if (!siteData) {
    return { title: 'Site Bulunamadi' }
  }

  return {
    title: siteData.settings.siteTitle || siteData.company.name,
    description:
      siteData.settings.siteDescription ||
      `${siteData.company.name} - Is Sagligi ve Guvenligi Hizmetleri`,
    keywords: siteData.settings.keywords,
    icons: siteData.design.faviconUrl ? [{ url: siteData.design.faviconUrl }] : undefined,
  }
}

export default async function SiteLayout({ children, params }: SiteLayoutProps) {
  const { siteSlug } = await params
  const siteData = await getSiteData(siteSlug)

  if (!siteData) {
    notFound()
  }

  const { project, company, settings, design, services } = siteData
  const theme = getSiteTheme(design.theme)

  const headingColor = theme.tokens.headingColor
  const bodyColor = theme.tokens.bodyColor
  const surfaceColor = theme.tokens.surfaceColor

  return (
    <>
      <style>{`
        .site-root {
          --color-primary: ${design.primaryColor};
          --color-secondary: ${design.secondaryColor};
          --color-accent: ${design.accentColor};
          --color-background: ${design.backgroundColor};
          --color-surface: ${surfaceColor};
          --color-heading: ${headingColor};
          --color-body: ${bodyColor};
          --font-heading: ${design.fontHeading}, Georgia, serif;
          --font-body: ${design.fontBody}, system-ui, sans-serif;
          font-family: var(--font-body);
          background-color: var(--color-background);
          color: var(--color-body);
          min-height: 100vh;
        }
        .site-root h1,
        .site-root h2,
        .site-root h3,
        .site-root h4,
        .site-root h5,
        .site-root h6 {
          font-family: var(--font-heading);
          color: var(--color-heading);
        }
      `}</style>

      <div className={`site-root theme-${design.theme}`}>
        <ThemedSiteHeader
          slug={project.slug}
          companyName={company.name}
          logoUrl={design.logoUrl || company.logoUrl}
          phone={settings.phone}
          email={settings.email}
          themeId={design.theme}
        />

        <main>{children}</main>

        <ThemedSiteFooter
          slug={project.slug}
          companyName={company.name}
          phone={settings.phone}
          email={settings.email}
          address={settings.address}
          workingHours={settings.workingHours}
          socialMedia={settings.socialMedia}
          dynamicServices={services}
          footerDescription={settings.footerDescription}
          themeId={design.theme}
        />
      </div>
    </>
  )
}
