import assert from 'node:assert/strict'
import test from 'node:test'

import {
  htmlToLexicalRichText,
  mapCompanyInfoToProjectFields,
  mapDesignToProjectFields,
  mapPipelineOutputToPayloadPages,
  mapSectionToPayloadBlock,
  matchServicesToPayload,
} from '../src/features/ai-generation/lib/payload-block-mapper'

test('mapSectionToPayloadBlock maps hero data with explicit fields', () => {
  const block = mapSectionToPayloadBlock({
    type: 'hero',
    order: 1,
    data: {
      title: 'OSGB Platform',
      subtitle: 'Kurumsal guvenlik cozumleri',
      ctaText: 'Teklif Al',
      ctaLink: '/iletisim',
      stats: [{ label: 'Musteri', value: '250+' }],
    },
  }) as Record<string, unknown>

  assert.equal(block.blockType, 'hero')
  assert.equal(block.title, 'OSGB Platform')
  assert.equal(block.subtitle, 'Kurumsal guvenlik cozumleri')
  assert.equal(block.ctaText, 'Teklif Al')
  assert.equal(block.ctaLink, '/iletisim')
  assert.deepEqual(block.stats, [{ label: 'Musteri', value: '250+' }])
})

test('mapSectionToPayloadBlock falls back to content block for unknown type', () => {
  const block = mapSectionToPayloadBlock({
    type: 'unknown_block',
    order: 2,
    content: '<p>Merhaba <strong>dunya</strong></p>',
  }) as Record<string, unknown>

  assert.equal(block.blockType, 'content')

  const text = block.text as {
    root?: { children?: Array<{ type?: string; children?: Array<{ text?: string }> }> }
  }
  assert.equal(text.root?.children?.[0]?.type, 'paragraph')
  assert.equal(text.root?.children?.[0]?.children?.[1]?.text, 'dunya')
})

test('mapPipelineOutputToPayloadPages normalizes slug and sorts sections by order', () => {
  const pages = mapPipelineOutputToPayloadPages(
    {
      pages: [
        {
          slug: 'hizmetler',
          title: 'Hizmetler',
          metaTitle: 'Hizmetler Meta',
          metaDescription: 'Hizmetler Aciklama',
          sections: [
            { type: 'cta', order: 2, data: { title: 'Hemen Basla' }, content: '' },
            { type: 'stats', order: 1, data: { items: [{ label: 'Proje', value: '40' }] }, content: '' },
          ],
        },
      ],
      globalContent: {
        navigation: [],
        footer: { copyright: 'x', links: [] },
      },
    },
    42
  )

  assert.equal(pages.length, 1)
  assert.equal(pages[0].slug, '/hizmetler')
  assert.equal(pages[0].project, 42)
  assert.equal(pages[0].content[0].blockType, 'stats')
  assert.equal(pages[0].content[1].blockType, 'cta')
})

test('mapDesignToProjectFields returns defaults for missing design fields', () => {
  assert.deepEqual(mapDesignToProjectFields(null), {})

  const mapped = mapDesignToProjectFields({
    colorScheme: {
      primary: '#111111',
      secondary: '#222222',
      accent: '#333333',
      background: '#fefefe',
      text: '#000000',
    },
    typography: {
      headingFont: 'Poppins',
      bodyFont: 'Open Sans',
      baseSize: 16,
    },
    layout: {
      maxWidth: '1200px',
      spacing: 'normal',
      grid: '12-col',
    },
    components: [],
  })

  assert.deepEqual(mapped, {
    design: {
      primaryColor: '#111111',
      secondaryColor: '#222222',
      accentColor: '#333333',
      backgroundColor: '#fefefe',
      fontHeading: 'Poppins',
      fontBody: 'Open Sans',
    },
  })
})

test('mapCompanyInfoToProjectFields extracts business type and company name', () => {
  const mapped = mapCompanyInfoToProjectFields(
    {
      requirements: {
        businessType: 'OSGB',
        targetAudience: [],
        goals: [],
        features: [],
      },
      recommendations: {
        template: 'modern',
        pages: [],
        style: 'clean',
        tone: 'professional',
      },
      complexity: 'SIMPLE',
      estimatedTokens: 1000,
    },
    {
      pages: [
        {
          slug: '/',
          title: 'Acme ISG - Ana Sayfa',
          metaTitle: 'Meta',
          metaDescription: 'Meta Desc',
          sections: [],
        },
      ],
      globalContent: {
        navigation: [],
        footer: { copyright: 'x', links: [] },
      },
    }
  )

  assert.equal(mapped.company.sector, 'OSGB')
  assert.equal(mapped.company.name, 'Acme ISG')
})

test('htmlToLexicalRichText parses headings, paragraphs, links and lists', () => {
  const rich = htmlToLexicalRichText(
    '<h2>Baslik</h2><p>Merhaba <strong>dunya</strong> <a href="/iletisim">link</a></p><ul><li>Bir</li><li>Iki</li></ul>'
  )

  assert.ok(rich)
  assert.equal(rich?.root.children.length, 3)
  assert.equal((rich?.root.children[0] as { type?: string }).type, 'heading')
  assert.equal((rich?.root.children[2] as { type?: string }).type, 'list')

  const paragraph = rich?.root.children[1] as {
    children?: Array<{ type?: string; url?: string }>
  }
  const linkNode = paragraph.children?.find(node => node.type === 'link')
  assert.equal(linkNode?.url, '/iletisim')
})

test('matchServicesToPayload matches by feature and falls back to all services', async () => {
  const payloadMock = {
    find: async () => ({
      docs: [
        { id: 10, name: 'Risk Analizi', slug: 'risk-analizi' },
        { id: 20, name: 'Acil Durum Egitimi', slug: 'acil-durum-egitimi' },
      ],
    }),
  } as any

  const matched = await matchServicesToPayload(payloadMock, {
    requirements: {
      businessType: 'OSGB',
      targetAudience: [],
      goals: [],
      features: ['risk analizi'],
    },
    recommendations: {
      template: 'modern',
      pages: [],
      style: 'clean',
      tone: 'formal',
    },
    complexity: 'SIMPLE',
    estimatedTokens: 100,
  })

  assert.deepEqual(matched, [10])

  const fallback = await matchServicesToPayload(payloadMock, {
    requirements: {
      businessType: 'OSGB',
      targetAudience: [],
      goals: [],
      features: ['tamamen alakasiz bir ozellik'],
    },
    recommendations: {
      template: 'modern',
      pages: [],
      style: 'clean',
      tone: 'formal',
    },
    complexity: 'SIMPLE',
    estimatedTokens: 100,
  })

  assert.deepEqual(fallback, [10, 20])
})
