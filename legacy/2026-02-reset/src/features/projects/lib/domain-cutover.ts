import { prisma } from '@/server/db';
import { getCloudflareService, getDefaultServerIp } from '@/server/integrations/cloudflare';

export type DomainLifecycleStatus =
  | 'PENDING'
  | 'PURCHASED'
  | 'ZONE_CREATED'
  | 'DNS_CONFIGURED'
  | 'DNS_PROPAGATED'
  | 'SSL_PENDING'
  | 'SSL_ACTIVE'
  | 'CUTOVER_READY'
  | 'LIVE'
  | 'CUTOVER_FAILED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'DELETED';

export type CutoverHealthStatus = 'healthy' | 'unhealthy' | 'unknown';
export type CutoverSslStatus = 'active' | 'pending' | 'error' | 'unknown';

export interface DomainCutoverMeta {
  previewTarget?: string | null;
  liveTarget?: string | null;
  lastHealthCheckAt?: string | null;
  lastHealthStatus?: CutoverHealthStatus | null;
  cutoverAt?: string | null;
  failureReason?: string | null;
  sslStatus?: CutoverSslStatus | null;
  propagationVerifiedAt?: string | null;
  updatedAt?: string | null;
}

type DomainWithProject = {
  id: string;
  name: string;
  status: string;
  serverIp: string | null;
  notes: string | null;
  project: {
    id: string;
    slug: string;
    status: string;
    siteUrl: string | null;
  } | null;
};

export interface CutoverStatusResponse {
  domainId: string;
  domain: string;
  lifecycle: DomainLifecycleStatus;
  meta: DomainCutoverMeta;
  canonicalUrl: string | null;
  projectId: string | null;
  projectStatus: string | null;
  siteUrl: string | null;
}

export interface StartCutoverResult {
  success: boolean;
  ready: boolean;
  message: string;
  status: CutoverStatusResponse;
}

const CUTOVER_META_PREFIX = '__CUTOVER_META__=';
const DEFAULT_TIMEOUT_MS = 4000;

function nowIso(): string {
  return new Date().toISOString();
}

function toLifecycleStatus(value: string | null | undefined): DomainLifecycleStatus {
  const normalized = String(value || 'PENDING').toUpperCase();
  return normalized as DomainLifecycleStatus;
}

function normalizeDomainUrl(domain: string): string {
  const cleaned = domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  return `https://${cleaned}`;
}

function parseCutoverMetaLine(line: string): DomainCutoverMeta | null {
  if (!line.startsWith(CUTOVER_META_PREFIX)) return null;
  const raw = line.slice(CUTOVER_META_PREFIX.length).trim();
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      previewTarget:
        typeof parsed.previewTarget === 'string' ? parsed.previewTarget : null,
      liveTarget: typeof parsed.liveTarget === 'string' ? parsed.liveTarget : null,
      lastHealthCheckAt:
        typeof parsed.lastHealthCheckAt === 'string' ? parsed.lastHealthCheckAt : null,
      lastHealthStatus:
        parsed.lastHealthStatus === 'healthy' ||
        parsed.lastHealthStatus === 'unhealthy' ||
        parsed.lastHealthStatus === 'unknown'
          ? parsed.lastHealthStatus
          : null,
      cutoverAt: typeof parsed.cutoverAt === 'string' ? parsed.cutoverAt : null,
      failureReason:
        typeof parsed.failureReason === 'string' ? parsed.failureReason : null,
      sslStatus:
        parsed.sslStatus === 'active' ||
        parsed.sslStatus === 'pending' ||
        parsed.sslStatus === 'error' ||
        parsed.sslStatus === 'unknown'
          ? parsed.sslStatus
          : null,
      propagationVerifiedAt:
        typeof parsed.propagationVerifiedAt === 'string'
          ? parsed.propagationVerifiedAt
          : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    };
  } catch {
    return null;
  }
}

export function parseCutoverMetaFromNotes(
  notes: string | null | undefined
): DomainCutoverMeta {
  const content = notes || '';
  const line = content
    .split('\n')
    .map((row) => row.trim())
    .find((row) => row.startsWith(CUTOVER_META_PREFIX));

  if (!line) return {};
  return parseCutoverMetaLine(line) || {};
}

