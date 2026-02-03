/**
 * Context Memo - Pipeline boyunca taşınan değiştirilemez bağlam
 *
 * Bu modül, AI agentlerin:
 * - Halüsinasyon yapmamasını (sadece memo'daki veriyi kullan)
 * - Bağlamı kaybetmemesini (memo her stage'de mevcut)
 * - Tutarlı kalmasını (memo değiştirilemez)
 * sağlar.
 */

import { InputStageOutput, DesignStageOutput, ResearchStageOutput } from "./types";
import crypto from "crypto";

// ============================================
// CONTEXT MEMO TYPES
// ============================================

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  workingHours?: string;
  mapUrl?: string;
}

export interface CompanyContext {
  readonly name: string;
  readonly industry?: string;
  readonly description?: string;
  readonly tone: "professional" | "friendly" | "formal" | "casual";
  readonly targetAudience: string[];
}

export interface DesignContext {
  readonly colors: {
    readonly primary: string;
    readonly primaryLight: string;
    readonly primaryDark: string;
    readonly secondary: string;
    readonly accent: string;
    readonly background: string;
    readonly text: string;
  };
  readonly fonts: {
    readonly heading: string;
    readonly body: string;
  };
  readonly layout: {
    readonly style: string;
    readonly heroType: string;
    readonly borderRadius: string;
  };
}

export interface ContentConstraints {
  readonly allowedPages: string[];
  readonly allowedServices: string[];
  readonly focusKeywords: string[];
  readonly competitors: string[];
  readonly forbiddenTopics: string[];
}

export interface ContextMemo {
  // Metadata
  readonly id: string;
  readonly createdAt: Date;
  readonly hash: string;

  // Company info (from INPUT stage)
  readonly company: CompanyContext;

  // Contact info (NEVER fabricate!)
  readonly contact: ContactInfo;

  // Design tokens (from DESIGN stage)
  readonly design?: DesignContext;

  // Content constraints
  readonly constraints: ContentConstraints;

  // Domain info
  readonly domain?: string;
}

// ============================================
// CONTEXT MEMO BUILDER
// ============================================

// Mutable version for building
type MutableContextMemo = {
  -readonly [K in keyof ContextMemo]: ContextMemo[K];
};

export class ContextMemoBuilder {
  private memo: any = {};

  /**
   * Create memo from INPUT stage output
   */
  fromInput(input: InputStageOutput): this {
    this.memo.id = crypto.randomUUID();
    this.memo.createdAt = new Date();

    this.memo.company = {
      name: input.company.name,
      industry: input.company.industry,
      description: input.company.description,
      tone: input.company.tone,
      targetAudience: input.company.targetAudience || [],
    };

    this.memo.constraints = {
      allowedPages: input.pages.map((p) => p.slug),
      allowedServices: [], // Will be populated from research
      focusKeywords: [],
      competitors: [],
      forbiddenTopics: [],
    };

    return this;
  }

  /**
   * Add contact info (must be provided, never fabricated)
   */
  withContact(contact: ContactInfo): this {
    this.memo.contact = { ...contact };
    return this;
  }

  /**
   * Add design context from DESIGN stage
   */
  withDesign(design: DesignStageOutput): this {
    this.memo.design = {
      colors: {
        primary: design.colors.primary,
        primaryLight: design.colors.primaryLight,
        primaryDark: design.colors.primaryDark,
        secondary: design.colors.secondary,
        accent: design.colors.accent,
        background: design.colors.background,
        text: design.colors.text,
      },
      fonts: {
        heading: design.typography.headingFont,
        body: design.typography.bodyFont,
      },
      layout: {
        style: design.layout.style,
        heroType: design.layout.heroType,
        borderRadius: design.layout.borderRadius,
      },
    };
    return this;
  }

  /**
   * Add research context
   */
  withResearch(research: ResearchStageOutput): this {
    if (this.memo.constraints) {
      this.memo.constraints = {
        ...this.memo.constraints,
        focusKeywords: [
          ...research.keywords.primary,
          ...research.keywords.secondary.slice(0, 3),
        ],
        competitors: research.competitorAnalysis?.map((c) => c.name) || [],
      };
    }
    return this;
  }

