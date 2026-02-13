export type AgentApprovalStep = 'GENERATE' | 'PUBLISH'

export type AgentApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN'

export type AgentVoteDecision = 'APPROVE' | 'REJECT'

export interface AgentApprovalActor {
  userId?: string | null
  role?: string | null
  email?: string | null
  name?: string | null
}

export interface AgentApprovalVoteInput {
  reviewerKey: string
  decision: AgentVoteDecision
  score: number
  rationale: string
  latencyMs?: number
  raw?: unknown
  timedOut?: boolean
}

export interface AgentApprovalConfig {
  requiredVotes: number
  threshold: number
  timeoutMs: number
}

export interface AgentApprovalResult {
  id: string
  projectId: string
  step: AgentApprovalStep
  contentFingerprint: string
  status: AgentApprovalStatus
  requiredVotes: number
  receivedVotes: number
  approvedVotes: number
  threshold: number
  timeoutMs: number
  reason: string | null
  forced: boolean
  forcedByUserId: string | null
  createdAt: string
  updatedAt: string
  votes: AgentApprovalVoteRecord[]
}

export interface AgentApprovalVoteRecord {
  reviewerKey: string
  decision: AgentVoteDecision
  score: number
  rationale: string
  latencyMs: number | null
  createdAt: string
  timedOut: boolean
}

export interface AgentApprovalRunInput {
  projectId: string
  step: AgentApprovalStep
  payload: Record<string, unknown>
  actor?: AgentApprovalActor
  force?: boolean
}

export interface AgentApprovalReviewerInput {
  reviewerKey: string
  step: AgentApprovalStep
  payload: Record<string, unknown>
  threshold: number
}
