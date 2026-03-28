// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import { createProductStateHarness } from '@/lib/testing/harness'
import { scheduleRecommendedJob } from '@/lib/recommended-job-schedules'
import {
  getScheduleById,
  getWorkItemById,
} from '@/lib/product-state/repositories'
import {
  deleteCanonicalRecurringSchedule,
  pauseCanonicalRecurringSchedule,
  resumeCanonicalRecurringSchedule,
  updateCanonicalRecurringSchedule,
} from '@/lib/schedules/lifecycle'
import { listRecommendedJobInstallations } from '@/lib/recommended-jobs'

const harnesses: Array<ReturnType<typeof createProductStateHarness>> = []

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.cleanup()
  }
})

describe('recurring schedule lifecycle', () => {
  it('pauses, resumes, and updates recurring schedules without archiving linked work', () => {
    const harness = createProductStateHarness()
    harnesses.push(harness)

    const created = scheduleRecommendedJob(
      {
        slug: 'weekly-system-review',
        time: '16:00',
        weekday: 'sunday',
        timezone: 'America/Los_Angeles',
      },
      harness.rootDir,
    )

    const paused = pauseCanonicalRecurringSchedule(created.scheduleId, harness.rootDir)
    expect(paused.schedule.status).toBe('paused')
    expect(paused.workItem?.status).toBe('scheduled')
    expect(paused.schedule.metadata).toMatchObject({
      syncStatus: 'runtime-sync-disabled',
    })

    const updated = updateCanonicalRecurringSchedule(
      {
        scheduleId: created.scheduleId,
        time: '15:30',
        weekday: 'friday',
        timezone: 'America/Los_Angeles',
      },
      harness.rootDir,
    )
    expect(updated.schedule.scheduleExpr).toBe('30 15 * * 5')
    expect(updated.schedule.metadata).toMatchObject({
      cadenceLabel: 'Weekly on friday at 15:30 America/Los_Angeles',
    })
    expect(updated.workItem?.status).toBe('scheduled')

    const resumed = resumeCanonicalRecurringSchedule(created.scheduleId, harness.rootDir)
    expect(resumed.schedule.status).toBe('scheduled')
    expect(resumed.workItem?.status).toBe('scheduled')
    expect(resumed.schedule.metadata).toMatchObject({
      syncStatus: 'runtime-sync-disabled',
    })
  })

  it('archives the linked work item when a recurring schedule is deleted', () => {
    const harness = createProductStateHarness()
    harnesses.push(harness)

    const created = scheduleRecommendedJob(
      {
        slug: 'morning-ops-brief',
        time: '07:00',
        timezone: 'America/Los_Angeles',
      },
      harness.rootDir,
    )

    const deleted = deleteCanonicalRecurringSchedule(created.scheduleId, harness.rootDir)

    expect(deleted.schedule.status).toBe('deleted')
    expect(deleted.workItem?.status).toBe('archived')
    expect(deleted.schedule.metadata).toMatchObject({
      syncStatus: 'runtime-sync-disabled',
    })
    expect(getScheduleById(created.scheduleId, harness.rootDir)?.status).toBe('deleted')
    expect(getWorkItemById(created.workItemId, harness.rootDir)?.status).toBe('archived')
    expect(
      listRecommendedJobInstallations(harness.rootDir).find((job) => job.slug === 'morning-ops-brief')
        ?.scheduledScheduleId,
    ).toBeNull()
  })
})
