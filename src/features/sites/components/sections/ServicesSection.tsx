import Link from 'next/link';
import {
  Shield,
  Stethoscope,
  GraduationCap,
  FileCheck,
  HeartPulse,
  Building2,
  ArrowRight,
  Briefcase,
} from 'lucide-react';

interface ServiceItem {
  icon?: string;
  title: string;
  description?: string;
  features?: string[];
}

interface ServicesSectionProps {
  slug: string;
  sectionTitle?: string;
  sectionSubtitle?: string;
  services?: ServiceItem[];
}

const defaultServices: ServiceItem[] = [
  {
    icon: 'Shield',
    title: 'Is Guvenligi Uzmanligi',
    description:
      'Deneyimli is guvenligi uzmanlarimiz ile is kazalarinin onlenmesi ve guveli calisma ortami saglanmasi.',
  },
  {
    icon: 'Stethoscope',
    title: 'Is Yeri Hekimligi',
    description:
      'Is yeri hekimlerimiz calisanlarinizin saglik kontrollerini duzenli olarak gerceklestirir.',
  },
  {
    icon: 'GraduationCap',
    title: 'ISG Egitimi',
    description:
      'Calisanlariniza yonelik is sagligi ve guvenligi egitimlerini profesyonel kadromuzla veriyoruz.',
  },
  {
    icon: 'FileCheck',
    title: 'Risk Degerlendirmesi',
    description:
      'Is yerinizde mevcut tehlike ve risklerin belirlenmesi, degerlendirme raporlarinin hazirlanmasi.',
  },
  {
    icon: 'HeartPulse',
    title: 'Isyeri Hemsireligi',
    description:
      'Saglik gozlem ve takiplerinin yapilmasi, ilk yardim hizmetlerinin saglanmasi.',
  },
  {
    icon: 'Building2',
    title: 'OSGB Hizmetleri',
    description:
      'Ortak Saglik ve Guvenlik Birimi olarak tum ISG gereksinimleriniz icin kapsamli hizmet.',
  },
];

function getServiceIcon(iconName?: string) {
  switch (iconName) {
    case 'Stethoscope': return Stethoscope;
    case 'GraduationCap': return GraduationCap;
    case 'FileCheck': return FileCheck;
    case 'HeartPulse': return HeartPulse;
    case 'Building2': return Building2;
    case 'Briefcase': return Briefcase;
    case 'Shield':
    default: return Shield;
  }
}

export function ServicesSection({
  slug,
  sectionTitle,
  sectionSubtitle,
  services,
}: ServicesSectionProps) {
  const displayServices = services && services.length > 0 ? services : defaultServices;

  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            {sectionTitle || 'Hizmetlerimiz'}
          </h2>
          <p className="text-lg text-neutral-600">
            {sectionSubtitle || 'Is sagligi ve guvenligi alaninda sunduğumuz profesyonel hizmetler'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((service) => {
            const Icon = getServiceIcon(service.icon);
            return (
              <div
                key={service.title}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  {service.title}
                </h3>
                {service.description && (
                  <p className="text-neutral-600 mb-4">{service.description}</p>
                )}
                {service.features && service.features.length > 0 && (
                  <ul className="text-sm text-neutral-500 space-y-1">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[var(--color-primary)] mt-1">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link
            href={`/${slug}/hizmetler`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-secondary)] transition-colors"
          >
            Tum Hizmetlerimiz
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
