import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createProject,
  generateProjectPages,
  listProjectPages,
  listProjects,
  publishProject,
} from '../src/features/projects/lib/project-layer';
import { resetMemoryStore } from '../src/features/projects/lib/store/memory-store';
import { getSiteData } from '../src/features/sites/lib/site-data';

test('memory backend: createProject generates unique slug', async () => {
  process.env.PROJECT_BACKEND = 'memory';
  resetMemoryStore();

  const contact = {
    phone: '+90 232 000 00 00',
    email: 'iletisim@acmeosgb.com',
    address: 'Bornova / Izmir',
    city: 'Izmir',
    district: 'Bornova',
  };

  const first = await createProject({
    name: 'Acme OSGB',
    description: 'Demo proje aciklamasi.',
    template: 'osgb-modern',
    industry: 'osgb',
    contact,
  });
  const second = await createProject({
    name: 'Acme OSGB',
    description: 'Demo proje aciklamasi.',
    template: 'osgb-modern',
    industry: 'osgb',
    contact,
  });

  assert.equal(first.slug, 'acme-osgb');
  assert.equal(second.slug, 'acme-osgb-1');
  assert.equal(first.contact.phone, contact.phone);
  assert.equal(first.contact.email, contact.email);
  assert.equal(first.contact.address, contact.address);
  assert.equal(first.contact.city, contact.city);
  assert.equal(first.contact.district, contact.district);
});

test('memory backend: generateProjectPages creates default pages', async () => {
  process.env.PROJECT_BACKEND = 'memory';
  resetMemoryStore();

  const project = await createProject({ name: 'Acme OSGB', description: 'Demo proje aciklamasi.' });

  const pages = await generateProjectPages(project.id, {
    companyName: 'Acme OSGB',
    description: 'x'.repeat(800),
    services: 'Isyeri Hekimligi, Is Guvenligi',
    phone: '+90 232 000 00 00',
    email: 'iletisim@acmeosgb.com',
    address: 'Bornova / Izmir',
  });

  assert.equal(pages.length, 4);
  const slugs = pages.map((page) => page.slug).sort();
  assert.deepEqual(slugs, ['', 'hakkimizda', 'hizmetler', 'iletisim']);

  // HTML editor content still exists via the "content" block.
  assert.equal(pages[0]?.content.includes('Öne Çıkan Hizmetler'), true);

  // Public site should render real blocks (hero/services/etc.), not only raw HTML.
  const siteData = await getSiteData(project.slug);
  assert.ok(siteData);

  const homepage = siteData?.pages.find((page) => page.slug === '/');
  assert.ok(homepage);
  const homepageBlockTypes = (homepage?.blocks || []).map((block) => block.blockType);
  assert.equal(homepageBlockTypes.includes('hero'), true);
  assert.equal(homepageBlockTypes.includes('services'), true);
  assert.equal(homepageBlockTypes.includes('cta'), true);
});

test('memory backend: publishProject marks pages published and skips webhook', async () => {
  process.env.PROJECT_BACKEND = 'memory';
  resetMemoryStore();

  const project = await createProject({ name: 'Acme OSGB', description: 'Demo proje aciklamasi.' });
  await generateProjectPages(project.id, {
    companyName: 'Acme OSGB',
    description: 'x'.repeat(800),
  });

  const result = await publishProject(project.id, {});

  assert.equal(result.project.status, 'PUBLISHED');
  assert.equal(result.pagesPublished, 4);
  assert.equal(result.webhook.skipped, true);
  assert.equal(typeof result.webhook.warning, 'string');

  const pages = await listProjectPages(project.id);
  assert.equal(pages.length, 4);
});

test('memory backend: listProjects returns created items', async () => {
  process.env.PROJECT_BACKEND = 'memory';
  resetMemoryStore();

  await createProject({ name: 'Acme OSGB', description: 'Demo proje aciklamasi.' });
  await createProject({ name: 'Beta OSGB', description: 'Demo proje aciklamasi.' });

  const projects = await listProjects();
  assert.equal(projects.length, 2);
});
