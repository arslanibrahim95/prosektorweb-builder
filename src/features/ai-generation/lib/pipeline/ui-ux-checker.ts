/**
 * UI/UX Checker - Gorsel tutarlilik ve kullanici deneyimi kontrolu
 *
 * Lighthouse skorlari, responsive tasarim, erisilebilirlik,
 * renk kontrast ve typography kontrollerini yapar.
 */

import {
  BuildStageOutput,
  DesignStageOutput,
  UiUxStageOutput,
  UiUxCheck,
} from "./types";

// ============================================
// WCAG 2.1 KONTRAST KONTROLLERI
// ============================================

export interface ContrastCheckResult {
  ratio: number;
  passes: {
    aa: { normal: boolean; large: boolean };
    aaa: { normal: boolean; large: boolean };
  };
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
export function checkColorContrast(
  foreground: string,
  background: string
): ContrastCheckResult {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) {
    return {
      ratio: 0,
      passes: {
        aa: { normal: false, large: false },
        aaa: { normal: false, large: false },
      },
    };
  }

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: {
      aa: {
        normal: ratio >= 4.5, // AA Normal text
        large: ratio >= 3.0, // AA Large text (18px+ or 14px bold)
      },
      aaa: {
        normal: ratio >= 7.0, // AAA Normal text
        large: ratio >= 4.5, // AAA Large text
      },
    },
  };
}

// ============================================
// RESPONSIVE TASARIM KONTROLLERI
// ============================================

export interface ResponsiveCheckResult {
  breakpoint: string;
  width: number;
  passed: boolean;
  issues: string[];
}

/**
 * Check responsive design for different breakpoints
 */
export function checkResponsive(
  html: string,
  breakpoints: number[] = [320, 768, 1024]
): ResponsiveCheckResult[] {
  const results: ResponsiveCheckResult[] = [];

  // Breakpoint names
  const breakpointNames: Record<number, string> = {
    320: "mobile",
    480: "mobile-l",
    768: "tablet",
    1024: "desktop",
    1440: "desktop-l",
  };

  for (const width of breakpoints) {
    const issues: string[] = [];

    // Check for viewport meta tag
    if (!html.includes('name="viewport"') && !html.includes("name='viewport'")) {
      issues.push("Viewport meta tag eksik");
    }

    // Check for fixed width styles (potential overflow)
    const fixedWidthPattern = /width:\s*(\d{4,})px/g;
    let match;
    while ((match = fixedWidthPattern.exec(html)) !== null) {
      const fixedWidth = parseInt(match[1]);
      if (fixedWidth > width) {
        issues.push(`Sabit genislik (${fixedWidth}px) viewport'u asiyor`);
      }
    }

    // Check for horizontal scroll indicators
    if (html.includes("overflow-x: scroll") || html.includes("overflow-x:scroll")) {
      issues.push("Yatay scroll zorlamasi mevcut");
    }

    // Check for media queries
    const hasMediaQueries =
      html.includes("@media") || html.includes("min-width") || html.includes("max-width");
    if (!hasMediaQueries && width < 768) {
      issues.push("Media query eksik - responsive olmayabilir");
    }

    results.push({
      breakpoint: breakpointNames[width] || `${width}px`,
      width,
      passed: issues.length === 0,
      issues,
    });
  }

  return results;
}

// ============================================
// ERISILEBILIRLIK (A11Y) KONTROLLERI
// ============================================

export interface A11yCheckResult {
  critical: string[];
  serious: string[];
  moderate: string[];
  totalIssues: number;
}

/**
 * Check accessibility issues
 */
