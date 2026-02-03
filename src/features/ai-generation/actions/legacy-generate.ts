'use server';

/**
 * AI Content Generation Server Actions
 * Firma bilgilerinden web sitesi içeriği üretir
 * 
 * Desteklenen modlar:
 * - Python Pipeline (claude-code-maestro yapısı) 
 * - TypeScript Connector (fallback)
 */

import { prisma } from '@/server/db';
import { getContentGenerator } from '@/features/ai-generation/lib/ai';
import { executeWithRetry } from '@/shared/lib';
import { revalidatePath } from 'next/cache';
import type { ContentType, CompanyInfo } from '@/features/ai-generation/lib/ai/types';
import { ContentType as PrismaContentType, ContentStatus } from '@prisma/client';
import { spawn } from 'child_process';
import path from 'path';
import { auth } from '@/auth';

// ================================
// TYPES
// ================================

interface GenerateResult {
    success: boolean;
    contentId?: string;
    error?: string;
}

interface GenerateAllResult {
    success: boolean;
    generated: number;
    failed: number;
    errors?: string[];
}

interface PythonPipelineResult {
    success: boolean;
    content?: string;
    model_used?: string;
    tokens_used?: number;
    review_score?: number;
    error?: string;
}

// ================================
// CONFIGURATION
// ================================

const USE_PYTHON_PIPELINE = process.env.USE_PYTHON_PIPELINE === 'true';
const PYTHON_SCRIPT_PATH = path.join(process.cwd(), 'scripts', 'ai', 'osgb_pipeline.py');

// ================================
// HELPER FUNCTIONS
// ================================

/**
 * Admin check (Server-side)
 */
async function requireAdmin() {
    const session = await auth();
    if (!session || session.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized: Admin access required');
    }
}

/**
 * Firma ve proje bilgilerini CompanyInfo formatına dönüştür
 */
async function getCompanyInfoFromProject(projectId: string): Promise<CompanyInfo | null> {
    const project = await prisma.webProject.findUnique({
        where: { id: projectId },
        include: {
            company: true
        },
    });

    if (!project) return null;

    const company = project.company;

    return {
        name: company.name,
        industry: 'OSGB',
        services: [
            'İş Sağlığı ve Güvenliği Hizmetleri',
            'Risk Değerlendirmesi',
            'İşyeri Hekimliği',
            'İş Güvenliği Uzmanlığı',
            'ISG Eğitimleri',
        ],
        address: company.address || undefined,
        phone: company.phone || undefined,
        email: company.email || undefined,
        naceCode: company.naceCode || undefined,
        dangerClass: company.dangerClass as CompanyInfo['dangerClass'],
    };
}

/**
 * Python pipeline ile içerik üret (claude-code-maestro yapısı)
 * SECURE: exec yerine spawn kullanıldı
 */
async function generateWithPythonPipeline(
    contentType: string,
    companyInfo: CompanyInfo
): Promise<PythonPipelineResult> {
    return new Promise((resolve) => {
        try {
            const args = [
                PYTHON_SCRIPT_PATH,
                '--type', contentType.toLowerCase(),
                '--company', companyInfo.name,
            ];

            if (companyInfo.address) args.push('--address', companyInfo.address);
            if (companyInfo.phone) args.push('--phone', companyInfo.phone);
            if (companyInfo.email) args.push('--email', companyInfo.email);

            const pythonProcess = spawn('python3', args, {
                // Security: Only pass necessary environment variables, do not leak all secrets
                env: {
                    PATH: process.env.PATH,
                    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
                    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
                    NODE_ENV: process.env.NODE_ENV,
                    // Add other specific keys if the python script needs them
                } as NodeJS.ProcessEnv,
                cwd: process.cwd(),
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // 2 dakika timeout
            const timeout = setTimeout(() => {
                pythonProcess.kill();
                resolve({ success: false, error: 'Python pipeline timeout (120s)' });
            }, 120000);

            pythonProcess.on('close', (code) => {
                clearTimeout(timeout);

                if (code !== 0) {
                    // Kod hatası olsa bile stderr kontrol et
                    if (!stdout && stderr) {
                        resolve({ success: false, error: `Process exited with code ${code}: ${stderr}` });
                        return;
                    }
                }

                // Parse output
                const lines = stdout.split('\n');
                const separatorIndex = lines.findIndex(line => line.includes('====='));

                let content = stdout;
                let modelUsed = 'claude';
                let reviewScore: number | undefined;

                if (separatorIndex !== -1) {
                    const statusSection = lines.slice(0, separatorIndex + 1).join('\n');
                    content = lines.slice(separatorIndex + 2).join('\n').trim();

                    const modelMatch = statusSection.match(/Model:\s*(\S+)/);
                    const scoreMatch = statusSection.match(/Review Score:\s*(\d+)/);

                    modelUsed = modelMatch?.[1] || 'claude';
                    reviewScore = scoreMatch ? parseInt(scoreMatch[1]) : undefined;
                }

                resolve({
                    success: true,
                    content,
                    model_used: modelUsed,
                    review_score: reviewScore,
                });
            });

            pythonProcess.on('error', (err) => {
                clearTimeout(timeout);
                resolve({ success: false, error: `Spawn error: ${err.message}` });
            });

        } catch (error) {
            console.error('Python pipeline error:', error);
            resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Python pipeline hatası',
            });
        }
    });
}

