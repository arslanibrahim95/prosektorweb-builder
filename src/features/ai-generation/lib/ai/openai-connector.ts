/**
 * OpenAI GPT-4 Connector
 * AI içerik üretimi için OpenAI API entegrasyonu
 */

import OpenAI from 'openai';
import type { AIConnector, AIModel, AIModelConfig, GeneratedContentResult } from './types';

const DEFAULT_CONFIG: AIModelConfig = {
    model: 'gpt-4-turbo',
    maxTokens: 4096,
    temperature: 0.7,
};

export class OpenAIConnector implements AIConnector {
    private client: OpenAI;
    private defaultConfig: AIModelConfig;

    constructor(apiKey?: string, config?: Partial<AIModelConfig>) {
        const key = apiKey || process.env.OPENAI_API_KEY;

        if (!key) {
            throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
        }

        this.client = new OpenAI({ apiKey: key });
        this.defaultConfig = { ...DEFAULT_CONFIG, ...config };
    }

    async generate(
        prompt: string,
        config?: Partial<AIModelConfig>
    ): Promise<GeneratedContentResult> {
        return this.generateWithSystem(
            'You are a professional content writer for Turkish businesses. Write in Turkish unless specified otherwise.',
            prompt,
            config
        );
    }

    async generateWithSystem(
        systemPrompt: string,
        userPrompt: string,
        config?: Partial<AIModelConfig>
    ): Promise<GeneratedContentResult> {
        const finalConfig = { ...this.defaultConfig, ...config };

        try {

            const response = await this.client.chat.completions.create({
                model: finalConfig.model,
                max_tokens: finalConfig.maxTokens,
                temperature: finalConfig.temperature,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            });

            const content = response.choices[0]?.message?.content || '';
            const tokensUsed = response.usage?.total_tokens;

            // Parse title and meta from content if structured
            const { title, metaTitle, metaDescription, body } = this.parseStructuredContent(content);

            return {
                success: true,
                content: body || content,
                title,
                metaTitle,
                metaDescription,
                modelUsed: finalConfig.model as AIModel,
                tokensUsed,
            };
        } catch (error) {
            console.error('OpenAI generation error:', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                modelUsed: finalConfig.model as AIModel,
            };
        }
    }

    /**
     * Parse structured content with optional title and meta tags
     */
    private parseStructuredContent(content: string): {
        title?: string;
        metaTitle?: string;
        metaDescription?: string;
        body: string;
    } {
        let title: string | undefined;
        let metaTitle: string | undefined;
        let metaDescription: string | undefined;
        let body = content;

        // Try to extract title (# heading)
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            title = titleMatch[1].trim();
            body = content.replace(titleMatch[0], '').trim();
        }

        // Try to extract meta tags from structured format
        const metaTitleMatch = content.match(/META_TITLE:\s*(.+)/i);
        if (metaTitleMatch) {
            metaTitle = metaTitleMatch[1].trim();
            body = body.replace(metaTitleMatch[0], '').trim();
        }

        const metaDescMatch = content.match(/META_DESCRIPTION:\s*(.+)/i);
        if (metaDescMatch) {
            metaDescription = metaDescMatch[1].trim();
            body = body.replace(metaDescMatch[0], '').trim();
        }

        // Use title as metaTitle if not specified
        if (!metaTitle && title) {
            metaTitle = title;
        }

        return { title, metaTitle, metaDescription, body };
    }
}

// ================================
// SINGLETON FACTORY
// ================================

let connectorInstance: OpenAIConnector | null = null;

export function getOpenAIConnector(config?: Partial<AIModelConfig>): OpenAIConnector {
    if (!connectorInstance) {
        connectorInstance = new OpenAIConnector(undefined, config);
    }
    return connectorInstance;
}

export function resetConnector(): void {
    connectorInstance = null;
}
