import { Quote, User } from 'lucide-react'

interface TestimonialItem {
  quote: string
  author: string
  company?: string
  image?: { url: string } | null
}

interface TestimonialsSectionProps {
  sectionTitle?: string
  items?: TestimonialItem[]
}

export function TestimonialsSection({ sectionTitle, items }: TestimonialsSectionProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            {sectionTitle || 'Musterilerimiz Ne Diyor?'}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
            >
              <Quote className="w-8 h-8 text-[var(--color-primary)]/30 mb-4" />
              <p className="text-neutral-600 mb-6 italic">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0">
                  {item.image?.url ? (
                    <img
                      src={item.image.url}
                      alt={item.author}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-neutral-400" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">{item.author}</div>
                  {item.company && (
                    <div className="text-sm text-neutral-500">{item.company}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
