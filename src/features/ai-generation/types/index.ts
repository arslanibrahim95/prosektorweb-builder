/**
 * AI Website Generation Types
 * Type definitions for the AI-powered website generation feature
 */

// ==========================================
// GENERATION JOB TYPES
// ==========================================

export type GenerationStatus =
    | 'PENDING'
    | 'ANALYZING'
    | 'DESIGNING'
    | 'GENERATING_CONTENT'
    | 'GENERATING_CODE'
    | 'BUILDING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';

export type GenerationStep =
    | 'ANALYSIS'
    | 'DESIGN'
    | 'CONTENT'
    | 'CODE'
    | 'BUILD';

export interface GenerationJob {
    id: string;
    userId: string;
    companyId?: string;
    prompt: string;
    promptHash: string;
    status: GenerationStatus;
    currentStep: string | null;
    progress: number;
    stepsCompleted: number;
    totalSteps: number;

    // Results
    analysisResult?: AnalysisResult;
    designResult?: DesignResult;
    contentResult?: ContentResult;
    codeResult?: CodeResult;

    // Error handling
    errorMessage?: string;
    errorCode?: string;
    retryCount: number;
    maxRetries: number;

    // Metadata
    estimatedDuration?: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;

    // Version control
    version: number;
    isLatest: boolean;
    parentJobId?: string;
}

// ==========================================
// GENERATION RESULTS
// ==========================================

export interface AnalysisResult {
    requirements: {
        businessType: string;
        targetAudience: string[];
        goals: string[];
        features: string[];
    };
    recommendations: {
        template: string;
        pages: string[];
        style: string;
        tone: string;
    };
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
    estimatedTokens: number;
}

export interface DesignResult {
    colorScheme: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        text: string;
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        baseSize: number;
    };
    layout: {
        maxWidth: string;
        spacing: string;
        grid: string;
    };
    components: string[];
}

export interface ContentResult {
    pages: {
        slug: string;
        title: string;
        metaTitle: string;
        metaDescription: string;
        sections: {
            type: string;
            content: string;
            order: number;
        }[];
    }[];
    globalContent: {
        navigation: {
            label: string;
            href: string;
        }[];
        footer: {
            copyright: string;
            links: {
                label: string;
                href: string;
            }[];
        };
    };
}

export interface CodeResult {
    framework: string;
    dependencies: string[];
    fileStructure: {
        path: string;
        content: string;
        type: 'page' | 'component' | 'style' | 'config';
    }[];
    buildConfig: {
        output: string;
        optimization: boolean;
        ssg: boolean;
    };
}

// ==========================================
// GENERATED WEBSITE TYPES
// ==========================================

export interface GeneratedWebsite {
    id: string;
    jobId: string;
    userId: string;
    companyId?: string;

    // Metadata
    name: string;
    slug: string;
    description?: string;
    template: string;

    // Assets
    siteStructure: SiteStructure;
    pages: WebsitePage[];
    components?: WebsiteComponent[];
    styles?: WebsiteStyles;
    assets?: WebsiteAsset[];

    // Source
    sourceCode?: string;
    buildOutput?: string;

    // Preview
    previewUrl?: string;
    thumbnailUrl?: string;

    // Version control
    version: number;
    versionLabel?: string;
    versionNotes?: string;
    isActive: boolean;
    isDeployed: boolean;
    deployedAt?: Date;
    deployedUrl?: string;

    // Rollback
    canRollback: boolean;
    rollbackToVersion?: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface SiteStructure {
    root: string;
    pages: {
        slug: string;
        path: string;
        title: string;
    }[];
    assets: {
        images: string[];
        fonts: string[];
        icons: string[];
    };
}

export interface WebsitePage {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    sections: WebsiteSection[];
}

export interface WebsiteSection {
    id: string;
    type: string;
    content: string;
    styles?: Record<string, string>;
    order: number;
}

export interface WebsiteComponent {
    name: string;
    type: string;
    props: Record<string, unknown>;
    code: string;
}

export interface WebsiteStyles {
    global: string;
    variables: Record<string, string>;
    utilities: string[];
}

export interface WebsiteAsset {
    id: string;
    type: 'image' | 'font' | 'icon' | 'other';
    url: string;
    filename: string;
    size: number;
    mimeType: string;
}

// ==========================================
// TEMPLATE TYPES
// ==========================================

export interface GenerationTemplate {
    id: string;
    name: string;
    slug: string;
    description?: string;
    category: string;

