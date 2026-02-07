import { z } from 'zod';
import {
  createDashboardPage,
  createDashboardSite,
  findDashboardSiteBySlug,
  getDashboardSiteById,
  listDashboardPages,
  listDashboardSites,
  updateDashboardPage,
  updateDashboardSite,
} from '@/features/dashboard/client';
import { createPuckDataFromHtml, extractHtmlFromPuckData, normalizePageSlug } from '@/features/dashboard/puck';

const projectCreateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  template: z.string().trim().max(80).optional(),
  industry: z.string().trim().max(80).optional(),
});

const generationSchema = z.object({
  companyName: z.string().trim().min(2),
  description: z.string().trim().min(10),
  services: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

const pageUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  content: z.string().trim().min(1),
});

const pageCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  template: string | null;
  industry: string | null;
  status: string;
  updatedAt: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  template: string | null;
  industry: string | null;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  domain: { id: string; name: string } | null;
  pagesCount: number;
  generatedContentsCount: number;
}

export interface ProjectEditorPage {
  id: string;
  name: string;
  slug: string;
  content: string;
  updatedAt: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function nowIso(): string {
  return new Date().toISOString();
}

function toStringId(value: string | number): string {
  return String(value);
}

function toEditorSlug(value: string | null | undefined): string {
  const normalized = normalizePageSlug(value || '/');
  if (normalized === '/') return '';
  return normalized.replace(/^\//, '');
}

function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'draft';
  return status.toUpperCase();
}

async function buildUniqueSiteSlug(name: string): Promise<string> {
  const base = slugify(name) || 'site';
  let candidate = base;
  let suffix = 1;

  while (suffix < 1000) {
    const exists = await findDashboardSiteBySlug(candidate);
    if (!exists) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return `${base}-${Date.now()}`;
}

async function buildUniquePageSlug(siteId: string, name: string): Promise<string> {
  const base = normalizePageSlug(slugify(name) || 'yeni-sayfa');
  const existingPages = await listDashboardPages(siteId);
  const slugs = new Set(existingPages.map((page) => normalizePageSlug(page.slug || '/')));

  if (!slugs.has(base)) {
    return base;
  }

  let suffix = 1;
  while (suffix < 1000) {
    const candidate = normalizePageSlug(`${base.replace(/^\//, '')}-${suffix}`);
    if (!slugs.has(candidate)) {
      return candidate;
    }
    suffix += 1;
  }

  return normalizePageSlug(`${base.replace(/^\//, '')}-${Date.now()}`);
}

function mapSiteToProjectListItem(site: {
  id: string | number;
  name?: string | null;
  description?: string | null;
  template?: string | null;
  industry?: string | null;
  status?: string | null;
  updatedAt?: string | null;
}): ProjectListItem {
  return {
    id: toStringId(site.id),
    name: site.name || 'Untitled Site',
    description: site.description || null,
    template: site.template || null,
    industry: site.industry || null,
    status: normalizeStatus(site.status),
    updatedAt: site.updatedAt || nowIso(),
  };
}

async function mapSiteToProjectDetail(site: {
  id: string | number;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  template?: string | null;
  industry?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}): Promise<ProjectDetail> {
  const siteId = toStringId(site.id);
  const pages = await listDashboardPages(siteId);

  return {
    id: siteId,
    name: site.name || 'Untitled Site',
    slug: site.slug || '',
    description: site.description || null,
    template: site.template || null,
    industry: site.industry || null,
    status: normalizeStatus(site.status),
    progress: pages.length > 0 ? 65 : 0,
    createdAt: site.createdAt || nowIso(),
    updatedAt: site.updatedAt || nowIso(),
    domain: null,
    pagesCount: pages.length,
    generatedContentsCount: pages.length,
  };
}

function mapPageForEditor(page: {
  id: string | number;
  title?: string | null;
  slug?: string | null;
  puckData?: unknown;
  updatedAt?: string | null;
}): ProjectEditorPage {
  return {
    id: toStringId(page.id),
    name: page.title || 'Sayfa',
    slug: toEditorSlug(page.slug),
    content: extractHtmlFromPuckData(page.puckData as never),
    updatedAt: page.updatedAt || nowIso(),
  };
}

function buildDefaultPages(input: z.infer<typeof generationSchema>) {
  const safeCompany = escapeHtml(input.companyName);
  const safeDescription = escapeHtml(input.description);
  const safePhone = input.phone ? escapeHtml(input.phone) : 'Belirtilmedi';
  const safeEmail = input.email ? escapeHtml(input.email) : 'Belirtilmedi';
  const safeAddress = input.address ? escapeHtml(input.address) : 'Belirtilmedi';

  const parsedServices = (input.services || '')
    .split(/[,\n]/)
    .map((service) => service.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((service) => `<li>${escapeHtml(service)}</li>`)
    .join('');

  const servicesList =
    parsedServices ||
    '<li>İşyeri hekimliği</li><li>İş güvenliği uzmanlığı</li><li>Risk değerlendirmesi</li>';

  return [
    {
      title: 'Ana Sayfa',
      slug: '/',
      seoTitle: `${safeCompany} | Ana Sayfa`,
      seoDescription: safeDescription,
      content: `<h1>${safeCompany}</h1><p>${safeDescription}</p><h2>Hizmetlerimiz</h2><ul>${servicesList}</ul>`,
    },
    {
      title: 'Hakkımızda',
      slug: '/hakkimizda',
      seoTitle: `${safeCompany} | Hakkımızda`,
      seoDescription: `${safeCompany} hakkında bilgiler`,
      content: `<h1>Hakkımızda</h1><p>${safeCompany} olarak müşterilerimize güvenilir çözümler sunuyoruz.</p><p>${safeDescription}</p>`,
    },
    {
      title: 'Hizmetler',
      slug: '/hizmetler',
      seoTitle: `${safeCompany} | Hizmetler`,
      seoDescription: `${safeCompany} hizmetler`,
      content: `<h1>Hizmetlerimiz</h1><p>İhtiyacınıza uygun OSGB çözümleri sağlıyoruz.</p><ul>${servicesList}</ul>`,
    },
    {
      title: 'İletişim',
      slug: '/iletisim',
      seoTitle: `${safeCompany} | İletişim`,
      seoDescription: `${safeCompany} iletişim bilgileri`,
      content: `<h1>İletişim</h1><p>Telefon: ${safePhone}</p><p>E-posta: ${safeEmail}</p><p>Adres: ${safeAddress}</p>`,
    },
  ];
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const sites = await listDashboardSites();
  return sites.map(mapSiteToProjectListItem);
}

export async function createProject(input: unknown): Promise<ProjectDetail> {
  const payload = projectCreateSchema.parse(input);
  const slug = await buildUniqueSiteSlug(payload.name);

  const site = await createDashboardSite({
    name: payload.name,
    slug,
    description: payload.description || null,
    template: payload.template || null,
    industry: payload.industry || null,
    status: 'draft',
  });

  return mapSiteToProjectDetail(site);
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const site = await getDashboardSiteById(id);
  if (!site) return null;

  return mapSiteToProjectDetail(site);
}

export async function listProjectPages(projectId: string): Promise<ProjectEditorPage[]> {
  const pages = await listDashboardPages(projectId);
  return pages.map(mapPageForEditor);
}

export async function generateProjectPages(
  projectId: string,
  input: unknown
): Promise<ProjectEditorPage[]> {
  const payload = generationSchema.parse(input);
  const site = await getDashboardSiteById(projectId);

  if (!site) {
    throw new Error('Proje bulunamadı');
  }

  const defaults = buildDefaultPages(payload);
  const existingPages = await listDashboardPages(projectId);
  const bySlug = new Map(existingPages.map((page) => [normalizePageSlug(page.slug || '/'), page]));

  for (const page of defaults) {
    const slug = normalizePageSlug(page.slug);
    const existing = bySlug.get(slug);

    if (existing) {
      await updateDashboardPage(toStringId(existing.id), {
        title: page.title,
        slug,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        status: 'draft',
        puckData: createPuckDataFromHtml(page.title, page.content),
      });
    } else {
      await createDashboardPage({
        siteId: projectId,
        title: page.title,
        slug,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        status: 'draft',
        puckData: createPuckDataFromHtml(page.title, page.content),
      });
    }
  }

  await updateDashboardSite(projectId, { status: 'draft' });

  return listProjectPages(projectId);
}

export async function createProjectPage(
  projectId: string,
  input: unknown
): Promise<ProjectEditorPage> {
  const payload = pageCreateSchema.parse(input);
  const slug = await buildUniquePageSlug(projectId, payload.name);

  const page = await createDashboardPage({
    siteId: projectId,
    title: payload.name,
    slug,
    status: 'draft',
    puckData: createPuckDataFromHtml(payload.name, `<h1>${escapeHtml(payload.name)}</h1><p>İçerik ekleyin...</p>`),
  });

  return mapPageForEditor(page);
}

export async function updateProjectPage(
  projectId: string,
  pageId: string,
  input: unknown
): Promise<ProjectEditorPage> {
  const payload = pageUpdateSchema.parse(input);

  const existingPages = await listDashboardPages(projectId);
  const existing = existingPages.find((page) => toStringId(page.id) === pageId);

  if (!existing) {
    throw new Error('Sayfa bulunamadı');
  }

  const updated = await updateDashboardPage(pageId, {
    title: payload.name,
    slug: normalizePageSlug(existing.slug || '/'),
    status: 'draft',
    puckData: createPuckDataFromHtml(payload.name, payload.content),
  });

  return mapPageForEditor(updated);
}
