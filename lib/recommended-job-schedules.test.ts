// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import { createProductStateHarness } from '@/lib/testing/harness'
import { closeProductStateDb } from '@/lib/product-state/db'
import {
  getScheduleById,
  getWorkItemById,
  listSavedLaunchPresets,
} from '@/lib/product-state/repositories'
import { scheduleRecommendedJob } from '@/lib/recommended-job-schedules'

const harnesses: Array<ReturnType<typeof createProductStateHarness>> = []

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.cleanup()
    closeProductStateDb(harness.rootDir)
  }
})

describe('recommended recurring job scheduling', () => {
  it('creates a canonical recurring schedule and hydrates the reporting prompt', () => {
    const harness = createProductStateHarness()
    harnesses.push(harness)

    const result = scheduleRecommendedJob(
      {
        slug: 'morning-ops-brief',
        time: '07:30',
        timezone: 'America/Los_Angeles',
      },
      harness.rootDir,
    )

    expect(result.created).toBe(true)
    expect(result.runtimeSyncStatus).toBe('pending')

    const schedule = getScheduleById(result.scheduleId, harness.rootDir)
    expect(schedule).toMatchObject({
      scheduleKind: 'cron',
      scheduleExpr: '30 7 * * *',
      status: 'pending_sync',
    })
    expect(schedule?.metadata).toMatchObject({
      recommendedJobSlug: 'morning-ops-brief',
      cadenceKind: 'daily',
      timezone: 'America/Los_Angeles',
      outputSlot: 'morning-ops-brief',
      syncStatus: 'runtime-sync-disabled',
    })
    expect(typeof schedule?.metadata?.prompt).toBe('string')
    expect(String(schedule?.metadata?.prompt)).toContain(`--schedule ${result.scheduleId}`)
    expect(String(schedule?.metadata?.prompt)).not.toContain('<schedule-id>')

    const workItem = getWorkItemById(result.workItemId, harness.rootDir)
    expect(workItem).toMatchObject({
      title: 'Morning Ops Brief',
      status: 'scheduled',
    })

    expect(listSavedLaunchPresets(harness.rootDir)).toHaveLength(1)
  })

  it('uses weekday + time for weekly starter jobs and dedupes on repeated scheduling', () => {
    const harness = createProductStateHarness()
    harnesses.push(harness)

    const first = scheduleRecommendedJob(
      {
        slug: 'weekly-system-review',
        time: '16:15',
        weekday: 'friday',
        timezone: 'America/Los_Angeles',
      },
      harness.rootDir,
    )

    const second = scheduleRecommendedJob(
      {
        slug: 'weekly-system-review',
        time: '10:00',
        weekday: 'monday',
        timezone: 'America/Los_Angeles',
      },
      harness.rootDir,
    )

    expect(first.created).toBe(true)
    expect(second.created).toBe(false)
    expect(second.scheduleId).toBe(first.scheduleId)

    const schedule = getScheduleById(first.scheduleId, harness.rootDir)
    expect(schedule).toMatchObject({
      scheduleKind: 'cron',
      scheduleExpr: '15 16 * * 5',
    })
    expect(schedule?.metadata).toMatchObject({
      cadenceKind: 'weekly',
      cadenceLabel: 'Weekly on friday at 16:15 America/Los_Angeles',
      recommendedJobSlug: 'weekly-system-review',
    })
  })
})