  /**
   * Set domain
   */
  withDomain(domain: string): this {
    this.memo.domain = domain;
    return this;
  }

  /**
   * Build the final immutable memo
   */
  build(): ContextMemo {
    // Validate required fields
    if (!this.memo.company?.name) {
      throw new Error("ContextMemo: company.name is required");
    }

    // Calculate hash for integrity checking
    const memoContent = JSON.stringify({
      company: this.memo.company,
      contact: this.memo.contact,
      constraints: this.memo.constraints,
    });
    this.memo.hash = crypto.createHash("md5").update(memoContent).digest("hex");

    // Return frozen object to prevent modifications
    return Object.freeze(this.memo as ContextMemo);
  }
}

// ============================================
// CONTEXT INTEGRITY VALIDATOR
// ============================================

export interface ContextIntegrityResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  drift: boolean;
}

export function validateContextIntegrity(
  memo: ContextMemo,
  stage: string
): ContextIntegrityResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check memo hash
  const currentContent = JSON.stringify({
    company: memo.company,
    contact: memo.contact,
    constraints: memo.constraints,
  });
  const currentHash = crypto.createHash("md5").update(currentContent).digest("hex");

  if (currentHash !== memo.hash) {
    errors.push("CRITICAL: Context memo has been modified (hash mismatch)");
  }

  // 2. Check company name
  if (!memo.company?.name || memo.company.name.length < 2) {
    errors.push("Context drift: company.name is missing or too short");
  }

  // 3. Check design tokens after DESIGN stage
  if (["images", "content", "seo", "build", "review", "publish"].includes(stage)) {
    if (!memo.design) {
      warnings.push("Design context missing for stage: " + stage);
    } else {
      // Validate hex colors
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      if (!hexPattern.test(memo.design.colors.primary)) {
        errors.push("Invalid primary color format: " + memo.design.colors.primary);
      }
    }
  }

  // 4. Check allowed pages for content/build
  if (["content", "build"].includes(stage)) {
    if (!memo.constraints?.allowedPages?.length) {
      errors.push("Context drift: allowedPages is empty for " + stage);
    }
  }

  // 5. Check focus keywords for content/seo
  if (["content", "seo"].includes(stage)) {
    if (!memo.constraints?.focusKeywords?.length) {
      warnings.push("No focus keywords defined for " + stage);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    drift: errors.some((e) => e.includes("drift") || e.includes("modified")),
  };
}

// ============================================
// HALLUCINATION DETECTOR
// ============================================

export interface HallucinationCheckResult {
  hasHallucination: boolean;
  flags: HallucinationFlag[];
}

export interface HallucinationFlag {
  type: "date" | "contact" | "metric" | "certification" | "location";
  severity: "critical" | "high" | "medium";
  content: string;
  position?: number;
  suggestion: string;
}