export function mergeCutoverMetaIntoNotes(
  currentNotes: string | null | undefined,
  patch: Partial<DomainCutoverMeta>
): string {
  const existing = parseCutoverMetaFromNotes(currentNotes);
  const merged: DomainCutoverMeta = {
    ...existing,
    ...patch,
    updatedAt: nowIso(),
  };

  const baseLines = (currentNotes || '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line && !line.startsWith(CUTOVER_META_PREFIX));

  baseLines.push(`${CUTOVER_META_PREFIX}${JSON.stringify(merged)}`);
  return baseLines.join('\n');
}

function buildPreviewTarget(projectSlug: string): string {
  const demoBase =
    process.env.NEXT_PUBLIC_DEMO_BASE_URL ||
    process.env.DEMO_BASE_URL ||
    'https://demo.prosektorweb.com';
  const sanitizedBase = demoBase.replace(/\/+$/, '');
  return `${sanitizedBase}/${projectSlug}`;
}

async function healthCheck(url: string): Promise<CutoverHealthStatus> {
  const timeoutMs = Number.parseInt(process.env.CUTOVER_HEALTHCHECK_TIMEOUT_MS || '', 10);
  const safeTimeoutMs = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), safeTimeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'text/html' },
    });

    return response.ok ? 'healthy' : 'unhealthy';
  } catch {
    return 'unhealthy';
  } finally {
    clearTimeout(timeout);
  }
}

async function getDomainWithProject(domainId: string): Promise<DomainWithProject | null> {
  return prisma.domain.findUnique({
    where: { id: domainId },
    include: {
      project: {
        select: {
          id: true,
          slug: true,
          status: true,
          siteUrl: true,
        },
      },
    },
  }) as unknown as Promise<DomainWithProject | null>;
}

async function buildStatusResponse(domain: DomainWithProject): Promise<CutoverStatusResponse> {
  const meta = parseCutoverMetaFromNotes(domain.notes);
  const canonicalUrl =
    domain.status.toUpperCase() === 'LIVE'
      ? normalizeDomainUrl(domain.name)
      : meta.previewTarget || null;

  return {
    domainId: domain.id,
    domain: domain.name,
    lifecycle: toLifecycleStatus(domain.status),
    meta,
    canonicalUrl,
    projectId: domain.project?.id || null,
    projectStatus: domain.project?.status || null,
    siteUrl: domain.project?.siteUrl || null,
  };
}

async function updateDomainState(input: {
  domain: DomainWithProject;
  lifecycle: DomainLifecycleStatus;
  metaPatch?: Partial<DomainCutoverMeta>;
}): Promise<DomainWithProject> {
  const notes = input.metaPatch
    ? mergeCutoverMetaIntoNotes(input.domain.notes, input.metaPatch)
    : input.domain.notes;

  await prisma.domain.update({
    where: { id: input.domain.id },
    data: {
      status: input.lifecycle,
      notes,
    },
  });

  const refreshed = await getDomainWithProject(input.domain.id);
  if (!refreshed) {
    throw new Error('Domain güncelleme sonrası bulunamadı');
  }
  return refreshed;
}

export async function getCutoverStatus(domainId: string): Promise<CutoverStatusResponse> {
  const domain = await getDomainWithProject(domainId);
  if (!domain) {
    throw new Error('Domain bulunamadı');
  }
  return buildStatusResponse(domain);
}