    promptTemplate: string;
    systemPrompt?: string;
    structureTemplate: TemplateStructure;
    defaultStyles?: TemplateStyles;

    isActive: boolean;
    isPublic: boolean;
    isPremium: boolean;
    complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
    estimatedDuration?: number;

    usageCount: number;
    rating?: number;
    ratingCount: number;

    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TemplateStructure {
    pages: {
        name: string;
        slug: string;
        type: string;
        required: boolean;
    }[];
    sections: {
        type: string;
        name: string;
        description?: string;
    }[];
}

export interface TemplateStyles {
    colorScheme?: {
        primary: string;
        secondary: string;
        accent: string;
    };
    typography?: {
        headingFont: string;
        bodyFont: string;
    };
}

// ==========================================
// PRESET TYPES
// ==========================================

export interface GenerationPreset {
    id: string;
    userId: string;
    name: string;
    description?: string;
    basePrompt: string;
    templateId?: string;
    customSettings?: Record<string, unknown>;
    isFavorite: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// ==========================================
// ACTIVITY TYPES
// ==========================================

export type GenerationActivityType =
    | 'JOB_CREATED'
    | 'JOB_STARTED'
    | 'STEP_COMPLETED'
    | 'JOB_COMPLETED'
    | 'JOB_FAILED'
    | 'JOB_CANCELLED'
    | 'VERSION_CREATED'
    | 'DEPLOYED'
    | 'ROLLED_BACK'
    | 'CLONED'
    | 'EDITED'
    | 'DELETED';

export interface GenerationActivity {
    id: string;
    jobId: string;
    websiteId?: string;
    userId: string;
    activityType: GenerationActivityType;
    stepName?: string;
    details?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

// ==========================================
// RATE LIMIT TYPES
// ==========================================

export interface GenerationRateLimit {
    id: string;
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    requestsCount: number;
    requestsLimit: number;
    tokensUsed: number;
    estimatedCost: number;
    createdAt: Date;
    updatedAt: Date;
}

// ==========================================
// API REQUEST/RESPONSE TYPES
// ==========================================

export interface CreateGenerationRequest {
    prompt: string;
    templateId?: string;
    companyId?: string;
    customSettings?: Record<string, unknown>;
}

export interface CreateGenerationResponse {
    success: boolean;
    jobId?: string;
    message: string;
    estimatedDuration?: number;
    meta: {
        requestId: string;
    };
}

export interface GenerationStatusResponse {
    success: boolean;
    job?: GenerationJob;
    message?: string;
    meta: {
        requestId: string;
    };
}

export interface GalleryQueryParams {
    page?: number;
    limit?: number;
    status?: GenerationStatus;
    search?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'name';
    sortOrder?: 'asc' | 'desc';
}

export interface GalleryResponse {
    success: boolean;
    websites: GeneratedWebsite[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    meta: {
        requestId: string;
    };
}

export interface CloneWebsiteRequest {
    websiteId: string;
    newName: string;
    prompt?: string;
}

export interface RollbackRequest {
    websiteId: string;
    toVersion: number;
}

// ==========================================
// REAL-TIME TYPES
// ==========================================

export interface GenerationProgressEvent {
    type: 'progress';
    jobId: string;
    step: string;
    progress: number;
    message: string;
    timestamp: Date;
}

export interface GenerationCompleteEvent {
    type: 'complete';
    jobId: string;
    websiteId: string;
    previewUrl: string;
    timestamp: Date;
}

export interface GenerationErrorEvent {
    type: 'error';
    jobId: string;
    errorCode: string;
    errorMessage: string;
    canRetry: boolean;
    timestamp: Date;
}

export type GenerationEvent =
    | GenerationProgressEvent
    | GenerationCompleteEvent
    | GenerationErrorEvent;

// ==========================================
// VALIDATION TYPES
// ==========================================

export interface PromptValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    characterCount: number;
    maxCharacters: number;
    estimatedComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
}

export const GENERATION_LIMITS = {
    PROMPT_MAX_LENGTH: 2000,
    PROMPT_MIN_LENGTH: 20,
    MAX_GENERATIONS_PER_HOUR: 10,
    MAX_GENERATIONS_PER_DAY: 50,
    MAX_RETRIES: 3,
    MAX_VERSIONS_PER_SITE: 20,
} as const;
