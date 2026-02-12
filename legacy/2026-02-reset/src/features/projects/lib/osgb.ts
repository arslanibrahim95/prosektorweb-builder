export const OSGB_INDUSTRY = 'OSGB'

export const OSGB_TEMPLATES = [
  {
    id: 'osgb-modern',
    name: 'OSGB Modern',
    description: 'Modern, hizmet odaklı ve güven veren OSGB web sitesi',
  },
  {
    id: 'osgb-classic',
    name: 'OSGB Kurumsal',
    description: 'Daha resmi ton, kurumsal görünüm ve net iletişim akışı',
  },
  {
    id: 'osgb-local-seo',
    name: 'OSGB Yerel SEO',
    description: 'Şehir/ilçe odaklı sayfa kurgusu için uygun (demo + publish)',
  },
  {
    id: 'osgb-landing',
    name: 'OSGB Tek Sayfa',
    description: 'Hızlı yayın için tek sayfa tanıtım kurgusu',
  },
] as const

export type OsgbTemplateId = (typeof OSGB_TEMPLATES)[number]['id']

export const DEFAULT_OSGB_TEMPLATE: OsgbTemplateId = 'osgb-modern'

const TEMPLATE_SET = new Set<string>(OSGB_TEMPLATES.map((template) => template.id))

export function normalizeOsgbTemplateId(value: string | null | undefined): OsgbTemplateId {
  const candidate = (value || '').trim().toLowerCase()
  if (TEMPLATE_SET.has(candidate)) return candidate as OsgbTemplateId

  // Backward-compat: generic template ids from early UI drafts.
  if (candidate === 'corporate' || candidate === 'standard') return 'osgb-classic'
  if (candidate === 'landing') return 'osgb-landing'
  if (candidate === 'blog') return 'osgb-local-seo'

  return DEFAULT_OSGB_TEMPLATE
}

export function getOsgbTemplateLabel(value: string | null | undefined): string {
  const normalized = normalizeOsgbTemplateId(value)
  return OSGB_TEMPLATES.find((template) => template.id === normalized)?.name ?? 'OSGB'
}