// ================================
// SERVER ACTIONS
// ================================

/**
 * Tek sayfa içeriği üret
 * USE_PYTHON_PIPELINE=true ise Python pipeline kullanır
 */
export async function generatePageContent(
    projectId: string,
    contentType: ContentType
): Promise<GenerateResult> {
    try {
        await requireAdmin();

        // Firma bilgilerini al
        const companyInfo = await getCompanyInfoFromProject(projectId);
        if (!companyInfo) {
            return { success: false, error: 'Proje bulunamadı' };
        }

        let content: string | undefined;
        let title: string | undefined;
        let metaTitle: string | undefined;
        let metaDescription: string | undefined;
        let modelUsed = 'gpt-4-turbo';
        let tokensUsed: number | undefined;

        if (USE_PYTHON_PIPELINE) {
            // Python Pipeline (claude-code-maestro)
            // WHY: Python ecosystem has better Agent/Maestro libraries. We spawn a child process to leverage them until JS ecosystem catches up.
            // WRAPPED: Resilient execution with retry
            const pyRes = await executeWithRetry(
                () => generateWithPythonPipeline(contentType, companyInfo),
                { name: 'python_pipeline', timeoutMs: 120000, maxAttempts: 1 }
                // WHY: Retrying a heavy 2-minute process is risky for server load. We prefer to fail fast after 1 attempt times out.
            );

            if (!pyRes.ok) {
                return { success: false, error: pyRes.error.message };
            }
            const pyResult = pyRes.data;

            if (!pyResult.success) {
                return { success: false, error: pyResult.error || 'Python pipeline hatası' };
            }

            content = pyResult.content;
            modelUsed = pyResult.model_used || 'claude';
        } else {
            // TypeScript Connector kullan
            // WRAPPED: Resilient execution with retry
            const genRes = await executeWithRetry(
                () => getContentGenerator().generateContent({
                    projectId,
                    contentType,
                    companyInfo,
                }),
                { name: 'ts_connector', maxAttempts: 3, timeoutMs: 60000 }
            );

            if (!genRes.ok) {
                return { success: false, error: genRes.error.message };
            }
            const result = genRes.data;


            if (!result.success) {
                return { success: false, error: result.error || 'İçerik üretilemedi' };
            }

            content = result.content;
            title = result.title;
            metaTitle = result.metaTitle;
            metaDescription = result.metaDescription;
            modelUsed = result.modelUsed;
            tokensUsed = result.tokensUsed;
        }

        if (!content) {
            return { success: false, error: 'İçerik üretilemedi' };
        }

        // Mevcut içeriği kontrol et (aynı tip varsa güncelle)
        const existing = await prisma.generatedContent.findFirst({
            where: {
                webProjectId: projectId,
                contentType: contentType as PrismaContentType,
            },
        });

        if (existing) {
            // Güncelle
            await prisma.generatedContent.update({
                where: { id: existing.id },
                data: {
                    content: content || '',
                    title: title,
                    metaTitle: metaTitle,
                    metaDescription: metaDescription,
                    modelUsed: modelUsed,
                    tokensUsed: tokensUsed,
                    generatedAt: new Date(),
                    status: 'DRAFT',
                },
            });

            revalidatePath(`/admin/projects/${projectId}`);
            return { success: true, contentId: existing.id };
        }

        // Yeni oluştur
        const newContent = await prisma.generatedContent.create({
            data: {
                webProjectId: projectId,
                contentType: contentType as PrismaContentType,
                content: content || '',
                title: title,
                metaTitle: metaTitle,
                metaDescription: metaDescription,
                modelUsed: modelUsed,
                tokensUsed: tokensUsed,
                status: 'DRAFT',
            },
        });

        revalidatePath(`/admin/projects/${projectId}`);
        return { success: true, contentId: newContent.id };
    } catch (error) {
        console.error('generatePageContent error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata',
        };
    }
}

