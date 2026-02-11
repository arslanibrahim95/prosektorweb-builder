import { normalizeSiteThemeId, type SiteThemeDefinition, type SiteThemeId } from './types'

export const SITE_THEMES: Record<SiteThemeId, SiteThemeDefinition> = {
  'corporate-clean': {
    id: 'corporate-clean',
    label: 'Corporate Clean',
    description: 'Temiz kurumsal cizgi, net CTA ve guven odakli duzen.',
    tokens: {
      primaryColor: '#0f6ad7',
      secondaryColor: '#0b4ca4',
      accentColor: '#f59e0b',
      backgroundColor: '#f6f8fb',
      surfaceColor: '#ffffff',
      headingColor: '#0f172a',
      bodyColor: '#334155',
      fontHeading: 'Sora',
      fontBody: 'Manrope',
    },
  },
  'industrial-bold': {
    id: 'industrial-bold',
    label: 'Industrial Bold',
    description: 'Kontrastli tipografi, keskin kutular ve saha odakli hissiyat.',
    tokens: {
      primaryColor: '#f97316',
      secondaryColor: '#9a3412',
      accentColor: '#0ea5e9',
      backgroundColor: '#0b1020',
      surfaceColor: '#121a2c',
      headingColor: '#f8fafc',
      bodyColor: '#cbd5e1',
      fontHeading: 'Archivo',
      fontBody: 'IBM Plex Sans',
    },
  },
  'minimal-editorial': {
    id: 'minimal-editorial',
    label: 'Minimal Editorial',
    description: 'Bosluk odakli sakin duzen, tipografi merkezli sunum.',
    tokens: {
      primaryColor: '#1d4ed8',
      secondaryColor: '#1e3a8a',
      accentColor: '#ea580c',
      backgroundColor: '#fdfcf8',
      surfaceColor: '#ffffff',
      headingColor: '#0f172a',
      bodyColor: '#334155',
      fontHeading: 'Merriweather',
      fontBody: 'Source Sans 3',
    },
  },
}

export function getSiteTheme(themeId: string | null | undefined): SiteThemeDefinition {
  return SITE_THEMES[normalizeSiteThemeId(themeId)]
}
