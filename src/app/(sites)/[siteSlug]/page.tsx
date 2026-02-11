import { notFound } from 'next/navigation';
import { getSiteData } from '@/features/sites/lib/site-data';
import { BlockRenderer } from '@/features/sites/components/BlockRenderer';
import { HeroSection } from '@/features/sites/components/sections/HeroSection';
import { ServicesSection } from '@/features/sites/components/sections/ServicesSection';
import { AboutSection } from '@/features/sites/components/sections/AboutSection';
import { CTASection } from '@/features/sites/components/sections/CTASection';

interface HomePageProps {
  params: Promise<{ siteSlug: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    notFound();
  }

  const { project, company, settings, contents, pages } = siteData;

  // Find homepage page data with blocks
  const homepageData = pages.find(
    (p) => p.slug === '/homepage' || p.slug === 'homepage' || p.slug === '/' || p.slug === ''
  );

  // If blocks exist, render dynamically
  if (homepageData && homepageData.blocks.length > 0) {
    return (
      <>
        {homepageData.blocks.map((block, index) => (
          <BlockRenderer
            key={`${block.blockType}-${index}`}
            block={block}
            slug={project.slug}
            siteData={siteData}
            themeId={siteData.design.theme}
          />
        ))}
      </>
    );
  }

  // Fallback: hardcoded sections for backward compatibility
  const homepageContent = contents['HOMEPAGE'];

  return (
    <>
      <HeroSection
        slug={project.slug}
        companyName={company.name}
        title={homepageContent?.title || undefined}
        subtitle={homepageContent?.metaDescription || undefined}
      />
      <ServicesSection slug={project.slug} />
      <AboutSection
        companyName={company.name}
        content={contents['ABOUT']?.content}
      />
      <CTASection slug={project.slug} phone={settings.phone} />
    </>
  );
}
