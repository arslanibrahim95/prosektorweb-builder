import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  buildAgentApprovalPrompt,
  type AgentApprovalPromptPackage,
} from '@/features/projects/lib/agent-approval.prompts'
import { runMockApprovalReviewer } from '@/features/projects/lib/agent-approval.mock'
import {
  findAgentApprovalRun,
  saveAgentApprovalDecision,
} from '@/features/projects/lib/agent-approval.store'
import type {
  AgentApprovalConfig,
  AgentApprovalResult,
  AgentApprovalRunInput,
  AgentApprovalReviewerInput,
  AgentApprovalVoteInput,
} from '@/features/projects/lib/agent-approval.types'
import {
  callOpenAIResponses,
  extractFirstJsonObject,
  extractOpenAIOutputText,
} from '@/lib/openai-client'

const REVIEWER_KEYS = ['structure_guard', 'content_guard', 'launch_guard'] as const

const openAiVoteSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  score: z.number().int().min(0).max(100),
  rationale: z.string().trim().min(1).max(2000),
})

export class AgentApprovalAccessError extends Error {
  statusCode = 403

  constructor(message = 'Bu islem icin ADMIN yetkisi gerekli.') {
    super(message)
    this.name = 'AgentApprovalAccessError'
  }
}

export class AgentApprovalRejectedError extends Error {
  statusCode: number
  approval: AgentApprovalResult

  constructor(approval: AgentApprovalResult) {
    super(buildRejectedMessage(approval))
    this.name = 'AgentApprovalRejectedError'
    this.approval = approval
    this.statusCode = approval.reason?.toLowerCase().includes('timeout') ? 504 : 409
  }
}

function buildRejectedMessage(approval: AgentApprovalResult): string {
  const reason = approval.reason || 'AI agent onayi alinmadi.'
  return `AI approval red: ${reason}`
}

function parseIntEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return parsed
}

function normalizeThreshold(rawValue: number): number {
  if (!Number.isFinite(rawValue)) return 80
  if (rawValue < 0) return 0
  if (rawValue > 100) return 100
  return Math.round(rawValue)
}

function normalizeRequiredVotes(rawValue: number): number {
  if (!Number.isFinite(rawValue)) return 3
  if (rawValue < 1) return 1
  if (rawValue > 3) return 3
  return Math.round(rawValue)
}

function normalizeTimeoutMs(rawValue: number): number {
  if (!Number.isFinite(rawValue)) return 20_000
  if (rawValue < 1_000) return 1_000
  if (rawValue > 120_000) return 120_000
  return Math.round(rawValue)
}

export function getAgentApprovalConfig(): AgentApprovalConfig {
  return {
    requiredVotes: normalizeRequiredVotes(
      parseIntEnv(process.env.AGENT_APPROVAL_REQUIRED_VOTES, REVIEWER_KEYS.length)
    ),
    threshold: normalizeThreshold(parseIntEnv(process.env.AGENT_APPROVAL_MIN_SCORE, 80)),
    timeoutMs: normalizeTimeoutMs(parseIntEnv(process.env.AGENT_APPROVAL_TIMEOUT_MS, 20_000)),
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  const body = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')
  return `{${body}}`
}

export function buildAgentApprovalFingerprint(payload: Record<string, unknown>): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex')
}

function isAdminRole(role: string | null | undefined): boolean {
  return String(role || '').trim().toUpperCase() === 'ADMIN'
}

function shouldUseMockProvider(): boolean {
  const mode = String(process.env.AGENT_APPROVAL_MODE || '').trim().toLowerCase()
  if (mode === 'mock') return true
  if (mode === 'openai') return false
  if (process.env.NODE_ENV === 'test') return true
  const hasOpenAi = Boolean((process.env.OPENAI_API_KEY || '').trim())
  return !hasOpenAi
}

function buildProviderPayload(prompt: AgentApprovalPromptPackage) {
  return {
    model: process.env.AGENT_APPROVAL_OPENAI_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: [
      {
        role: 'system' as const,
        content: [{ type: 'input_text' as const, text: prompt.system }],
      },
      {
        role: 'user' as const,
        content: [{ type: 'input_text' as const, text: prompt.user }],
      },
    ],
    temperature: 0.2,
    max_output_tokens: 350,
  }
}

function fallbackRejectedVote(
  reviewerKey: string,
  reason: string,
  startedAt: number,
  raw?: unknown,
  timedOut?: boolean
): AgentApprovalVoteInput {
  return {
    reviewerKey,
    decision: 'REJECT',
    score: 0,
    rationale: reason,
    latencyMs: Date.now() - startedAt,
    raw,
    timedOut,
  }
}