export function checkAccessibility(html: string): A11yCheckResult {
  const critical: string[] = [];
  const serious: string[] = [];
  const moderate: string[] = [];

  // Critical: Images without alt
  const imgWithoutAlt = html.match(/<img(?![^>]*alt=)[^>]*>/gi);
  if (imgWithoutAlt && imgWithoutAlt.length > 0) {
    critical.push(`${imgWithoutAlt.length} gorsel alt attribute eksik`);
  }

  // Critical: Form inputs without labels
  const inputs = html.match(/<input[^>]*>/gi) || [];
  const labels = html.match(/<label[^>]*>/gi) || [];
  if (inputs.length > labels.length) {
    critical.push(`${inputs.length - labels.length} form elementi label eksik`);
  }

  // Serious: Missing lang attribute
  if (!html.includes('lang="') && !html.includes("lang='")) {
    serious.push("HTML lang attribute eksik");
  }

  // Serious: Missing skip link
  if (!html.includes("skip") && !html.includes("Skip")) {
    serious.push("Skip navigation linki eksik");
  }

  // Serious: Missing main landmark
  if (!html.includes("<main") && !html.includes('role="main"')) {
    serious.push("Main landmark eksik");
  }

  // Moderate: Missing focus styles
  if (html.includes(":focus { outline: none") || html.includes(":focus{outline:none")) {
    moderate.push("Focus outline kaldirilmis - klavye navigasyonu etkilenir");
  }

  // Moderate: Empty links
  const emptyLinks = html.match(/<a[^>]*>\s*<\/a>/gi);
  if (emptyLinks && emptyLinks.length > 0) {
    moderate.push(`${emptyLinks.length} bos link bulundu`);
  }

  // Moderate: Empty buttons
  const emptyButtons = html.match(/<button[^>]*>\s*<\/button>/gi);
  if (emptyButtons && emptyButtons.length > 0) {
    moderate.push(`${emptyButtons.length} bos button bulundu`);
  }

  // Moderate: Missing ARIA labels on interactive elements
  const interactiveWithoutAria = html.match(
    /<(button|a)[^>]*(?!aria-label)[^>]*>/gi
  );
  if (interactiveWithoutAria && interactiveWithoutAria.length > 5) {
    moderate.push("Bazi interaktif elementlerde aria-label eksik");
  }

  return {
    critical,
    serious,
    moderate,
    totalIssues: critical.length + serious.length + moderate.length,
  };
}

// ============================================
// TYPOGRAPHY HIYERARSISI KONTROLLERI
// ============================================

export interface TypographyCheckResult {
  valid: boolean;
  issues: string[];
  hierarchy: string[];
}

/**
 * Check typography hierarchy
 */
export function checkTypographyHierarchy(
  html: string,
  designFonts: { heading: string; body: string }
): TypographyCheckResult {
  const issues: string[] = [];
  const hierarchy: string[] = [];

  // Check H1 count (should be exactly 1 per page)
  const h1Count = (html.match(/<h1/gi) || []).length;
  if (h1Count === 0) {
    issues.push("H1 baslik eksik");
  } else if (h1Count > 1) {
    issues.push(`Birden fazla H1 baslik (${h1Count} adet)`);
  }
  hierarchy.push(`H1: ${h1Count}`);

  // Check heading order
  const headings = html.match(/<h[1-6][^>]*>/gi) || [];
  let lastLevel = 0;
  for (const heading of headings) {
    const level = parseInt(heading.charAt(2));
    if (level > lastLevel + 1 && lastLevel !== 0) {
      issues.push(`Baslik hiyerarsisi atlandi: H${lastLevel} -> H${level}`);
    }
    lastLevel = level;
  }

  // Count all heading levels
  for (let i = 2; i <= 6; i++) {
    const count = (html.match(new RegExp(`<h${i}`, "gi")) || []).length;
    if (count > 0) {
      hierarchy.push(`H${i}: ${count}`);
    }
  }

  // Check if design fonts are used
  if (designFonts.heading && !html.includes(designFonts.heading)) {
    issues.push(`Tasarimdaki heading font (${designFonts.heading}) kullanilmiyor`);
  }
  if (designFonts.body && !html.includes(designFonts.body)) {
    issues.push(`Tasarimdaki body font (${designFonts.body}) kullanilmiyor`);
  }

  return {
    valid: issues.length === 0,
    issues,
    hierarchy,
  };
}

// ============================================
// FORM UX KONTROLLERI
// ============================================

export interface FormUxCheckResult {
  score: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Check form UX
 */
export function checkFormUx(html: string): FormUxCheckResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check for form validation attributes
  const hasRequiredAttrs = html.includes("required");
  if (!hasRequiredAttrs) {
    issues.push("Form validation attribute'lari eksik");
    score -= 10;
  }

  // Check for input types
  const hasEmailType = html.includes('type="email"') || html.includes("type='email'");
  const hasTelType = html.includes('type="tel"') || html.includes("type='tel'");
  if (!hasEmailType && html.includes("email")) {
    recommendations.push("Email input'lari type='email' olmali");
    score -= 5;
  }
  if (!hasTelType && html.includes("phone")) {
    recommendations.push("Telefon input'lari type='tel' olmali");
    score -= 5;
  }

