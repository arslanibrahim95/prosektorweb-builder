/**
 * Payload Block Mapper
 * Bridges AI pipeline output to Payload CMS block structures
 */

import type { AnalysisResult, ContentResult, DesignResult } from '../types'
import type { Payload } from 'payload'

// ── Types ──────────────────────────────────────────────────────

interface PipelineSection {
    type: string
    content?: string
    order: number
    data?: Record<string, unknown>
}

interface PipelinePage {
    slug: string
    title: string
    metaTitle?: string
    metaDescription?: string
    sections: PipelineSection[]
}

type PayloadBlockType = 'hero' | 'services' | 'about' | 'cta' | 'faq' | 'team' | 'stats' | 'gallery' | 'testimonials' | 'content'

interface PayloadBlock {
    blockType: PayloadBlockType
    [key: string]: unknown
}

interface PayloadPageData {
    title: string
    slug: string
    project: number
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
    content: PayloadBlock[]
}

// ── 4.1 — Map Section to Payload Block ─────────────────────────

export function mapSectionToPayloadBlock(section: PipelineSection): PayloadBlock {
    const data = section.data || {}

    switch (section.type) {
        case 'hero':
            return {
                blockType: 'hero',
                title: (data.title as string) || '',
                subtitle: (data.subtitle as string) || '',
                ctaText: (data.ctaText as string) || undefined,
                ctaLink: (data.ctaLink as string) || undefined,
                stats: Array.isArray(data.stats) ? data.stats : undefined,
            }

        case 'services':
            return {
                blockType: 'services',
                sectionTitle: (data.sectionTitle as string) || 'Hizmetlerimiz',
                sectionSubtitle: (data.sectionSubtitle as string) || undefined,
                items: Array.isArray(data.items) ? data.items : [],
            }

        case 'about':
            return {
                blockType: 'about',
                title: (data.title as string) || 'Hakkimizda',
                description: data.description
                    ? htmlToLexicalRichText(data.description as string)
                    : undefined,
                highlights: Array.isArray(data.highlights) ? data.highlights : [],
                experienceYears: (data.experienceYears as number) || undefined,
            }

        case 'cta':
            return {
                blockType: 'cta',
                title: (data.title as string) || '',
                subtitle: (data.subtitle as string) || undefined,
                buttonText: (data.buttonText as string) || 'Ucretsiz Teklif Alin',
                buttonLink: (data.buttonLink as string) || undefined,
                showPhone: data.showPhone !== false,
            }

        case 'faq':
            return {
                blockType: 'faq',
                sectionTitle: (data.sectionTitle as string) || 'Sikca Sorulan Sorular',
                items: Array.isArray(data.items) ? data.items : [],
            }

        case 'team':
            return {
                blockType: 'team',
                sectionTitle: (data.sectionTitle as string) || 'Ekibimiz',
                members: Array.isArray(data.members) ? data.members : [],
            }

        case 'stats':
            return {
                blockType: 'stats',
                items: Array.isArray(data.items) ? data.items : [],
            }

        case 'testimonials':
            return {
                blockType: 'testimonials',
                sectionTitle: (data.sectionTitle as string) || 'Musterilerimiz',
                items: Array.isArray(data.items) ? data.items : [],
            }

        case 'gallery':
            return {
                blockType: 'gallery',
                sectionTitle: (data.sectionTitle as string) || 'Galeri',
                images: Array.isArray(data.images) ? data.images : [],
            }

        default:
            // Fallback: wrap content as richText content block
            return {
                blockType: 'content',
                text: section.content
                    ? htmlToLexicalRichText(section.content)
                    : undefined,
            }
    }
}

// ── 4.2 — Map Pipeline Output to Payload Pages ─────────────────

export function mapPipelineOutputToPayloadPages(
    contentResult: ContentResult,
    projectId: number
): PayloadPageData[] {
    return contentResult.pages.map((page: PipelinePage) => ({
        title: page.title,
        slug: page.slug.startsWith('/') ? page.slug : `/${page.slug}`,
        project: projectId,
        metaTitle: page.metaTitle || undefined,
        metaDescription: page.metaDescription || undefined,
        content: page.sections
            .sort((a, b) => a.order - b.order)
            .map(section => mapSectionToPayloadBlock(section)),
    }))
}

