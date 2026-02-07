import type { PipelineShareInfo } from "./types";

const DEFAULT_DEMO_BASE_URL = "https://demo.prosektorweb.com";

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_DEMO_BASE_URL;

  try {
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return DEFAULT_DEMO_BASE_URL;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/_/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toValidSlug(value: string | null | undefined): string {
  const normalized = slugify(value || "");
  return normalized || "site";
}

export function resolveDemoBaseUrl(explicit?: string): string {
  return normalizeBaseUrl(
    explicit ||
      process.env.DEMO_BASE_URL ||
      process.env.NEXT_PUBLIC_DEMO_BASE_URL ||
      DEFAULT_DEMO_BASE_URL
  );
}

export function createPipelineShareInfo(params: {
  slug?: string | null;
  source: "build" | "publish";
  demoBaseUrl?: string;
}): PipelineShareInfo {
  const baseUrl = resolveDemoBaseUrl(params.demoBaseUrl);
  const baseHost = new URL(baseUrl).host;
  const slug = toValidSlug(params.slug);
  const path = `/${slug}`;
  const hasInputSlug = typeof params.slug === "string" && params.slug.trim().length > 0;

  return {
    baseHost,
    slug,
    path,
    url: `${baseUrl}${path}`,
    ready: hasInputSlug,
    source: params.source,
  };
}

export function normalizePipelineStageShare<T extends Record<string, unknown>>(
  stage: "build" | "publish",
  output: T,
  options?: {
    slug?: string | null;
    demoBaseUrl?: string;
  }
): T & { share: PipelineShareInfo } {
  const existingShare =
    output.share && typeof output.share === "object"
      ? (output.share as Record<string, unknown>)
      : null;

  const slugCandidate =
    (typeof existingShare?.slug === "string" && existingShare.slug) ||
    (typeof options?.slug === "string" && options.slug) ||
    (typeof output.slug === "string" && output.slug) ||
    null;

  const share = createPipelineShareInfo({
    source: stage,
    slug: slugCandidate,
    demoBaseUrl: options?.demoBaseUrl,
  });

  const normalized = {
    ...output,
    share,
  } as T & { share: PipelineShareInfo };

  if (stage === "build" && typeof normalized.previewUrl !== "string") {
    (normalized as Record<string, unknown>).previewUrl = share.url;
  }

  if (stage === "publish" && typeof normalized.url !== "string") {
    (normalized as Record<string, unknown>).url = share.url;
  }

  return normalized;
}

