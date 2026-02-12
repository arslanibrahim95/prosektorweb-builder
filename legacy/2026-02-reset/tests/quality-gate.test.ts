import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveEscalationLevel,
  estimateQAScoreFromPages,
  evaluatePublishQualityGate,
} from '../src/features/projects/lib/quality-gate';

test('deriveEscalationLevel maps score buckets correctly', () => {
  assert.equal(deriveEscalationLevel(92, 70), 'none');
  assert.equal(deriveEscalationLevel(75, 70), 'low');
  assert.equal(deriveEscalationLevel(64, 70), 'medium');
  assert.equal(deriveEscalationLevel(40, 70), 'high');
});

test('estimateQAScoreFromPages rewards complete content set', () => {
  const score = estimateQAScoreFromPages([
    { slug: '/', status: 'published', content: '<h1>Ana Sayfa</h1><p>' + 'x'.repeat(600) + '</p>' },
    { slug: '/hakkimizda', status: 'published', content: '<p>' + 'x'.repeat(400) + '</p>' },
    { slug: '/hizmetler', status: 'published', content: '<p>' + 'x'.repeat(500) + '</p>' },
    { slug: '/iletisim', status: 'published', content: '<p>' + 'x'.repeat(300) + '</p>' },
  ]);

  assert.equal(score >= 70, true);
});

test('evaluatePublishQualityGate blocks low qaScore without force', () => {
  const gate = evaluatePublishQualityGate({
    qaScore: 58,
    threshold: 70,
  });

  assert.equal(gate.passed, false);
  assert.equal(gate.escalationLevel, 'high');
});

test('evaluatePublishQualityGate allows force override', () => {
  const gate = evaluatePublishQualityGate({
    qaScore: 35,
    threshold: 70,
    force: true,
  });

  assert.equal(gate.passed, true);
  assert.equal(gate.forced, true);
});

test('evaluatePublishQualityGate requires explicit score when policy requires it', () => {
  const gate = evaluatePublishQualityGate({
    threshold: 70,
    requireScore: true,
    pages: [{ slug: '/', content: '<p>demo</p>', status: 'draft' }],
  });

  assert.equal(gate.passed, false);
  assert.equal(gate.source, 'heuristic');
});