// ── 4.3 — Map Design Result to Project Fields ──────────────────

export function mapDesignToProjectFields(designResult: DesignResult | null) {
    if (!designResult) return {}

    return {
        design: {
            primaryColor: designResult.colorScheme?.primary || '#2563eb',
            secondaryColor: designResult.colorScheme?.secondary || '#1e40af',
            accentColor: designResult.colorScheme?.accent || '#f59e0b',
            backgroundColor: designResult.colorScheme?.background || '#ffffff',
            fontHeading: designResult.typography?.headingFont || 'Inter',
            fontBody: designResult.typography?.bodyFont || 'Inter',
        },
    }
}

// ── 4.4 — Map Company Info to Project Fields ────────────────────

export function mapCompanyInfoToProjectFields(
    analysisResult: AnalysisResult | null,
    contentResult: ContentResult | null
) {
    const result: Record<string, Record<string, unknown>> = {
        company: {},
        contact: {},
        social: {},
    }

    if (analysisResult?.requirements) {
        const req = analysisResult.requirements
        if (req.businessType) {
            result.company.sector = req.businessType
        }
    }

    // Extract company name from content if available
    if (contentResult?.pages?.[0]?.title) {
        result.company.name = contentResult.pages[0].title.replace(/ - .*$/, '')
    }

    return result
}

// ── 4.5 — HTML to Lexical Rich Text ────────────────────────────

export function htmlToLexicalRichText(html: string) {
    if (!html) return undefined

    const children = parseHtmlToLexicalChildren(html)

    return {
        root: {
            type: 'root',
            format: '' as const,
            indent: 0,
            version: 1,
            children,
            direction: 'ltr' as const,
        },
    }
}

function parseHtmlToLexicalChildren(html: string): Record<string, unknown>[] {
    const children: Record<string, unknown>[] = []

    // Strip full HTML document tags if present
    let content = html
        .replace(/<\/?html[^>]*>/gi, '')
        .replace(/<\/?head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<\/?body[^>]*>/gi, '')
        .trim()

    // Split by block-level tags
    const blockRegex = /<(h[1-6]|p|ul|ol|blockquote)([^>]*)>([\s\S]*?)<\/\1>/gi
    let match
    let lastIndex = 0

    while ((match = blockRegex.exec(content)) !== null) {
        // Handle any text between blocks
        const between = content.slice(lastIndex, match.index).trim()
        if (between) {
            children.push(createParagraphNode(between))
        }

        const tag = match[1].toLowerCase()
        const innerHtml = match[3]

        switch (tag) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                children.push(createHeadingNode(tag, innerHtml))
                break
            case 'ul':
                children.push(createListNode('bullet', innerHtml))
                break
            case 'ol':
                children.push(createListNode('number', innerHtml))
                break
            case 'p':
            default:
                children.push(createParagraphNode(innerHtml))
                break
        }

        lastIndex = match.index + match[0].length
    }

    // Handle remaining text
    const remaining = content.slice(lastIndex).trim()
    if (remaining) {
        children.push(createParagraphNode(remaining))
    }

    // If no block elements were found, treat as single paragraph
    if (children.length === 0 && content) {
        children.push(createParagraphNode(content))
    }

    return children
}

function createHeadingNode(tag: string, html: string) {
    const level = parseInt(tag.charAt(1))
    return {
        type: 'heading',
        tag: `h${level}`,
        format: '',
        indent: 0,
        version: 1,
        children: parseInlineHtml(html),
        direction: 'ltr',
    }
}

function createParagraphNode(html: string) {
    return {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: parseInlineHtml(html),
        direction: 'ltr',
    }
}

