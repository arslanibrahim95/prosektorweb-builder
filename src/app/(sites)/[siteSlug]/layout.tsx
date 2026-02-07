import { notFound } from 'next/navigation';
import { getSiteData } from '@/features/sites/lib/site-data';
import { SiteHeader } from '@/features/sites/components/layout/SiteHeader';
import { SiteFooter } from '@/features/sites/components/layout/SiteFooter';

interface SiteLayoutProps {
  children: React.ReactNode;
  params: Promise<{ siteSlug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    return { title: 'Site Bulunamadi' };
  }

  return {
    title: siteData.settings.siteTitle || siteData.company.name,
    description: siteData.settings.siteDescription || `${siteData.company.name} - Is Sagligi ve Guvenligi Hizmetleri`,
    keywords: siteData.settings.keywords,
  };
}

export default async function SiteLayout({ children, params }: SiteLayoutProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    notFound();
  }

  const { project, company, settings, design, services } = siteData;

  return (
    <html lang="tr">
      <head>
        <style>{`
          :root {
            --color-primary: ${design.primaryColor};
            --color-secondary: ${design.secondaryColor};
            --color-accent: ${design.accentColor};
            --color-background: ${design.backgroundColor};
            --font-heading: ${design.fontHeading}, system-ui, sans-serif;
            --font-body: ${design.fontBody}, system-ui, sans-serif;
          }
          body {
            font-family: var(--font-body);
            background-color: var(--color-background);
          }
          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-heading);
          }
        `}</style>
        {design.faviconUrl && <link rel="icon" href={design.faviconUrl} />}
      </head>
      <body>
        <SiteHeader
          slug={project.slug}
          companyName={company.name}
          logoUrl={design.logoUrl || company.logoUrl}
          phone={settings.phone}
          email={settings.email}
        />
        <main>{children}</main>
        <SiteFooter
          slug={project.slug}
          companyName={company.name}
          phone={settings.phone}
          email={settings.email}
          address={settings.address}
          workingHours={settings.workingHours}
          socialMedia={settings.socialMedia}
          dynamicServices={services}
          footerDescription={settings.footerDescription}
        />
      </body>
    </html>
  );
}
