import type { AgentApprovalReviewerInput } from '@/features/projects/lib/agent-approval.types'

export interface AgentApprovalPromptPackage {
  system: string
  user: string
}

export function buildAgentApprovalPrompt(input: AgentApprovalReviewerInput): AgentApprovalPromptPackage {
  const system = [
    'You are a strict release gate reviewer for Turkish OSGB website projects.',
    'Return only JSON with keys: decision, score, rationale.',
    'decision must be APPROVE or REJECT.',
    'score must be an integer between 0 and 100.',
    'Reject if there are clear quality, clarity, coverage, or safety problems.',
    'Do not include markdown.',
  ].join(' ')

  const reviewerFocus = resolveReviewerFocus(input.reviewerKey)

  const user = [
    `Step: ${input.step}`,
    `Reviewer: ${input.reviewerKey}`,
    `Approval threshold: ${input.threshold}`,
    `Focus: ${reviewerFocus}`,
    'Payload JSON:',
    JSON.stringify(input.payload),
  ].join('\n')

  return { system, user }
}

function resolveReviewerFocus(reviewerKey: string): string {
  switch (reviewerKey) {
    case 'structure_guard':
      return 'Page structure completeness, required pages, and coherent information architecture.'
    case 'content_guard':
      return 'Content quality, clarity, useful details, and consistency with service domain.'
    case 'launch_guard':
      return 'Publish readiness, SEO basics, user trust signals, and contact clarity.'
    default:
      return 'General quality and release readiness.'
  }
}
