// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'
import { createProductStateHarness, getHarnessHealth } from '@/lib/testing/harness'
import {
  createOpenClawEventEnvelope,
  makeOpenClawSequenceKey,
} from '@/lib/openclaw/contracts'

const activeHarnesses: ReturnType<typeof createProductStateHarness>[] = []

function makeHarness() {
  const harness = createProductStateHarness()
  activeHarnesses.push(harness)
  return harness
}

afterEach(() => {
  for (const harness of activeHarnesses.splice(0)) {
    harness.cleanup()
  }
})

describe('product-state harness', () => {
  it('provisions isolated state, workspace, and artifact directories', () => {
    const harness = makeHarness()
    const health = getHarnessHealth(harness)

    expect(existsSync(harness.stateDir)).toBe(true)
    expect(existsSync(harness.workspaceDir)).toBe(true)
    expect(existsSync(harness.artifactDir)).toBe(true)
    expect(health.counts.conversations).toBe(0)
    expect(health.schemaVersion).toBeGreaterThan(0)
  })

  it('records fake runtime events and approval resolutions deterministically', async () => {
    const harness = makeHarness()
    await harness.adapter.events.push(
      createOpenClawEventEnvelope({
        surface: 'agent-result',
        eventType: 'run_completed',
        sequenceKey: makeOpenClawSequenceKey(
          'agent-result',
          { runId: 'run-123' },
          'completed',
        ),
        occurredAt: harness.clock.nowIso(),
        correlation: { runId: 'run-123', sessionKey: 'agent:mini-ops:main' },
        raw: { summary: 'DISCOVERY_OK' },
        retryable: false,
      }),
    )

    harness.adapter.approvals.seed({
      id: 'approval-123',
      approvalType: 'confirm',
      requestedActionType: 'exec_write',
      runId: 'run-123',
      workItemId: 'work-123',
      context: { path: '/safe/path' },
      timeoutAt: null,
      requestedAt: harness.clock.nowIso(),
    })

    harness.clock.advanceMs(5000)
    const pending = await harness.adapter.approvals.listPending()
    const resolution = await harness.adapter.approvals.resolve({
      approvalId: 'approval-123',
      status: 'approved',
    })

    expect((await harness.adapter.events.list())).toHaveLength(1)
    expect(pending).toHaveLength(1)
    expect(resolution.resolvedAt).toBe(harness.clock.nowIso())
  })

  it('writes memory only inside the scoped allowlist root', async () => {
    const harness = makeHarness()
    const success = await harness.adapter.workspace.writeMemoryFile({
      scope: 'ops',
      relativePath: '2026-03-20.md',
      content: '# Memory\n',
      contentType: 'markdown',
    })

    const rejected = await harness.adapter.workspace.writeMemoryFile({
      scope: 'ops',
      relativePath: '../escape.md',
      content: 'bad',
      contentType: 'markdown',
    })

    expect(success.status).toBe('written')
    expect(success.absolutePath).not.toBeNull()
    expect(success.absolutePath).toContain('/memory/2026-03-20.md')
    expect(readFileSync(success.absolutePath!, 'utf8')).toContain('# Memory')
    expect(rejected.status).toBe('rejected')
    expect(rejected.reason).toBe('path-outside-allowlist')
  })
})
