import {
  DashboardSiteSchema,
  DashboardPageSchema,
  type DashboardSite,
  type DashboardPage,
  type DashboardLayoutData,
} from './contracts';
import { normalizePageSlug } from './layout';
import { getDataInstance } from '@/lib/bodyData';

const collections = {
  sites: process.env.DASHBOARD_SITES_COLLECTION || 'websites',
  pages: process.env.DASHBOARD_PAGES_COLLECTION || 'pages',
  pageSiteField: process.env.DASHBOARD_PAGE_SITE_FIELD || 'site',
};

const apiBase = (process.env.DASHBOARD_API_BASE || process.env.DASHBOARD_PUBLIC_API_BASE || '').replace(/\/$/, '');
const apiToken = process.env.DASHBOARD_API_TOKEN || '';
const localDirectAdapterRaw = (process.env.DASHBOARD_LOCAL_DIRECT_ADAPTER || '').trim().toLowerCase();
const localDirectAdapterEnabled = localDirectAdapterRaw
  ? !['0', 'false', 'no', 'off'].includes(localDirectAdapterRaw)
  : !apiBase;

function ensureDashboardApiConfigured() {
  if (!apiBase && !localDirectAdapterEnabled) {
    throw new Error(
      'Dashboard API base yok. DASHBOARD_API_BASE/DASHBOARD_PUBLIC_API_BASE ayarlayın veya DASHBOARD_LOCAL_DIRECT_ADAPTER=true kullanın.'
    );
  }
}

function buildCollectionUrl(collection: string, suffix = '') {
  ensureDashboardApiConfigured();
  const path = suffix ? `/api/${collection}/${suffix.replace(/^\//, '')}` : `/api/${collection}`;
  return `${apiBase}${path}`;
}

function headers(): HeadersInit {
  if (!apiToken) {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${apiToken}`,
  };
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Dashboard API JSON parse hatası: ${text.slice(0, 180)}`);
  }
}

function extractDocs(bodyData: unknown): unknown[] {
  if (Array.isArray(bodyData)) return bodyData;
  if (bodyData && typeof bodyData === 'object') {
    const objectBody = bodyData as Record<string, unknown>;
    if (Array.isArray(objectBody.docs)) return objectBody.docs;
    if (Array.isArray(objectBody.data)) return objectBody.data;
    if (Array.isArray(objectBody.items)) return objectBody.items;
  }

  return [];
}

function extractDoc(bodyData: unknown): unknown {
  if (bodyData && typeof bodyData === 'object') {
    const objectBody = bodyData as Record<string, unknown>;
    if (objectBody.doc) return objectBody.doc;
    if (objectBody.data) return objectBody.data;
  }

  return bodyData;
}

function parseSite(data: unknown): DashboardSite {
  const parsed = DashboardSiteSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Dashboard site schema uyumsuz: ${parsed.error.issues[0]?.message || 'invalid site bodyData'}`);
  }
  return parsed.data;
}

function parsePage(data: unknown): DashboardPage {
  const parsed = DashboardPageSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Dashboard page schema uyumsuz: ${parsed.error.issues[0]?.message || 'invalid page bodyData'}`);
  }
  return parsed.data;
}

async function request(url: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        ...headers(),
        ...(init?.headers || {}),
      },
      cache: 'no-store',
    });
  } catch (error) {
    throw new Error(
      `Dashboard API erişilemiyor (${apiBase}). ${
        error instanceof Error ? error.message : 'network error'
      }`
    );
  }

  const body = await parseJson(response);

  if (!response.ok) {
    const bodyData = body as Record<string, unknown>;
    const message =
      (typeof bodyData?.error === 'string' && bodyData.error) ||
      (typeof bodyData?.message === 'string' && bodyData.message) ||
      `${response.status} ${response.statusText}`;
    throw new Error(`Dashboard API hatası: ${message}`);
  }

  return body;
}

function normalizeRelationValue(value: string): string | number {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
}

