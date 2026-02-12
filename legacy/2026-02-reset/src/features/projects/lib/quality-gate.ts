export type EscalationLevel = 'none' | 'low' | 'medium' | 'high';

export interface QualityGatePageInput {
  slug?: string | null;
  status?: string | null;
  content?: string | null;
}

export interface PublishQualityGateInput {
  qaScore?: number | null;
  threshold?: number;
  force?: boolean;
  requireScore?: boolean;
  pages?: QualityGatePageInput[];
  escalationLevel?: EscalationLevel;
}

export interface PublishQualityGateResult {
  source: 'provided' | 'heuristic';
  qaScore: number;
  threshold: number;
  requireScore: boolean;
  escalationLevel: EscalationLevel;
  passed: boolean;
  forced: boolean;
  reason?: string;
}

const REQUIRED_PAGE_SLUGS = ['/', '/hakkimizda', '/hizmetler', '/iletisim'];

function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return Math.round(value);
}

export function getPublishQualityThreshold(): number {
  const parsed = Number.parseInt(process.env.PUBLISH_MIN_QA_SCORE || '', 10);
  if (!Number.isFinite(parsed)) return 70;
  return clampScore(parsed);
}

export function getPublishRequireScore(): boolean {
  return parseBooleanEnv(process.env.PUBLISH_REQUIRE_QA_SCORE, false);
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizePageSlug(value: string | null | undefined): string {
  if (!value) return '/';
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '/';
  return (trimmed.startsWith('/') ? trimmed : `/${trimmed}`).replace(/\/+/g, '/');
}

function normalizePageStatus(value: string | null | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function estimateQAScoreFromPages(pages: QualityGatePageInput[]): number {
  if (!Array.isArray(pages) || pages.length === 0) {
    return 20;
  }

  let score = 35;

  const pageCount = pages.length;
  if (pageCount >= 4) score += 20;
  else score += pageCount * 5;

  const contentLengths = pages.map((page) => stripHtml(page.content || '').length);
  const averageLength =
    contentLengths.reduce((sum, length) => sum + length, 0) / contentLengths.length;

  if (averageLength >= 1200) score += 20;
  else if (averageLength >= 700) score += 16;
  else if (averageLength >= 400) score += 12;
  else if (averageLength >= 200) score += 6;

  const publishedCount = pages.filter(
    (page) => normalizePageStatus(page.status).includes('publish')
  ).length;
  score += (publishedCount / pageCount) * 15;

  const normalizedSlugs = new Set(pages.map((page) => normalizePageSlug(page.slug)));
  const requiredCoverage =
    REQUIRED_PAGE_SLUGS.filter((slug) => normalizedSlugs.has(slug)).length /
    REQUIRED_PAGE_SLUGS.length;
  score += requiredCoverage * 10;

  const emptyPages = contentLengths.filter((len) => len < 80).length;
  if (emptyPages > 0) {
    score -= Math.min(15, emptyPages * 4);
  }

  return clampScore(score);
}

const ESCALATION_SEVERITY: Record<EscalationLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

function mergeEscalationLevel(
  computed: EscalationLevel,
  requested?: EscalationLevel
): EscalationLevel {
  if (!requested) return computed;
  return ESCALATION_SEVERITY[requested] >= ESCALATION_SEVERITY[computed]
    ? requested
    : computed;
}

export function deriveEscalationLevel(qaScore: number, threshold: number): EscalationLevel {
  if (qaScore >= threshold + 15) return 'none';
  if (qaScore >= threshold) return 'low';
  if (qaScore >= threshold - 10) return 'medium';
  return 'high';
}

export function evaluatePublishQualityGate(
  input: PublishQualityGateInput = {}
): PublishQualityGateResult {
  const threshold = clampScore(input.threshold ?? getPublishQualityThreshold());
  const force = Boolean(input.force);
  const hasProvidedScore =
    typeof input.qaScore === 'number' && Number.isFinite(input.qaScore);
  const qaScore = hasProvidedScore
    ? clampScore(input.qaScore as number)
    : estimateQAScoreFromPages(input.pages || []);
  const requireScore = input.requireScore ?? getPublishRequireScore();

  const computedEscalation = deriveEscalationLevel(qaScore, threshold);
  const escalationLevel = mergeEscalationLevel(computedEscalation, input.escalationLevel);

  if (force) {
    return {
      source: hasProvidedScore ? 'provided' : 'heuristic',
      qaScore,
      threshold,
      requireScore,
      escalationLevel,
      passed: true,
      forced: true,
      reason: 'Yayinlama kalite kapisi force ile gecildi.',
    };
  }

  if (requireScore && !hasProvidedScore) {
    return {
      source: 'heuristic',
      qaScore,
      threshold,
      requireScore,
      escalationLevel,
      passed: false,
      forced: false,
      reason:
        'Yayinlama kalite kapisi icin acik qaScore zorunlu. qaScore veya force=true gonderin.',
    };
  }

  if (qaScore < threshold) {
    return {
      source: hasProvidedScore ? 'provided' : 'heuristic',
      qaScore,
      threshold,
      requireScore,
      escalationLevel,
      passed: false,
      forced: false,
      reason: `Kalite skoru esik altinda (${qaScore}/${threshold}).`,
    };
  }

  return {
    source: hasProvidedScore ? 'provided' : 'heuristic',
    qaScore,
    threshold,
    requireScore,
    escalationLevel,
    passed: true,
    forced: false,
  };
}
