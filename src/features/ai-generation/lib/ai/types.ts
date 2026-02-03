/**
 * AI Content Generation Types
 * Multi-model content pipeline için type tanımları
 */

// ================================
// CONTENT TYPES
// ================================

export type ContentType =
    | 'HOMEPAGE'
    | 'ABOUT'
    | 'SERVICES'
    | 'CONTACT'
    | 'BLOG'
    | 'FAQ'
    | 'DESIGN'
    | 'CAREERS';

export type ContentStatus =
    | 'DRAFT'
    | 'APPROVED'
    | 'REJECTED'
    | 'PUBLISHED';

// ================================
// AI MODEL TYPES
// ================================

export type AIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'kilocode';

export interface AIModelConfig {
    model: AIModel;
    maxTokens: number;
    temperature: number;
}

// ================================
// GENERATION REQUEST/RESPONSE
// ================================

export interface CompanyInfo {
    name: string;
    industry?: string;
    services?: string[];
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
    naceCode?: string;
    dangerClass?: 'LESS_DANGEROUS' | 'DANGEROUS' | 'VERY_DANGEROUS';
}

export interface GenerationRequest {
    projectId: string;
    contentType: ContentType;
    companyInfo: CompanyInfo;
    language?: 'tr' | 'en';
    tone?: 'professional' | 'friendly' | 'corporate';
    additionalContext?: string;
}

export interface GeneratedContentResult {
    success: boolean;
    content?: string;
    title?: string;
    metaTitle?: string;
    metaDescription?: string;
    modelUsed: AIModel;
    tokensUsed?: number;
    error?: string;
}

// ================================
// CONNECTOR INTERFACE
// ================================

export interface AIConnector {
    generate(prompt: string, config?: Partial<AIModelConfig>): Promise<GeneratedContentResult>;
    generateWithSystem(systemPrompt: string, userPrompt: string, config?: Partial<AIModelConfig>): Promise<GeneratedContentResult>;
}

// ================================
// CONTENT TEMPLATES
// ================================

export interface PageTemplate {
    contentType: ContentType;
    sections: string[];
    requiredFields: (keyof CompanyInfo)[];
}

export const PAGE_TEMPLATES: Record<ContentType, PageTemplate> = {
    HOMEPAGE: {
        contentType: 'HOMEPAGE',
        sections: ['hero', 'services', 'about-preview', 'cta'],
        requiredFields: ['name', 'services'],
    },
    ABOUT: {
        contentType: 'ABOUT',
        sections: ['company-story', 'mission-vision', 'team', 'values'],
        requiredFields: ['name'],
    },
    SERVICES: {
        contentType: 'SERVICES',
        sections: ['service-list', 'service-details', 'pricing-cta'],
        requiredFields: ['name', 'services'],
    },
    CONTACT: {
        contentType: 'CONTACT',
        sections: ['contact-form', 'address', 'map', 'working-hours'],
        requiredFields: ['name', 'address', 'phone', 'email'],
    },
    BLOG: {
        contentType: 'BLOG',
        sections: ['title', 'introduction', 'content', 'conclusion'],
        requiredFields: ['name'],
    },
    FAQ: {
        contentType: 'FAQ',
        sections: ['questions-answers'],
        requiredFields: ['name', 'services'],
    },
    DESIGN: {
        contentType: 'DESIGN',
        sections: ['style-guide', 'color-palette', 'typography'],
        requiredFields: ['name'],
    },
    CAREERS: {
        contentType: 'CAREERS',
        sections: ['why-us', 'open-positions', 'application-process', 'benefits'],
        requiredFields: ['name'],
    },
};

// ================================
// OSGB SPECIFIC TYPES
// ================================

export interface OSGBCompanyInfo extends CompanyInfo {
    osgbServices?: string[];
    certificateNumber?: string;
    workplaceCount?: number;
    employeeCount?: number;
}

export const OSGB_DEFAULT_SERVICES = [
    'İş Sağlığı ve Güvenliği Hizmetleri',
    'Risk Değerlendirmesi',
    'İşyeri Hekimliği',
    'İş Güvenliği Uzmanlığı',
    'Acil Durum Planlaması',
    'İSG Eğitimleri',
    'Sağlık Gözetimi',
    'Ortam Ölçümleri',
];
