// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import * as resolveRoute from '@/app/api/product-state/approvals/[id]/resolve/route'
import { createRun, createWorkItem, upsertApproval } from '@/lib/product-state/repositories'
import { syncWorkItemSummary } from '@/lib/product-state/projections'
import { createProductStateHarness } from '@/lib/testing/harness'

const harnesses: ReturnType<typeof createProductStateHarness>[] = []

function makeHarness() {
  const harness = createProductStateHarness()
  harnesses.push(harness)
  harness.useAsProcessStateDir()
  return harness
}

vi.mock('@/lib/openclaw/runtime-approvals', async () => {
  const actual = await vi.importActual<typeof import('@/lib/openclaw/runtime-approvals')>(
    '@/lib/openclaw/runtime-approvals',
  )

  return {
    ...actual,
    resolveRuntimeApproval: vi.fn((input: { approvalId: string; decision: 'allow-once' | 'deny' }) => ({
      status: 'resolved',
      mode: 'ssh',
      approvalId: input.approvalId,
      decision: input.decision,
      reason: null,
      raw: { ok: true },
    })),
  }
})

afterEach(() => {
  vi.clearAllMocks()

  for (const harness of harnesses.splice(0)) {
    harness.cleanup()
  }
})

describe('approval resolution api', () => {
  it('resolves a pending approval through the canonical service', async () => {
    makeHarness()
    const workItem = createWorkItem({
      title: 'Approval route target',
      scope: 'ops',
    })
    const run = createRun({
      scope: 'ops',
      triggerKind: 'manual',
      workItemId: workItem.id,
      status: 'waiting_approval',
    })
    syncWorkItemSummary(workItem.id)
    upsertApproval({
      id: 'approval-route-1',
      runId: run.id,
      status: 'pending',
      request: {
        approvalType: 'confirm',
        requestedActionType: 'exec.write',
        workItemId: workItem.id,
      },
    })

    const response = await resolveRoute.POST(
      new Request('http://localhost/api/product-state/approvals/approval-route-1/resolve', {
        method: 'POST',
        body: JSON.stringify({
          decision: 'allow-once',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
      { params: Promise.resolve({ id: 'approval-route-1' }) },
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.resolution.runtime.status).toBe('resolved')
    expect(payload.resolution.approval.status).toBe('approved')
  })
})
