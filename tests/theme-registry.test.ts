import test from 'node:test'
import assert from 'node:assert/strict'
import { getSiteTheme } from '../src/features/sites/themes/registry'
import { normalizeSiteThemeId } from '../src/features/sites/themes/types'

test('normalizeSiteThemeId falls back to corporate-clean', () => {
  assert.equal(normalizeSiteThemeId('unknown-theme'), 'corporate-clean')
  assert.equal(normalizeSiteThemeId(undefined), 'corporate-clean')
})

test('getSiteTheme resolves industrial-bold theme tokens', () => {
  const theme = getSiteTheme('industrial-bold')
  assert.equal(theme.id, 'industrial-bold')
  assert.equal(theme.tokens.primaryColor, '#f97316')
  assert.equal(theme.tokens.backgroundColor, '#0b1020')
})

test('getSiteTheme returns fallback for invalid value', () => {
  const theme = getSiteTheme('invalid')
  assert.equal(theme.id, 'corporate-clean')
})
