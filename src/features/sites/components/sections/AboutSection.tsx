import { CheckCircle } from 'lucide-react';

interface AboutSectionProps {
  companyName: string;
  content?: string;
  title?: string;
  highlights?: string[];
  experienceYears?: number;
  image?: string;
}

const defaultHighlights = [
  'Deneyimli uzman kadro',
  '7/24 destek hizmeti',
  'Hizli ve etkin cozumler',
  'Guncel mevzuat takibi',
  'Kapsamli risk analizi',
  'Duzenli egitim programlari',
];

export function AboutSection({
  companyName,
  content,
  title,
  highlights,
  experienceYears,
  image,
}: AboutSectionProps) {
  const displayHighlights = highlights && highlights.length > 0 ? highlights : defaultHighlights;
  const displayYears = experienceYears || 15;

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
              {title || `${companyName} Hakkinda`}
            </h2>
            <div className="prose prose-lg text-neutral-600">
              {content ? (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                <>
                  <p>
                    Is sagligi ve guvenligi alaninda uzun yillik deneyimimizle,
                    isletmelerin guveli calisma ortami olusturmasina yardimci oluyoruz.
                  </p>
                  <p>
                    Uzman kadromuz, guncel mevzuata uygun olarak tum ISG hizmetlerini
                    profesyonelce sunmaktadir. Is kazalarinin onlenmesi ve calisan sagliginin
                    korunmasi en buyuk onceliğimizdir.
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              {displayHighlights.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[var(--color-primary)]" />
                  <span className="text-neutral-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {image ? (
              <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                <img src={image} alt={companyName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] p-1">
                <div className="w-full h-full rounded-xl bg-neutral-100 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl font-bold text-[var(--color-primary)] mb-2">{displayYears}+</div>
                    <div className="text-xl text-neutral-600">Yillik Deneyim</div>
                  </div>
                </div>
              </div>
            )}
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[var(--color-accent)] rounded-2xl -z-10" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-[var(--color-primary)]/20 rounded-full -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
