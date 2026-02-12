import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSignedWebhookSignature,
  collectWarmupPaths,
  normalizeSiteSlug,
  toSiteRoutePath,
  verifyPublishWebhookSignature,
} from '../src/features/site-engine/lib/publish-webhook';

test('normalizeSiteSlug normalizes Turkish/company style names', () => {
  assert.equal(normalizeSiteSlug(' ACME İş Güvenliği A.Ş. '), 'acme-is-guvenligi-as');
  assert.equal(normalizeSiteSlug('---'), '');
});

test('signature verification succeeds with valid timestamp and secret', () => {
  const secret = 'demo-secret';
  const now = Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify({
    siteSlug: 'acme-osgb',
    publishedAt: '2026-02-07T10:00:00.000Z',
    traceId: 'trace-1',
    source: 'panel',
  });

  const signature = buildSignedWebhookSignature(rawBody, secret, now);
  const verification = verifyPublishWebhookSignature({
    rawBody,
    secret,
    signature,
    timestamp: String(now),
    nowSeconds: now,
  });

  assert.equal(verification.ok, true);
});

test('signature verification rejects stale timestamp', () => {
  const secret = 'demo-secret';
  const now = Math.floor(Date.now() / 1000);
  const stale = now - 601;
  const rawBody = JSON.stringify({
    siteSlug: 'acme-osgb',
    publishedAt: '2026-02-07T10:00:00.000Z',
    traceId: 'trace-2',
    source: 'panel',
  });

  const signature = buildSignedWebhookSignature(rawBody, secret, stale);
  const verification = verifyPublishWebhookSignature({
    rawBody,
    secret,
    signature,
    timestamp: String(stale),
    nowSeconds: now,
    maxSkewSeconds: 300,
  });

  assert.equal(verification.ok, false);
});

test('collectWarmupPaths includes defaults and maps nested page paths', () => {
  const paths = collectWarmupPaths('acme-osgb', ['/', '/iletisim', '/blog/yeni', '/acme-osgb/hakkimizda']);

  assert.equal(paths.includes('/acme-osgb'), true);
  assert.equal(paths.includes('/acme-osgb/iletisim'), true);
  assert.equal(paths.includes('/acme-osgb/blog/yeni'), true);
  assert.equal(paths.includes('/acme-osgb/hakkimizda'), true);
});

test('toSiteRoutePath prefixes slug when page path is relative', () => {
  assert.equal(toSiteRoutePath('acme-osgb', 'hizmetler'), '/acme-osgb/hizmetler');
  assert.equal(toSiteRoutePath('acme-osgb', '/'), '/acme-osgb');
});
