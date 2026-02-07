interface ContentBlockProps {
  content: unknown
}

/**
 * Renders Lexical rich text content from Payload CMS.
 * Handles the root > children > paragraph/heading/list structure.
 */
export function ContentBlock({ content }: ContentBlockProps) {
  if (!content) return null

  // If content is a string, render directly
  if (typeof content === 'string') {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div
            className="prose prose-lg max-w-4xl mx-auto"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </section>
    )
  }

  // Lexical JSON structure
  const lexical = content as {
    root?: {
      children?: LexicalNode[]
    }
  }

  if (!lexical?.root?.children) return null

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="prose prose-lg max-w-4xl mx-auto">
          {lexical.root.children.map((node, index) => (
            <LexicalNodeRenderer key={index} node={node} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Lexical Node Types ─────────────────────────────────────────

interface LexicalNode {
  type: string
  tag?: string
  text?: string
  format?: number | string
  url?: string
  listType?: string
  children?: LexicalNode[]
  [key: string]: unknown
}

function LexicalNodeRenderer({ node }: { node: LexicalNode }) {
  // Text node
  if (node.type === 'text') {
    let element = <>{node.text}</>
    if (node.format === 1) element = <strong>{node.text}</strong>
    if (node.format === 2) element = <em>{node.text}</em>
    if (node.format === 3) element = <strong><em>{node.text}</em></strong>
    return element
  }

  // Link
  if (node.type === 'link') {
    return (
      <a href={node.url || '#'} className="text-[var(--color-primary)] underline">
        {node.children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </a>
    )
  }

  // Heading
  if (node.type === 'heading') {
    const Tag = (node.tag || 'h2') as keyof JSX.IntrinsicElements
    return (
      <Tag>
        {node.children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </Tag>
    )
  }

  // List
  if (node.type === 'list') {
    const Tag = node.listType === 'number' ? 'ol' : 'ul'
    return (
      <Tag>
        {node.children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </Tag>
    )
  }

  // List item
  if (node.type === 'listitem') {
    return (
      <li>
        {node.children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </li>
    )
  }

  // Paragraph (default block)
  if (node.type === 'paragraph') {
    return (
      <p>
        {node.children?.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </p>
    )
  }

  // Fallback
  if (node.children) {
    return (
      <div>
        {node.children.map((child, i) => (
          <LexicalNodeRenderer key={i} node={child} />
        ))}
      </div>
    )
  }

  return null
}
