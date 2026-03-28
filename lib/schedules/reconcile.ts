import 'server-only'

import { listRuntimeCronJobs, listRuntimeCronRuns } from '@/lib/openclaw/runtime-schedules'
import { projectInboxFromScheduleSummary, syncScheduleSummary } from '@/lib/product-state/projections'
import { listSchedules, updateSchedule } from '@/lib/product-state/repositories'

export interface ScheduleReconcileResult {
  checked: number
  updated: number
  active: number
  completed: number
  failed: number
  missed: number
}

function mergeMetadata(
  metadata: Record<string, unknown> | null,
  updates: Record<string, unknown>,
) {
  return {
    ...(metadata ?? {}),
    ...updates,
  }
}

export function reconcileRuntimeNativeSchedules(rootDir = process.cwd()): ScheduleReconcileResult {
  const schedules = listSchedules(rootDir).filter((schedule) => schedule.sourceKind === 'runtime-native')
  const result: ScheduleReconcileResult = {
    checked: schedules.length,
    updated: 0,
    active: 0,
    completed: 0,
    failed: 0,
    missed: 0,
  }

  if (schedules.length === 0) {
    return result
  }

  const runtimeJobs = new Map(listRuntimeCronJobs().map((job) => [job.id, job]))
  const nowMs = Date.now()

  for (const schedule of schedules) {
    if (schedule.status === 'deleted') {
      continue
    }

    if (!schedule.externalJobId) {
      continue
    }

    const runtimeJob = runtimeJobs.get(schedule.externalJobId)

    if (runtimeJob) {
      updateSchedule(
        schedule.id,
        {
          status: runtimeJob.enabled ? 'scheduled' : 'paused',
          nextRunAt: runtimeJob.enabled ? runtimeJob.nextRun ?? schedule.nextRunAt : null,
          lastRunAt: runtimeJob.lastRun ?? schedule.lastRunAt,
          consecutiveFailures: runtimeJob.consecutiveErrors,
          missedRunFlag: false,
          metadata: mergeMetadata(schedule.metadata, {
            syncStatus: runtimeJob.enabled ? 'runtime_synced' : 'runtime_paused',
            lastRuntimeStatus: runtimeJob.status,
            lastRuntimeError: runtimeJob.lastError,
            runtimeEnabled: runtimeJob.enabled,
          }),
        },
        rootDir,
      )
      projectInboxFromScheduleSummary(syncScheduleSummary(schedule.id, rootDir), rootDir)
      result.updated += 1
      result.active += 1
      continue
    }

    const runs = listRuntimeCronRuns(schedule.externalJobId, 1)
    const latestRun = runs[0] ?? null

    if (latestRun) {
      const runAt = latestRun.ts > 0 ? new Date(latestRun.ts).toISOString() : schedule.lastRunAt
      const nextStatus = latestRun.status === 'ok' ? 'completed' : 'failed'

      updateSchedule(
        schedule.id,
        {
          status: nextStatus,
          nextRunAt: null,
          lastRunAt: runAt,
          lastSuccessAt: latestRun.status === 'ok' ? runAt : schedule.lastSuccessAt,
          consecutiveFailures: latestRun.status === 'ok' ? 0 : 1,
          missedRunFlag: false,
          metadata: mergeMetadata(schedule.metadata, {
            syncStatus: 'runtime_synced',
            lastRunOutcome: latestRun.status === 'ok' ? 'completed' : 'failed',
            lastRunSummary: latestRun.summary,
            lastRunError: latestRun.error,
          }),
        },
        rootDir,
      )
      projectInboxFromScheduleSummary(syncScheduleSummary(schedule.id, rootDir), rootDir)
      result.updated += 1
      if (latestRun.status === 'ok') {
        result.completed += 1
      } else {
        result.failed += 1
      }
      continue
    }

    const nextRunAtMs = schedule.nextRunAt ? Date.parse(schedule.nextRunAt) : NaN
    if (Number.isFinite(nextRunAtMs) && nextRunAtMs < nowMs) {
      updateSchedule(
        schedule.id,
        {
          status: 'missed',
          missedRunFlag: true,
          metadata: mergeMetadata(schedule.metadata, {
            syncStatus: 'runtime_synced',
            lastRunOutcome: 'missed',
          }),
        },
        rootDir,
      )
      projectInboxFromScheduleSummary(syncScheduleSummary(schedule.id, rootDir), rootDir)
      result.updated += 1
      result.missed += 1
    }
  }

  return result
}
