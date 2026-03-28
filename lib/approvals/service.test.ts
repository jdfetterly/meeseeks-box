// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveCanonicalApproval } from '@/lib/approvals/service'
import { upsertApproval, listInboxItems, listRuns, createRun, createWorkItem } from '@/lib/product-state/repositories'
import { syncWorkItemSummary } from '@/lib/product-state/projections'
import { createProductStateHarness } from '@/lib/testing/harness'

const harnesses: ReturnType<typeof createProductStateHarness>[] = []

function makeHarness() {
  const harness = createProductStateHarness()
  harnesses.push(harness)
  return harness
}

vi.mock('@/lib/openclaw/runtime-approvals', async () => {
  const actual = await vi.importActual<typeof import('@/lib/openclaw/runtime-approvals')>(
    '@/lib/openclaw/runtime-approvals',
  )

  return {
    ...actual,
    resolveRuntimeApproval: vi.fn(() => ({
      status: 'resolved',
      mode: 'ssh',
      approvalId: 'approval-123',
      decision: 'allow-once',
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

describe('approval resolution service', () => {
  it('resolves a pending approval and updates canonical state', () => {
    const harness = makeHarness()
    const workItem = createWorkItem(
      {
        title: 'Approval service target',
        scope: 'ops',
      },
      harness.rootDir,
    )
    const run = createRun(
      {
        scope: 'ops',
        triggerKind: 'manual',
        workItemId: workItem.id,
        status: 'waiting_approval',
      },
      harness.rootDir,
    )
    syncWorkItemSummary(workItem.id, harness.rootDir)
    upsertApproval(
      {
        id: 'approval-123',
        runId: run.id,
        status: 'pending',
        request: {
          approvalType: 'confirm',
          requestedActionType: 'exec.write',
          workItemId: workItem.id,
        },
      },
      harness.rootDir,
    )

    const result = resolveCanonicalApproval(
      {
        approvalId: 'approval-123',
        decision: 'allow-once',
      },
      harness.rootDir,
    )

    expect(result.runtime.status).toBe('resolved')
    expect(result.approval).toMatchObject({
      id: 'approval-123',
      status: 'approved',
    })
    expect(listRuns(harness.rootDir).find((candidate) => candidate.id === run.id)?.status).toBe(
      'running',
    )
    expect(listInboxItems(harness.rootDir)).toHaveLength(0)
  })
})
