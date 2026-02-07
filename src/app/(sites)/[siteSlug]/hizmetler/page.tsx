import { notFound } from 'next/navigation';
import { getSiteData } from '@/features/sites/lib/site-data';
import { CTASection } from '@/features/sites/components/sections/CTASection';
import {
  Shield,
  Stethoscope,
  GraduationCap,
  FileCheck,
  HeartPulse,
  Building2,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react';

interface HizmetlerPageProps {
  params: Promise<{ siteSlug: string }>;
}

const defaultServices = [
  {
    icon: Shield,
    title: 'Is Guvenligi Uzmanligi',
    description: `Is yeri ortaminda mevcut veya olusabilecek tehlikeleri tespit eden, risk degerlendirmesi yapan ve onlem alan profesyonellerimiz. Deneyimli is guvenligi uzmanlarimiz:

    - Is kazasi risklerini minimize eder
    - Yasal mevzuata uyumu saglar
    - Periyodik denetimler gerceklestirir
    - Acil durum planlarini hazirlar`,
  },
  {
    icon: Stethoscope,
    title: 'Is Yeri Hekimligi',
    description: `Calisanlarinizin saglik durumlarini takip eden ve is yerine uygunluklarini degerlendiren hekimlerimiz. Hizmetlerimiz:

    - Ise giris muayeneleri
    - Periyodik saglik kontrolleri
    - Meslek hastaliklari takibi
    - Saglik raporlari`,
  },
  {
    icon: GraduationCap,
    title: 'ISG Egitimi',
    description: `Yasal zorunluluklar cercevesinde calisanlariniza yonelik kapsamli egitimler. Egitim programlarimiz:

    - Temel ISG egitimleri
    - Risk grubuna ozel egitimler
    - Ilk yardim egitimleri
    - Yangin ve acil durum egitimleri`,
  },
  {
    icon: FileCheck,
    title: 'Risk Degerlendirmesi',
    description: `Is yerinizdeki tum tehlike ve risklerin sistematik olarak analiz edilmesi. Hizmet kapsamimiz:

    - Tehlike tanimlama
    - Risk analizi ve derecelendirme
    - Onlem planlari
    - Revizyon takibi`,
  },
  {
    icon: HeartPulse,
    title: 'Isyeri Hemsireligi',
    description: `Saglik gozetimi ve ilk yardim hizmetlerinin saglanmasi. Isyeri hemsirelerimiz:

    - Saglik takibi yapar
    - Ilk yardim mudahalesi saglar
    - Saglik bilincini artirir
    - Kayit ve raporlama yapar`,
  },
  {
    icon: Building2,
    title: 'OSGB Hizmetleri',
    description: `Ortak Saglik ve Guvenlik Birimi olarak tum ISG gereksinimleriniz icin tek noktadan cozum. OSGB hizmetlerimiz:

    - Komple ISG yonetimi
    - Mevzuat uyum takibi
    - Denetim ve kontrol
    - Raporlama`,
  },
  {
    icon: ClipboardCheck,
    title: 'ISG Dokumantasyonu',
    description: `Yasal zorunluluklara uygun tum belge ve dokumanlarin hazirlanmasi. Hazirlanan dokumanlar:

    - Acil durum planlari
    - Talimatinameler
    - Is izin belgeleri
    - Kisisel koruyucu donanim formlari`,
  },
  {
    icon: AlertTriangle,
    title: 'Is Kazasi Analizi',
    description: `Is kazalarinin tekrarinin onlenmesi icin detayli kaza analizleri. Analiz surecimiz:

    - Kaza kok neden analizi
    - Onleyici tedbirler
    - Duzeltici faaliyetler
    - Takip ve izleme`,
  },
];

export async function generateMetadata({ params }: HizmetlerPageProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    return { title: 'Hizmetler' };
  }

  return {
    title: `Hizmetlerimiz | ${siteData.company.name}`,
    description: `${siteData.company.name} OSGB hizmetleri - Is Guvenligi, Is Yeri Hekimligi, Risk Degerlendirmesi ve daha fazlasi`,
  };
}

export default async function HizmetlerPage({ params }: HizmetlerPageProps) {
  const { siteSlug } = await params;
  const siteData = await getSiteData(siteSlug);

  if (!siteData) {
    notFound();
  }

  const { project, settings, contents, services } = siteData;
  const servicesContent = contents['SERVICES'];

  // Use dynamic services from Payload if available
  const hasDynamicServices = services.length > 0;

  return (
    <>
      {/* Page Header */}
      <section className="py-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hizmetlerimiz</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Is sagligi ve guvenligi alaninda sunduğumuz profesyonel hizmetler
          </p>
        </div>
      </section>

      {/* Services Content from CMS */}
      {servicesContent?.content && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div
              className="prose prose-lg max-w-4xl mx-auto"
              dangerouslySetInnerHTML={{ __html: servicesContent.content }}
            />
          </div>
        </section>
      )}

      {/* Services Grid */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          {hasDynamicServices ? (
            <div className="grid md:grid-cols-2 gap-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center mb-6">
                    <Shield className="w-8 h-8 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
                    {service.name}
                  </h3>
                  <div className="text-neutral-600">
                    {service.shortDescription}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {defaultServices.map((service) => (
                <div
                  key={service.title}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="w-16 h-16 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center mb-6">
                    <service.icon className="w-8 h-8 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="text-2xl font-semibold text-neutral-900 mb-4">
                    {service.title}
                  </h3>
                  <div className="text-neutral-600 whitespace-pre-line">
                    {service.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <CTASection slug={project.slug} phone={settings.phone} />
    </>
  );
}
