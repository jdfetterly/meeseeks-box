import 'server-only'

import { resolveRuntimeApproval } from '@/lib/openclaw/runtime-approvals'
import { getApprovalById, upsertApproval } from '@/lib/product-state/repositories'
import { syncApprovalImpact } from '@/lib/product-state/projections'

export interface ApprovalResolutionServiceResult {
  approvalId: string
  decision: 'allow-once' | 'deny'
  runtime: ReturnType<typeof resolveRuntimeApproval>
  approval: ReturnType<typeof getApprovalById>
}

export function resolveCanonicalApproval(
  input: {
    approvalId: string
    decision: 'allow-once' | 'deny'
  },
  rootDir = process.cwd(),
): ApprovalResolutionServiceResult {
  const existing = getApprovalById(input.approvalId, rootDir)

  if (!existing) {
    throw new Error(`Unknown approval: ${input.approvalId}`)
  }

  if (existing.status !== 'pending') {
    throw new Error(`Approval is not pending: ${input.approvalId}`)
  }

  const runtime = resolveRuntimeApproval(input)

  if (runtime.status !== 'resolved') {
    return {
      approvalId: input.approvalId,
      decision: input.decision,
      runtime,
      approval: existing,
    }
  }

  const resolvedAt = new Date().toISOString()
  const approval = upsertApproval(
    {
      id: existing.id,
      runId: existing.runId,
      status: input.decision === 'deny' ? 'denied' : 'approved',
      request: existing.request,
      resolution: {
        decision: input.decision,
        resolvedBy: 'meeseeks-box',
        ts: resolvedAt,
      },
      requestedAt: existing.requestedAt,
      resolvedAt,
    },
    rootDir,
  )
  syncApprovalImpact(approval, rootDir)

  return {
    approvalId: input.approvalId,
    decision: input.decision,
    runtime,
    approval,
  }
}
