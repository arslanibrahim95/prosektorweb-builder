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
import { createLayoutDataFromBlocks, createLayoutDataFromHtml, extractHtmlFromLayoutData, normalizePageSlug } from '@/features/dashboard/layout';
import {
  createWebhookTraceId,
  dispatchDemoPublishWebhook,
  normalizeSiteSlug,
  type DemoPublishDispatchResult,
} from '@/features/projects/lib/publish-webhook';
import {
  evaluatePublishQualityGate,
  type EscalationLevel,
  type PublishQualityGateResult,
} from '@/features/projects/lib/quality-gate';
import {
  createMemoryPage,
  createMemorySite,
  findMemorySiteBySlug,
  getMemorySiteById,
  listMemoryPages,
  listMemorySites,
  updateMemoryPage,
  updateMemorySite,
} from '@/features/projects/lib/store/memory-store';
import { DEFAULT_OSGB_TEMPLATE, OSGB_INDUSTRY, normalizeOsgbTemplateId } from '@/features/projects/lib/osgb';

const projectCreateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  template: z.string().trim().max(80).optional(),
  industry: z.string().trim().max(80).optional(),
  contact: z
    .object({
      phone: z.string().trim().max(40).optional().or(z.literal('')),
      email: z.string().trim().max(120).optional().or(z.literal('')),
      address: z.string().trim().max(400).optional().or(z.literal('')),
      city: z.string().trim().max(80).optional().or(z.literal('')),
      district: z.string().trim().max(80).optional().or(z.literal('')),
    })
    .optional(),
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
  contact: ProjectContactInfo;
  status: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  domain: { id: string; name: string } | null;
  pagesCount: number;
  generatedContentsCount: number;
}

export interface ProjectContactInfo {
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
}

export interface ProjectEditorPage {
  id: string;
  name: string;
  slug: string;
  content: string;
  updatedAt: string;
}

export interface PublishProjectResult {
  project: ProjectDetail;
  pagesPublished: number;
  webhook: DemoPublishDispatchResult;
  qualityGate: PublishQualityGateResult;
}

export interface PublishProjectOptions {
  qaScore?: number;
  escalationLevel?: EscalationLevel;
  force?: boolean;
  minQaScore?: number;
  requireQaScore?: boolean;
}

