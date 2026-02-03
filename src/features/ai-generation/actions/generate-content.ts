'use server';

import { createOrchestrator } from '../lib/orchestrator';
import type { AnalysisResult, DesignResult, ContentResult, CodeResult } from '../types';

interface GenerateWebsiteInput {
    prompt: string;
    templateId?: string;
    industry?: string;
}

interface GenerateWebsiteResult {
    success: boolean;
    websiteId?: string;
    analysis?: AnalysisResult;
    design?: DesignResult;
    content?: ContentResult;
    code?: CodeResult;
    error?: string;
}

/**
 * Main action to generate a complete website using AI
 */
export async function generateWebsite(input: GenerateWebsiteInput): Promise<GenerateWebsiteResult> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const orchestrator = createOrchestrator();

    console.log(`[generateWebsite] Starting job: ${jobId}`);
    console.log(`[generateWebsite] Prompt: ${input.prompt.slice(0, 100)}...`);

    try {
        const result = await orchestrator.startGeneration(jobId, {
            prompt: input.prompt,
            templateId: input.templateId,
            industry: input.industry,
        });

        if (!result.success) {
            console.error(`[generateWebsite] Failed:`, result.error);
            return { success: false, error: result.error };
        }

        // Get results from each step
        const analysis = orchestrator.getStepResult<AnalysisResult>('ANALYSIS');
        const design = orchestrator.getStepResult<DesignResult>('DESIGN');
        const content = orchestrator.getStepResult<ContentResult>('CONTENT');
        const code = orchestrator.getStepResult<CodeResult>('CODE');
        const buildResult = orchestrator.getStepResult<{ websiteId: string }>('BUILD');

        console.log(`[generateWebsite] Completed. Website ID: ${buildResult?.websiteId}`);

        return {
            success: true,
            websiteId: buildResult?.websiteId,
            analysis,
            design,
            content,
            code,
        };

    } catch (error) {
        console.error('[generateWebsite] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Generation failed',
        };
    }
}

/**
 * Quick content generation (single section)
 */
export async function generateQuickContent(
    sectionType: 'hero' | 'about' | 'services' | 'contact' | 'cta',
    context: { industry: string; businessName?: string; additionalInfo?: string }
): Promise<{ success: boolean; content?: string; error?: string }> {
    const { getOpenAIConnector } = await import('../lib/ai/openai-connector');
    const { getContentPrompt } = await import('../lib/prompts');

    const openai = getOpenAIConnector();
    const systemPrompt = getContentPrompt(sectionType);

    const userPrompt = `
Sektör: ${context.industry}
${context.businessName ? `İşletme: ${context.businessName}` : ''}
${context.additionalInfo ? `Ek bilgi: ${context.additionalInfo}` : ''}

Bu bilgilere göre ${sectionType} bölümü için içerik üret.
`;

    const result = await openai.generateWithSystem(
        systemPrompt,
        userPrompt,
        { temperature: 0.7, maxTokens: 1000 }
    );

    return {
        success: result.success,
        content: result.content,
        error: result.error,
    };
}
