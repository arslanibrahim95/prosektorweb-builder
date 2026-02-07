import { TrendingUp } from 'lucide-react'

interface StatItem {
  value: string
  label: string
  icon?: string
}

interface StatsSectionProps {
  items?: StatItem[]
}

export function StatsSection({ items }: StatsSectionProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="py-16 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] text-white">
      <div className="container mx-auto px-4">
        <div className={`grid grid-cols-2 md:grid-cols-${Math.min(items.length, 4)} gap-8`}>
          {items.map((item, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-3">
                <TrendingUp className="w-8 h-8 text-white/80" />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-1">{item.value}</div>
              <div className="text-white/80">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