export async function startCutover(domainId: string): Promise<StartCutoverResult> {
  let domain = await getDomainWithProject(domainId);
  if (!domain) {
    throw new Error('Domain bulunamadı');
  }

  if (!domain.project) {
    domain = await updateDomainState({
      domain,
      lifecycle: 'CUTOVER_FAILED',
      metaPatch: {
        failureReason: 'Domain bir projeye bağlı değil',
        lastHealthStatus: 'unknown',
      },
    });

    return {
      success: false,
      ready: false,
      message: 'Domain bir projeye bağlı değil',
      status: await buildStatusResponse(domain),
    };
  }

  const projectId = domain.project.id;
  const previewTarget = buildPreviewTarget(domain.project.slug);
  const liveTarget = normalizeDomainUrl(domain.name);

  domain = await updateDomainState({
    domain,
    lifecycle: 'PURCHASED',
    metaPatch: {
      previewTarget,
      liveTarget,
      failureReason: null,
      cutoverAt: null,
    },
  });

  const cf = await getCloudflareService();
  if (!cf) {
    domain = await updateDomainState({
      domain,
      lifecycle: 'CUTOVER_FAILED',
      metaPatch: {
        failureReason: 'Cloudflare servisi yapılandırılmamış',
      },
    });

    return {
      success: false,
      ready: false,
      message: 'Cloudflare servisi yapılandırılmamış',
      status: await buildStatusResponse(domain),
    };
  }

  let zone = await cf.getZoneByName(domain.name);
  if (!zone) {
    const zoneResult = await cf.createZone(domain.name);
    if (!zoneResult.success || !zoneResult.zone) {
      domain = await updateDomainState({
        domain,
        lifecycle: 'CUTOVER_FAILED',
        metaPatch: {
          failureReason: zoneResult.error || 'Zone oluşturulamadı',
        },
      });

      return {
        success: false,
        ready: false,
        message: zoneResult.error || 'Zone oluşturulamadı',
        status: await buildStatusResponse(domain),
      };
    }

    zone = zoneResult.zone;
  }

  domain = await updateDomainState({
    domain,
    lifecycle: 'ZONE_CREATED',
  });

  const serverIp = domain.serverIp || getDefaultServerIp();
  if (!serverIp) {
    domain = await updateDomainState({
      domain,
      lifecycle: 'CUTOVER_FAILED',
      metaPatch: {
        failureReason: 'Sunucu IP adresi bulunamadı',
      },
    });

    return {
      success: false,
      ready: false,
      message: 'Sunucu IP adresi bulunamadı',
      status: await buildStatusResponse(domain),
    };
  }

  const dnsResult = await cf.createStandardWebsiteDns(zone.id, domain.name, serverIp);
  if (!dnsResult.success) {
    domain = await updateDomainState({
      domain,
      lifecycle: 'CUTOVER_FAILED',
      metaPatch: {
        failureReason: dnsResult.error || 'DNS kayıtları oluşturulamadı',
      },
    });

    return {
      success: false,
      ready: false,
      message: dnsResult.error || 'DNS kayıtları oluşturulamadı',
      status: await buildStatusResponse(domain),
    };
  }

  domain = await updateDomainState({
    domain,
    lifecycle: 'DNS_CONFIGURED',
  });

  const propagation = await cf.verifyDnsPropagation(domain.name, serverIp);
  if (!propagation.propagated) {
    domain = await updateDomainState({
      domain,
      lifecycle: 'DNS_CONFIGURED',
      metaPatch: {
        failureReason: propagation.error || 'DNS yayılımı henüz tamamlanmadı',
      },
    });

    return {
      success: true,
      ready: false,
      message: propagation.error || 'DNS yayılımı bekleniyor',
      status: await buildStatusResponse(domain),
    };
  }

  domain = await updateDomainState({
    domain,
    lifecycle: 'DNS_PROPAGATED',
    metaPatch: {
      propagationVerifiedAt: nowIso(),
      failureReason: null,
    },
  });

  const sslStatus = await cf.getSSLStatus(domain.name);
  if (sslStatus.status !== 'active') {
    domain = await updateDomainState({
      domain,
      lifecycle: 'SSL_PENDING',
      metaPatch: {
        sslStatus: sslStatus.status,
        failureReason: sslStatus.error || 'SSL henüz aktif değil',
      },
    });

    return {
      success: true,
      ready: false,
      message: sslStatus.error || 'SSL bekleniyor',
      status: await buildStatusResponse(domain),
    };
  }

  domain = await updateDomainState({
    domain,
    lifecycle: 'SSL_ACTIVE',
    metaPatch: {
      sslStatus: 'active',
      failureReason: null,
    },
  });

  const previewHealth = await healthCheck(previewTarget);
  if (previewHealth !== 'healthy') {
    domain = await updateDomainState({
      domain,
      lifecycle: 'CUTOVER_FAILED',
      metaPatch: {
        lastHealthCheckAt: nowIso(),
        lastHealthStatus: 'unhealthy',
        failureReason: 'Preview health check başarısız',
      },
    });

    return {
      success: false,
      ready: false,
      message: 'Preview health check başarısız',
      status: await buildStatusResponse(domain),
    };
  }

  domain = await updateDomainState({
    domain,
    lifecycle: 'CUTOVER_READY',
    metaPatch: {
      lastHealthCheckAt: nowIso(),
      lastHealthStatus: 'healthy',
    },
  });

  await prisma.webProject.update({
    where: { id: projectId },
    data: {
      siteUrl: liveTarget,
      status: 'LIVE',
      completedAt: new Date(),
    },
  });

  domain = await updateDomainState({
    domain,
    lifecycle: 'LIVE',
    metaPatch: {
      cutoverAt: nowIso(),
      failureReason: null,
    },
  });

  return {
    success: true,
    ready: true,
    message: 'Domain cutover tamamlandı',
    status: await buildStatusResponse(domain),
  };
}

export async function retryCutover(domainId: string): Promise<StartCutoverResult> {
  return startCutover(domainId);
}

export async function rollbackCutover(
  domainId: string,
  reason = 'Manuel rollback'
): Promise<StartCutoverResult> {
  let domain = await getDomainWithProject(domainId);
  if (!domain) {
    throw new Error('Domain bulunamadı');
  }

  const meta = parseCutoverMetaFromNotes(domain.notes);
  const fallbackSiteUrl = meta.previewTarget || null;

  if (domain.project) {
    await prisma.webProject.update({
      where: { id: domain.project.id },
      data: {
        siteUrl: fallbackSiteUrl,
        status: 'REVIEW',
      },
    });
  }

  domain = await updateDomainState({
    domain,
    lifecycle: 'CUTOVER_FAILED',
    metaPatch: {
      failureReason: reason,
      cutoverAt: null,
    },
  });

  return {
    success: true,
    ready: false,
    message: 'Rollback tamamlandı',
    status: await buildStatusResponse(domain),
  };
}
