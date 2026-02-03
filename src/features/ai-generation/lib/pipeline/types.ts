/**
 * Web Project Pipeline Types
 *
 * Type-safe pipeline for web project creation.
 * Supports both automated and "vibe coding" (manual) workflows.
 */

// ============================================
// STAGE DEFINITIONS
// ============================================

export const PIPELINE_STAGES = [
  "input",
  "research",
  "design",
  "images",    // NEW: Gemini Imagen ile görsel üretimi
  "content",
  "seo",
  "build",
  "ui_ux",     // NEW: UI/UX quality checks
  "review",
  "publish"
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

export type StageStatus =
  | "pending"      // Not started
  | "running"      // In progress
  | "completed"    // Success
  | "failed"       // Error
  | "skipped";     // Skipped

// ============================================
// STAGE 1: INPUT (Project Setup)
// ============================================

export interface InputStageInput {
  projectId: string;
  companyName: string;
  domain?: string;
  industry?: string;
  description?: string;
}

export interface InputStageOutput {
  projectId: string;
  slug: string;
  company: {
    name: string;
    industry?: string;
    description?: string;
    tone: "professional" | "friendly" | "formal" | "casual";
    targetAudience?: string[];
    colorPreference?: string;
    avoidColors?: string[];
  };
  pages: {
    name: string;
    slug: string;
    type: "homepage" | "about" | "services" | "contact" | "blog" | "faq" | "custom";
  }[];
}

export interface InputStageExpectation {
  nextStage: "research";
  expectedOutputs: {
    researchTopics: string[];
    estimatedDuration: string;
  };
}

// ============================================
// STAGE 2: RESEARCH
// ============================================

export interface ResearchStageInput {
  projectId: string;
  company: InputStageOutput["company"];
  pages: InputStageOutput["pages"];
}

export interface ResearchStageOutput {
  projectId: string;
  industryData?: {
    name: string;
    trends: string[];
    competitors: number;
    opportunities: string[];
  };
  competitorAnalysis?: {
    name: string;
    url?: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  keywords: {
    primary: string[];
    secondary: string[];
    longTail: string[];
  };
  insights: {
    notes: string[];
    recommendations: string[];
  };
}

export interface ResearchStageExpectation {
  nextStage: "design";
  expectedOutputs: {
    suggestedColors: string[];
    suggestedFonts: string[];
    designDirection: string;
  };
}

// ============================================
// STAGE 3: DESIGN (Interactive in Vibe Mode)
// ============================================

export interface DesignStageInput {
  projectId: string;
  company: InputStageOutput["company"];
  research?: ResearchStageOutput;
  // Vibe coding additions
  designNotes?: string;
  referenceUrls?: string[];
  customStyles?: Record<string, unknown>;
}

export interface DesignStageOutput {
  projectId: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: "compact" | "normal" | "spacious";
  };
  layout: {
    style: "modern" | "classic" | "minimal" | "bold" | "custom";
    heroType: "gradient" | "image" | "video" | "split" | "custom";
    navigationStyle: "sticky" | "fixed" | "standard";
    footerStyle: "columns" | "centered" | "minimal";
    borderRadius: "none" | "small" | "medium" | "large";
  };
  components: {
    cardStyle: "flat" | "elevated" | "bordered" | "glass";
    buttonStyle: "solid" | "outline" | "ghost" | "gradient";
    iconSet: "lucide" | "heroicons" | "phosphor";
  };
  // Vibe coding additions
  customCSS?: string;
  designSystem?: Record<string, unknown>;
  reasoning?: {
    colorChoice: string;
    fontChoice: string;
    layoutChoice: string;
  };
}

export interface DesignStageExpectation {
  nextStage: "images";
  expectedOutputs: {
    imageCount: number;
    imageTypes: string[];
    estimatedGenerationTime: string;
  };
}

// ============================================
// STAGE 4: IMAGES (Gemini Imagen)
// ============================================

export interface ImagesStageInput {
  projectId: string;
  company: InputStageOutput["company"];
  design: DesignStageOutput;
  pages: InputStageOutput["pages"];
}

export interface GeneratedImage {
  id: string;
  type: "hero" | "feature" | "background" | "icon" | "illustration" | "photo";
  prompt: string;
  url: string;
  localPath?: string;
  width: number;
  height: number;
  format: "webp" | "png" | "jpg";
  altText: string;
  page?: string; // Which page this image belongs to
  section?: string; // Which section (hero, features, etc.)
}

export interface ImagesStageOutput {
  projectId: string;
  images: GeneratedImage[];
  totalImages: number;
  generationStats: {
    model: string;
    totalGenerations: number;
    successCount: number;
    failedCount: number;
    duration: number;
  };
  // Organized by usage
  heroImages: GeneratedImage[];
  featureIcons: GeneratedImage[];
  backgroundImages: GeneratedImage[];
  illustrations: GeneratedImage[];
}

export interface ImagesStageExpectation {
  nextStage: "content";
  expectedOutputs: {
    pageCount: number;
    contentTypes: string[];
    estimatedWordCount: number;
  };
}

// ============================================
// STAGE 5: CONTENT
// ============================================

export interface ContentStageInput {
  projectId: string;
  company: InputStageOutput["company"];
  pages: InputStageOutput["pages"];
  research?: ResearchStageOutput;
  design: DesignStageOutput;
  images?: ImagesStageOutput; // Generated images to reference in content
}

export interface PageContent {
  slug: string;
  type: "homepage" | "about" | "services" | "contact" | "blog" | "faq" | "custom";
  title: string;
  metaTitle: string;
  metaDescription: string;
  sections: {
    id: string;
    type: string;
    title?: string;
    content: string;
    data?: Record<string, unknown>;
  }[];
  keywords: string[];
  wordCount: number;
  readabilityScore?: number;
}

export interface ContentStageOutput {
  projectId: string;
  pages: PageContent[];
  totalWordCount: number;
  averageReadabilityScore: number;
  generationStats?: {
    model: string;
    totalTokens: number;
    duration: number;
  };
}

export interface ContentStageExpectation {
  nextStage: "seo";
  expectedOutputs: {
    seoFiles: string[];
    schemaTypes: string[];
    estimatedSeoScore: number;
  };
}

// ============================================
// STAGE 5: SEO
// ============================================

export interface SeoStageInput {
  projectId: string;
  company: InputStageOutput["company"];
  pages: InputStageOutput["pages"];
  content: ContentStageOutput;
  domain: string;
}

export interface SeoStageOutput {
  projectId: string;
  files: {
    filename: string;
    content: string;
    purpose: string;
  }[];
  schemas: {
    type: string;
    data: Record<string, unknown>;
  }[];
  sitemapUrls: string[];
  metaTags: {
    page: string;
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
  }[];
  technicalChecks: {
    check: string;
    passed: boolean;
    details?: string;
  }[];
}

export interface SeoStageExpectation {
  nextStage: "build";
  expectedOutputs: {
    outputFiles: string[];
    buildDuration: string;
    optimizationLevel: string;
  };
}

// ============================================
// STAGE 6: BUILD (Interactive in Vibe Mode)
// ============================================

export interface BuildStageInput {
  projectId: string;
  slug: string;
  config: {
    company: InputStageOutput["company"];
    pages: InputStageOutput["pages"];
    design: DesignStageOutput;
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
    domain: string;
  };
  content: ContentStageOutput;
  seoFiles: SeoStageOutput["files"];
  // Vibe coding additions
  designNotes?: string;
  referenceUrls?: string[];
  customCode?: string;
}

export interface BuildStageOutput {
  projectId: string;
  outputPath?: string;
  previewUrl?: string;
  codeRepository?: string;
  buildStats?: {
    duration: number;
    totalPages: number;
    totalAssets: number;
    bundleSize: number;
  };
  pages?: {
    path: string;
    size: number;
    type: string;
  }[];
  assets?: {
    path: string;
    type: string;
    size: number;
  }[];
  lighthouse?: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  // Vibe coding additions
  status: "ready_for_review" | "needs_iteration" | "completed";
  iterationNotes?: string;
}

export interface BuildStageExpectation {
  nextStage: "ui_ux";
  expectedOutputs: {
    uiuxChecks: string[];
    potentialIssues: string[];
    qualityScore: number;
  };
}

// ============================================
// STAGE 7: UI/UX (Quality Control)
// ============================================

export interface UiUxStageInput {
  projectId: string;
  build: BuildStageOutput;
  design: DesignStageOutput;
  previewUrl?: string;
}

export interface UiUxCheck {
  category: "performance" | "accessibility" | "responsive" | "contrast" | "typography" | "forms" | "loading";
  name: string;
  status: "pass" | "warning" | "fail";
  score: number;
  details: string;
  recommendation?: string;
}

export interface UiUxStageOutput {
  projectId: string;
  overallScore: number;

  // Lighthouse scores
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };

  // Detailed checks
  checks: UiUxCheck[];

  // Responsive test results
  responsiveTests: {
    mobile: { passed: boolean; issues: string[] };
    tablet: { passed: boolean; issues: string[] };
    desktop: { passed: boolean; issues: string[] };
  };

  // Accessibility issues
  a11yIssues: {
    critical: string[];
    serious: string[];
    moderate: string[];
  };

  // Color contrast issues
  contrastIssues: {
    element: string;
    foreground: string;
    background: string;
    ratio: number;
    required: number;
  }[];

  readyForReview: boolean;
}

