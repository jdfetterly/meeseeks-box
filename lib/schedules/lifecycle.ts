import {
  deleteRuntimeSchedule,
  pauseRuntimeSchedule,
  resumeRuntimeSchedule,
  updateRuntimeRecurringSchedule,
} from '@/lib/openclaw/runtime-schedules'
import { syncScheduleSummary, syncWorkItemSummary } from '@/lib/product-state/projections'
import {
  getScheduleById,
  updateSchedule,
  updateWorkItem,
} from '@/lib/product-state/repositories'
import {
  buildRecurringCronExpression,
  ensureRecurringTimezone,
  makeRecurringCadenceLabel,
  normalizeRecurringTime,
  normalizeRecurringWeekday,
  type RecurringWeekday,
} from '@/lib/schedules/recurring-cadence'

export interface ManageScheduleResult {
  schedule: ReturnType<typeof updateSchedule>
  workItem: ReturnType<typeof updateWorkItem> | null
  scheduleSummary: ReturnType<typeof syncScheduleSummary>
  workItemSummary: ReturnType<typeof syncWorkItemSummary> | null
  runtime: {
    status: 'resolved' | 'pending' | 'failed' | 'synced'
    syncReason: string | null
    syncError: string | null
  }
}

function pendingRuntimeFallback() {
  return {
    status: 'pending' as const,
    syncReason: 'runtime-sync-disabled',
    syncError: null,
  }
}

function assertRecurringSchedule(scheduleId: string, rootDir: string) {
  const schedule = getScheduleById(scheduleId, rootDir)

  if (!schedule) {
    throw new Error(`Unknown schedule: ${scheduleId}`)
  }

  if (schedule.scheduleKind !== 'cron') {
    throw new Error('Schedule lifecycle actions are only supported for recurring schedules')
  }

  return schedule
}

export function pauseCanonicalRecurringSchedule(
  scheduleId: string,
  rootDir = process.cwd(),
): ManageScheduleResult {
  const schedule = assertRecurringSchedule(scheduleId, rootDir)
  const runtime =
    schedule.externalJobId ? pauseRuntimeSchedule(schedule.externalJobId) : pendingRuntimeFallback()

  const updatedSchedule = updateSchedule(
    schedule.id,
    {
      status: 'paused',
      nextRunAt: null,
      metadata: {
        ...(schedule.metadata ?? {}),
        syncStatus:
          runtime.status === 'failed'
            ? 'runtime_pause_failed'
            : runtime.status === 'pending'
              ? runtime.syncReason ?? 'runtime-sync-disabled'
              : 'runtime_paused',
        syncError: runtime.syncError,
      },
    },
    rootDir,
  )

  const workItem = schedule.sourceRef
    ? updateWorkItem(
        schedule.sourceRef,
        {
          status: 'scheduled',
        },
        rootDir,
      )
    : null

  return {
    schedule: updatedSchedule,
    workItem,
    scheduleSummary: syncScheduleSummary(schedule.id, rootDir),
    workItemSummary: workItem ? syncWorkItemSummary(workItem.id, rootDir) : null,
    runtime,
  }
}

export function resumeCanonicalRecurringSchedule(
  scheduleId: string,
  rootDir = process.cwd(),
): ManageScheduleResult {
  const schedule = assertRecurringSchedule(scheduleId, rootDir)
  const runtime =
    schedule.externalJobId ? resumeRuntimeSchedule(schedule.externalJobId) : pendingRuntimeFallback()

  const updatedSchedule = updateSchedule(
    schedule.id,
    {
      status: runtime.status === 'failed' ? 'sync_failed' : 'scheduled',
      metadata: {
        ...(schedule.metadata ?? {}),
        syncStatus:
          runtime.status === 'failed'
            ? 'runtime_resume_failed'
            : runtime.status === 'pending'
              ? runtime.syncReason ?? 'pending_runtime_sync'
              : 'runtime_synced',
        syncError: runtime.syncError,
      },
    },
    rootDir,
  )

  const workItem = schedule.sourceRef
    ? updateWorkItem(
        schedule.sourceRef,
        {
          status: 'scheduled',
        },
        rootDir,
      )
    : null

  return {
    schedule: updatedSchedule,
    workItem,
    scheduleSummary: syncScheduleSummary(schedule.id, rootDir),
    workItemSummary: workItem ? syncWorkItemSummary(workItem.id, rootDir) : null,
    runtime,
  }
}

