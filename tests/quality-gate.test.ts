import test from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluatePublishQualityGate,
  estimateQAScoreFromPages,
} from '../src/features/projects/lib/quality-gate'

test('estimateQAScoreFromPages returns low score for empty pages', () => {
  const score = estimateQAScoreFromPages([])
  assert.equal(score, 20)
})

test('evaluatePublishQualityGate fails when score is under threshold', () => {
  const result = evaluatePublishQualityGate({
    qaScore: 40,
    threshold: 70,
    pages: [{ slug: '/', status: 'draft', content: '<p>kisa</p>' }],
  })

  assert.equal(result.passed, false)
  assert.equal(result.forced, false)
  assert.equal(result.escalationLevel, 'high')
})

test('evaluatePublishQualityGate force option overrides failures', () => {
  const result = evaluatePublishQualityGate({
    qaScore: 10,
    threshold: 80,
    force: true,
    pages: [{ slug: '/', status: 'draft', content: '' }],
  })

  assert.equal(result.passed, true)
  assert.equal(result.forced, true)
  assert.ok(result.reason)
})
