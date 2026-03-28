// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import {
  createOpenClawEventEnvelope,
  makeOpenClawSequenceKey,
} from '@/lib/openclaw/contracts'
import { normalizeOpenClawEvent } from '@/lib/product-state/events'
import {
  createRun,
  listApprovals,
  listInboxItems,
  listRunEvents,
  listRuns,
  listWorkItemSummaries,
  createWorkItem,
} from '@/lib/product-state/repositories'
import { syncWorkItemSummary } from '@/lib/product-state/projections'
import { createProductStateHarness } from '@/lib/testing/harness'
import {
  liveRunCompletionFixture,
  liveScheduleTriggerFixture,
  liveToolFailureFixture,
} from '@/lib/testing/openclaw-fixtures'

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

describe('product-state event normalization', () => {
  it('normalizes a direct OpenClaw run result and deduplicates by sequence key', () => {
    const harness = makeHarness()
    const run = createRun(
      {
        scope: 'ops',
        triggerKind: 'manual',
        agentId: 'mini-ops',
        externalRunId: liveRunCompletionFixture.runId,
        externalSessionKey: liveRunCompletionFixture.sessionKey,
      },
      harness.rootDir,
    )

    const envelope = createOpenClawEventEnvelope({
      surface: 'agent-result',
      eventType: 'run_completed',
      sequenceKey: makeOpenClawSequenceKey(
        'agent-result',
        {
          runId: liveRunCompletionFixture.runId,
          sessionKey: liveRunCompletionFixture.sessionKey,
        },
        'completed',
      ),
      occurredAt: harness.clock.nowIso(),
      correlation: {
        runId: liveRunCompletionFixture.runId,
        sessionKey: liveRunCompletionFixture.sessionKey,
      },
      raw: {
        status: liveRunCompletionFixture.status,
        summary: liveRunCompletionFixture.summary,
        resultText: liveRunCompletionFixture.resultText,
      },
      retryable: false,
    })

    const first = normalizeOpenClawEvent(envelope, harness.rootDir)
    const second = normalizeOpenClawEvent(envelope, harness.rootDir)

    expect(first.duplicate).toBe(false)
    expect(second.duplicate).toBe(true)
    expect(first.canonicalRunId).toBe(run.id)
    expect(listRunEvents(run.id, harness.rootDir)).toHaveLength(1)
    expect(listRunEvents(run.id, harness.rootDir)[0].eventType).toBe('run_completed')
    expect(listRuns(harness.rootDir)[0].status).toBe('completed')
  })

  it('normalizes runtime-log tool failures and cron-run schedule triggers', () => {
    const harness = makeHarness()
    const toolRun = createRun(
      {
        scope: 'ops',
        triggerKind: 'manual',
        externalRunId: liveToolFailureFixture.runId,
        externalSessionKey: liveToolFailureFixture.sessionKey,
      },
      harness.rootDir,
    )
    const scheduledRun = createRun(
      {
        scope: 'ops',
        triggerKind: 'schedule',
        externalSessionId: liveScheduleTriggerFixture.sessionId,
        externalSessionKey: liveScheduleTriggerFixture.sessionKey,
      },
      harness.rootDir,
    )

    const toolEvent = normalizeOpenClawEvent(
      createOpenClawEventEnvelope({
        surface: 'runtime-log',
        eventType: 'tool_failed',
        sequenceKey: makeOpenClawSequenceKey(
          'runtime-log',
          { runId: liveToolFailureFixture.runId },
          'tool-failed',
        ),
        occurredAt: null,
        correlation: {
          runId: liveToolFailureFixture.runId,
          sessionKey: liveToolFailureFixture.sessionKey,
        },
        raw: liveToolFailureFixture.logLine,
        retryable: false,
      }),
      harness.rootDir,
    )

    const scheduleEvent = normalizeOpenClawEvent(
      createOpenClawEventEnvelope({
        surface: 'cron-run',
        eventType: 'schedule_triggered',
        sequenceKey: makeOpenClawSequenceKey(
          'cron-run',
          {
            jobId: liveScheduleTriggerFixture.jobId,
            sessionId: liveScheduleTriggerFixture.sessionId,
          },
          'finished',
        ),
        occurredAt: harness.clock.nowIso(),
        correlation: {
          jobId: liveScheduleTriggerFixture.jobId,
          sessionId: liveScheduleTriggerFixture.sessionId,
          sessionKey: liveScheduleTriggerFixture.sessionKey,
        },
        raw: {
          action: liveScheduleTriggerFixture.action,
          status: liveScheduleTriggerFixture.status,
          summary: liveScheduleTriggerFixture.summary,
        },
        retryable: false,
      }),
      harness.rootDir,
    )

    expect(toolEvent.canonicalRunId).toBe(toolRun.id)
    expect(toolEvent.kind).toBe('run_event')
    if (toolEvent.kind !== 'run_event') {
      throw new Error('Expected run event result')
    }
    expect(toolEvent.event.eventType).toBe('tool_failed')
    expect(scheduleEvent.canonicalRunId).toBe(scheduledRun.id)
    expect(scheduleEvent.kind).toBe('run_event')
    if (scheduleEvent.kind !== 'run_event') {
      throw new Error('Expected run event result')
    }
    expect(scheduleEvent.event.eventType).toBe('schedule_triggered')
    expect(listRuns(harness.rootDir).find((run) => run.id === toolRun.id)?.status).toBe('queued')
  })

  it('normalizes approval gateway events into canonical approvals and Inbox items', () => {
    const harness = makeHarness()
    const workItem = createWorkItem(
      {
        title: 'Approval target',
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
        externalRunId: 'ext-approval-run',
        externalSessionKey: 'agent:mini-ops:main',
      },
      harness.rootDir,
    )
    syncWorkItemSummary(workItem.id, harness.rootDir)

    const requested = normalizeOpenClawEvent(
      createOpenClawEventEnvelope({
        surface: 'gateway-event',
        eventType: 'exec.approval.requested',
        sequenceKey: makeOpenClawSequenceKey(
          'gateway-event',
          { runId: 'ext-approval-run' },
          'approval-requested',
        ),
        occurredAt: harness.clock.nowIso(),
        correlation: {
          runId: 'ext-approval-run',
          sessionKey: 'agent:mini-ops:main',
        },
        raw: {
          id: 'approval-123',
          createdAtMs: Date.parse(harness.clock.nowIso()),
          request: {
            approvalType: 'confirm',
            requestedActionType: 'exec.write',
            sessionKey: 'agent:mini-ops:main',
          },
        },
        retryable: false,
      }),
      harness.rootDir,
    )

    expect(requested.kind).toBe('approval_event')
    expect(listApprovals(harness.rootDir)[0]).toMatchObject({
      id: 'approval-123',
      runId: run.id,
      workItemId: workItem.id,
      status: 'pending',
    })
    expect(listRuns(harness.rootDir).find((candidate) => candidate.id === run.id)?.status).toBe(
      'waiting_approval',
    )
    expect(listWorkItemSummaries(harness.rootDir)[0]).toMatchObject({
      workItemId: workItem.id,
      displayStatus: 'needs_approval',
    })
    expect(listInboxItems(harness.rootDir)[0]).toMatchObject({
      sourceKind: 'approval',
      sourceRef: 'approval-123',
      category: 'approval_required',
      status: 'open',
    })

    harness.clock.advanceMs(1_000)

    const resolved = normalizeOpenClawEvent(
      createOpenClawEventEnvelope({
        surface: 'gateway-event',
        eventType: 'exec.approval.resolved',
        sequenceKey: makeOpenClawSequenceKey(
          'gateway-event',
          { runId: 'ext-approval-run' },
          'approval-resolved',
        ),
        occurredAt: harness.clock.nowIso(),
        correlation: {
          runId: 'ext-approval-run',
          sessionKey: 'agent:mini-ops:main',
        },
        raw: {
          id: 'approval-123',
          decision: 'deny',
          resolvedBy: 'operator',
          ts: Date.parse(harness.clock.nowIso()),
          request: {
            approvalType: 'confirm',
            requestedActionType: 'exec.write',
            sessionKey: 'agent:mini-ops:main',
          },
        },
        retryable: false,
      }),
      harness.rootDir,
    )

    expect(resolved.kind).toBe('approval_event')
    expect(listApprovals(harness.rootDir)[0]).toMatchObject({
      id: 'approval-123',
      status: 'denied',
    })
    expect(listRuns(harness.rootDir).find((candidate) => candidate.id === run.id)?.status).toBe(
      'blocked',
    )
    expect(listInboxItems(harness.rootDir)[0]).toMatchObject({
      sourceKind: 'approval',
      status: 'resolved',
    })
  })
})
