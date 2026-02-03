/**
 * Quality Scorer - İçerik ve çıktı kalitesi değerlendirmesi
 *
 * Bu modül:
 * - İçerik kalitesini ölçer (okunabilirlik, keyword yoğunluğu)
 * - Tekrar/formül tespit eder
 * - CTA varlığını kontrol eder
 * - Genel kalite skoru hesaplar
 */

import { ContentStageOutput, PageContent } from "./types";
import { ContextMemo } from "./context-memo";

// ============================================
// QUALITY SCORE TYPES
// ============================================

export interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    readability: number;
    keywordUsage: number;
    uniqueness: number;
    structure: number;
    cta: number;
  };
  issues: QualityIssue[];
  suggestions: string[];
}

export interface QualityIssue {
  severity: "critical" | "warning" | "info";
  category: "readability" | "keyword" | "repetition" | "structure" | "cta" | "scope";
  message: string;
  page?: string;
  position?: number;
}

// ============================================
// PAGE QUALITY REQUIREMENTS
// ============================================

interface PageRequirements {
  minWords: number;
  maxWords: number;
  requiredSections: string[];
  requiresCta: boolean;
}

const PAGE_REQUIREMENTS: Record<string, PageRequirements> = {
  homepage: {
    minWords: 500,
    maxWords: 1500,
    requiredSections: ["hero", "features", "cta"],
    requiresCta: true,
  },
  about: {
    minWords: 400,
    maxWords: 1000,
    requiredSections: ["company_story", "mission"],
    requiresCta: true,
  },
  services: {
    minWords: 300,
    maxWords: 800,
    requiredSections: ["service_description", "benefits"],
    requiresCta: true,
  },
  contact: {
    minWords: 100,
    maxWords: 400,
    requiredSections: ["contact_form"],
    requiresCta: false,
  },
  faq: {
    minWords: 500,
    maxWords: 2000,
    requiredSections: ["questions"],
    requiresCta: true,
  },
  blog: {
    minWords: 800,
    maxWords: 3000,
    requiredSections: ["intro", "body", "conclusion"],
    requiresCta: true,
  },
  custom: {
    minWords: 300,
    maxWords: 1500,
    requiredSections: [],
    requiresCta: true,
  },
};

// ============================================
// FORBIDDEN PATTERNS (Repetition Detection)
// ============================================

const FORBIDDEN_PATTERNS = [
  // Over-used phrases
  /profesyonel (hizmet|çözüm|ekip)/gi,
  /müşteri memnuniyeti/gi,
  /kaliteli (hizmet|ürün|çözüm)/gi,
  /en iyi (hizmet|fiyat|kalite)/gi,
  /güvenilir (hizmet|firma|partner)/gi,
  /uzman (kadro|ekip)/gi,
  /yılların tecrübesi/gi,
  /sektörün lideri/gi,

  // Filler phrases
  /bu bağlamda/gi,
  /şüphesiz ki/gi,
  /hiç kuşkusuz/gi,
  /söylemek gerekir/gi,
];

const MAX_PHRASE_FREQUENCY = 2; // Same phrase max 2 times across all content

// ============================================
// READABILITY CALCULATOR
// ============================================

interface ReadabilityMetrics {
  avgSentenceLength: number;
  avgWordLength: number;
  passiveVoiceRatio: number;
  complexSentenceRatio: number;
  score: number; // 0-100
}

