/**
 * AI Generation Orchestrator
 * Manages the multi-step website generation workflow
 */

import { getOpenAIConnector } from '@/features/ai-generation/lib/ai/openai-connector';
import { prisma } from '@/server/db';
import type {
    GenerationJob,
    GenerationStep,
    AnalysisResult,
    DesignResult,
    ContentResult,
    CodeResult,
} from '../types';

const logger = {
    info(meta: unknown, message?: string) {
        if (message) {
            console.info(message, meta);
            return;
        }
        console.info(meta);
    },
    error(meta: unknown, message?: string) {
        if (message) {
            console.error(message, meta);
            return;
        }
        console.error(meta);
    },
};

const redis = {
    async publish(_channel: string, _message: string): Promise<void> {
        // Redis is optional in this app layer; no-op keeps generation flow alive.
    },
};

interface GenerationContext {
    jobId: string;
    prompt: string;
    templateId?: string;
    customSettings?: Record<string, unknown>;
}

interface StepResult {
    success: boolean;
    data?: any;
    error?: string;
}

/**
 * Orchestrates the multi-step AI website generation process
 */
export class GenerationOrchestrator {
    private context: GenerationContext | null = null;
    private currentStep: number = 0;
    private readonly steps: GenerationStep[] = [
        'ANALYSIS',
        'DESIGN',
        'CONTENT',
        'CODE',
        'BUILD',
    ];

    /**
     * Starts the generation process
     */
    async startGeneration(
        jobId: string,
        context: Omit<GenerationContext, 'jobId'>
    ): Promise<void> {
        this.context = { jobId, ...context };
        this.currentStep = 0;

        logger.info({ jobId }, 'Starting generation orchestrator');

        try {
            // Update job status to started
            await this.updateJobStatus('ANALYZING', 0);

            // Execute each step
            for (const step of this.steps) {
                this.currentStep++;
                const progress = Math.round((this.currentStep / this.steps.length) * 100);

                logger.info({ jobId, step, progress }, `Executing generation step: ${step}`);

                const result = await this.executeStep(step);

                if (!result.success) {
                    await this.handleStepFailure(step, result.error || 'Unknown error');
                    return;
                }

                // Save step result
                await this.saveStepResult(step, result.data);
                await this.updateJobStatus(this.getNextStatus(step), progress);

                // Publish progress event
                await this.publishProgressEvent(step, progress);
            }

            // Complete generation
            await this.finalizeGeneration();

        } catch (error) {
            logger.error({ error, jobId }, 'Generation orchestrator error');
            await this.handleStepFailure('UNKNOWN', error instanceof Error ? error.message : 'Unknown error');
        }
    }

    /**
     * Executes a single generation step
     */
    private async executeStep(step: GenerationStep): Promise<StepResult> {
        if (!this.context) {
            return { success: false, error: 'Context not initialized' };
        }

        switch (step) {
            case 'ANALYSIS':
                return this.executeAnalysisStep();
            case 'DESIGN':
                return this.executeDesignStep();
            case 'CONTENT':
                return this.executeContentStep();
            case 'CODE':
                return this.executeCodeStep();
            case 'BUILD':
                return this.executeBuildStep();
            default:
                return { success: false, error: `Unknown step: ${step}` };
        }
    }

