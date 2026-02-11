import { notFound } from 'next/navigation';
import { getSiteData } from '@/features/sites/lib/site-data';
import { BlockRenderer } from '@/features/sites/components/BlockRenderer';
import { CTASection } from '@/features/sites/components/sections/CTASection';

interface HakkimizdaPageProps {
  params: Promise<{ siteSlug: string }>;
}

export async function generateMetadata({ params }: HakkimizdaPageProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    return { title: 'Hakkimizda' };
  }

  return {
    title: `Hakkimizda | ${siteData.company.name}`,
    description: siteData.contents['ABOUT']?.metaDescription || `${siteData.company.name} hakkinda bilgi edinin`,
  };
}

export default async function HakkimizdaPage({ params }: HakkimizdaPageProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    notFound();
  }

  const { project, company, settings, contents, pages } = siteData;
  const aboutContent = contents['ABOUT'];
  const aboutPageData = pages.find((p) => p.slug === '/hakkimizda');

  if (aboutPageData && aboutPageData.blocks.length > 0) {
    return (
      <>
        {aboutPageData.blocks.map((block, index) => (
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

  return (
    <>
      {/* Page Header */}
      <section className="py-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hakkimizda</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            {company.name} olarak is sagligi ve guvenligi alanindaki hikayemiz
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {aboutContent?.content ? (
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: aboutContent.content }}
              />
            ) : (
              <div className="prose prose-lg max-w-none">
                <p>
                  {company.name} olarak, is sagligi ve guvenligi alaninda uzun yillik
                  deneyimimizle hizmet vermekteyiz. Profesyonel ekibimiz ve guncel
                  yaklasimlarimizla isletmelerin guvenli calisma ortami olusturmasina
                  yardimci oluyoruz.
                </p>
                <h2>Vizyonumuz</h2>
                <p>
                  Is kazalarinin sifira indirildiği, tum calisanlarin saglikli ve guvenli
                  bir ortamda calisabildigi bir Turkiye icin calismaktayiz.
                </p>
                <h2>Misyonumuz</h2>
                <p>
                  Isletmelere en yuksek kalitede is sagligi ve guvenligi hizmeti sunarak,
                  is kazalarini onlemek ve calisan sagligini korumaktir.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <CTASection slug={project.slug} phone={settings.phone} />
    </>
  );
}
