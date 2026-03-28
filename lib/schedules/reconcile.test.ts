// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createProductStateHarness } from '@/lib/testing/harness'
import {
  createSchedule,
  getScheduleById,
  listInboxItems,
  listScheduleSummaries,
} from '@/lib/product-state/repositories'
import { reconcileRuntimeNativeSchedules } from '@/lib/schedules/reconcile'

const listRuntimeCronJobsMock = vi.hoisted(() => vi.fn())
const listRuntimeCronRunsMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/openclaw/runtime-schedules', () => ({
  listRuntimeCronJobs: listRuntimeCronJobsMock,
  listRuntimeCronRuns: listRuntimeCronRunsMock,
}))

afterEach(() => {
  listRuntimeCronJobsMock.mockReset()
  listRuntimeCronRunsMock.mockReset()
  vi.restoreAllMocks()
})

describe('schedule reconciliation', () => {
  it('marks runtime-missing schedules completed when run history shows success', () => {
    const harness = createProductStateHarness()
    harness.useAsProcessStateDir()
    const schedule = createSchedule(
      {
        sourceKind: 'runtime-native',
        sourceRef: 'work-1',
        label: 'Morning review',
        status: 'scheduled',
        scheduleKind: 'at',
        scheduleExpr: '2026-03-21T16:00:00.000Z',
        nextRunAt: '2026-03-21T16:00:00.000Z',
        externalJobId: 'job-123',
        metadata: { syncStatus: 'runtime_synced' },
      },
      harness.rootDir,
    )

    listRuntimeCronJobsMock.mockReturnValue([])
    listRuntimeCronRunsMock.mockReturnValue([
      {
        ts: Date.parse('2026-03-21T16:00:01.000Z'),
        jobId: 'job-123',
        status: 'ok',
        summary: 'SCHEDULE_TRIGGER_CAPTURED',
        error: null,
        durationMs: 5000,
        deliveryStatus: null,
        model: 'openai/gpt-5.4',
        provider: 'openai',
        usage: null,
      },
    ])

    try {
      const result = reconcileRuntimeNativeSchedules(harness.rootDir)

      expect(result).toMatchObject({
        checked: 1,
        updated: 1,
        completed: 1,
      })
      expect(getScheduleById(schedule.id, harness.rootDir)).toMatchObject({
        status: 'completed',
        lastSuccessAt: '2026-03-21T16:00:01.000Z',
        metadata: {
          syncStatus: 'runtime_synced',
          lastRunOutcome: 'completed',
          lastRunSummary: 'SCHEDULE_TRIGGER_CAPTURED',
        },
      })
      expect(listScheduleSummaries(harness.rootDir)[0]).toMatchObject({
        status: 'completed',
        lastRunOutcome: 'completed',
      })
      expect(listInboxItems(harness.rootDir)).toEqual([])
    } finally {
      harness.cleanup()
    }
  })

  it('creates and later resolves missed schedule inbox attention', () => {
    const harness = createProductStateHarness()
    harness.useAsProcessStateDir()
    const schedule = createSchedule(
      {
        sourceKind: 'runtime-native',
        sourceRef: 'work-2',
        label: 'Delayed review',
        status: 'scheduled',
        scheduleKind: 'at',
        scheduleExpr: '2026-03-21T15:00:00.000Z',
        nextRunAt: '2026-03-21T15:00:00.000Z',
        externalJobId: 'job-456',
        metadata: { syncStatus: 'runtime_synced' },
      },
      harness.rootDir,
    )

    listRuntimeCronJobsMock.mockReturnValue([])
    listRuntimeCronRunsMock.mockReturnValue([])

    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-03-21T16:00:00.000Z'))

    try {
      const missedResult = reconcileRuntimeNativeSchedules(harness.rootDir)

      expect(missedResult).toMatchObject({
        checked: 1,
        updated: 1,
        missed: 1,
      })
      expect(listInboxItems(harness.rootDir)).toMatchObject([
        {
          category: 'missed_schedule',
          sourceKind: 'schedule',
          sourceRef: schedule.id,
          status: 'open',
        },
      ])

      listRuntimeCronRunsMock.mockReturnValue([
        {
          ts: Date.parse('2026-03-21T16:05:00.000Z'),
          jobId: 'job-456',
          status: 'ok',
          summary: 'Recovered run',
          error: null,
          durationMs: 1000,
          deliveryStatus: null,
          model: 'openai/gpt-5.4',
          provider: 'openai',
          usage: null,
        },
      ])

      const recoveryResult = reconcileRuntimeNativeSchedules(harness.rootDir)

      expect(recoveryResult).toMatchObject({
        checked: 1,
        updated: 1,
        completed: 1,
      })
      expect(listInboxItems(harness.rootDir)[0]).toMatchObject({
        category: 'missed_schedule',
        status: 'resolved',
      })
    } finally {
      harness.cleanup()
    }
  })
})
