import { createHash } from 'node:crypto'
import type {
  AgentApprovalReviewerInput,
  AgentApprovalVoteInput,
  AgentVoteDecision,
} from '@/features/projects/lib/agent-approval.types'

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort()
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
  return `{${entries.join(',')}}`
}

function calculateBaseScore(payload: Record<string, unknown>): number {
  const text = stableStringify(payload)
  const length = text.length

  let score = 50
  if (length > 700) score += 12
  if (length > 1400) score += 8

  const lowered = text.toLowerCase()

  if (lowered.includes('hakkimizda')) score += 6
  if (lowered.includes('hizmet')) score += 6
  if (lowered.includes('iletisim')) score += 6
  if (lowered.includes('seo')) score += 4

  const looksThin = lowered.includes('"description":""') || lowered.includes('"services":""')
  if (looksThin) score -= 10

  return Math.max(0, Math.min(100, score))
}

function reviewerOffset(reviewerKey: string, payload: Record<string, unknown>): number {
  const digest = createHash('sha256')
    .update(reviewerKey)
    .update(':')
    .update(stableStringify(payload))
    .digest('hex')

  const bucket = Number.parseInt(digest.slice(0, 2), 16) % 9
  return bucket - 4
}

function toDecision(score: number, threshold: number): AgentVoteDecision {
  return score >= threshold ? 'APPROVE' : 'REJECT'
}

export async function runMockApprovalReviewer(
  input: AgentApprovalReviewerInput
): Promise<AgentApprovalVoteInput> {
  const startedAt = Date.now()
  const baseScore = calculateBaseScore(input.payload)
  const score = Math.max(0, Math.min(100, baseScore + reviewerOffset(input.reviewerKey, input.payload)))
  const decision = toDecision(score, input.threshold)
  const rationale =
    decision === 'APPROVE'
      ? `Mock reviewer ${input.reviewerKey}: release criteria satisfied with score ${score}.`
      : `Mock reviewer ${input.reviewerKey}: content quality below threshold (${score}/${input.threshold}).`

  return {
    reviewerKey: input.reviewerKey,
    decision,
    score,
    rationale,
    latencyMs: Date.now() - startedAt,
    raw: {
      provider: 'mock',
      step: input.step,
    },
  }
}