function slugify(input: string): string {
  // Keep URLs stable and readable for Turkish input (e.g. "Düzce" -> "duzce", "Karın" -> "karin").
  const turkishMap: Record<string, string> = {
    İ: 'i',
    I: 'i',
    ı: 'i',
    Ş: 's',
    ş: 's',
    Ğ: 'g',
    ğ: 'g',
    Ü: 'u',
    ü: 'u',
    Ö: 'o',
    ö: 'o',
    Ç: 'c',
    ç: 'c',
  };

  const mapped = input
    .trim()
    .replace(/[İIıŞşĞğÜüÖöÇç]/g, (char) => turkishMap[char] || char)
    .toLowerCase();

  return mapped
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
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

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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

function isMemoryBackend(): boolean {
  return (process.env.PROJECT_BACKEND || '').trim().toLowerCase() === 'memory';
}

async function listSites() {
  if (isMemoryBackend()) return listMemorySites();
  return listDashboardSites();
}

async function findSiteBySlug(slug: string) {
  if (isMemoryBackend()) return findMemorySiteBySlug(slug);
  return findDashboardSiteBySlug(slug);
}

async function getSiteById(siteId: string) {
  if (isMemoryBackend()) return getMemorySiteById(siteId);
  return getDashboardSiteById(siteId);
}

async function createSite(input: {
  name: string;
  slug: string;
  description?: string | null;
  template?: string | null;
  industry?: string | null;
  contact?: ProjectContactInfo | null;
  status?: string;
}) {
  if (isMemoryBackend()) return createMemorySite(input);
  const { contact: _contact, ...dashboardInput } = input;
  return createDashboardSite(dashboardInput);
}

async function updateSite(siteId: string, patch: Record<string, unknown>) {
  if (isMemoryBackend()) return updateMemorySite(siteId, patch);
  const { contact: _contact, ...dashboardPatch } = patch as { contact?: unknown };
  return updateDashboardSite(siteId, dashboardPatch as Record<string, unknown>);
}

async function listPages(siteId: string) {
  if (isMemoryBackend()) return listMemoryPages(siteId);
  return listDashboardPages(siteId);
}

async function createPage(input: {
  siteId: string;
  title: string;
  slug: string;
  layoutData: unknown;
  status?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}) {
  if (isMemoryBackend()) return createMemoryPage(input as never);
  return createDashboardPage(input as never);
}

async function updatePage(pageId: string, patch: Record<string, unknown>) {
  if (isMemoryBackend()) return updateMemoryPage(pageId, patch);
  return updateDashboardPage(pageId, patch);
}

async function buildUniqueSiteSlug(name: string): Promise<string> {
  const base = slugify(name) || 'site';
  let candidate = base;
  let suffix = 1;

  while (suffix < 1000) {
    const exists = await findSiteBySlug(candidate);
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
  const existingPages = await listPages(siteId);
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
  contact?: unknown;
}): Promise<ProjectDetail> {
  const siteId = toStringId(site.id);
  const pages = await listPages(siteId);
  const contact = parseContact(site.contact);

  return {
    id: siteId,
    name: site.name || 'Untitled Site',
    slug: site.slug || '',
    description: site.description || null,
    template: site.template || null,
    industry: site.industry || null,
    contact,
    status: normalizeStatus(site.status),
    progress: pages.length > 0 ? 65 : 0,
    createdAt: site.createdAt || nowIso(),
    updatedAt: site.updatedAt || nowIso(),
    domain: null,
    pagesCount: pages.length,
    generatedContentsCount: pages.length,
  };
}

function parseContact(value: unknown): ProjectContactInfo {
  const record = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

  return {
    phone: toNullableString(record?.phone),
    email: toNullableString(record?.email),
    address: toNullableString(record?.address),
    city: toNullableString(record?.city),
    district: toNullableString(record?.district),
  };
}

function mapPageForEditor(page: {
  id: string | number;
  title?: string | null;
  slug?: string | null;
  layoutData?: unknown;
  updatedAt?: string | null;
}): ProjectEditorPage {
  return {
    id: toStringId(page.id),
    name: page.title || 'Sayfa',
    slug: toEditorSlug(page.slug),
    content: extractHtmlFromLayoutData(page.layoutData as never),
    updatedAt: page.updatedAt || nowIso(),
  };
}

function buildDefaultPages(input: z.infer<typeof generationSchema>) {
  const safeCompany = escapeHtml(input.companyName);
  const safeDescription = escapeHtml(input.description);
  const safePhone = input.phone ? escapeHtml(input.phone) : 'Belirtilmedi';
  const safeEmail = input.email ? escapeHtml(input.email) : 'Belirtilmedi';
  const safeAddress = input.address ? escapeHtml(input.address) : 'Belirtilmedi';

  const rawServices = (input.services || '')
    .split(/[,\n]/)
    .map((service) => service.trim())
    .filter(Boolean)
    .slice(0, 8);

  const serviceTitles =
    rawServices.length > 0
      ? rawServices
      : ['İşyeri hekimliği', 'İş güvenliği uzmanlığı', 'Risk değerlendirmesi', 'İSG eğitimleri'];

  const servicesListHtml = serviceTitles.map((service) => `<li>${escapeHtml(service)}</li>`).join('');

  const normalizeServiceIcon = (title: string): string => {
    const normalized = title.toLowerCase();
    if (normalized.includes('hekim')) return 'Stethoscope';
    if (normalized.includes('eğitim') || normalized.includes('egitim')) return 'GraduationCap';
    if (normalized.includes('risk') || normalized.includes('değerlendirme') || normalized.includes('degerlendirme')) return 'FileCheck';
    if (normalized.includes('hemşire') || normalized.includes('hemsire')) return 'HeartPulse';
    if (normalized.includes('osgb')) return 'Building2';
    return 'Shield';
  };

  const servicesItems = serviceTitles.map((service) => ({
    icon: normalizeServiceIcon(service),
    title: service,
    description:
      'Mevzuata uyum, planlama ve düzenli raporlama ile işletmenize uygun süreç yönetimi.',
  }));

  const homepageContentHtml = `<p>${safeDescription}</p>
<p>İş sağlığı ve güvenliği süreçlerinizi tek noktadan yönetmek için buradayız. Mevzuata uyum, saha planlaması ve periyodik kontrolleri işletmenizin ihtiyaçlarına göre planlarız.</p>
<h2>Öne Çıkan Hizmetler</h2>
<ul>${servicesListHtml}</ul>
<h2>Neden ${safeCompany}?</h2>
<ul>
  <li>Hızlı başlangıç ve net yol haritası</li>
  <li>Denetimlere hazır, düzenli raporlama</li>
  <li>Deneyimli uzman kadro</li>
</ul>`;

  const aboutContentHtml = `<p>${safeCompany} olarak işletmelere güvenilir ve sürdürülebilir İSG çözümleri sunuyoruz.</p>
<p>${safeDescription}</p>
<h2>Misyonumuz</h2>
<p>Çalışan sağlığını koruyan, riskleri azaltan ve yasal uyumu sağlayan süreçler kurmak.</p>
<h2>Vizyonumuz</h2>
<p>Sıfır iş kazası hedefiyle, ölçülebilir ve şeffaf bir İSG yönetimi standartlaştırmak.</p>
<h2>Değerlerimiz</h2>
<ul>
  <li>Şeffaf iletişim</li>
  <li>Önleyici yaklaşım</li>
  <li>Hızlı aksiyon ve takip</li>
</ul>`;

  const servicesContentHtml = `<p>İhtiyacınıza uygun OSGB çözümleri sağlıyoruz. Hizmet kapsamını işletmenizin tehlike sınıfı ve çalışan sayısına göre planlarız.</p>
<h2>Kapsam</h2>
<ul>${servicesListHtml}</ul>
<h2>Süreç Nasıl İlerler?</h2>
<ol>
  <li>Ön analiz ve ihtiyaç tespiti</li>
  <li>Saha ziyaret planı ve görevlendirme</li>
  <li>Dokümantasyon, eğitim ve takip</li>
  <li>Periyodik raporlama ve iyileştirme</li>
</ol>
<p>Detaylı teklif için bizimle iletişime geçebilirsiniz.</p>`;

  const contactContentHtml = `<p>Sorularınız ve teklif talepleriniz için bize ulaşın. En kısa sürede geri dönüş yaparız.</p>
<h2>İletişim Bilgileri</h2>
<p><strong>Telefon:</strong> ${safePhone}</p>
<p><strong>E-posta:</strong> ${safeEmail}</p>
<p><strong>Adres:</strong> ${safeAddress}</p>
<h2>Çalışma Saatleri</h2>
<p>Hafta içi 09:00 - 18:00</p>`;

  return [
    {
      title: 'Ana Sayfa',
      slug: '/',
      seoTitle: `${safeCompany} | Ana Sayfa`,
      seoDescription: safeDescription,
      blocks: [
        {
          blockType: 'hero',
          title: safeCompany,
          subtitle: safeDescription,
          ctaText: 'Ücretsiz Danışmanlık',
          ctaLink: '/iletisim',
          stats: [
            { value: '15+', label: 'Yıl Deneyim', icon: 'Award' },
            { value: '1000+', label: 'İş Yeri', icon: 'Shield' },
            { value: '50.000+', label: 'Çalışan', icon: 'Users' },
          ],
        },
        {
          blockType: 'services',
          sectionTitle: 'Hizmetlerimiz',
          sectionSubtitle: 'İş sağlığı ve güvenliği alanında uçtan uca çözüm',
          items: servicesItems,
        },
        {
          blockType: 'about',
          title: `${safeCompany} Hakkında`,
          description: `<p>${safeCompany}, işletmenize özel İSG süreçleri kurar; periyodik kontrol, eğitim ve raporlama ile denetime hazır hale getirir.</p>`,
          highlights: [
            'Mevzuata uyum takibi',
            'Denetime hazır dokümantasyon',
            'Düzenli saha planlaması',
            'Şeffaf raporlama',
          ],
          experienceYears: 15,
        },
        {
          blockType: 'faq',
          sectionTitle: 'Sıkça Sorulan Sorular',
          items: [
            {
              question: 'Hangi tehlike sınıflarında hizmet veriyorsunuz?',
              answer: 'Az tehlikeli, tehlikeli ve çok tehlikeli tüm sınıflarda ihtiyaçlarınıza göre planlama yapıyoruz.',
            },
            {
              question: 'Süreç ne kadar sürede başlar?',
              answer: 'Ön analiz sonrası hızlı başlangıç yapar, ziyaret planı ve görevlendirmeyi netleştiririz.',
            },
          ],
        },
        {
          blockType: 'cta',
          title: 'Denetime Hazır Süreçler',
          subtitle: 'Ücretsiz ön görüşme için hemen iletişime geçin.',
          buttonText: 'Teklif Al',
          buttonLink: '/iletisim',
          showPhone: true,
        },
        {
          blockType: 'content',
          text: homepageContentHtml,
        },
      ],
    },
    {
      title: 'Hakkımızda',
      slug: '/hakkimizda',
      seoTitle: `${safeCompany} | Hakkımızda`,
      seoDescription: `${safeCompany} hakkında bilgiler`,
      blocks: [
        {
          blockType: 'hero',
          title: 'Hakkımızda',
          subtitle: `${safeCompany} olarak iş sağlığı ve güvenliği alanındaki yaklaşımımız`,
          ctaText: 'İletişime Geç',
          ctaLink: '/iletisim',
        },
        {
          blockType: 'about',
          title: `${safeCompany} Kimdir?`,
          description: aboutContentHtml,
          highlights: ['Şeffaf iletişim', 'Önleyici yaklaşım', 'Hızlı aksiyon ve takip'],
          experienceYears: 15,
        },
        {
          blockType: 'cta',
          title: 'OSGB Çözümleri İçin Yanınızdayız',
          subtitle: 'İş yerinizin ihtiyaçlarına uygun planlama için hemen ulaşın.',
          buttonText: 'Hemen Ulaşın',
          buttonLink: '/iletisim',
          showPhone: true,
        },
        {
          blockType: 'content',
          text: aboutContentHtml,
        },
      ],
    },
    {
      title: 'Hizmetler',
      slug: '/hizmetler',
      seoTitle: `${safeCompany} | Hizmetler`,
      seoDescription: `${safeCompany} hizmetler`,
      blocks: [
        {
          blockType: 'hero',
          title: 'Hizmetlerimiz',
          subtitle: 'İşyeri hekimliği, iş güvenliği uzmanlığı, eğitim ve daha fazlası',
          ctaText: 'Teklif Al',
          ctaLink: '/iletisim',
        },
        {
          blockType: 'services',
          sectionTitle: 'Hizmet Kapsamı',
          sectionSubtitle: 'İşletmenizin tehlike sınıfı ve çalışan sayısına göre planlanır',
          items: servicesItems,
        },
        {
          blockType: 'content',
          text: servicesContentHtml,
        },
        {
          blockType: 'cta',
          title: 'İhtiyacınıza Özel Teklif',
          subtitle: 'Hizmet kapsamını birlikte belirleyelim.',
          buttonText: 'Ücretsiz Teklif',
          buttonLink: '/iletisim',
          showPhone: true,
        },
      ],
    },
    {
      title: 'İletişim',
      slug: '/iletisim',
      seoTitle: `${safeCompany} | İletişim`,
      seoDescription: `${safeCompany} iletişim bilgileri`,
      blocks: [
        {
          blockType: 'hero',
          title: 'İletişim',
          subtitle: 'Sorularınız ve teklif talepleriniz için bize ulaşın',
          ctaText: 'Hemen Ara',
          ctaLink: '/iletisim',
        },
        {
          blockType: 'content',
          text: contactContentHtml,
        },
      ],
    },
  ];
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const sites = await listSites();
  return sites.map(mapSiteToProjectListItem);
}

export async function createProject(input: unknown): Promise<ProjectDetail> {
  const bodyData = projectCreateSchema.parse(input);
  const slug = await buildUniqueSiteSlug(bodyData.name);
  const template = normalizeOsgbTemplateId(bodyData.template || DEFAULT_OSGB_TEMPLATE);
  const contact = parseContact(bodyData.contact);

  const site = await createSite({
    name: bodyData.name,
    slug,
    description: bodyData.description || null,
    template,
    industry: OSGB_INDUSTRY,
    contact,
    status: 'draft',
  });

  return mapSiteToProjectDetail(site);
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const site = await getSiteById(id);
  if (!site) return null;

  return mapSiteToProjectDetail(site);
}

export async function listProjectPages(projectId: string): Promise<ProjectEditorPage[]> {
  const pages = await listPages(projectId);
  return pages.map(mapPageForEditor);
}

export async function generateProjectPages(
  projectId: string,
  input: unknown
): Promise<ProjectEditorPage[]> {
  const bodyData = generationSchema.parse(input);
  const site = await getSiteById(projectId);

  if (!site) {
    throw new Error('Proje bulunamadı');
  }

  const defaults = buildDefaultPages(bodyData);
  const existingPages = await listPages(projectId);
  const bySlug = new Map(existingPages.map((page) => [normalizePageSlug(page.slug || '/'), page]));

  for (const page of defaults) {
    const slug = normalizePageSlug(page.slug);
    const existing = bySlug.get(slug);
    const blocks = (page as { blocks?: Array<{ blockType: string; [key: string]: unknown }> }).blocks;
    const layoutData = Array.isArray(blocks)
      ? createLayoutDataFromBlocks(page.title, blocks)
      : createLayoutDataFromHtml(page.title, (page as { content?: string }).content || '');

    if (existing) {
      await updatePage(toStringId(existing.id), {
        title: page.title,
        slug,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        status: 'draft',
        layoutData,
      });
    } else {
      await createPage({
        siteId: projectId,
        title: page.title,
        slug,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        status: 'draft',
        layoutData,
      });
    }
  }

  await updateSite(projectId, { status: 'draft' });

  return listProjectPages(projectId);
}

export async function createProjectPage(
  projectId: string,
  input: unknown
): Promise<ProjectEditorPage> {
  const bodyData = pageCreateSchema.parse(input);
  const slug = await buildUniquePageSlug(projectId, bodyData.name);

  const page = await createPage({
    siteId: projectId,
    title: bodyData.name,
    slug,
    status: 'draft',
    layoutData: createLayoutDataFromHtml(bodyData.name, `<h1>${escapeHtml(bodyData.name)}</h1><p>İçerik ekleyin...</p>`),
  });

  return mapPageForEditor(page);
}

export async function updateProjectPage(
  projectId: string,
  pageId: string,
  input: unknown
): Promise<ProjectEditorPage> {
  const bodyData = pageUpdateSchema.parse(input);

  const existingPages = await listPages(projectId);
  const existing = existingPages.find((page) => toStringId(page.id) === pageId);

  if (!existing) {
    throw new Error('Sayfa bulunamadı');
  }

  const updated = await updatePage(pageId, {
    title: bodyData.name,
    slug: normalizePageSlug(existing.slug || '/'),
    status: 'draft',
    layoutData: createLayoutDataFromHtml(bodyData.name, bodyData.content),
  });

  return mapPageForEditor(updated);
}

export async function publishProject(
  projectId: string,
  options: PublishProjectOptions = {}
): Promise<PublishProjectResult> {
  const site = await getSiteById(projectId);
  if (!site) {
    throw new Error('Proje bulunamadı');
  }

  const pages = await listPages(projectId);
  const qualityGate = evaluatePublishQualityGate({
    qaScore: options.qaScore,
    threshold: options.minQaScore,
    force: options.force,
    requireScore: options.requireQaScore,
    escalationLevel: options.escalationLevel,
    pages: pages.map((page) => ({
      slug: page.slug,
      status: page.status,
      content: extractHtmlFromLayoutData(page.layoutData as never),
    })),
  });

  if (!qualityGate.passed) {
    throw new Error(
      `${qualityGate.reason || 'Kalite kapisi gecilemedi'} (qaScore=${qualityGate.qaScore}, esik=${qualityGate.threshold}, escalation=${qualityGate.escalationLevel})`
    );
  }

  const pagePaths = pages.map((page) => normalizePageSlug(page.slug || '/'));

  let pagesPublished = 0;
  for (const page of pages) {
    const currentStatus = (page.status || '').toLowerCase();
    if (currentStatus === 'published') continue;

    await updatePage(toStringId(page.id), {
      status: 'published',
    });
    pagesPublished += 1;
  }

  const updatedSite = await updateSite(projectId, { status: 'published' });
  const slug = normalizeSiteSlug(updatedSite.slug || site.slug || '');
  if (!slug) {
    throw new Error('Proje slug bulunamadı');
  }

  const traceId = createWebhookTraceId();
  const webhook = isMemoryBackend()
    ? {
        ok: false,
        skipped: true,
        traceId,
        warning: 'Memory backend: demo publish webhook atlandi.',
      }
    : await dispatchDemoPublishWebhook({
        siteSlug: slug,
        siteId: toStringId(updatedSite.id),
        pages: pagePaths,
        source: 'dashboard',
        traceId,
      });

  return {
    project: await mapSiteToProjectDetail(updatedSite),
    pagesPublished,
    webhook,
    qualityGate,
  };
}
