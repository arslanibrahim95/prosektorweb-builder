import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CONTRACT_VERSION,
  apiErrorEnvelopeSchema,
  apiSuccessEnvelopeSchema,
  publishWebhookBodySchema,
} from '../src/contracts'

test('publishWebhookBodySchema accepts dashboard source with explicit version', () => {
  const parsed = publishWebhookBodySchema.parse({
    version: CONTRACT_VERSION,
    event: 'publish',
    traceId: 'trace_12345678',
    publishedAt: '2026-02-13T10:00:00.000Z',
    site: {
      id: 'site_1',
      slug: 'acme-osgb',
      status: 'published',
    },
    pages: ['/', '/iletisim'],
    source: 'dashboard',
  })

  assert.equal(parsed.version, CONTRACT_VERSION)
  assert.equal(parsed.source, 'dashboard')
})

test('publishWebhookBodySchema defaults version to current contract', () => {
  const parsed = publishWebhookBodySchema.parse({
    event: 'publish',
    traceId: 'trace_87654321',
    publishedAt: '2026-02-13T10:00:00.000Z',
    site: {
      id: 'site_2',
      slug: 'acme-osgb',
      status: 'published',
    },
    pages: [],
    source: 'panel',
  })

  assert.equal(parsed.version, CONTRACT_VERSION)
})

test('api envelope schemas validate success and error contracts', () => {
  const ok = apiSuccessEnvelopeSchema.parse({
    success: true,
    version: CONTRACT_VERSION,
  })

  const err = apiErrorEnvelopeSchema.parse({
    success: false,
    version: CONTRACT_VERSION,
    error: 'Proje bulunamadi',
    code: 'PROJECT_NOT_FOUND',
  })

  assert.equal(ok.success, true)
  assert.equal(err.success, false)
  assert.equal(err.code, 'PROJECT_NOT_FOUND')
})