function cleanUndefined(input: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(input).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (typeof value !== 'undefined') {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function buildWhereParam(field: string, value: string | number): string {
  const where = {
    [field]: {
      equals: value,
    },
  };

  return encodeURIComponent(JSON.stringify(where));
}

export interface CreateDashboardSiteInput {
  name: string;
  slug: string;
  description?: string | null;
  template?: string | null;
  industry?: string | null;
  status?: string;
}

export interface CreateDashboardPageInput {
  siteId: string;
  title: string;
  slug: string;
  layoutData: DashboardLayoutData;
  status?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface UpdateDashboardPageInput {
  title?: string;
  slug?: string;
  layoutData?: DashboardLayoutData;
  status?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export async function listDashboardSites(): Promise<DashboardSite[]> {
  if (localDirectAdapterEnabled) {
    const bodyData = (await getDataInstance()) as any;
    const result = await bodyData.find({
      collection: collections.sites as never,
      limit: 100,
      sort: '-updatedAt',
      depth: 1,
      overrideAccess: true,
    });

    return result.docs.map((doc: unknown) => parseSite(doc));
  }

  const url = `${buildCollectionUrl(collections.sites)}?limit=100&sort=-updatedAt&depth=1`;
  const data = await request(url);
  return extractDocs(data).map(parseSite);
}

export async function findDashboardSiteBySlug(slug: string): Promise<DashboardSite | null> {
  if (localDirectAdapterEnabled) {
    const bodyData = (await getDataInstance()) as any;
    const result = await bodyData.find({
      collection: collections.sites as never,
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    });

    if (result.docs.length === 0) return null;
    return parseSite(result.docs[0]);
  }

  const where = buildWhereParam('slug', slug);
  const url = `${buildCollectionUrl(collections.sites)}?where=${where}&limit=1&depth=1`;
  const data = await request(url);
  const docs = extractDocs(data);
  if (docs.length === 0) return null;
  return parseSite(docs[0]);
}

export async function getDashboardSiteById(siteId: string): Promise<DashboardSite | null> {
  if (localDirectAdapterEnabled) {
    const bodyData = (await getDataInstance()) as any;

    try {
      const doc = await bodyData.findByID({
        collection: collections.sites as never,
        id: normalizeRelationValue(siteId),
        depth: 1,
        overrideAccess: true,
      });

      return parseSite(doc);
    } catch {
      return null;
    }
  }

  const url = `${buildCollectionUrl(collections.sites, encodeURIComponent(siteId))}?depth=1`;

  try {
    const data = await request(url);
    return parseSite(extractDoc(data));
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function createDashboardSite(input: CreateDashboardSiteInput): Promise<DashboardSite> {
  const bodyDataRecord = cleanUndefined({
    name: input.name,
    slug: input.slug,
    description: input.description || '',
    status: input.status || 'draft',
    template: input.template || undefined,
    industry: input.industry || undefined,
  });

  if (localDirectAdapterEnabled) {
    const bodyData = (await getDataInstance()) as any;
    const created = await bodyData.create({
      collection: collections.sites as never,
      data: bodyDataRecord,
      overrideAccess: true,
    });

    return parseSite(created);
  }

  const data = await request(buildCollectionUrl(collections.sites), {
    method: 'POST',
    body: JSON.stringify(bodyDataRecord),
  });

  return parseSite(extractDoc(data));
}

export async function updateDashboardSite(
  siteId: string,
  patch: Partial<CreateDashboardSiteInput>
): Promise<DashboardSite> {
  const patchData = cleanUndefined(patch as Record<string, unknown>);

  if (localDirectAdapterEnabled) {
    const bodyData = (await getDataInstance()) as any;
    const updated = await bodyData.update({
      collection: collections.sites as never,
      id: normalizeRelationValue(siteId),
      data: patchData,
      overrideAccess: true,
    });

    return parseSite(updated);
  }

  const data = await request(buildCollectionUrl(collections.sites, encodeURIComponent(siteId)), {
    method: 'PATCH',
    body: JSON.stringify(patchData),
  });

  return parseSite(extractDoc(data));
}

export async function listDashboardPages(siteId: string): Promise<DashboardPage[]> {
  if (localDirectAdapterEnabled) {
    const bodyData = (await getDataInstance()) as any;
    const result = await bodyData.find({
      collection: collections.pages as never,
      where: {
        [collections.pageSiteField]: {
          equals: normalizeRelationValue(siteId),
        },
      },
      limit: 200,
      sort: 'title',
      depth: 1,
      overrideAccess: true,
    });

    return result.docs.map((doc: unknown) => {
      const page = parsePage(doc);
      return {
        ...page,
        slug: normalizePageSlug(page.slug || '/'),
      };
    });
  }

  const where = buildWhereParam(collections.pageSiteField, normalizeRelationValue(siteId));
  const url = `${buildCollectionUrl(collections.pages)}?where=${where}&limit=200&sort=title&depth=1`;
  const data = await request(url);
  return extractDocs(data).map((doc) => {
    const page = parsePage(doc);
    return {
      ...page,
      slug: normalizePageSlug(page.slug || '/'),
    };
  });
}

export async function createDashboardPage(input: CreateDashboardPageInput): Promise<DashboardPage> {
  const bodyDataRecord = cleanUndefined({
    title: input.title,
    slug: normalizePageSlug(input.slug),
    layoutData: input.layoutData,
    status: input.status || 'draft',
    seoTitle: input.seoTitle || undefined,
    seoDescription: input.seoDescription || undefined,
    [collections.pageSiteField]: Number.isNaN(Number(input.siteId)) ? input.siteId : Number(input.siteId),
  });

  if (localDirectAdapterEnabled) {
    const bodyData = (await getDataInstance()) as any;
    const created = await bodyData.create({
      collection: collections.pages as never,
      data: bodyDataRecord,
      overrideAccess: true,
    });

    const page = parsePage(created);
    return {
      ...page,
      slug: normalizePageSlug(page.slug || '/'),
    };
  }

  const data = await request(buildCollectionUrl(collections.pages), {
    method: 'POST',
    body: JSON.stringify(bodyDataRecord),
  });

  const page = parsePage(extractDoc(data));
  return {
    ...page,
    slug: normalizePageSlug(page.slug || '/'),
  };
}

export async function updateDashboardPage(pageId: string, patch: UpdateDashboardPageInput): Promise<DashboardPage> {
  const bodyDataRecord: Record<string, unknown> = {
    ...patch,
  };

  if (typeof patch.slug === 'string') {
    bodyDataRecord.slug = normalizePageSlug(patch.slug);
  }

  const sanitizedBody = cleanUndefined(bodyDataRecord);

  if (localDirectAdapterEnabled) {
    const bodyData = (await getDataInstance()) as any;
    const updated = await bodyData.update({
      collection: collections.pages as never,
      id: normalizeRelationValue(pageId),
      data: sanitizedBody,
      overrideAccess: true,
    });

    const page = parsePage(updated);
    return {
      ...page,
      slug: normalizePageSlug(page.slug || '/'),
    };
  }

  const data = await request(buildCollectionUrl(collections.pages, encodeURIComponent(pageId)), {
    method: 'PATCH',
    body: JSON.stringify(sanitizedBody),
  });

  const page = parsePage(extractDoc(data));
  return {
    ...page,
    slug: normalizePageSlug(page.slug || '/'),
  };
}