function createListNode(listType: 'bullet' | 'number', html: string) {
    const itemRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
    const items: Record<string, unknown>[] = []
    let itemMatch

    while ((itemMatch = itemRegex.exec(html)) !== null) {
        items.push({
            type: 'listitem',
            value: 1,
            format: '',
            indent: 0,
            version: 1,
            children: parseInlineHtml(itemMatch[1]),
            direction: 'ltr',
        })
    }

    return {
        type: 'list',
        listType,
        start: 1,
        format: '',
        indent: 0,
        version: 1,
        children: items,
        direction: 'ltr',
        tag: listType === 'bullet' ? 'ul' : 'ol',
    }
}

function parseInlineHtml(html: string): Record<string, unknown>[] {
    const nodes: Record<string, unknown>[] = []

    // Strip HTML tags while preserving formatting intent
    let remaining = html

    // Process inline elements
    const inlineRegex = /<(strong|b|em|i|a)([^>]*)>([\s\S]*?)<\/\1>/gi
    let inlineMatch
    let lastIdx = 0

    while ((inlineMatch = inlineRegex.exec(html)) !== null) {
        // Text before this inline element
        const before = html.slice(lastIdx, inlineMatch.index)
        if (before) {
            const text = stripTags(before).trim()
            if (text) {
                nodes.push({ text, type: 'text', version: 1 })
            }
        }

        const inlineTag = inlineMatch[1].toLowerCase()
        const attrs = inlineMatch[2]
        const innerText = stripTags(inlineMatch[3])

        if (inlineTag === 'strong' || inlineTag === 'b') {
            nodes.push({ text: innerText, type: 'text', format: 1, version: 1 }) // bold
        } else if (inlineTag === 'em' || inlineTag === 'i') {
            nodes.push({ text: innerText, type: 'text', format: 2, version: 1 }) // italic
        } else if (inlineTag === 'a') {
            const hrefMatch = attrs.match(/href=["']([^"']*)["']/)
            const url = hrefMatch ? hrefMatch[1] : '#'
            nodes.push({
                type: 'link',
                version: 1,
                url,
                children: [{ text: innerText, type: 'text', version: 1 }],
            })
        }

        lastIdx = inlineMatch.index + inlineMatch[0].length
    }

    // Remaining text after last inline element
    const after = html.slice(lastIdx)
    if (after) {
        const text = stripTags(after).trim()
        if (text) {
            nodes.push({ text, type: 'text', version: 1 })
        }
    }

    // If no inline elements found, just use plain text
    if (nodes.length === 0 && html) {
        const text = stripTags(html).trim()
        if (text) {
            nodes.push({ text, type: 'text', version: 1 })
        }
    }

    return nodes
}

function stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

// ── 4.6 — Match Services to Payload ────────────────────────────

export async function matchServicesToPayload(
    payload: Payload,
    analysisResult: AnalysisResult | null
): Promise<number[]> {
    if (!analysisResult?.requirements?.features) return []

    const allServices = await payload.find({
        collection: 'services',
        limit: 100,
    })

    if (allServices.docs.length === 0) return []

    const features = analysisResult.requirements.features.map(f => f.toLowerCase())
    const matched: number[] = []

    for (const service of allServices.docs) {
        const serviceId = normalizeServiceId(service.id)
        if (serviceId === null) continue

        const serviceName = String(service.name ?? '').toLowerCase()
        const serviceSlug = String(service.slug ?? '').toLowerCase()

        const isMatch = features.some(feature =>
            serviceName.includes(feature) ||
            feature.includes(serviceName) ||
            serviceSlug.includes(feature.replace(/\s+/g, '-')) ||
            feature.includes(serviceSlug.replace(/-/g, ' '))
        )

        if (isMatch) {
            matched.push(serviceId)
        }
    }

    // If no specific matches, return all services (OSGB companies typically offer all)
    if (matched.length === 0) {
        return allServices.docs
            .map(s => normalizeServiceId(s.id))
            .filter((id): id is number => id !== null)
    }

    return matched
}

function normalizeServiceId(id: number | string): number | null {
    if (typeof id === 'number' && Number.isFinite(id)) {
        return id
    }

    if (typeof id === 'string') {
        const parsed = Number(id)
        return Number.isFinite(parsed) ? parsed : null
    }

    return null
}