export interface UiUxStageExpectation {
  nextStage: "review";
  expectedOutputs: {
    estimatedScore: number;
    criticalChecks: string[];
  };
}

// ============================================
// STAGE 8: REVIEW
// ============================================

export interface ReviewStageInput {
  projectId: string;
  company: InputStageOutput["company"];
  content: ContentStageOutput;
  build: BuildStageOutput;
  uiUx: UiUxStageOutput;
}

export interface ReviewCheck {
  category: "content" | "design" | "seo" | "performance" | "accessibility";
  name: string;
  status: "pass" | "warning" | "fail";
  score: number;
  details: string;
  suggestions?: string[];
}

export interface ReviewStageOutput {
  projectId: string;
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: ReviewCheck[];
  blockers: ReviewCheck[];
  warnings: ReviewCheck[];
  passedChecks: number;
  totalChecks: number;
  readyForPublish: boolean;
  summary: string;
}

export interface ReviewStageExpectation {
  nextStage: "publish";
  expectedOutputs: {
    deploymentPlatform: string;
    estimatedDeployTime: string;
    requiredActions: string[];
  };
}

// ============================================
// STAGE 9: PUBLISH
// ============================================

export interface PublishStageInput {
  projectId: string;
  slug: string;
  outputPath?: string;
  previewUrl?: string;
  domain: string;
  platform: "vercel" | "netlify" | "cloudflare" | "custom";
}

