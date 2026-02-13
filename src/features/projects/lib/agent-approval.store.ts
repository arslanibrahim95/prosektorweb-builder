import type { AgentApprovalRun, AgentApprovalVote } from '@prisma/client'
import { prisma } from '@/server/db'
import type {
  AgentApprovalConfig,
  AgentApprovalResult,
  AgentApprovalStatus,
  AgentApprovalStep,
  AgentApprovalVoteInput,
  AgentApprovalVoteRecord,
} from '@/features/projects/lib/agent-approval.types'

interface RunWithVotes extends AgentApprovalRun {
  votes: AgentApprovalVote[]
}

function mapVote(vote: AgentApprovalVote): AgentApprovalVoteRecord {
  return {
    reviewerKey: vote.reviewerKey,
    decision: vote.decision,
    score: vote.score,
    rationale: vote.rationale,
    latencyMs: vote.latencyMs,
    createdAt: vote.createdAt.toISOString(),
    timedOut: vote.timedOut,
  }
}

function mapRun(run: RunWithVotes): AgentApprovalResult {
  return {
    id: run.id,
    projectId: run.projectId,
    step: run.step,
    contentFingerprint: run.contentFingerprint,
    status: run.status,
    requiredVotes: run.requiredVotes,
    receivedVotes: run.receivedVotes,
    approvedVotes: run.approvedVotes,
    threshold: run.threshold,
    timeoutMs: run.timeoutMs,
    reason: run.reason,
    forced: run.forced,
    forcedByUserId: run.forcedByUserId,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    votes: run.votes
      .slice()
      .sort((a, b) => a.reviewerKey.localeCompare(b.reviewerKey))
      .map(mapVote),
  }
}

export async function findAgentApprovalRun(
  projectId: string,
  step: AgentApprovalStep,
  contentFingerprint: string
): Promise<AgentApprovalResult | null> {
  const run = await prisma.agentApprovalRun.findUnique({
    where: {
      projectId_step_contentFingerprint: {
        projectId,
        step,
        contentFingerprint,
      },
    },
    include: {
      votes: true,
    },
  })

  if (!run) return null
  return mapRun(run)
}

export async function listAgentApprovalRuns(
  projectId: string,
  limit = 20
): Promise<AgentApprovalResult[]> {
  const runs = await prisma.agentApprovalRun.findMany({
    where: {
      projectId,
    },
    include: {
      votes: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: Math.max(1, Math.min(100, limit)),
  })

  return runs.map(mapRun)
}

export async function saveAgentApprovalDecision(input: {
  projectId: string
  step: AgentApprovalStep
  contentFingerprint: string
  config: AgentApprovalConfig
  status: AgentApprovalStatus
  reason: string | null
  votes?: AgentApprovalVoteInput[]
  forced?: boolean
  forcedByUserId?: string | null
}): Promise<AgentApprovalResult> {
  return prisma.$transaction(async (tx) => {
    const run = await tx.agentApprovalRun.upsert({
      where: {
        projectId_step_contentFingerprint: {
          projectId: input.projectId,
          step: input.step,
          contentFingerprint: input.contentFingerprint,
        },
      },
      update: {
        threshold: input.config.threshold,
        timeoutMs: input.config.timeoutMs,
        requiredVotes: input.config.requiredVotes,
      },
      create: {
        projectId: input.projectId,
        step: input.step,
        contentFingerprint: input.contentFingerprint,
        threshold: input.config.threshold,
        timeoutMs: input.config.timeoutMs,
        requiredVotes: input.config.requiredVotes,
      },
    })

    if (Array.isArray(input.votes) && input.votes.length > 0) {
      for (const vote of input.votes) {
        await tx.agentApprovalVote.upsert({
          where: {
            runId_reviewerKey: {
              runId: run.id,
              reviewerKey: vote.reviewerKey,
            },
          },
          update: {
            decision: vote.decision,
            score: vote.score,
            rationale: vote.rationale,
            latencyMs: vote.latencyMs,
            raw: vote.raw ?? undefined,
            timedOut: Boolean(vote.timedOut),
          },
          create: {
            runId: run.id,
            reviewerKey: vote.reviewerKey,
            decision: vote.decision,
            score: vote.score,
            rationale: vote.rationale,
            latencyMs: vote.latencyMs,
            raw: vote.raw ?? undefined,
            timedOut: Boolean(vote.timedOut),
          },
        })
      }
    }

    const allVotes = await tx.agentApprovalVote.findMany({
      where: {
        runId: run.id,
      },
    })

    const approvedVotes = allVotes.filter((vote) => vote.decision === 'APPROVE').length
    const receivedVotes = allVotes.length

    const updatedRun = await tx.agentApprovalRun.update({
      where: {
        id: run.id,
      },
      data: {
        status: input.status,
        reason: input.reason,
        forced: Boolean(input.forced),
        forcedByUserId: input.forced ? input.forcedByUserId || null : null,
        approvedVotes,
        receivedVotes,
      },
      include: {
        votes: true,
      },
    })

    return mapRun(updatedRun)
  })
}