function calculateReadability(text: string): ReadabilityMetrics {
  // Split into sentences
  const sentences = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0);

  // Split into words
  const words = text
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (sentences.length === 0 || words.length === 0) {
    return {
      avgSentenceLength: 0,
      avgWordLength: 0,
      passiveVoiceRatio: 0,
      complexSentenceRatio: 0,
      score: 0,
    };
  }

  // Average sentence length
  const avgSentenceLength = words.length / sentences.length;

  // Average word length
  const avgWordLength =
    words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Passive voice detection (Turkish: "-ıl-", "-il-", "-ul-", "-ül-", "-n-")
  const passivePatterns = /(ıl|il|ul|ül|ın|in|un|ün)(dı|di|du|dü|mış|miş|muş|müş|ır|ir|ur|ür|ar|er)/gi;
  const passiveSentences = sentences.filter((s) => passivePatterns.test(s));
  const passiveVoiceRatio = passiveSentences.length / sentences.length;

  // Complex sentences (more than 25 words)
  const complexSentences = sentences.filter(
    (s) => s.split(/\s+/).length > 25
  );
  const complexSentenceRatio = complexSentences.length / sentences.length;

  // Calculate score
  // Ideal: 15-20 word sentences, <20% passive, <10% complex
  let score = 100;

  // Sentence length penalty
  if (avgSentenceLength < 10) score -= 15; // Too short
  else if (avgSentenceLength > 25) score -= 25; // Too long
  else if (avgSentenceLength > 20) score -= 10; // Slightly long

  // Passive voice penalty
  if (passiveVoiceRatio > 0.3) score -= 20;
  else if (passiveVoiceRatio > 0.2) score -= 10;

  // Complex sentence penalty
  if (complexSentenceRatio > 0.2) score -= 15;
  else if (complexSentenceRatio > 0.1) score -= 5;

  return {
    avgSentenceLength,
    avgWordLength,
    passiveVoiceRatio,
    complexSentenceRatio,
    score: Math.max(0, score),
  };
}

// ============================================
// KEYWORD USAGE CHECKER
// ============================================

interface KeywordUsageMetrics {
  totalMentions: number;
  density: number; // percentage
  missingKeywords: string[];
  overusedKeywords: string[];
  score: number; // 0-100
}

function analyzeKeywordUsage(
  text: string,
  keywords: string[]
): KeywordUsageMetrics {
  const words = text.toLowerCase().split(/\s+/);
  const wordCount = words.length;

  if (wordCount === 0 || keywords.length === 0) {
    return {
      totalMentions: 0,
      density: 0,
      missingKeywords: keywords,
      overusedKeywords: [],
      score: 0,
    };
  }

  const textLower = text.toLowerCase();
  let totalMentions = 0;
  const missingKeywords: string[] = [];
  const overusedKeywords: string[] = [];

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(keywordLower, "gi");
    const matches = textLower.match(regex);
    const count = matches ? matches.length : 0;

    if (count === 0) {
      missingKeywords.push(keyword);
    } else {
      totalMentions += count;

      // Check for overuse (>3% density for single keyword)
      const keywordDensity = (count * keyword.split(/\s+/).length) / wordCount;
      if (keywordDensity > 0.03) {
        overusedKeywords.push(keyword);
      }
    }
  }

  const density = (totalMentions / wordCount) * 100;

  // Calculate score
  let score = 100;

  // Missing keywords penalty
  const missingRatio = missingKeywords.length / keywords.length;
  if (missingRatio > 0.5) score -= 30;
  else if (missingRatio > 0.25) score -= 15;
  else if (missingRatio > 0) score -= 5;

  // Overuse penalty
  if (overusedKeywords.length > 0) {
    score -= overusedKeywords.length * 10;
  }

  // Density check
  if (density < 0.5) score -= 15; // Too low
  else if (density > 3) score -= 20; // Too high (keyword stuffing)

  return {
    totalMentions,
    density,
    missingKeywords,
    overusedKeywords,
    score: Math.max(0, score),
  };
}

// ============================================
// UNIQUENESS CHECKER
// ============================================

interface UniquenessMetrics {
  duplicatePhrases: string[];
  forbiddenPhrases: string[];
  score: number; // 0-100
}

function analyzeUniqueness(pages: PageContent[]): UniquenessMetrics {
  const allContent = pages.map((p) =>
    p.sections.map((s) => s.content).join(" ")
  );

  const duplicatePhrases: string[] = [];
  const forbiddenPhrases: string[] = [];
  const phraseCount = new Map<string, number>();

  // Check for duplicate phrases (5+ word sequences)
  for (const content of allContent) {
    const words = content.split(/\s+/);
    for (let i = 0; i < words.length - 5; i++) {
      const phrase = words.slice(i, i + 5).join(" ").toLowerCase();
      phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1);
    }
  }

  // Find duplicates across pages
  for (const [phrase, count] of phraseCount) {
    if (count > MAX_PHRASE_FREQUENCY) {
      duplicatePhrases.push(phrase);
    }
  }

  // Check forbidden patterns
  const combinedContent = allContent.join(" ");
  for (const pattern of FORBIDDEN_PATTERNS) {
    const matches = combinedContent.match(pattern);
    if (matches && matches.length > MAX_PHRASE_FREQUENCY) {
      forbiddenPhrases.push(matches[0]);
    }
  }

  // Calculate score
  let score = 100;
  score -= duplicatePhrases.length * 5;
  score -= forbiddenPhrases.length * 10;

  return {
    duplicatePhrases: [...new Set(duplicatePhrases)].slice(0, 10),
    forbiddenPhrases: [...new Set(forbiddenPhrases)],
    score: Math.max(0, score),
  };
}

