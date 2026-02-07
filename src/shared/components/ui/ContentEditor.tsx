'use client'

interface ContentEditorProps {
  content: string
  onChange: (nextValue: string) => void
  editable?: boolean
}

export function ContentEditor({ content, onChange, editable = true }: ContentEditorProps) {
  if (!editable) {
    return (
      <div className="prose max-w-none">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    )
  }

  return (
    <textarea
      value={content}
      onChange={(event) => onChange(event.target.value)}
      className="w-full min-h-[320px] p-4 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
    />
  )
}
