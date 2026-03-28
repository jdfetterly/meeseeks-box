// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  createOpenClawEventEnvelope,
  makeOpenClawSequenceKey,
} from '@/lib/openclaw/contracts'
import {
  liveRunCompletionFixture,
  liveScheduleTriggerFixture,
  liveToolFailureFixture,
} from '@/lib/testing/openclaw-fixtures'

describe('openclaw contracts', () => {
  it('creates a stable sequence key for run results', () => {
    expect(
      makeOpenClawSequenceKey(
        'agent-result',
        {
          runId: liveRunCompletionFixture.runId,
          sessionKey: liveRunCompletionFixture.sessionKey,
        },
        'completed',
      ),
    ).toBe(`agent-result:${liveRunCompletionFixture.runId}:completed`)
  })

  it('falls back to job and session correlation when a run id is unavailable', () => {
    expect(
      makeOpenClawSequenceKey(
        'cron-run',
        {
          jobId: liveScheduleTriggerFixture.jobId,
          sessionId: liveScheduleTriggerFixture.sessionId,
        },
        'finished',
      ),
    ).toBe(
      `cron-run:${liveScheduleTriggerFixture.jobId}:${liveScheduleTriggerFixture.sessionId}:finished`,
    )
  })

  it('captures log-derived tool failure evidence as an envelope', () => {
    const envelope = createOpenClawEventEnvelope({
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
      metadata: { linkedSurface: 'agent-result' },
    })

    expect(envelope.source).toBe('openclaw')
    expect(envelope.surface).toBe('runtime-log')
    expect(envelope.raw).toContain('DOES_NOT_EXIST')
    expect(envelope.metadata?.linkedSurface).toBe('agent-result')
  })
})