// ============================================
// STRUCTURE CHECKER
// ============================================

interface StructureMetrics {
  hasH1: boolean;
  h1Count: number;
  headingHierarchy: boolean;
  hasSections: boolean;
  score: number;
}

function analyzeStructure(page: PageContent): StructureMetrics {
  const sections = page.sections;

  // Check H1
  const h1Sections = sections.filter(
    (s) => s.type === "h1" || s.type === "hero" || s.title
  );
  const hasH1 = h1Sections.length > 0;
  const h1Count = h1Sections.length;

  // Check sections exist
  const hasSections = sections.length >= 2;

  // Check heading hierarchy (simplified)
  const headingHierarchy = true; // Would need more detailed analysis

  // Calculate score
  let score = 100;

  if (!hasH1) score -= 30;
  if (h1Count > 1) score -= 20; // Multiple H1s
  if (!hasSections) score -= 20;

  return {
    hasH1,
    h1Count,
    headingHierarchy,
    hasSections,
    score: Math.max(0, score),
  };
}

// ============================================
// CTA CHECKER
// ============================================

interface CtaMetrics {
  hasCta: boolean;
  ctaCount: number;
  ctaPositions: string[];
  score: number;
}

const CTA_PATTERNS = [
  /hemen (başla|ara|iletişim|teklif)/gi,
  /şimdi (ara|başla|dene)/gi,
  /ücretsiz (teklif|danışma|deneme)/gi,
  /iletişime geç/gi,
  /teklif (al|iste)/gi,
  /bize (ulaş|yaz)/gi,
  /detaylı bilgi/gi,
  /randevu (al|oluştur)/gi,
];

function analyzeCta(page: PageContent): CtaMetrics {
  const content = page.sections.map((s) => s.content).join(" ");
  const ctaPositions: string[] = [];
  let ctaCount = 0;

  for (const pattern of CTA_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      ctaCount += matches.length;
      ctaPositions.push(...matches);
    }
  }

  // Check for CTA in sections
  const ctaSections = page.sections.filter(
    (s) => s.type === "cta" || s.type === "contact"
  );
  if (ctaSections.length > 0) {
    ctaCount += ctaSections.length;
    ctaPositions.push("dedicated_cta_section");
  }

  const hasCta = ctaCount > 0;

  // Get page requirements
  const requirements = PAGE_REQUIREMENTS[page.type] || PAGE_REQUIREMENTS.custom;

  // Calculate score
  let score = 100;
  if (requirements.requiresCta && !hasCta) {
    score -= 40;
  } else if (requirements.requiresCta && ctaCount < 2) {
    score -= 15; // Should have at least 2 CTAs
  }

  return {
    hasCta,
    ctaCount,
    ctaPositions: [...new Set(ctaPositions)],
    score: Math.max(0, score),
  };
}

// ============================================
// MAIN QUALITY SCORER
// ============================================

