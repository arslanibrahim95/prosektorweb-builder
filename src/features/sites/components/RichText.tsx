interface RichTextProps {
  content: unknown
  className?: string
}

/**
 * Renders either:
 * - HTML string (dangerouslySetInnerHTML)
 * - BodyData Lexical richText JSON (root.children tree)
 */
export function RichText({ content, className }: RichTextProps) {
  if (!content) return null

  if (typeof content === 'string') {
    return (
      <div className={className} dangerouslySetInnerHTML={{ __html: content }} />
    )
  }

  const lexical = content as {
    root?: {
      children?: LexicalNode[]
    }
  }

  if (!lexical?.root?.children) return null

  return (
    <div className={className}>
      {lexical.root.children.map((node, index) => (
        <LexicalNodeRenderer key={index} node={node} />
      ))}
    </div>
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function LexicalNodeRenderer({ node }: { node: LexicalNode }) {
  if (!node) return null

  // Text node
  if (node.type === 'text') {
    const safeText = escapeHtml(node.text || '')
    let element = <span dangerouslySetInnerHTML={{ __html: safeText }} />

    if (node.format === 1) element = <strong dangerouslySetInnerHTML={{ __html: safeText }} />
    if (node.format === 2) element = <em dangerouslySetInnerHTML={{ __html: safeText }} />
    if (node.format === 3) {
      element = (
        <strong>
          <em dangerouslySetInnerHTML={{ __html: safeText }} />
        </strong>
      )
    }

    return element
  }

  // Link
  if (node.type === 'link') {
    return (
      <a href={node.url || '#'} className="underline underline-offset-4">
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