/**
 * Tüm site içeriklerini üret
 */
export async function generateAllContent(projectId: string): Promise<GenerateAllResult> {
    try {
        await requireAdmin();
        const contentTypes: ContentType[] = ['DESIGN', 'HOMEPAGE', 'ABOUT', 'SERVICES', 'CONTACT', 'FAQ', 'CAREERS'];
        const errors: string[] = [];
        let generated = 0;
        let failed = 0;

        for (const contentType of contentTypes) {
            const result = await generatePageContent(projectId, contentType);

            if (result.success) {
                generated++;
            } else {
                failed++;
                errors.push(`${contentType}: ${result.error}`);
            }

            // Rate limiting için kısa bekleme
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        revalidatePath(`/admin/projects/${projectId}`);

        return {
            success: failed === 0,
            generated,
            failed,
            errors: errors.length > 0 ? errors : undefined,
        };
    } catch (error) {
        return { success: false, generated: 0, failed: 0, errors: [error instanceof Error ? error.message : 'Unauthorized'] };
    }
}

/**
 * İçeriği onayla
 */
export async function approveContent(contentId: string): Promise<GenerateResult> {
    try {
        await requireAdmin();
        const content = await prisma.generatedContent.update({
            where: { id: contentId },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
            },
        });

        revalidatePath(`/admin/projects/${content.webProjectId}`);
        return { success: true, contentId };
    } catch (error) {
        console.error('approveContent error:', error);
        return { success: false, error: 'İçerik onaylanamadı' };
    }
}

/**
 * İçeriği reddet
 */
export async function rejectContent(contentId: string): Promise<GenerateResult> {
    try {
        await requireAdmin();
        const content = await prisma.generatedContent.update({
            where: { id: contentId },
            data: {
                status: 'REJECTED',
            },
        });

        revalidatePath(`/admin/projects/${content.webProjectId}`);
        return { success: true, contentId };
    } catch (error) {
        console.error('rejectContent error:', error);
        return { success: false, error: 'İçerik reddedilemedi' };
    }
}

/**
 * İçeriği yeniden üret
 */
export async function regenerateContent(contentId: string): Promise<GenerateResult> {
    try {
        await requireAdmin();
        const existing = await prisma.generatedContent.findUnique({
            where: { id: contentId },
        });

        if (!existing) {
            return { success: false, error: 'İçerik bulunamadı' };
        }

        return generatePageContent(existing.webProjectId, existing.contentType as ContentType);
    } catch (error) {
        console.error('regenerateContent error:', error);
        return { success: false, error: 'İçerik yeniden üretilemedi' };
    }
}

/**
 * Proje için üretilen içerikleri getir
 */
export async function getGeneratedContents(projectId: string) {
    try {
        // Portal için de kullanılıyor, o yüzden tenant kontrolü (auth) gerekli
        const session = await auth();
        if (!session) return [];

        if (session.user?.role === 'ADMIN') {
            return prisma.generatedContent.findMany({
                where: { webProjectId: projectId },
                orderBy: { createdAt: 'desc' },
            });
        }

        // Client ise sadece kendi şirketinin projesi ise
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) return [];

        // Proje bu şirkete mi ait?
        const project = await prisma.webProject.findFirst({
            where: { id: projectId, companyId: user.companyId }
        });

        if (!project) return [];

        return prisma.generatedContent.findMany({
            where: { webProjectId: projectId },
            orderBy: { createdAt: 'desc' },
        });

    } catch (error) {
        return [];
    }
}

/**
 * Tek içerik getir
 */
export async function getGeneratedContent(contentId: string) {
    try {
        const session = await auth();
        if (!session) return null;

        const content = await prisma.generatedContent.findUnique({
            where: { id: contentId },
            include: { webProject: { select: { companyId: true } } }
        });

        if (!content) return null;

        if (session.user?.role === 'ADMIN') return content;

        // Client tenant check
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (user?.companyId && content.webProject.companyId === user.companyId) {
            return content;
        }

        return null;
    } catch (error) {
        return null;
    }
}
