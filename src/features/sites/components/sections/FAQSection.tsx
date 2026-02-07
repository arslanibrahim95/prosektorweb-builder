'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQSectionProps {
  sectionTitle?: string
  items?: Array<{ question: string; answer: string }>
}

export function FAQSection({ sectionTitle, items }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!items || items.length === 0) return null

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            {sectionTitle || 'Sikca Sorulan Sorular'}
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors"
              >
                <span className="font-semibold text-neutral-900 pr-4">
                  {item.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-neutral-500 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 text-neutral-600">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
