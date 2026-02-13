import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAgentApprovalFingerprint,
  evaluateAgentVotes,
} from '../src/features/projects/lib/agent-approval'

const config = {
  requiredVotes: 3,
  threshold: 80,
  timeoutMs: 20_000,
}

test('buildAgentApprovalFingerprint is stable for object key order', () => {
  const a = buildAgentApprovalFingerprint({
    projectId: 'p1',
    payload: {
      b: 2,
      a: 1,
    },
  })

  const b = buildAgentApprovalFingerprint({
    payload: {
      a: 1,
      b: 2,
    },
    projectId: 'p1',
  })

  assert.equal(a, b)
})

test('evaluateAgentVotes approves only unanimous votes above threshold', () => {
  const result = evaluateAgentVotes(
    [
      { reviewerKey: 'r1', decision: 'APPROVE', score: 82, rationale: 'ok' },
      { reviewerKey: 'r2', decision: 'APPROVE', score: 88, rationale: 'ok' },
      { reviewerKey: 'r3', decision: 'APPROVE', score: 91, rationale: 'ok' },
    ],
    config
  )

  assert.equal(result.approved, true)
  assert.equal(result.status, 'APPROVED')
})

test('evaluateAgentVotes rejects when one reviewer score is below threshold', () => {
  const result = evaluateAgentVotes(
    [
      { reviewerKey: 'r1', decision: 'APPROVE', score: 82, rationale: 'ok' },
      { reviewerKey: 'r2', decision: 'APPROVE', score: 78, rationale: 'low score' },
      { reviewerKey: 'r3', decision: 'APPROVE', score: 95, rationale: 'ok' },
    ],
    config
  )

  assert.equal(result.approved, false)
  assert.equal(result.status, 'REJECTED')
  assert.match(result.reason || '', /esik/i)
})

test('evaluateAgentVotes rejects when timeout exists', () => {
  const result = evaluateAgentVotes(
    [
      { reviewerKey: 'r1', decision: 'APPROVE', score: 84, rationale: 'ok' },
      { reviewerKey: 'r2', decision: 'REJECT', score: 0, rationale: 'timeout', timedOut: true },
      { reviewerKey: 'r3', decision: 'APPROVE', score: 93, rationale: 'ok' },
    ],
    config
  )

  assert.equal(result.approved, false)
  assert.equal(result.status, 'REJECTED')
  assert.match(result.reason || '', /timeout/i)
})
