export const siteThemeIds = [
  'corporate-clean',
  'industrial-bold',
  'minimal-editorial',
] as const

export type SiteThemeId = (typeof siteThemeIds)[number]

export interface SiteThemeTokens {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  headingColor: string
  bodyColor: string
  fontHeading: string
  fontBody: string
}

export interface SiteThemeDefinition {
  id: SiteThemeId
  label: string
  description: string
  tokens: SiteThemeTokens
}

const themeSet = new Set<string>(siteThemeIds)

export function normalizeSiteThemeId(value: string | null | undefined): SiteThemeId {
  const normalized = (value || '').trim().toLowerCase()
  return themeSet.has(normalized) ? (normalized as SiteThemeId) : 'corporate-clean'
}