const HALLUCINATION_PATTERNS = {
  // Date claims
  date: {
    pattern: /(kuruldu|founded|established|since|\'den beri)\s*(\d{4})?/gi,
    severity: "high" as const,
    suggestion: "Remove date claim or verify with customer",
  },

  // Metric claims (X+ customers, years, projects)
  metric: {
    pattern: /(\d+)\+?\s*(müşteri|customer|proje|project|yıl|year|çalışan|employee)/gi,
    severity: "high" as const,
    suggestion: "Remove metric or verify with customer data",
  },

  // Certification claims
  certification: {
    pattern: /(ISO|TSE|CE|TÜRKAK|TÜV|sertifika|onaylı|belgeli|akredite)/gi,
    severity: "critical" as const,
    suggestion: "Remove certification claim - requires documentation",
  },

  // Phone number (if not in contact info)
  contact: {
    pattern: /0[0-9]{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
    severity: "critical" as const,
    suggestion: "Phone number detected - verify against provided contact info",
  },

  // Location claims
  location: {
    pattern:
      /(merkez|şube|ofis|mağaza).{0,20}(bulunmaktadır|yer almaktadır|konumlanmıştır)/gi,
    severity: "medium" as const,
    suggestion: "Location claim detected - verify against provided address",
  },
};

export function detectHallucinations(
  content: string,
  memo: ContextMemo
): HallucinationCheckResult {
  const flags: HallucinationFlag[] = [];

  for (const [type, config] of Object.entries(HALLUCINATION_PATTERNS)) {
    const matches = content.matchAll(config.pattern);

    for (const match of matches) {
      // Special handling for contact - check if phone matches
      if (type === "contact" && memo.contact?.phone) {
        const normalizedMatch = match[0].replace(/[\s\-]/g, "");
        const normalizedPhone = memo.contact.phone.replace(/[\s\-]/g, "");
        if (normalizedMatch === normalizedPhone) {
          continue; // This is the actual phone, not hallucination
        }
      }

      flags.push({
        type: type as HallucinationFlag["type"],
        severity: config.severity,
        content: match[0],
        position: match.index,
        suggestion: config.suggestion,
      });
    }
  }

  return {
    hasHallucination: flags.length > 0,
    flags,
  };
}

// ============================================
// CONTENT SCOPE VALIDATOR
// ============================================

export interface ScopeCheckResult {
  inScope: boolean;
  violations: string[];
}

export function validateContentScope(
  pages: { slug: string; type: string }[],
  memo: ContextMemo
): ScopeCheckResult {
  const violations: string[] = [];

  for (const page of pages) {
    if (!memo.constraints.allowedPages.includes(page.slug)) {
      violations.push(`Page "${page.slug}" is not in allowedPages`);
    }
  }

  return {
    inScope: violations.length === 0,
    violations,
  };
}

// ============================================
// DESIGN TOKEN VALIDATOR
// ============================================

export interface DesignTokenCheckResult {
  consistent: boolean;
  deviations: {
    field: string;
    expected: string;
    found: string;
  }[];
}

export function validateDesignTokens(
  cssContent: string,
  memo: ContextMemo
): DesignTokenCheckResult {
  if (!memo.design) {
    return { consistent: true, deviations: [] };
  }

  const deviations: DesignTokenCheckResult["deviations"] = [];

  // Extract colors from CSS
  const colorMatches = cssContent.matchAll(/#[0-9A-Fa-f]{6}/g);
  const foundColors = new Set([...colorMatches].map((m) => m[0].toUpperCase()));

  // Check if design colors are used
  const designColors = Object.values(memo.design.colors).map((c) => c.toUpperCase());

  // Find hardcoded colors that aren't in design system
  for (const found of foundColors) {
    if (!designColors.includes(found)) {
      // Check if it's a common color (white, black, gray)
      const commonColors = ["#FFFFFF", "#000000", "#F5F5F5", "#E5E5E5", "#D4D4D4"];
      if (!commonColors.includes(found)) {
        deviations.push({
          field: "color",
          expected: "Design system color",
          found: found,
        });
      }
    }
  }

  return {
    consistent: deviations.length === 0,
    deviations,
  };
}

// ============================================
// EXPORT UTILITIES
// ============================================

export function createContextMemo(
  input: InputStageOutput,
  contact: ContactInfo
): ContextMemo {
  return new ContextMemoBuilder()
    .fromInput(input)
    .withContact(contact)
    .build();
}

export function enrichContextMemo(
  memo: ContextMemo,
  design?: DesignStageOutput,
  research?: ResearchStageOutput,
  domain?: string
): ContextMemo {
  // Create new memo with additional context
  // Note: This creates a NEW memo, doesn't modify existing
  const builder = new ContextMemoBuilder();

  // Deep clone existing data to make it mutable
  const mutableMemo: Partial<MutableContextMemo> = JSON.parse(JSON.stringify({
    id: memo.id,
    createdAt: memo.createdAt,
    company: memo.company,
    contact: memo.contact,
    constraints: memo.constraints,
    design: memo.design,
    domain: memo.domain,
  }));

  // Access private memo field via type assertion
  (builder as unknown as { memo: Partial<MutableContextMemo> }).memo = mutableMemo;

  if (design) {
    builder.withDesign(design);
  }

  if (research) {
    builder.withResearch(research);
  }

  if (domain) {
    builder.withDomain(domain);
  }

  return builder.build();
}