async function runOpenAiReviewer(
  input: AgentApprovalReviewerInput,
  timeoutMs: number
): Promise<AgentApprovalVoteInput> {
  const startedAt = Date.now()
  const prompt = buildAgentApprovalPrompt(input)
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => {
    controller.abort('timeout')
  }, timeoutMs)

  try {
    const bodyData = await callOpenAIResponses(buildProviderPayload(prompt), controller.signal)
    const outputText = extractOpenAIOutputText(bodyData)
    const jsonText = extractFirstJsonObject(outputText)

    if (!jsonText) {
      return fallbackRejectedVote(
        input.reviewerKey,
        'OpenAI reviewer parse edilemedi (JSON yok).',
        startedAt,
        bodyData
      )
    }

    const parsed = openAiVoteSchema.safeParse(JSON.parse(jsonText))
    if (!parsed.success) {
      return fallbackRejectedVote(
        input.reviewerKey,
        'OpenAI reviewer gecersiz JSON dondurdu.',
        startedAt,
        bodyData
      )
    }

    return {
      reviewerKey: input.reviewerKey,
      decision: parsed.data.decision,
      score: parsed.data.score,
      rationale: parsed.data.rationale,
      latencyMs: Date.now() - startedAt,
      raw: bodyData,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OpenAI reviewer hatasi'
    const timedOut = /abort|timeout/i.test(message)
    return fallbackRejectedVote(
      input.reviewerKey,
      timedOut ? 'Reviewer timeout nedeniyle cevap vermedi.' : message,
      startedAt,
      null,
      timedOut
    )
  } finally {
    clearTimeout(timeoutHandle)
  }
}

async function runReviewer(
  input: AgentApprovalReviewerInput,
  config: AgentApprovalConfig
): Promise<AgentApprovalVoteInput> {
  if (shouldUseMockProvider()) {
    const start = Date.now()
    const timeoutMs = config.timeoutMs

    const votePromise = runMockApprovalReviewer(input)
    const timeoutPromise = new Promise<AgentApprovalVoteInput>((resolve) => {
      setTimeout(() => {
        resolve(
          fallbackRejectedVote(
            input.reviewerKey,
            `Mock reviewer timeout (${timeoutMs}ms).`,
            start,
            { provider: 'mock' },
            true
          )
        )
      }, timeoutMs)
    })

    return Promise.race([votePromise, timeoutPromise])
  }

  const timeoutMs = config.timeoutMs
  const start = Date.now()

  const reviewPromise = runOpenAiReviewer(input, timeoutMs)
  const timeoutPromise = new Promise<AgentApprovalVoteInput>((resolve) => {
    setTimeout(() => {
      resolve(
        fallbackRejectedVote(
          input.reviewerKey,
          `Reviewer timeout (${timeoutMs}ms).`,
          start,
          null,
          true
        )
      )
    }, timeoutMs)
  })

  return Promise.race([reviewPromise, timeoutPromise])
}

export function evaluateAgentVotes(
  votes: AgentApprovalVoteInput[],
  config: AgentApprovalConfig
): {
  approved: boolean
  status: 'APPROVED' | 'REJECTED'
  reason: string | null
} {
  if (votes.length < config.requiredVotes) {
    return {
      approved: false,
      status: 'REJECTED',
      reason: `Yetersiz reviewer oyu (${votes.length}/${config.requiredVotes}).`,
    }
  }

  const hasTimeout = votes.some((vote) => vote.timedOut)
  if (hasTimeout) {
    return {
      approved: false,
      status: 'REJECTED',
      reason: `En az bir reviewer timeout yasadi (${config.timeoutMs}ms).`,
    }
  }

  const hasExplicitReject = votes.some((vote) => vote.decision !== 'APPROVE')
  if (hasExplicitReject) {
    return {
      approved: false,
      status: 'REJECTED',
      reason: 'Reviewer oy birligi saglanamadi.',
    }
  }

  const hasLowScore = votes.some((vote) => vote.score < config.threshold)
  if (hasLowScore) {
    return {
      approved: false,
      status: 'REJECTED',
      reason: `Reviewer skoru esik altinda (${config.threshold}).`,
    }
  }

  return {
    approved: true,
    status: 'APPROVED',
    reason: null,
  }
}

export async function runAgentApproval(
  input: AgentApprovalRunInput
): Promise<AgentApprovalResult> {
  const config = getAgentApprovalConfig()
  const contentFingerprint = buildAgentApprovalFingerprint(input.payload)

  if (input.force && !isAdminRole(input.actor?.role)) {
    throw new AgentApprovalAccessError('force=true kullanimi icin ADMIN yetkisi gerekir.')
  }

  if (input.force) {
    return saveAgentApprovalDecision({
      projectId: input.projectId,
      step: input.step,
      contentFingerprint,
      config,
      status: 'OVERRIDDEN',
      reason: 'ADMIN force override ile approval adimi gecildi.',
      forced: true,
      forcedByUserId: input.actor?.userId || null,
    })
  }

  const existing = await findAgentApprovalRun(input.projectId, input.step, contentFingerprint)
  if (existing && existing.status !== 'PENDING') {
    if (existing.status === 'APPROVED' || existing.status === 'OVERRIDDEN') {
      return existing
    }
    throw new AgentApprovalRejectedError(existing)
  }

  const reviewers = REVIEWER_KEYS.slice(0, config.requiredVotes)
  const votes = await Promise.all(
    reviewers.map((reviewerKey) =>
      runReviewer({
        reviewerKey,
        step: input.step,
        payload: input.payload,
        threshold: config.threshold,
      }, config)
    )
  )

  const decision = evaluateAgentVotes(votes, config)

  const saved = await saveAgentApprovalDecision({
    projectId: input.projectId,
    step: input.step,
    contentFingerprint,
    config,
    status: decision.status,
    reason: decision.reason,
    votes,
    forced: false,
  })

  if (!decision.approved) {
    throw new AgentApprovalRejectedError(saved)
  }

  return saved
}
