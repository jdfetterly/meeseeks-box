// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import {
  createOpenClawEventEnvelope,
  makeOpenClawSequenceKey,
} from '@/lib/openclaw/contracts'
import { normalizeOpenClawEvent } from '@/lib/product-state/events'
import {
  createRun,
  createWorkItem,
  listInboxItems,
  listRunSummaries,
  listWorkItemSummaries,
  upsertApproval,
} from '@/lib/product-state/repositories'
import {
  syncApprovalImpact,
  syncRunSummary,
  syncWorkItemSummary,
} from '@/lib/product-state/projections'
import { createProductStateHarness } from '@/lib/testing/harness'

const harnesses: ReturnType<typeof createProductStateHarness>[] = []

function makeHarness() {
  const harness = createProductStateHarness()
  harnesses.push(harness)
  return harness
}

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.cleanup()
  }
})

describe('product-state projections', () => {
  it('seeds run and work summaries from canonical records', () => {
    const harness = makeHarness()
    const workItem = createWorkItem(
      {
        title: 'Review overnight failures',
        scope: 'ops',
      },
      harness.rootDir,
    )
    const run = createRun(
      {
        scope: 'ops',
        triggerKind: 'manual',
        workItemId: workItem.id,
        agentId: 'mini-ops',
        status: 'queued',
      },
      harness.rootDir,
    )

    syncRunSummary(run.id, harness.rootDir)
    syncWorkItemSummary(workItem.id, harness.rootDir)

    expect(listRunSummaries(harness.rootDir)[0]).toMatchObject({
      runId: run.id,
      workItemId: workItem.id,
      status: 'queued',
    })
    expect(listWorkItemSummaries(harness.rootDir)[0]).toMatchObject({
      workItemId: workItem.id,
      displayStatus: 'queued',
      badges: [],
    })
  })

  it('projects failures into Inbox and resolves them on completion', () => {
    const harness = makeHarness()
    const workItem = createWorkItem(
      {
        title: 'Failure drill',
        scope: 'ops',
      },
      harness.rootDir,
    )
    createRun(
      {
        scope: 'ops',
        triggerKind: 'manual',
        workItemId: workItem.id,
        externalRunId: 'ext-run-1',
        externalSessionKey: 'agent:mini-ops:main',
      },
      harness.rootDir,
    )

    normalizeOpenClawEvent(
      createOpenClawEventEnvelope({
        surface: 'agent-result',
        eventType: 'run_failed',
        sequenceKey: makeOpenClawSequenceKey(
          'agent-result',
          { runId: 'ext-run-1' },
          'failed',
        ),
        occurredAt: harness.clock.nowIso(),
        correlation: {
          runId: 'ext-run-1',
          sessionKey: 'agent:mini-ops:main',
        },
        raw: {
          status: 'error',
          summary: 'tool chain failed',
        },
        retryable: false,
      }),
      harness.rootDir,
    )

    expect(listRunSummaries(harness.rootDir)[0]).toMatchObject({
      status: 'failed',
      lastEventType: 'run_failed',
    })
    expect(listWorkItemSummaries(harness.rootDir)[0]).toMatchObject({
      displayStatus: 'failed',
    })
    expect(listInboxItems(harness.rootDir)[0]).toMatchObject({
      category: 'run_failure',
      status: 'open',
    })

    normalizeOpenClawEvent(
      createOpenClawEventEnvelope({
        surface: 'agent-result',
        eventType: 'run_completed',
        sequenceKey: makeOpenClawSequenceKey(
          'agent-result',
          { runId: 'ext-run-1' },
          'completed',
        ),
        occurredAt: harness.clock.nowIso(),
        correlation: {
          runId: 'ext-run-1',
          sessionKey: 'agent:mini-ops:main',
        },
        raw: {
          status: 'ok',
          summary: 'completed',
        },
        retryable: false,
      }),
      harness.rootDir,
    )

    expect(listInboxItems(harness.rootDir)[0]).toMatchObject({
      category: 'run_failure',
      status: 'resolved',
    })
  })

  it('projects pending approvals into Inbox and updates run and work summaries', () => {
    const harness = makeHarness()
    const workItem = createWorkItem(
      {
        title: 'Approval drill',
        scope: 'ops',
      },
      harness.rootDir,
    )
    const run = createRun(
      {
        scope: 'ops',
        triggerKind: 'manual',
        workItemId: workItem.id,
        status: 'running',
      },
      harness.rootDir,
    )
    syncRunSummary(run.id, harness.rootDir)
    syncWorkItemSummary(workItem.id, harness.rootDir)

    const approval = upsertApproval(
      {
        id: 'approval-ops-1',
        runId: run.id,
        status: 'pending',
        request: {
          approvalType: 'confirm',
          requestedActionType: 'exec.write',
          workItemId: workItem.id,
        },
        requestedAt: harness.clock.nowIso(),
      },
      harness.rootDir,
    )

    syncApprovalImpact(approval, harness.rootDir)

    expect(listRunSummaries(harness.rootDir)[0]).toMatchObject({
      runId: run.id,
      status: 'waiting_approval',
    })
    expect(listWorkItemSummaries(harness.rootDir)[0]).toMatchObject({
      workItemId: workItem.id,
      displayStatus: 'needs_approval',
      badges: ['needs-approval'],
    })
    expect(listInboxItems(harness.rootDir)[0]).toMatchObject({
      sourceKind: 'approval',
      category: 'approval_required',
      status: 'open',
    })
  })
})
