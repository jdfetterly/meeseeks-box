// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLaunch } from '@/lib/launch/service'
import { createProductStateHarness } from '@/lib/testing/harness'
import { closeProductStateDb } from '@/lib/product-state/db'
import { getScheduleById } from '@/lib/product-state/repositories'

const syncMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/openclaw/runtime-schedules', () => ({
  createRuntimeOneShotSchedule: syncMock,
}))

afterEach(() => {
  closeProductStateDb()
  syncMock.mockReset()
})

describe('launch service schedule sync', () => {
  it('marks schedule synced and persists the external job id when runtime sync succeeds', () => {
    const harness = createProductStateHarness()
    harness.useAsProcessStateDir()
    syncMock.mockReturnValue({
      status: 'synced',
      mode: 'ssh',
      externalJobId: 'job-123',
      nextRunAt: '2026-03-21T16:00:00.000Z',
      syncReason: null,
      syncError: null,
      raw: { id: 'job-123' },
    })

    try {
      const result = createLaunch(
        {
          prompt: 'Review overnight failures',
          scope: 'ops',
          agentId: 'mini-ops',
          timing: 'schedule_once',
          scheduledAt: '2026-03-21T16:00:00.000Z',
        },
        harness.rootDir,
      )

      const schedule = getScheduleById(result.scheduleId!, harness.rootDir)
      expect(result).toMatchObject({
        timing: 'schedule_once',
        runtimeSyncStatus: 'synced',
        externalJobId: 'job-123',
      })
      expect(schedule).toMatchObject({
        id: result.scheduleId,
        status: 'scheduled',
        externalJobId: 'job-123',
        metadata: {
          syncStatus: 'runtime_synced',
          runtimeSyncMode: 'ssh',
          externalJobId: 'job-123',
        },
      })
    } finally {
      harness.cleanup()
    }
  })

  it('keeps the canonical schedule visible when runtime sync fails', () => {
    const harness = createProductStateHarness()
    harness.useAsProcessStateDir()
    syncMock.mockReturnValue({
      status: 'failed',
      mode: 'ssh',
      externalJobId: null,
      nextRunAt: null,
      syncReason: 'runtime-sync-error',
      syncError: 'ssh timed out',
      raw: null,
    })

    try {
      const result = createLaunch(
        {
          prompt: 'Review overnight failures',
          scope: 'ops',
          agentId: 'mini-ops',
          timing: 'schedule_once',
          scheduledAt: '2026-03-21T16:00:00.000Z',
        },
        harness.rootDir,
      )

      const schedule = getScheduleById(result.scheduleId!, harness.rootDir)
      expect(result).toMatchObject({
        timing: 'schedule_once',
        runtimeSyncStatus: 'failed',
        runtimeSyncError: 'ssh timed out',
      })
      expect(schedule).toMatchObject({
        id: result.scheduleId,
        status: 'sync_failed',
        externalJobId: null,
        metadata: {
          syncStatus: 'runtime_sync_failed',
          runtimeSyncMode: 'ssh',
          syncError: 'ssh timed out',
        },
      })
    } finally {
      harness.cleanup()
    }
  })
})
