import { RichText } from '@/features/sites/components/RichText'

interface ContentBlockProps {
  content: unknown
}

export function ContentBlock({ content }: ContentBlockProps) {
  if (!content) return null

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <RichText content={content} className="prose prose-lg max-w-4xl mx-auto" />
      </div>
    </section>
  )
}