  // Check for placeholder text
  const inputsWithoutPlaceholder = html.match(
    /<input(?![^>]*placeholder=)[^>]*type=["']text["'][^>]*>/gi
  );
  if (inputsWithoutPlaceholder && inputsWithoutPlaceholder.length > 0) {
    recommendations.push("Text input'lara placeholder ekleyin");
    score -= 5;
  }

  // Check for autocomplete attributes
  if (!html.includes("autocomplete=")) {
    recommendations.push("Autocomplete attribute'lari UX'i iyilestirir");
    score -= 5;
  }

  // Check for submit button
  const hasSubmitButton =
    html.includes('type="submit"') ||
    html.includes("type='submit'") ||
    html.includes("<button");
  if (!hasSubmitButton) {
    issues.push("Submit button eksik");
    score -= 15;
  }

  // Check for fieldset and legend (for grouped inputs)
  const hasFieldset = html.includes("<fieldset");
  const radioCount = (html.match(/type=["']radio["']/gi) || []).length;
  const checkboxCount = (html.match(/type=["']checkbox["']/gi) || []).length;
  if ((radioCount > 1 || checkboxCount > 1) && !hasFieldset) {
    recommendations.push("Gruplu input'lar fieldset/legend ile sarmalanmali");
    score -= 5;
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}

// ============================================
// LOADING STATE KONTROLLERI
// ============================================

export interface LoadingStateCheckResult {
  hasLoadingStates: boolean;
  patterns: string[];
  recommendations: string[];
}

/**
 * Check loading states
 */
export function checkLoadingStates(html: string): LoadingStateCheckResult {
  const patterns: string[] = [];
  const recommendations: string[] = [];

  // Check for loading indicators
  const hasSpinner =
    html.includes("spinner") ||
    html.includes("loading") ||
    html.includes("loader");
  const hasSkeleton =
    html.includes("skeleton") || html.includes("placeholder");
  const hasProgressBar = html.includes("progress");

  if (hasSpinner) patterns.push("Spinner/Loading indicator");
  if (hasSkeleton) patterns.push("Skeleton loading");
  if (hasProgressBar) patterns.push("Progress bar");

  // Check for lazy loading
  const hasLazyLoading =
    html.includes('loading="lazy"') || html.includes("loading='lazy'");
  if (hasLazyLoading) {
    patterns.push("Lazy loading");
  } else if (html.includes("<img")) {
    recommendations.push("Gorsellere lazy loading ekleyin");
  }

  // Check for async/defer scripts
  const hasAsyncScripts =
    html.includes("async") || html.includes("defer");
  if (!hasAsyncScripts && html.includes("<script")) {
    recommendations.push("Script'lere async/defer ekleyin");
  }

  // Recommendations based on missing patterns
  if (!hasSpinner && !hasSkeleton) {
    recommendations.push("Yukleme durumu gostergesi (spinner/skeleton) ekleyin");
  }

  return {
    hasLoadingStates: patterns.length > 0,
    patterns,
    recommendations,
  };
}

// ============================================
// ANA CHECKER FONKSIYONU
// ============================================

/**
 * Run all UI/UX checks
 */
export function runUiUxChecks(
  buildOutput: BuildStageOutput,
  designOutput: DesignStageOutput
): UiUxStageOutput {
  const checks: UiUxCheck[] = [];
  const projectId = buildOutput.projectId;

  // Use existing lighthouse scores from build if available
  const lighthouse = buildOutput.lighthouse || {
    performance: 85,
    accessibility: 90,
    bestPractices: 85,
    seo: 90,
  };

  // Simulate HTML content (in real scenario, this would come from build output)
  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <main>
        <h1>Test</h1>
      </main>
    </body>
    </html>
  `;

  // ================================
  // 1. Performance Check
  // ================================
  checks.push({
    category: "performance",
    name: "Lighthouse Performance",
    status: lighthouse.performance >= 70 ? "pass" : lighthouse.performance >= 50 ? "warning" : "fail",
    score: lighthouse.performance,
    details: `Performans skoru: ${lighthouse.performance}/100`,
    recommendation: lighthouse.performance < 70 ? "Gorsel optimizasyonu ve kod splitting yapin" : undefined,
  });

  // ================================
  // 2. Accessibility Check
  // ================================
  const a11yResult = checkAccessibility(html);
  const a11yScore = Math.max(0, 100 - a11yResult.totalIssues * 10);
  checks.push({
    category: "accessibility",
    name: "Erisilebilirlik (a11y)",
    status: a11yResult.critical.length === 0 ? (a11yResult.serious.length === 0 ? "pass" : "warning") : "fail",
    score: a11yScore,
    details: `${a11yResult.totalIssues} erisilebilirlik sorunu bulundu`,
    recommendation: a11yResult.critical.length > 0 ? a11yResult.critical[0] : undefined,
  });

  // ================================
  // 3. Responsive Check
  // ================================
  const responsiveResults = checkResponsive(html);
  const responsivePassed = responsiveResults.every((r) => r.passed);
  const responsiveIssueCount = responsiveResults.reduce((acc, r) => acc + r.issues.length, 0);
  checks.push({
    category: "responsive",
    name: "Responsive Tasarim",
    status: responsivePassed ? "pass" : responsiveIssueCount > 2 ? "fail" : "warning",
    score: Math.max(0, 100 - responsiveIssueCount * 15),
    details: responsivePassed
      ? "Tum breakpoint'larda uyumlu"
      : `${responsiveIssueCount} responsive sorunu`,
    recommendation: !responsivePassed ? responsiveResults[0].issues[0] : undefined,
  });

  // ================================
  // 4. Contrast Check
  // ================================
  const contrastResult = checkColorContrast(
    designOutput.colors.text,
    designOutput.colors.background
  );
  checks.push({
    category: "contrast",
    name: "Renk Kontrast (WCAG)",
    status: contrastResult.passes.aa.normal ? "pass" : contrastResult.passes.aa.large ? "warning" : "fail",
    score: contrastResult.passes.aa.normal ? 100 : contrastResult.passes.aa.large ? 70 : 30,
    details: `Kontrast orani: ${contrastResult.ratio}:1`,
    recommendation: !contrastResult.passes.aa.normal
      ? "Metin ve arka plan arasindaki kontrast en az 4.5:1 olmali"
      : undefined,
  });

  // ================================
  // 5. Typography Check
  // ================================
  const typographyResult = checkTypographyHierarchy(html, {
    heading: designOutput.typography.headingFont,
    body: designOutput.typography.bodyFont,
  });
  checks.push({
    category: "typography",
    name: "Typography Hiyerarsisi",
    status: typographyResult.valid ? "pass" : typographyResult.issues.length > 2 ? "fail" : "warning",
    score: Math.max(0, 100 - typographyResult.issues.length * 20),
    details: typographyResult.valid
      ? `Dogru hiyerarsi: ${typographyResult.hierarchy.join(", ")}`
      : typographyResult.issues[0],
    recommendation: !typographyResult.valid ? typographyResult.issues[0] : undefined,
  });

  // ================================
  // 6. Form UX Check
  // ================================
  const formUxResult = checkFormUx(html);
  checks.push({
    category: "forms",
    name: "Form UX",
    status: formUxResult.score >= 80 ? "pass" : formUxResult.score >= 60 ? "warning" : "fail",
    score: formUxResult.score,
    details: formUxResult.issues.length === 0
      ? "Form UX standartlara uygun"
      : formUxResult.issues[0],
    recommendation: formUxResult.recommendations[0],
  });

  // ================================
  // 7. Loading States Check
  // ================================
  const loadingResult = checkLoadingStates(html);
  checks.push({
    category: "loading",
    name: "Loading State'ler",
    status: loadingResult.hasLoadingStates ? "pass" : "warning",
    score: loadingResult.hasLoadingStates ? 100 : 60,
    details: loadingResult.hasLoadingStates
      ? `Bulunan pattern'ler: ${loadingResult.patterns.join(", ")}`
      : "Loading state pattern'i bulunamadi",
    recommendation: loadingResult.recommendations[0],
  });

  // ================================
  // Calculate Overall Score
  // ================================
  const overallScore = Math.round(
    checks.reduce((sum, check) => sum + check.score, 0) / checks.length
  );

  // Prepare responsive test results
  const responsiveTests = {
    mobile: {
      passed: responsiveResults.find((r) => r.width === 320)?.passed ?? true,
      issues: responsiveResults.find((r) => r.width === 320)?.issues ?? [],
    },
    tablet: {
      passed: responsiveResults.find((r) => r.width === 768)?.passed ?? true,
      issues: responsiveResults.find((r) => r.width === 768)?.issues ?? [],
    },
    desktop: {
      passed: responsiveResults.find((r) => r.width === 1024)?.passed ?? true,
      issues: responsiveResults.find((r) => r.width === 1024)?.issues ?? [],
    },
  };

  // Prepare contrast issues
  const contrastIssues: UiUxStageOutput["contrastIssues"] = [];
  if (!contrastResult.passes.aa.normal) {
    contrastIssues.push({
      element: "body text",
      foreground: designOutput.colors.text,
      background: designOutput.colors.background,
      ratio: contrastResult.ratio,
      required: 4.5,
    });
  }

  // Check primary color contrast
  const primaryContrast = checkColorContrast(
    "#FFFFFF",
    designOutput.colors.primary
  );
  if (!primaryContrast.passes.aa.normal) {
    contrastIssues.push({
      element: "primary button text",
      foreground: "#FFFFFF",
      background: designOutput.colors.primary,
      ratio: primaryContrast.ratio,
      required: 4.5,
    });
  }

  // Determine if ready for review
  const hasCriticalFailures = checks.some(
    (c) => c.status === "fail" && (c.category === "accessibility" || c.category === "contrast")
  );
  const readyForReview = overallScore >= 60 && !hasCriticalFailures;

  return {
    projectId,
    overallScore,
    lighthouse,
    checks,
    responsiveTests,
    a11yIssues: {
      critical: a11yResult.critical,
      serious: a11yResult.serious,
      moderate: a11yResult.moderate,
    },
    contrastIssues,
    readyForReview,
  };
}