export interface PublishStageOutput {
  projectId: string;
  deploymentId: string;
  url: string;
  customDomain?: string;
  ssl: boolean;
  cdn: boolean;
  deploymentStats: {
    duration: number;
    filesUploaded: number;
    totalSize: number;
  };
  dnsRecords?: {
    type: string;
    name: string;
    value: string;
  }[];
}

export interface PublishStageExpectation {
  nextStage: null; // Final stage
  expectedOutputs: {
    liveUrl: string;
    monitoringSetup: boolean;
    analyticsSetup: boolean;
  };
}

// ============================================
// PIPELINE STATE
// ============================================

export interface StageResult<TOutput, TExpectation> {
  status: StageStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  output?: TOutput;
  expectation?: TExpectation;
  error?: {
    message: string;
    code: string;
    recoverable: boolean;
  };
}

export interface PipelineState {
  projectId: string;
  currentStage: PipelineStage;
  startedAt: Date;
  updatedAt: Date;

  stages: {
    input: StageResult<InputStageOutput, InputStageExpectation>;
    research: StageResult<ResearchStageOutput, ResearchStageExpectation>;
    design: StageResult<DesignStageOutput, DesignStageExpectation>;
    images: StageResult<ImagesStageOutput, ImagesStageExpectation>;
    content: StageResult<ContentStageOutput, ContentStageExpectation>;
    seo: StageResult<SeoStageOutput, SeoStageExpectation>;
    build: StageResult<BuildStageOutput, BuildStageExpectation>;
    ui_ux: StageResult<UiUxStageOutput, UiUxStageExpectation>;
    review: StageResult<ReviewStageOutput, ReviewStageExpectation>;
    publish: StageResult<PublishStageOutput, PublishStageExpectation>;
  };

