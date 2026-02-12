import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeCutoverMetaIntoNotes,
  parseCutoverMetaFromNotes,
} from '../src/features/projects/lib/domain-cutover';

test('parseCutoverMetaFromNotes returns empty object when marker missing', () => {
  const meta = parseCutoverMetaFromNotes('Cloudflare üzerinden satın alındı');
  assert.deepEqual(meta, {});
});

test('mergeCutoverMetaIntoNotes appends and updates cutover meta marker', () => {
  const first = mergeCutoverMetaIntoNotes('line-1', {
    liveTarget: 'https://example.com',
    sslStatus: 'pending',
  });

  const second = mergeCutoverMetaIntoNotes(first, {
    sslStatus: 'active',
    failureReason: null,
  });

  const meta = parseCutoverMetaFromNotes(second);
  assert.equal(meta.liveTarget, 'https://example.com');
  assert.equal(meta.sslStatus, 'active');
  assert.equal(meta.failureReason, null);
  assert.equal(second.includes('line-1'), true);
});

test('parseCutoverMetaFromNotes tolerates malformed marker bodyData', () => {
  const notes = '__CUTOVER_META__={not-valid-json}';
  const meta = parseCutoverMetaFromNotes(notes);
  assert.deepEqual(meta, {});
});
