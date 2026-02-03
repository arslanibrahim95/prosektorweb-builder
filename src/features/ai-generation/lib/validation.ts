/**
 * AI Generation Validation Utilities
 * Prompt validation, rate limiting, and permission checks
 */

import { z } from 'zod';
import { GENERATION_LIMITS, type PromptValidationResult } from '../types';
import { prisma } from '@/server/db';
import { logger } from '@/shared/lib';
import { createHash } from 'crypto';

export { GENERATION_LIMITS, type PromptValidationResult };

// ==========================================
// PROMPT VALIDATION SCHEMA
// ==========================================

export const promptSchema = z.object({
    prompt: z
        .string()
        .min(GENERATION_LIMITS.PROMPT_MIN_LENGTH, {
            message: `Prompt must be at least ${GENERATION_LIMITS.PROMPT_MIN_LENGTH} characters`,
        })
        .max(GENERATION_LIMITS.PROMPT_MAX_LENGTH, {
            message: `Prompt must not exceed ${GENERATION_LIMITS.PROMPT_MAX_LENGTH} characters`,
        })
        .regex(/[a-zA-Z\u00C0-\u017F]+/, {
            message: 'Prompt must contain at least some text',
        }),
    templateId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    customSettings: z.record(z.string(), z.unknown()).optional(),
});

export type PromptInput = z.infer<typeof promptSchema>;

// ==========================================
// PROMPT VALIDATION
// ==========================================

/**
 * Validates a generation prompt and returns detailed validation results
 */
export function validatePrompt(prompt: string): PromptValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const characterCount = prompt.length;

    // Check minimum length
    if (characterCount < GENERATION_LIMITS.PROMPT_MIN_LENGTH) {
        errors.push(
            `Prompt is too short. Minimum ${GENERATION_LIMITS.PROMPT_MIN_LENGTH} characters required.`
        );
    }

    // Check maximum length
    if (characterCount > GENERATION_LIMITS.PROMPT_MAX_LENGTH) {
        errors.push(
            `Prompt is too long. Maximum ${GENERATION_LIMITS.PROMPT_MAX_LENGTH} characters allowed.`
        );
    }

    // Check for meaningful content
    const wordCount = prompt.trim().split(/\s+/).length;
    if (wordCount < 3) {
        errors.push('Prompt must contain at least 3 words');
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /eval\s*\(/i,
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(prompt)) {
            errors.push('Prompt contains potentially unsafe content');
            break;
        }
    }

    // Warnings for better prompts
    if (characterCount < 50) {
        warnings.push('Consider providing more details for better results');
    }

    if (!prompt.toLowerCase().includes('website') &&
        !prompt.toLowerCase().includes('site') &&
        !prompt.toLowerCase().includes('web')) {
        warnings.push('Consider mentioning you want a website for clearer results');
    }

    // Estimate complexity
    let estimatedComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' = 'SIMPLE';
    if (wordCount > 50 || prompt.includes('blog') || prompt.includes('e-commerce')) {
        estimatedComplexity = 'COMPLEX';
    } else if (wordCount > 20) {
        estimatedComplexity = 'MODERATE';
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        characterCount,
        maxCharacters: GENERATION_LIMITS.PROMPT_MAX_LENGTH,
        estimatedComplexity,
    };
}

/**
 * Sanitizes a prompt for safe storage and processing
 */
export function sanitizePrompt(prompt: string): string {
    return prompt
        .trim()
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .slice(0, GENERATION_LIMITS.PROMPT_MAX_LENGTH);
}

/**
 * Generates a hash of the prompt for deduplication
 */
export function hashPrompt(prompt: string): string {
    return createHash('sha256').update(prompt.toLowerCase().trim()).digest('hex');
}

// ==========================================
// RATE LIMITING
// ==========================================

interface RateLimitCheck {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    reason?: string;
}

/**
 * Checks if a user can create a new generation job
 */
export async function checkGenerationRateLimit(
    userId: string,
    userRole: string
): Promise<RateLimitCheck> {
    // Admins have no rate limit
    if (userRole === 'ADMIN') {
        return {
            allowed: true,
            remaining: 999999,
            resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };
    }

    const now = new Date();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

    try {
        // Get or create rate limit record for current hour
        let rateLimit = await prisma.generationRateLimit.findFirst({
            where: {
                userId,
                periodEnd: {
                    gt: now,
                },
            },
            orderBy: {
                periodStart: 'desc',
            },
        });

        if (!rateLimit) {
            // Create new rate limit period
            rateLimit = await prisma.generationRateLimit.create({
                data: {
                    userId,
                    periodStart: hourStart,
                    periodEnd: hourEnd,
                    requestsCount: 0,
                    requestsLimit: GENERATION_LIMITS.MAX_GENERATIONS_PER_HOUR,
                },
            });
        }

        const remaining = rateLimit.requestsLimit - rateLimit.requestsCount;

        if (remaining <= 0) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: rateLimit.periodEnd,
                reason: `Hourly limit reached. Try again after ${rateLimit.periodEnd.toLocaleTimeString()}`,
            };
        }

        return {
            allowed: true,
            remaining,
            resetAt: rateLimit.periodEnd,
        };
    } catch (error) {
        logger.error({ error, userId }, 'Rate limit check failed');
        // Fail open - allow request if we can't check rate limit
        return {
            allowed: true,
            remaining: 1,
            resetAt: hourEnd,
        };
    }
}