  // Overall progress
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };

  // Vibe coding mode flag
  vibeMode: boolean;
}

// ============================================
// STAGE METADATA
// ============================================

export type AIProviderType = "claude" | "chatgpt" | "gemini" | "gemini-imagen" | "glm" | "codex" | "manual";

export interface StageMetadata {
  id: PipelineStage;
  name: string;
  description: string;
  icon: string;
  color: string;
  estimatedDuration: string;
  requiredInputs: string[];
  producedOutputs: string[];
  canSkip: boolean;
  canRetry: boolean;
  isInteractive: boolean; // For vibe coding - manual interaction required
  // AI Provider configuration
  aiProvider: AIProviderType;
  aiProviderFallback?: AIProviderType;
  aiProviderDescription: string;
}

export const STAGE_METADATA: Record<PipelineStage, StageMetadata> = {
  input: {
    id: "input",
    name: "Proje Girisi",
    description: "Temel proje bilgilerinin girilmesi",
    icon: "Building2",
    color: "#6366F1", // Indigo
    estimatedDuration: "Manuel giris",
    requiredInputs: ["projectId", "companyName"],
    producedOutputs: ["projectId", "slug", "company", "pages"],
    canSkip: false,
    canRetry: true,
    isInteractive: true,
    aiProvider: "manual",
    aiProviderDescription: "Kullanici tarafindan manuel giris",
  },
  research: {
    id: "research",
    name: "Arastirma",
    description: "Sektor ve rakip analizi",
    icon: "Search",
    color: "#8B5CF6", // Violet
    estimatedDuration: "2-3 dakika",
    requiredInputs: ["projectId", "company"],
    producedOutputs: ["industryData", "competitorAnalysis", "keywords"],
    canSkip: true,
    canRetry: true,
    isInteractive: false,
    aiProvider: "gemini",
    aiProviderFallback: "chatgpt",
    aiProviderDescription: "Gemini ile sektor ve rakip analizi",
  },
  design: {
    id: "design",
    name: "Tasarim",
    description: "Renk, font ve layout secimi",
    icon: "Palette",
    color: "#EC4899", // Pink
    estimatedDuration: "30-60 saniye",
    requiredInputs: ["company"],
    producedOutputs: ["colors", "typography", "layout", "components"],
    canSkip: false,
    canRetry: true,
    isInteractive: true, // Vibe mode: manual design
    aiProvider: "glm",
    aiProviderFallback: "claude",
    aiProviderDescription: "GLM-4 ile yapisal tasarim (JSON cikti)",
  },
  images: {
    id: "images",
    name: "Gorseller",
    description: "Hero, ikon ve arkaplan gorselleri uretimi",
    icon: "Image",
    color: "#F472B6", // Pink-400
    estimatedDuration: "2-4 dakika",
    requiredInputs: ["company", "design", "pages"],
    producedOutputs: ["heroImages", "featureIcons", "backgroundImages", "illustrations"],
    canSkip: true,
    canRetry: true,
    isInteractive: false,
    aiProvider: "gemini",
    aiProviderDescription: "Gemini Imagen 3 ile gorsel uretimi",
  },
  content: {
    id: "content",
    name: "Icerik",
    description: "Sayfa iceriklerinin uretimi",
    icon: "FileText",
    color: "#14B8A6", // Teal
    estimatedDuration: "3-5 dakika",
    requiredInputs: ["company", "pages", "design"],
    producedOutputs: ["pages", "totalWordCount", "readabilityScore"],
    canSkip: false,
    canRetry: true,
    isInteractive: false,
    aiProvider: "glm",
    aiProviderFallback: "chatgpt",
    aiProviderDescription: "GLM-4 Flash ile ekonomik icerik uretimi",
  },
  seo: {
    id: "seo",
    name: "SEO",
    description: "Teknik SEO dosyalarinin uretimi",
    icon: "Globe",
    color: "#F59E0B", // Amber
    estimatedDuration: "10-20 saniye",
    requiredInputs: ["company", "content", "domain"],
    producedOutputs: ["files", "schemas", "sitemapUrls", "metaTags"],
    canSkip: false,
    canRetry: true,
    isInteractive: false,
    aiProvider: "gemini",
    aiProviderFallback: "chatgpt",
    aiProviderDescription: "Gemini ile SEO optimizasyonu",
  },
  build: {
    id: "build",
    name: "Derleme",
    description: "Sitenin derlenmesi",
    icon: "Hammer",
    color: "#EF4444", // Red
    estimatedDuration: "2-4 dakika",
    requiredInputs: ["config", "content", "seoFiles"],
    producedOutputs: ["outputPath", "buildStats", "pages", "assets"],
    canSkip: false,
    canRetry: true,
    isInteractive: true, // Vibe mode: manual code/iteration
    aiProvider: "gemini",
    aiProviderFallback: "claude",
    aiProviderDescription: "Gemini ile site/kod uretimi",
  },
  ui_ux: {
    id: "ui_ux",
    name: "UI/UX Kontrol",
    description: "Gorsel tutarlilik, erisilebilirlik ve kullanici deneyimi kontrolu",
    icon: "Eye",
    color: "#10B981", // Emerald
    estimatedDuration: "2-3 dakika",
    requiredInputs: ["build", "design"],
    producedOutputs: ["lighthouse", "checks", "responsiveTests", "a11yIssues"],
    canSkip: false,
    canRetry: true,
    isInteractive: false,
    aiProvider: "codex",
    aiProviderFallback: "claude",
    aiProviderDescription: "Codex ile UI/UX analizi ve oneriler",
  },
  review: {
    id: "review",
    name: "Inceleme",
    description: "Kalite kontrol ve onay",
    icon: "CheckCircle",
    color: "#22C55E", // Green
    estimatedDuration: "1-2 dakika",
    requiredInputs: ["company", "content", "build"],
    producedOutputs: ["overallScore", "checks", "readyForPublish"],
    canSkip: false,
    canRetry: true,
    isInteractive: true,
    aiProvider: "codex",
    aiProviderFallback: "claude",
    aiProviderDescription: "Codex ile kod inceleme ve kalite kontrol",
  },
  publish: {
    id: "publish",
    name: "Yayinlama",
    description: "Sitenin deploy edilmesi",
    icon: "Rocket",
    color: "#0EA5E9", // Sky
    estimatedDuration: "1-2 dakika",
    requiredInputs: ["outputPath", "domain", "platform"],
    producedOutputs: ["deploymentId", "url", "ssl"],
    canSkip: false,
    canRetry: true,
    isInteractive: false,
    aiProvider: "manual",
    aiProviderDescription: "Deploy islemi (Vercel/Cloudflare)",
  },
};

// ============================================
// TYPE GUARDS & UTILITIES
// ============================================

export function isValidStage(stage: string): stage is PipelineStage {
  return PIPELINE_STAGES.includes(stage as PipelineStage);
}

export function getNextStage(current: PipelineStage): PipelineStage | null {
  const index = PIPELINE_STAGES.indexOf(current);
  if (index === -1 || index === PIPELINE_STAGES.length - 1) {
    return null;
  }
  return PIPELINE_STAGES[index + 1];
}

export function getPreviousStage(current: PipelineStage): PipelineStage | null {
  const index = PIPELINE_STAGES.indexOf(current);
  if (index <= 0) {
    return null;
  }
  return PIPELINE_STAGES[index - 1];
}

export function getStageIndex(stage: PipelineStage): number {
  return PIPELINE_STAGES.indexOf(stage);
}

export function isInteractiveStage(stage: PipelineStage): boolean {
  return STAGE_METADATA[stage].isInteractive;
}
