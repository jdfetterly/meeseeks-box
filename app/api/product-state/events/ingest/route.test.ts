// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import * as ingestRoute from '@/app/api/product-state/events/ingest/route'
import { createRun, createWorkItem } from '@/lib/product-state/repositories'
import { createProductStateHarness } from '@/lib/testing/harness'
import {
  liveRunCompletionFixture,
} from '@/lib/testing/openclaw-fixtures'

const harnesses: ReturnType<typeof createProductStateHarness>[] = []

function makeHarness() {
  const harness = createProductStateHarness()
  harnesses.push(harness)
  harness.useAsProcessStateDir()
  return harness
}

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.cleanup()
  }
})

describe('product-state event ingest api', () => {
  it('ingests an OpenClaw event for a correlated canonical run', async () => {
    makeHarness()

    createRun({
      scope: 'ops',
      triggerKind: 'manual',
      externalRunId: liveRunCompletionFixture.runId,
      externalSessionKey: liveRunCompletionFixture.sessionKey,
    })

    const response = await ingestRoute.POST(
      new Request('http://localhost/api/product-state/events/ingest', {
        method: 'POST',
        body: JSON.stringify({
          envelope: {
            source: 'openclaw',
            surface: 'agent-result',
            eventType: 'run_completed',
            sequenceKey: `agent-result:${liveRunCompletionFixture.runId}:completed`,
            occurredAt: '2026-03-20T12:00:00.000Z',
            correlation: {
              runId: liveRunCompletionFixture.runId,
              sessionKey: liveRunCompletionFixture.sessionKey,
            },
            raw: {
              status: 'ok',
              summary: 'completed',
            },
            retryable: false,
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )

    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload.event.eventType).toBe('run_completed')
    expect(payload.duplicate).toBe(false)
  })

  it('rejects events that do not map to a canonical run', async () => {
    makeHarness()

    const response = await ingestRoute.POST(
      new Request('http://localhost/api/product-state/events/ingest', {
        method: 'POST',
        body: JSON.stringify({
          envelope: {
            source: 'openclaw',
            surface: 'agent-result',
            eventType: 'run_completed',
            sequenceKey: 'agent-result:missing:completed',
            occurredAt: '2026-03-20T12:00:00.000Z',
            correlation: {
              runId: 'missing',
            },
            raw: {
              status: 'ok',
              summary: 'completed',
            },
            retryable: false,
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )

    expect(response.status).toBe(422)
  })

  it('ingests an approval gateway event and returns the canonical approval payload', async () => {
    makeHarness()
    const workItem = createWorkItem({
      title: 'Approval route test',
      scope: 'ops',
    })

    createRun({
      scope: 'ops',
      triggerKind: 'manual',
      workItemId: workItem.id,
      externalRunId: 'approval-route-run',
      externalSessionKey: 'agent:mini-ops:main',
    })

    const response = await ingestRoute.POST(
      new Request('http://localhost/api/product-state/events/ingest', {
        method: 'POST',
        body: JSON.stringify({
          envelope: {
            source: 'openclaw',
            surface: 'gateway-event',
            eventType: 'exec.approval.requested',
            sequenceKey: 'gateway-event:approval-route-run:approval-requested',
            occurredAt: '2026-03-20T12:00:00.000Z',
            correlation: {
              runId: 'approval-route-run',
              sessionKey: 'agent:mini-ops:main',
            },
            raw: {
              id: 'approval-route-1',
              createdAtMs: Date.parse('2026-03-20T12:00:00.000Z'),
              request: {
                approvalType: 'confirm',
                requestedActionType: 'exec.write',
                sessionKey: 'agent:mini-ops:main',
              },
            },
            retryable: false,
          },
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )

    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload.kind).toBe('approval_event')
    expect(payload.approval.id).toBe('approval-route-1')
    expect(payload.approval.status).toBe('pending')
  })
})
