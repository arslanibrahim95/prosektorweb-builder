'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface GeneratePageInput {
    projectName: string;
    industry: string;
    template: string;
    sections: string[];
}

interface PageSection {
    type: string;
    title: string;
    content: string;
    metadata?: Record<string, unknown>;
}

interface GeneratePageResult {
    success: boolean;
    sections?: PageSection[];
    error?: string;
}

export async function generatePage(input: GeneratePageInput): Promise<GeneratePageResult> {
    try {
        const systemPrompt = `Sen profesyonel bir web tasarımcısısın. ${input.industry} sektörü için ${input.projectName} isimli proje için sayfa içeriği üreteceksin. Template: ${input.template}. Türkçe içerik üret.`;

        const userPrompt = `Aşağıdaki bölümler için içerik üret: ${input.sections.join(', ')}. Her bölüm için JSON formatında: { type, title, content } döndür.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 2000,
        });

        const rawContent = response.choices[0]?.message?.content;

        if (!rawContent) {
            return { success: false, error: 'Sayfa üretilemedi' };
        }

        const parsed = JSON.parse(rawContent);
        const sections = parsed.sections || [];

        return { success: true, sections };
    } catch (error) {
        console.error('AI page generation error:', error);
        return { success: false, error: 'Sayfa üretimi başarısız' };
    }
}
