import Link from 'next/link';
import { ArrowRight, Shield, Users, Award } from 'lucide-react';

interface HeroStat {
  value: string;
  label: string;
  icon?: string;
}

interface HeroSectionProps {
  slug: string;
  companyName: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  stats?: HeroStat[];
}

const defaultStats: HeroStat[] = [
  { value: '1000+', label: 'Is Yeri', icon: 'Shield' },
  { value: '50.000+', label: 'Calisan', icon: 'Users' },
  { value: '15+', label: 'Yil Deneyim', icon: 'Award' },
];

function getStatIcon(iconName?: string) {
  switch (iconName) {
    case 'Users': return Users;
    case 'Award': return Award;
    case 'Shield':
    default: return Shield;
  }
}

export function HeroSection({
  slug,
  companyName,
  title,
  subtitle,
  ctaText,
  ctaLink,
  backgroundImage,
  stats,
}: HeroSectionProps) {
  const displayStats = stats && stats.length > 0 ? stats : defaultStats;

  return (
    <section
      className="relative bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white overflow-hidden"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      {/* Background pattern */}
      {!backgroundImage && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }} />
        </div>
      )}

      {/* Overlay for background image */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="container mx-auto px-4 py-24 md:py-32 relative">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {title || `${companyName} - Is Sagligi ve Guvenligi Cozumleri`}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            {subtitle || 'Profesyonel OSGB hizmetleri ile is yerinizin guvenligini sagliyoruz. Uzman ekibimizle yaninizdayiz.'}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={ctaLink || `/${slug}/iletisim`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[var(--color-primary)] rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
            >
              {ctaText || 'Ucretsiz Danismanlik'}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href={`/${slug}/hizmetler`}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Hizmetlerimiz
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-${Math.min(displayStats.length, 4)} gap-8 mt-16 pt-16 border-t border-white/20`}>
          {displayStats.map((stat, index) => {
            const Icon = getStatIcon(stat.icon);
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-3">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-white/80">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