/**
 * Increments the generation rate limit counter for a user
 */
export async function incrementGenerationRateLimit(
    userId: string,
    tokensUsed: number = 0,
    estimatedCost: number = 0
): Promise<void> {
    try {
        const now = new Date();

        await prisma.generationRateLimit.updateMany({
            where: {
                userId,
                periodEnd: {
                    gt: now,
                },
            },
            data: {
                requestsCount: {
                    increment: 1,
                },
                tokensUsed: {
                    increment: tokensUsed,
                },
                estimatedCost: {
                    increment: estimatedCost,
                },
                updatedAt: now,
            },
        });
    } catch (error) {
        logger.error({ error, userId }, 'Failed to increment rate limit');
    }
}

// ==========================================
// PERMISSION CHECKS
// ==========================================

interface PermissionCheck {
    allowed: boolean;
    reason?: string;
}

/**
 * Checks if a user has permission to generate websites
 */
export function checkGenerationPermission(userRole: string): PermissionCheck {
    const allowedRoles = ['ADMIN', 'DOCTOR', 'EXPERT', 'OFFICE'];

    if (allowedRoles.includes(userRole)) {
        return { allowed: true };
    }

    return {
        allowed: false,
        reason: 'You do not have permission to generate websites. Contact an administrator.',
    };
}

/**
 * Checks if a user can access a specific generation job
 */
export async function checkJobAccess(
    userId: string,
    userRole: string,
    jobId: string
): Promise<PermissionCheck> {
    // Admins can access all jobs
    if (userRole === 'ADMIN') {
        return { allowed: true };
    }

    try {
        const job = await prisma.aIGenerationJob.findUnique({
            where: { id: jobId },
            select: { userId: true },
        });

        if (!job) {
            return {
                allowed: false,
                reason: 'Generation job not found',
            };
        }

        if (job.userId !== userId) {
            return {
                allowed: false,
                reason: 'You do not have permission to access this generation job',
            };
        }

        return { allowed: true };
    } catch (error) {
        logger.error({ error, userId, jobId }, 'Job access check failed');
        return {
            allowed: false,
            reason: 'Unable to verify access permissions',
        };
    }
}

/**
 * Checks if a user can modify a generated website
 */
export async function checkWebsiteModificationPermission(
    userId: string,
    userRole: string,
    websiteId: string
): Promise<PermissionCheck> {
    // Admins can modify all websites
    if (userRole === 'ADMIN') {
        return { allowed: true };
    }

    try {
        const website = await prisma.generatedWebsite.findUnique({
            where: { id: websiteId },
            select: { userId: true, isDeployed: true },
        });

        if (!website) {
            return {
                allowed: false,
                reason: 'Website not found',
            };
        }

        if (website.userId !== userId) {
            return {
                allowed: false,
                reason: 'You do not have permission to modify this website',
            };
        }

        // Optionally prevent modification of deployed sites
        if (website.isDeployed) {
            return {
                allowed: false,
                reason: 'Cannot modify a deployed website. Create a new version instead.',
            };
        }

        return { allowed: true };
    } catch (error) {
        logger.error({ error, userId, websiteId }, 'Website modification check failed');
        return {
            allowed: false,
            reason: 'Unable to verify modification permissions',
        };
    }
}

// ==========================================
// VERSION CONTROL VALIDATION
// ==========================================

/**
 * Checks if a new version can be created for a website
 */
export async function canCreateNewVersion(websiteId: string): Promise<PermissionCheck> {
    try {
        const versionCount = await prisma.generatedWebsite.count({
            where: {
                OR: [
                    { id: websiteId },
                    { job: { parentJobId: websiteId } },
                ],
            },
        });

        if (versionCount >= GENERATION_LIMITS.MAX_VERSIONS_PER_SITE) {
            return {
                allowed: false,
                reason: `Maximum version limit (${GENERATION_LIMITS.MAX_VERSIONS_PER_SITE}) reached. Delete old versions to create new ones.`,
            };
        }

        return { allowed: true };
    } catch (error) {
        logger.error({ error, websiteId }, 'Version check failed');
        return {
            allowed: false,
            reason: 'Unable to verify version limits',
        };
    }
}

/**
 * Validates a rollback request
 */
export async function validateRollback(
    websiteId: string,
    toVersion: number
): Promise<PermissionCheck> {
    try {
        const targetVersion = await prisma.generatedWebsite.findFirst({
            where: {
                id: websiteId,
                version: toVersion,
                canRollback: true,
            },
        });

        if (!targetVersion) {
            return {
                allowed: false,
                reason: `Version ${toVersion} not found or cannot be rolled back to`,
            };
        }

        return { allowed: true };
    } catch (error) {
        logger.error({ error, websiteId, toVersion }, 'Rollback validation failed');
        return {
            allowed: false,
            reason: 'Unable to validate rollback request',
        };
    }
}
