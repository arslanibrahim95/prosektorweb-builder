export const OSGB_INDUSTRY = 'OSGB'

export const OSGB_TEMPLATES = [
  {
    id: 'osgb-modern',
    name: 'OSGB Modern',
    description: 'Modern, hizmet odakli ve guven veren OSGB web sitesi',
  },
  {
    id: 'osgb-classic',
    name: 'OSGB Kurumsal',
    description: 'Daha resmi ton, kurumsal gorunum ve net iletisim akisi',
  },
  {
    id: 'osgb-local-seo',
    name: 'OSGB Yerel SEO',
    description: 'Sehir/ilce odakli sayfa kurgusu icin uygun',
  },
  {
    id: 'osgb-landing',
    name: 'OSGB Tek Sayfa',
    description: 'Hizli yayin icin tek sayfa tanitim kurgusu',
  },
] as const

export type OsgbTemplateId = (typeof OSGB_TEMPLATES)[number]['id']

export const DEFAULT_OSGB_TEMPLATE: OsgbTemplateId = 'osgb-modern'

const TEMPLATE_SET = new Set<string>(OSGB_TEMPLATES.map((template) => template.id))

export function normalizeOsgbTemplateId(value: string | null | undefined): OsgbTemplateId {
  const candidate = (value || '').trim().toLowerCase()
  if (TEMPLATE_SET.has(candidate)) return candidate as OsgbTemplateId

  if (candidate === 'corporate' || candidate === 'standard') return 'osgb-classic'
  if (candidate === 'landing') return 'osgb-landing'
  if (candidate === 'blog') return 'osgb-local-seo'

  return DEFAULT_OSGB_TEMPLATE
}

export function getOsgbTemplateLabel(value: string | null | undefined): string {
  const normalized = normalizeOsgbTemplateId(value)
  return OSGB_TEMPLATES.find((template) => template.id === normalized)?.name ?? 'OSGB'
}

export function mapTemplateToTheme(template: string | null | undefined): string {
  const normalized = normalizeOsgbTemplateId(template)
  if (normalized === 'osgb-classic') return 'corporate-clean'
  if (normalized === 'osgb-local-seo') return 'minimal-editorial'
  if (normalized === 'osgb-landing') return 'industrial-bold'
  return 'industrial-bold'
}