    /**
     * Step 1: Analyze requirements and create plan
     */
    private async executeAnalysisStep(): Promise<StepResult> {
        try {
            const openai = getOpenAIConnector();

            const systemPrompt = `You are an expert web development consultant. Analyze the user's request and create a detailed plan for website generation.

Respond in JSON format with the following structure:
{
  "requirements": {
    "businessType": "type of business",
    "targetAudience": ["audience1", "audience2"],
    "goals": ["goal1", "goal2"],
    "features": ["feature1", "feature2"]
  },
  "recommendations": {
    "template": "recommended template",
    "pages": ["page1", "page2"],
    "style": "design style description",
    "tone": "content tone"
  },
  "complexity": "SIMPLE|MODERATE|COMPLEX",
  "estimatedTokens": number
}`;

            const response = await openai.generateWithSystem(
                systemPrompt,
                `Analyze this website request and create a generation plan:\n\n${this.context!.prompt}`,
                { temperature: 0.3 }
            );

            if (!response.success || !response.content) {
                return { success: false, error: response.error || 'Analysis failed' };
            }

            const analysisResult: AnalysisResult = JSON.parse(response.content);

            logger.info({
                jobId: this.context!.jobId,
                complexity: analysisResult.complexity
            }, 'Analysis step completed');

            return { success: true, data: analysisResult };
        } catch (error) {
            logger.error({ error, jobId: this.context!.jobId }, 'Analysis step failed');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Analysis failed'
            };
        }
    }

    /**
     * Step 2: Generate design system
     */
    private async executeDesignStep(): Promise<StepResult> {
        try {
            const openai = getOpenAIConnector();

            const systemPrompt = `You are an expert UI/UX designer. Create a complete design system for the website.

Respond in JSON format with:
{
  "colorScheme": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "accent": "#hexcolor",
    "background": "#hexcolor",
    "text": "#hexcolor"
  },
  "typography": {
    "headingFont": "font name",
    "bodyFont": "font name",
    "baseSize": 16
  },
  "layout": {
    "maxWidth": "1200px",
    "spacing": "1rem",
    "grid": "12-column"
  },
  "components": ["navbar", "hero", "features", "footer"]
}`;

            const response = await openai.generateWithSystem(
                systemPrompt,
                `Create a design system for: ${this.context!.prompt}`,
                { temperature: 0.4 }
            );

            if (!response.success || !response.content) {
                return { success: false, error: response.error || 'Design generation failed' };
            }

            const designResult: DesignResult = JSON.parse(response.content);

            return { success: true, data: designResult };
        } catch (error) {
            logger.error({ error, jobId: this.context!.jobId }, 'Design step failed');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Design generation failed'
            };
        }
    }

    /**
     * Step 3: Generate content
     */
    private async executeContentStep(): Promise<StepResult> {
        try {
            const openai = getOpenAIConnector();

            const systemPrompt = `You are a professional content writer for Turkish OSGB (occupational health and safety) companies. Create website content in Turkish.

Each section must include a "data" field with structured content matching the block type.

Respond in JSON format:
{
  "pages": [
    {
      "slug": "homepage",
      "title": "Ana Sayfa",
      "metaTitle": "SEO Title (max 60 chars)",
      "metaDescription": "SEO Description (max 160 chars)",
      "sections": [
        {
          "type": "hero",
          "order": 1,
          "content": "",
          "data": {
            "title": "Firma Adi - Is Sagligi ve Guvenligi",
            "subtitle": "Profesyonel OSGB hizmetleri...",
            "ctaText": "Ucretsiz Danismanlik",
            "stats": [
              { "value": "1000+", "label": "Is Yeri", "icon": "Shield" },
              { "value": "50000+", "label": "Calisan", "icon": "Users" }
            ]
          }
        },
        {
          "type": "services",
          "order": 2,
          "content": "",
          "data": {
            "sectionTitle": "Hizmetlerimiz",
            "sectionSubtitle": "Profesyonel ISG hizmetleri",
            "items": [
              { "icon": "Shield", "title": "Is Guvenligi", "description": "...", "features": ["feature1"] }
            ]
          }
        },
        {
          "type": "about",
          "order": 3,
          "content": "",
          "data": {
            "title": "Hakkimizda",
            "description": "<p>HTML content...</p>",
            "highlights": ["Deneyimli kadro", "7/24 destek"],
            "experienceYears": 15
          }
        },
        {
          "type": "faq",
          "order": 4,
          "content": "",
          "data": {
            "sectionTitle": "Sikca Sorulan Sorular",
            "items": [{ "question": "...", "answer": "..." }]
          }
        },
        {
          "type": "cta",
          "order": 5,
          "content": "",
          "data": {
            "title": "Hemen Iletisime Gecin",
            "subtitle": "...",
            "buttonText": "Ucretsiz Teklif Alin",
            "showPhone": true
          }
        }
      ]
    }
  ],
  "globalContent": {
    "navigation": [{"label": "Ana Sayfa", "href": "/"}],
    "footer": {
      "copyright": "© 2024 Firma Adi",
      "links": [{"label": "Gizlilik", "href": "/gizlilik"}]
    }
  }
}

Available section types: hero, services, about, cta, faq, team, stats, testimonials, gallery, content.
Always include at least: hero, services, about, cta sections for the homepage.`;

            const response = await openai.generateWithSystem(
                systemPrompt,
                `Create content for: ${this.context!.prompt}`,
                { temperature: 0.7 }
            );

            if (!response.success || !response.content) {
                return { success: false, error: response.error || 'Content generation failed' };
            }

            const contentResult: ContentResult = JSON.parse(response.content);

            return { success: true, data: contentResult };
        } catch (error) {
            logger.error({ error, jobId: this.context!.jobId }, 'Content step failed');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Content generation failed'
            };
        }
    }

    /**
     * Step 4: Generate code
     */
    private async executeCodeStep(): Promise<StepResult> {
        try {
            // Get previous results
            const analysisResult = await this.getStepResult<AnalysisResult>('ANALYSIS');
            const designResult = await this.getStepResult<DesignResult>('DESIGN');
            const contentResult = await this.getStepResult<ContentResult>('CONTENT');

            const openai = getOpenAIConnector();

            const systemPrompt = `You are an expert Next.js developer. Generate production-ready code.

Respond in JSON format with:
{
  "framework": "nextjs",
  "dependencies": ["dependency1", "dependency2"],
  "fileStructure": [
    {
      "path": "app/page.tsx",
      "content": "file content",
      "type": "page"
    }
  ],
  "buildConfig": {
    "output": "export",
    "optimization": true,
    "ssg": true
  }
}`;

            const response = await openai.generateWithSystem(
                systemPrompt,
                `Generate Next.js code for:
      Requirements: ${JSON.stringify(analysisResult?.requirements)}
      Design: ${JSON.stringify(designResult)}
      Content: ${JSON.stringify(contentResult)}`,
                { temperature: 0.2 }
            );

            if (!response.success || !response.content) {
                return { success: false, error: response.error || 'Code generation failed' };
            }

            const codeResult: CodeResult = JSON.parse(response.content);

            return { success: true, data: codeResult };
        } catch (error) {
            logger.error({ error, jobId: this.context!.jobId }, 'Code step failed');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Code generation failed'
            };
        }
    }

    // Step 5: Build and finalize — creates Website + Pages in Dashboard Payload/Puck
    private async executeBuildStep(): Promise<StepResult> {
        try {
            const mapper = await import('./payload-block-mapper');
            const { createDashboardSite, createDashboardPage } = await import('@/features/dashboard/client');
            const { createPuckDataFromBlocks, normalizePageSlug } = await import('@/features/dashboard/puck');

            const analysisResult = await this.getStepResult<AnalysisResult>('ANALYSIS');
            const designResult = await this.getStepResult<DesignResult>('DESIGN');
            const contentResult = await this.getStepResult<ContentResult>('CONTENT');

            if (!contentResult) {
                return { success: false, error: 'Content result not found' };
            }

            // 1. Map design to site fields
            const designFields = mapper.mapDesignToProjectFields(designResult);

            // 2. Map company info from analysis + content
            const companyFields = mapper.mapCompanyInfoToProjectFields(analysisResult, contentResult);

            const firstPageTitle = contentResult.pages[0]?.title || 'Generated Website';
            const siteSlug = `site-${Date.now()}`;

            // 3. Create canonical site record in dashboard
            const site = await createDashboardSite({
                name: firstPageTitle,
                slug: siteSlug,
                description: 'AI-generated website from: ' + this.context!.prompt.slice(0, 180),
                status: 'draft',
            });

            // 4. Create pages using pipeline -> payload blocks -> puckData mapping
            const payloadPages = mapper.mapPipelineOutputToPayloadPages(contentResult, 0);
            for (const pageData of payloadPages) {
                const title = pageData.title || 'Sayfa';
                await createDashboardPage({
                    siteId: String(site.id),
                    title,
                    slug: normalizePageSlug(pageData.slug || '/'),
                    status: 'draft',
                    seoTitle: pageData.metaTitle || null,
                    seoDescription: pageData.metaDescription || null,
                    puckData: createPuckDataFromBlocks(
                        title,
                        (pageData.content || []) as Array<{ blockType: string; [key: string]: unknown }>
                    ),
                });
            }

            // Update traditional job status for logging/tracking
            await prisma.$queryRaw`
                UPDATE "AIGenerationJob"
                SET "completedAt" = NOW(), "updatedAt" = NOW()
                WHERE id = ${this.context!.jobId}
            `;

            logger.info({
                jobId: this.context!.jobId,
                siteId: String(site.id),
                pagesCreated: payloadPages.length,
                hasDesignFields: Object.keys(designFields || {}).length > 0,
                hasCompanyFields: Object.keys(companyFields || {}).length > 0,
            }, 'Build step completed with Dashboard Payload/Puck integration');

            return { success: true, data: { projectId: String(site.id) } };
        } catch (error) {
            logger.error({ error, jobId: this.context!.jobId }, 'Build step failed during Dashboard sync');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Build failed'
            };
        }
    }

    /**
     * Updates the job status in the database
     */
    private async updateJobStatus(
        status: string,
        progress: number
    ): Promise<void> {
        await prisma.$queryRaw`
      UPDATE AIGenerationJob 
      SET 
        status = ${status},
        progress = ${progress},
        stepsCompleted = ${this.currentStep},
        currentStep = ${status},
        updatedAt = NOW()
      WHERE id = ${this.context!.jobId}
    `;
    }

    /**
     * Saves the result of a generation step
     */
    private async saveStepResult(step: GenerationStep, data: any): Promise<void> {
        const columnMap: Record<GenerationStep, string> = {
            'ANALYSIS': 'analysisResult',
            'DESIGN': 'designResult',
            'CONTENT': 'contentResult',
            'CODE': 'codeResult',
            'BUILD': 'buildOutput',
        };

        const column = columnMap[step];
        if (column) {
            await prisma.$queryRaw`
        UPDATE AIGenerationJob 
        SET ${column} = ${JSON.stringify(data)}, updatedAt = NOW()
        WHERE id = ${this.context!.jobId}
      `;
        }
    }

    /**
     * Retrieves a previous step result
     */
    private async getStepResult<T>(step: GenerationStep): Promise<T | null> {
        const columnMap: Record<GenerationStep, string> = {
            'ANALYSIS': 'analysisResult',
            'DESIGN': 'designResult',
            'CONTENT': 'contentResult',
            'CODE': 'codeResult',
            'BUILD': 'buildOutput',
        };

        const column = columnMap[step];
        const result = await prisma.$queryRaw`
      SELECT ${column} as data FROM AIGenerationJob WHERE id = ${this.context!.jobId} LIMIT 1
    `;

        if (Array.isArray(result) && result.length > 0) {
            const data = (result[0] as any).data;
            return data ? JSON.parse(data) : null;
        }

        return null;
    }

    /**
     * Handles step failure
     */
    private async handleStepFailure(step: string, error: string): Promise<void> {
        logger.error({
            jobId: this.context!.jobId,
            step,
            error
        }, 'Generation step failed');

        await prisma.$queryRaw`
      UPDATE AIGenerationJob 
      SET 
        status = 'FAILED',
        errorMessage = ${error},
        errorCode = ${step + '_FAILED'},
        updatedAt = NOW()
      WHERE id = ${this.context!.jobId}
    `;

        // Publish error event
        await this.publishErrorEvent(step, error);
    }

    /**
     * Finalizes the generation process
     */
    private async finalizeGeneration(): Promise<void> {
        await prisma.$queryRaw`
      UPDATE AIGenerationJob 
      SET 
        status = 'COMPLETED',
        progress = 100,
        stepsCompleted = ${this.steps.length},
        completedAt = NOW(),
        updatedAt = NOW()
      WHERE id = ${this.context!.jobId}
    `;

        // Log activity
        await prisma.$queryRaw`
      INSERT INTO GenerationActivity (id, jobId, userId, activityType, createdAt)
      VALUES (${crypto.randomUUID()}, ${this.context!.jobId}, 
        (SELECT userId FROM AIGenerationJob WHERE id = ${this.context!.jobId}), 
        'JOB_COMPLETED', NOW())
    `;

        // Publish completion event
        await this.publishCompleteEvent();

        logger.info({ jobId: this.context!.jobId }, 'Generation completed successfully');
    }

    /**
     * Gets the next status based on current step
     */
    private getNextStatus(step: GenerationStep): string {
        const statusMap: Record<GenerationStep, string> = {
            'ANALYSIS': 'ANALYZING',
            'DESIGN': 'DESIGNING',
            'CONTENT': 'GENERATING_CONTENT',
            'CODE': 'GENERATING_CODE',
            'BUILD': 'BUILDING',
        };
        return statusMap[step];
    }

    /**
     * Publishes a progress event to Redis
     */
    private async publishProgressEvent(step: string, progress: number): Promise<void> {
        const event = {
            type: 'progress',
            jobId: this.context!.jobId,
            step,
            progress,
            message: `Completed ${step} step`,
            timestamp: new Date(),
        };

        await redis.publish(`generation:${this.context!.jobId}`, JSON.stringify(event));
    }

    /**
     * Publishes a completion event
     */
    private async publishCompleteEvent(): Promise<void> {
        const event = {
            type: 'complete',
            jobId: this.context!.jobId,
            timestamp: new Date(),
        };

        await redis.publish(`generation:${this.context!.jobId}`, JSON.stringify(event));
    }

    /**
     * Publishes an error event
     */
    private async publishErrorEvent(step: string, error: string): Promise<void> {
        const event = {
            type: 'error',
            jobId: this.context!.jobId,
            errorCode: step + '_FAILED',
            errorMessage: error,
            canRetry: true,
            timestamp: new Date(),
        };

        await redis.publish(`generation:${this.context!.jobId}`, JSON.stringify(event));
    }
}

export function createOrchestrator(): GenerationOrchestrator {
    return new GenerationOrchestrator();
}