export function updateCanonicalRecurringSchedule(
  input: {
    scheduleId: string
    time: string
    weekday?: RecurringWeekday | null
    timezone?: string | null
  },
  rootDir = process.cwd(),
): ManageScheduleResult {
  const schedule = assertRecurringSchedule(input.scheduleId, rootDir)
  const cadenceKind =
    schedule.metadata?.cadenceKind === 'weekly' ? 'weekly' : 'daily'
  const time = normalizeRecurringTime(input.time, '07:00').value
  const timezone = ensureRecurringTimezone(input.timezone ?? (typeof schedule.metadata?.timezone === 'string' ? schedule.metadata.timezone : null))
  const weekday =
    cadenceKind === 'weekly'
      ? normalizeRecurringWeekday(
          input.weekday,
          (typeof schedule.metadata?.defaultWeekday === 'string'
            ? schedule.metadata.defaultWeekday
            : 'sunday') as RecurringWeekday,
        )
      : null
  const cronExpr = buildRecurringCronExpression({
    cadenceKind,
    time,
    weekday,
  })
  const cadenceLabel = makeRecurringCadenceLabel({
    cadenceKind,
    time,
    weekday,
    timezone,
  })

  const runtime =
    schedule.externalJobId
      ? updateRuntimeRecurringSchedule({
          externalJobId: schedule.externalJobId,
          cronExpr,
          timezone,
          prompt: typeof schedule.metadata?.prompt === 'string' ? schedule.metadata.prompt : null,
          agentId: typeof schedule.metadata?.agentId === 'string' ? schedule.metadata.agentId : null,
        })
      : {
          ...pendingRuntimeFallback(),
          nextRunAt: null,
        }

  const updatedSchedule = updateSchedule(
    schedule.id,
    {
      status: runtime.status === 'failed' ? 'sync_failed' : schedule.status === 'paused' ? 'paused' : 'scheduled',
      scheduleExpr: cronExpr,
      nextRunAt: runtime.status === 'synced' ? runtime.nextRunAt : schedule.nextRunAt,
      metadata: {
        ...(schedule.metadata ?? {}),
        cadenceLabel,
        timezone,
        syncStatus:
          runtime.status === 'failed'
            ? 'runtime_edit_failed'
            : runtime.status === 'pending'
              ? runtime.syncReason ?? 'pending_runtime_sync'
              : 'runtime_synced',
        syncError: runtime.syncError,
      },
    },
    rootDir,
  )

  const workItem = schedule.sourceRef
    ? updateWorkItem(
        schedule.sourceRef,
        {
          status: 'scheduled',
        },
        rootDir,
      )
    : null

  return {
    schedule: updatedSchedule,
    workItem,
    scheduleSummary: syncScheduleSummary(schedule.id, rootDir),
    workItemSummary: workItem ? syncWorkItemSummary(workItem.id, rootDir) : null,
    runtime: {
      status: runtime.status,
      syncReason: runtime.syncReason ?? null,
      syncError: runtime.syncError ?? null,
    },
  }
}

export function deleteCanonicalRecurringSchedule(
  scheduleId: string,
  rootDir = process.cwd(),
): ManageScheduleResult {
  const schedule = assertRecurringSchedule(scheduleId, rootDir)
  const runtime =
    schedule.externalJobId ? deleteRuntimeSchedule(schedule.externalJobId) : pendingRuntimeFallback()

  const updatedSchedule = updateSchedule(
    schedule.id,
    {
      status: 'deleted',
      nextRunAt: null,
      externalJobId: null,
      metadata: {
        ...(schedule.metadata ?? {}),
        syncStatus:
          runtime.status === 'failed'
            ? 'runtime_delete_failed'
            : runtime.status === 'pending'
              ? runtime.syncReason ?? 'runtime-sync-disabled'
              : 'runtime_deleted',
        syncError: runtime.syncError,
        deletedAt: new Date().toISOString(),
        removedExternalJobId: schedule.externalJobId,
      },
    },
    rootDir,
  )

  const workItem = schedule.sourceRef
    ? updateWorkItem(
        schedule.sourceRef,
        {
          status: 'archived',
        },
        rootDir,
      )
    : null

  return {
    schedule: updatedSchedule,
    workItem,
    scheduleSummary: syncScheduleSummary(schedule.id, rootDir),
    workItemSummary: workItem ? syncWorkItemSummary(workItem.id, rootDir) : null,
    runtime,
  }
}
