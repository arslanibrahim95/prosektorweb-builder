import { notFound } from 'next/navigation';
import { getSiteData } from '@/features/sites/lib/site-data';
import { ContactSection } from '@/features/sites/components/sections/ContactSection';

interface IletisimPageProps {
  params: Promise<{ siteSlug: string }>;
}

export async function generateMetadata({ params }: IletisimPageProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    return { title: 'Iletisim' };
  }

  return {
    title: `Iletisim | ${siteData.company.name}`,
    description: `${siteData.company.name} ile iletisime gecin. ${siteData.settings.phone || ''} ${siteData.settings.email || ''}`,
  };
}

export default async function IletisimPage({ params }: IletisimPageProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    notFound();
  }

  const { settings } = siteData;

  return (
    <>
      {/* Page Header */}
      <section className="py-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Iletisim</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Sorulariniz ve talepleriniz icin bizimle iletisime gecin
          </p>
        </div>
      </section>

      <ContactSection
        projectId={String(siteData.project.id)}
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
        mapEmbed={settings.mapEmbed}
      />
    </>
  );
}
