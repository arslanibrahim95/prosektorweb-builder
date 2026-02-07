import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';

interface CTASectionProps {
  slug: string;
  phone: string | null;
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export function CTASection({ slug, phone, title, subtitle, buttonText }: CTASectionProps) {
  return (
    <section className="py-20 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          {title || 'Is Yerinizi Guvence Altina Alin'}
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          {subtitle || 'Profesyonel OSGB hizmetlerimizle is yerinizin ve calisanlarinizin guvenligini saglayalim. Ucretsiz danismanlik icin hemen iletisime gecin.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href={`/${slug}/iletisim`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[var(--color-primary)] rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
          >
            {buttonText || 'Ucretsiz Teklif Alin'}
            <ArrowRight className="w-5 h-5" />
          </Link>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              <Phone className="w-5 h-5" />
              {phone}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