export function scoreContent(
  content: ContentStageOutput,
  memo: ContextMemo
): QualityScore {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];

  // Analyze each page
  const pageScores = content.pages.map((page) => {
    const requirements =
      PAGE_REQUIREMENTS[page.type] || PAGE_REQUIREMENTS.custom;
    const pageContent = page.sections.map((s) => s.content).join(" ");

    // Word count check
    if (page.wordCount < requirements.minWords) {
      issues.push({
        severity: "warning",
        category: "structure",
        message: `${page.slug}: Word count (${page.wordCount}) below minimum (${requirements.minWords})`,
        page: page.slug,
      });
    }

    if (page.wordCount > requirements.maxWords) {
      issues.push({
        severity: "info",
        category: "structure",
        message: `${page.slug}: Word count (${page.wordCount}) above maximum (${requirements.maxWords})`,
        page: page.slug,
      });
    }

    // Readability
    const readability = calculateReadability(pageContent);

    // Structure
    const structure = analyzeStructure(page);
    if (!structure.hasH1) {
      issues.push({
        severity: "critical",
        category: "structure",
        message: `${page.slug}: Missing H1 heading`,
        page: page.slug,
      });
    }
    if (structure.h1Count > 1) {
      issues.push({
        severity: "warning",
        category: "structure",
        message: `${page.slug}: Multiple H1 headings (${structure.h1Count})`,
        page: page.slug,
      });
    }

    // CTA
    const cta = analyzeCta(page);
    if (requirements.requiresCta && !cta.hasCta) {
      issues.push({
        severity: "warning",
        category: "cta",
        message: `${page.slug}: Missing call-to-action`,
        page: page.slug,
      });
      suggestions.push(`Add CTA to ${page.slug} page`);
    }

    return {
      readability: readability.score,
      structure: structure.score,
      cta: cta.score,
    };
  });

  // Keyword analysis across all content
  const allContent = content.pages
    .map((p) => p.sections.map((s) => s.content).join(" "))
    .join(" ");

  const keywordMetrics = analyzeKeywordUsage(
    allContent,
    memo.constraints.focusKeywords
  );

  if (keywordMetrics.missingKeywords.length > 0) {
    issues.push({
      severity: "warning",
      category: "keyword",
      message: `Missing keywords: ${keywordMetrics.missingKeywords.join(", ")}`,
    });
    suggestions.push(
      `Include these keywords: ${keywordMetrics.missingKeywords.join(", ")}`
    );
  }

  if (keywordMetrics.overusedKeywords.length > 0) {
    issues.push({
      severity: "warning",
      category: "keyword",
      message: `Overused keywords (stuffing risk): ${keywordMetrics.overusedKeywords.join(", ")}`,
    });
  }

  // Uniqueness analysis
  const uniqueness = analyzeUniqueness(content.pages);

  if (uniqueness.duplicatePhrases.length > 0) {
    issues.push({
      severity: "info",
      category: "repetition",
      message: `Duplicate phrases found: ${uniqueness.duplicatePhrases.slice(0, 3).join("; ")}...`,
    });
    suggestions.push("Vary language to reduce repetition");
  }

  if (uniqueness.forbiddenPhrases.length > 0) {
    issues.push({
      severity: "warning",
      category: "repetition",
      message: `Overused clichés: ${uniqueness.forbiddenPhrases.join(", ")}`,
    });
    suggestions.push("Replace clichés with specific value propositions");
  }

  // Calculate overall scores
  const avgReadability =
    pageScores.reduce((sum, p) => sum + p.readability, 0) / pageScores.length;
  const avgStructure =
    pageScores.reduce((sum, p) => sum + p.structure, 0) / pageScores.length;
  const avgCta =
    pageScores.reduce((sum, p) => sum + p.cta, 0) / pageScores.length;

  const breakdown = {
    readability: Math.round(avgReadability),
    keywordUsage: keywordMetrics.score,
    uniqueness: uniqueness.score,
    structure: Math.round(avgStructure),
    cta: Math.round(avgCta),
  };

  // Weighted overall score
  const overall = Math.round(
    breakdown.readability * 0.2 +
      breakdown.keywordUsage * 0.25 +
      breakdown.uniqueness * 0.15 +
      breakdown.structure * 0.25 +
      breakdown.cta * 0.15
  );

  // Add general suggestions
  if (overall < 60) {
    suggestions.push("Content needs significant improvement");
  } else if (overall < 75) {
    suggestions.push("Content is acceptable but could be improved");
  }

  return {
    overall,
    breakdown,
    issues,
    suggestions,
  };
}

// ============================================
// QUICK QUALITY CHECK
// ============================================

export interface QuickCheckResult {
  pass: boolean;
  score: number;
  criticalIssues: string[];
}

export function quickQualityCheck(
  content: ContentStageOutput,
  memo: ContextMemo,
  minScore: number = 60
): QuickCheckResult {
  const fullScore = scoreContent(content, memo);

  const criticalIssues = fullScore.issues
    .filter((i) => i.severity === "critical")
    .map((i) => i.message);

  return {
    pass: fullScore.overall >= minScore && criticalIssues.length === 0,
    score: fullScore.overall,
    criticalIssues,
  };
}
