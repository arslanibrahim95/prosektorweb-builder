'use server';

import { prisma } from '@/server/db';
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

interface GenerationJobSnapshot {
    status?: string | null;
    errorMessage?: string | null;
    analysisResult?: unknown;
    designResult?: unknown;
    contentResult?: unknown;
    codeResult?: unknown;
    buildOutput?: unknown;
}

function parseJobJson<T>(value: unknown): T | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as T;
        } catch {
            return undefined;
        }
    }
    if (typeof value === 'object') {
        return value as T;
    }
    return undefined;
}

async function readGenerationSnapshot(jobId: string): Promise<GenerationJobSnapshot | null> {
    const rows = await prisma.$queryRaw<GenerationJobSnapshot[]>`
        SELECT
            status,
            errorMessage,
            analysisResult,
            designResult,
            contentResult,
            codeResult,
            buildOutput
        FROM AIGenerationJob
        WHERE id = ${jobId}
        LIMIT 1
    `;

    if (!Array.isArray(rows) || rows.length === 0) {
        return null;
    }

    return rows[0];
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
        await orchestrator.startGeneration(jobId, {
            prompt: input.prompt,
            templateId: input.templateId,
            customSettings: input.industry ? { industry: input.industry } : undefined,
        });

        const snapshot = await readGenerationSnapshot(jobId);

        if (!snapshot) {
            return { success: false, error: 'Generation snapshot not found' };
        }

        const status = (snapshot.status || '').toUpperCase();
        if (status === 'FAILED') {
            const message = snapshot.errorMessage || 'Generation failed';
            console.error('[generateWebsite] Failed:', message);
            return { success: false, error: message };
        }

        const analysis = parseJobJson<AnalysisResult>(snapshot.analysisResult);
        const design = parseJobJson<DesignResult>(snapshot.designResult);
        const content = parseJobJson<ContentResult>(snapshot.contentResult);
        const code = parseJobJson<CodeResult>(snapshot.codeResult);
        const build = parseJobJson<{ projectId?: string; websiteId?: string }>(snapshot.buildOutput);
        const websiteId = build?.projectId || build?.websiteId;

        console.log(`[generateWebsite] Completed. Website ID: ${websiteId || 'n/a'}`);

        return {
            success: true,
            websiteId,
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
