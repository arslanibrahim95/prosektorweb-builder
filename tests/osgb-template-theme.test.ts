import test from 'node:test'
import assert from 'node:assert/strict'
import { mapTemplateToTheme, normalizeOsgbTemplateId } from '../src/features/projects/lib/osgb'

test('normalizeOsgbTemplateId handles backward-compatible aliases', () => {
  assert.equal(normalizeOsgbTemplateId('corporate'), 'osgb-classic')
  assert.equal(normalizeOsgbTemplateId('landing'), 'osgb-landing')
  assert.equal(normalizeOsgbTemplateId('blog'), 'osgb-local-seo')
})

test('mapTemplateToTheme maps templates to expected themes', () => {
  assert.equal(mapTemplateToTheme('osgb-classic'), 'corporate-clean')
  assert.equal(mapTemplateToTheme('osgb-local-seo'), 'minimal-editorial')
  assert.equal(mapTemplateToTheme('osgb-modern'), 'industrial-bold')
})
