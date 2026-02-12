import { randomUUID } from 'node:crypto';

import type { DashboardPage, DashboardPuckData, DashboardSite } from '@/features/dashboard/contracts';
import { normalizePageSlug } from '@/features/dashboard/puck';

type SiteId = number;
type PageId = number;

export interface MemorySiteContactInfo {
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
}

export interface MemoryCreateSiteInput {
  name: string;
  slug: string;
  description?: string | null;
  template?: string | null;
  industry?: string | null;
  contact?: MemorySiteContactInfo | null;
  status?: string | null;
}

export interface MemoryUpdateSiteInput {
  name?: string;
  slug?: string;
  description?: string | null;
  template?: string | null;
  industry?: string | null;
  contact?: MemorySiteContactInfo | null;
  status?: string | null;
}

export interface MemoryCreatePageInput {
  siteId: string | number;
  title: string;
  slug: string;
  puckData: DashboardPuckData;
  status?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface MemoryUpdatePageInput {
  title?: string;
  slug?: string;
  puckData?: DashboardPuckData;
  status?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

interface MemorySite extends DashboardSite {
  id: SiteId;
  name: string;
  slug: string;
  description: string | null;
  template: string | null;
  industry: string | null;
  contact: MemorySiteContactInfo | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MemoryPage extends DashboardPage {
  id: PageId;
  siteId: SiteId;
  title: string;
  slug: string;
  status: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  puckData: DashboardPuckData;
  createdAt: string;
  updatedAt: string;
}

interface MemoryState {
  nextSiteId: number;
  nextPageId: number;
  sitesById: Map<SiteId, MemorySite>;
  siteIdBySlug: Map<string, SiteId>;
  pagesById: Map<PageId, MemoryPage>;
  pageIdsBySiteId: Map<SiteId, Set<PageId>>;
  seed: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeSiteSlug(value: string): string {
  return value.trim().toLowerCase();
}

function parseNumericId(value: string | number): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function getState(): MemoryState {
  const globalAny = globalThis as unknown as { __prosektorMemoryState?: MemoryState };

  if (!globalAny.__prosektorMemoryState) {
    globalAny.__prosektorMemoryState = {
      nextSiteId: 1,
      nextPageId: 1,
      sitesById: new Map(),
      siteIdBySlug: new Map(),
      pagesById: new Map(),
      pageIdsBySiteId: new Map(),
      seed: randomUUID(),
    };
  }

  return globalAny.__prosektorMemoryState;
}

export function resetMemoryStore(): void {
  const globalAny = globalThis as unknown as { __prosektorMemoryState?: MemoryState };
  globalAny.__prosektorMemoryState = undefined;
}

function resolveSiteId(value: string | number): SiteId {
  const parsed = parseNumericId(value);
  if (!parsed) {
    throw new Error('Gecersiz site id');
  }
  return parsed;
}

function resolvePageId(value: string | number): PageId {
  const parsed = parseNumericId(value);
  if (!parsed) {
    throw new Error('Gecersiz page id');
  }
  return parsed;
}

export async function listMemorySites(): Promise<DashboardSite[]> {
  const state = getState();
  const sites = Array.from(state.sitesById.values());

  sites.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  return sites;
}

export async function findMemorySiteBySlug(slug: string): Promise<DashboardSite | null> {
  const state = getState();
  const normalized = normalizeSiteSlug(slug);
  const siteId = state.siteIdBySlug.get(normalized);
  if (!siteId) return null;

  return state.sitesById.get(siteId) || null;
}

export async function getMemorySiteById(siteId: string | number): Promise<DashboardSite | null> {
  const state = getState();
  const resolved = resolveSiteId(siteId);
  return state.sitesById.get(resolved) || null;
}

export async function createMemorySite(input: MemoryCreateSiteInput): Promise<DashboardSite> {
  const state = getState();
  const slug = normalizeSiteSlug(input.slug);
  const existingId = state.siteIdBySlug.get(slug);
  if (existingId) {
    throw new Error('Bu slug ile zaten bir site var');
  }

  const timestamp = nowIso();
  const siteId = state.nextSiteId;
  state.nextSiteId += 1;

  const site: MemorySite = {
    id: siteId,
    name: input.name,
    slug,
    description: input.description ?? null,
    template: input.template ?? null,
    industry: input.industry ?? null,
    contact: input.contact ?? null,
    status: input.status ?? 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  state.sitesById.set(siteId, site);
  state.siteIdBySlug.set(slug, siteId);
  return site;
}

export async function updateMemorySite(
  siteId: string | number,
  patch: MemoryUpdateSiteInput
): Promise<DashboardSite> {
  const state = getState();
  const resolved = resolveSiteId(siteId);
  const existing = state.sitesById.get(resolved);
  if (!existing) {
    throw new Error('Site bulunamadi');
  }

  let nextSlug = existing.slug;
  if (typeof patch.slug === 'string') {
    nextSlug = normalizeSiteSlug(patch.slug);
  }

  if (nextSlug !== existing.slug) {
    const collision = state.siteIdBySlug.get(nextSlug);
    if (collision && collision !== resolved) {
      throw new Error('Bu slug ile zaten bir site var');
    }
    state.siteIdBySlug.delete(existing.slug);
    state.siteIdBySlug.set(nextSlug, resolved);
  }

  const updated: MemorySite = {
    ...existing,
    ...patch,
    slug: nextSlug,
    updatedAt: nowIso(),
  };

  state.sitesById.set(resolved, updated);
  return updated;
}

export async function listMemoryPages(siteId: string | number): Promise<DashboardPage[]> {
  const state = getState();
  const resolved = resolveSiteId(siteId);
  const pageIds = state.pageIdsBySiteId.get(resolved);
  if (!pageIds) return [];

  const pages = Array.from(pageIds)
    .map((id) => state.pagesById.get(id))
    .filter(Boolean) as MemoryPage[];

  pages.sort((a, b) => (a.slug || '').localeCompare(b.slug || '') || (a.title || '').localeCompare(b.title || ''));
  return pages;
}

export async function createMemoryPage(input: MemoryCreatePageInput): Promise<DashboardPage> {
  const state = getState();
  const resolvedSiteId = resolveSiteId(input.siteId);
  if (!state.sitesById.has(resolvedSiteId)) {
    throw new Error('Site bulunamadi');
  }

  const timestamp = nowIso();
  const pageId = state.nextPageId;
  state.nextPageId += 1;

  const page: MemoryPage = {
    id: pageId,
    siteId: resolvedSiteId,
    title: input.title,
    slug: normalizePageSlug(input.slug),
    status: input.status ?? 'draft',
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    puckData: input.puckData,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  state.pagesById.set(pageId, page);
  const set = state.pageIdsBySiteId.get(resolvedSiteId) || new Set<PageId>();
  set.add(pageId);
  state.pageIdsBySiteId.set(resolvedSiteId, set);
  return page;
}

export async function updateMemoryPage(pageId: string | number, patch: MemoryUpdatePageInput): Promise<DashboardPage> {
  const state = getState();
  const resolvedPageId = resolvePageId(pageId);
  const existing = state.pagesById.get(resolvedPageId);
  if (!existing) {
    throw new Error('Sayfa bulunamadi');
  }

  const nextSlug = typeof patch.slug === 'string' ? normalizePageSlug(patch.slug) : existing.slug;

  const updated: MemoryPage = {
    ...existing,
    ...patch,
    slug: nextSlug,
    updatedAt: nowIso(),
  };

  state.pagesById.set(resolvedPageId, updated);
  return updated;
}
