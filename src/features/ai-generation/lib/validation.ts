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

interface DbRateLimitRow {
    periodEnd: Date;
    requestsCount: number | string;
    requestsLimit: number | string;
}

interface InMemoryRateLimit {
    periodStart: number;
    periodEnd: number;
    requestsCount: number;
}

const inMemoryRateLimits = new Map<string, InMemoryRateLimit>();
let loggedRateLimitFallback = false;

function getHourlyWindow(now: Date): { hourStart: Date; hourEnd: Date } {
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
    return { hourStart, hourEnd };
}

function getInMemoryRateLimit(userId: string, now: Date): InMemoryRateLimit {
    const key = `${userId}:${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
    const existing = inMemoryRateLimits.get(key);

    if (existing && existing.periodEnd > now.getTime()) {
        return existing;
    }

    const { hourStart, hourEnd } = getHourlyWindow(now);
    const created: InMemoryRateLimit = {
        periodStart: hourStart.getTime(),
        periodEnd: hourEnd.getTime(),
        requestsCount: 0,
    };
    inMemoryRateLimits.set(key, created);
    return created;
}

function buildInMemoryRateLimitCheck(userId: string, now: Date): RateLimitCheck {
    const rateLimit = getInMemoryRateLimit(userId, now);
    const remaining = GENERATION_LIMITS.MAX_GENERATIONS_PER_HOUR - rateLimit.requestsCount;

    if (remaining <= 0) {
        return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(rateLimit.periodEnd),
            reason: `Hourly limit reached. Try again after ${new Date(rateLimit.periodEnd).toLocaleTimeString()}`,
        };
    }

    return {
        allowed: true,
        remaining,
        resetAt: new Date(rateLimit.periodEnd),
    };
}

function incrementInMemoryRateLimit(userId: string, now: Date): void {
    const rateLimit = getInMemoryRateLimit(userId, now);
    rateLimit.requestsCount += 1;
}

function isMissingRelationError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    return (
        (message.includes('relation') && message.includes('does not exist')) ||
        message.includes('no such table') ||
        message.includes('column') && message.includes('does not exist')
    );
}

async function queryLegacyRows<T>(
    sqlVariants: string[],
    values: unknown[]
): Promise<T[]> {
    let lastError: unknown;

    for (const query of sqlVariants) {
        try {
            return await prisma.$queryRawUnsafe<T[]>(query, ...values);
        } catch (error) {
            lastError = error;
            if (!isMissingRelationError(error)) {
                throw error;
            }
        }
    }

    if (lastError) {
        throw lastError;
    }

    return [];
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
    const { hourStart, hourEnd } = getHourlyWindow(now);

    try {
        let rateLimit = (
            await queryLegacyRows<DbRateLimitRow>(
                [
                    `SELECT "periodEnd", "requestsCount", "requestsLimit"
                     FROM "GenerationRateLimit"
                     WHERE "userId" = $1 AND "periodEnd" > $2
                     ORDER BY "periodStart" DESC
                     LIMIT 1`,
                    `SELECT periodEnd, requestsCount, requestsLimit
                     FROM GenerationRateLimit
                     WHERE userId = $1 AND periodEnd > $2
                     ORDER BY periodStart DESC
                     LIMIT 1`,
                ],
                [userId, now]
            )
        )[0];

        if (!rateLimit) {
            rateLimit = (
                await queryLegacyRows<DbRateLimitRow>(
                    [
                        `INSERT INTO "GenerationRateLimit"
                        ("id", "userId", "periodStart", "periodEnd", "requestsCount", "requestsLimit", "createdAt", "updatedAt")
                        VALUES ($1, $2, $3, $4, 0, $5, $6, $6)
                        RETURNING "periodEnd", "requestsCount", "requestsLimit"`,
                        `INSERT INTO GenerationRateLimit
                        (id, userId, periodStart, periodEnd, requestsCount, requestsLimit, createdAt, updatedAt)
                        VALUES ($1, $2, $3, $4, 0, $5, $6, $6)
                        RETURNING periodEnd, requestsCount, requestsLimit`,
                    ],
                    [
                        crypto.randomUUID(),
                        userId,
                        hourStart,
                        hourEnd,
                        GENERATION_LIMITS.MAX_GENERATIONS_PER_HOUR,
                        now,
                    ]
                )
            )[0];
        }

        if (!rateLimit) {
            return buildInMemoryRateLimitCheck(userId, now);
        }

        const requestsLimit = Number(rateLimit.requestsLimit);
        const requestsCount = Number(rateLimit.requestsCount);
        const resetAt = new Date(rateLimit.periodEnd);
        const remaining = requestsLimit - requestsCount;

        if (remaining <= 0) {
            return {
                allowed: false,
                remaining: 0,
                resetAt,
                reason: `Hourly limit reached. Try again after ${resetAt.toLocaleTimeString()}`,
            };
        }

        return {
            allowed: true,
            remaining,
            resetAt,
        };
    } catch (error) {
        if (!loggedRateLimitFallback && isMissingRelationError(error)) {
            loggedRateLimitFallback = true;
            logger.warn(
                { userId },
                'GenerationRateLimit table not found, using in-memory rate limit fallback'
            );
        } else {
            logger.error({ error, userId }, 'Rate limit check failed');
        }

        return buildInMemoryRateLimitCheck(userId, now);
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

        await queryLegacyRows(
            [
                `UPDATE "GenerationRateLimit"
                 SET "requestsCount" = "requestsCount" + 1,
                     "tokensUsed" = COALESCE("tokensUsed", 0) + $1,
                     "estimatedCost" = COALESCE("estimatedCost", 0) + $2,
                     "updatedAt" = $3
                 WHERE "userId" = $4
                   AND "periodEnd" > $3
                 RETURNING "id"`,
                `UPDATE GenerationRateLimit
                 SET requestsCount = requestsCount + 1,
                     tokensUsed = COALESCE(tokensUsed, 0) + $1,
                     estimatedCost = COALESCE(estimatedCost, 0) + $2,
                     updatedAt = $3
                 WHERE userId = $4
                   AND periodEnd > $3
                 RETURNING id`,
            ],
            [tokensUsed, estimatedCost, now, userId]
        );
    } catch (error) {
        if (!isMissingRelationError(error)) {
            logger.error({ error, userId }, 'Failed to increment rate limit');
        }
        incrementInMemoryRateLimit(userId, new Date());
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
    const allowedRoles = ['ADMIN', 'USER', 'PARTNER'];

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
        const job = (
            await queryLegacyRows<{ userId: string }>(
                [
                    `SELECT "userId" FROM "AIGenerationJob" WHERE "id" = $1 LIMIT 1`,
                    `SELECT userId FROM AIGenerationJob WHERE id = $1 LIMIT 1`,
                ],
                [jobId]
            )
        )[0];

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
        const website = (
            await queryLegacyRows<{ userId: string; isDeployed: boolean | null }>(
                [
                    `SELECT "userId", "isDeployed" FROM "GeneratedWebsite" WHERE "id" = $1 LIMIT 1`,
                    `SELECT userId, isDeployed FROM GeneratedWebsite WHERE id = $1 LIMIT 1`,
                ],
                [websiteId]
            )
        )[0];

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
        if (Boolean(website.isDeployed)) {
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
        const versionCountRow = (
            await queryLegacyRows<{ count: number | string }>(
                [
                    `SELECT COUNT(*)::int AS "count"
                     FROM "GeneratedWebsite"
                     WHERE "id" = $1
                        OR "jobId" IN (
                            SELECT "id"
                            FROM "AIGenerationJob"
                            WHERE "parentJobId" = $1
                        )`,
                    `SELECT COUNT(*)::int AS count
                     FROM GeneratedWebsite
                     WHERE id = $1
                        OR jobId IN (
                            SELECT id
                            FROM AIGenerationJob
                            WHERE parentJobId = $1
                        )`,
                ],
                [websiteId]
            )
        )[0];
        const versionCount = Number(versionCountRow?.count ?? 0);

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
            allowed: true,
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
        const targetVersion = (
            await queryLegacyRows<{ id: string }>(
                [
                    `SELECT "id"
                     FROM "GeneratedWebsite"
                     WHERE "id" = $1
                       AND "version" = $2
                       AND "canRollback" = TRUE
                     LIMIT 1`,
                    `SELECT id
                     FROM GeneratedWebsite
                     WHERE id = $1
                       AND version = $2
                       AND canRollback = TRUE
                     LIMIT 1`,
                ],
                [websiteId, toVersion]
            )
        )[0];

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
