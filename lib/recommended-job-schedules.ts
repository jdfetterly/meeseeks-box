import {
  createWorkItem,
  createSchedule,
  getSavedLaunchPresetById,
  listSchedules,
  updateSchedule,
} from '@/lib/product-state/repositories'
import { syncScheduleSummary, syncWorkItemSummary } from '@/lib/product-state/projections'
import {
  getRecommendedJobBySlug,
  installRecommendedJob,
  renderRecommendedJobPrompt,
} from '@/lib/recommended-jobs'
import { createRuntimeRecurringSchedule } from '@/lib/openclaw/runtime-schedules'
import {
  buildRecurringCronExpression,
  ensureRecurringTimezone,
  makeRecurringCadenceLabel,
  normalizeRecurringTime,
  normalizeRecurringWeekday,
  type RecurringWeekday as RecommendedWeekday,
} from '@/lib/schedules/recurring-cadence'

export interface ScheduleRecommendedJobRequest {
  slug: string
  time?: string | null
  weekday?: RecommendedWeekday | null
  timezone?: string | null
}

export interface ScheduleRecommendedJobResult {
  created: boolean
  workItemId: string
  scheduleId: string
  runtimeSyncStatus: 'pending' | 'synced' | 'failed' | null
  externalJobId: string | null
  runtimeSyncError: string | null
}

export function scheduleRecommendedJob(
  input: ScheduleRecommendedJobRequest,
  rootDir = process.cwd(),
): ScheduleRecommendedJobResult {
  const job = getRecommendedJobBySlug(input.slug)

  if (!job) {
    throw new Error(`Unknown recommended job: ${input.slug}`)
  }

  const existing = listSchedules(rootDir).find(
    (schedule) =>
      schedule.scheduleKind === 'cron' &&
      typeof schedule.metadata?.recommendedJobSlug === 'string' &&
      schedule.metadata.recommendedJobSlug === job.slug,
  )

  if (existing?.sourceRef) {
    return {
      created: false,
      workItemId: existing.sourceRef,
      scheduleId: existing.id,
      runtimeSyncStatus:
        existing.status === 'scheduled'
          ? 'synced'
          : existing.status === 'sync_failed'
            ? 'failed'
            : 'pending',
      externalJobId: existing.externalJobId,
      runtimeSyncError:
        typeof existing.metadata?.syncError === 'string' ? existing.metadata.syncError : null,
    }
  }

  const preset = installRecommendedJob(job.slug, rootDir).preset
  const savedPreset = getSavedLaunchPresetById(preset.id, rootDir)

  if (!savedPreset) {
    throw new Error(`Failed to install starter job preset: ${job.title}`)
  }

  const time = normalizeRecurringTime(input.time, job.defaultTime).value
  const timezone = ensureRecurringTimezone(input.timezone)
  const weekday =
    job.cadenceKind === 'weekly'
      ? normalizeRecurringWeekday(input.weekday, job.defaultWeekday ?? 'sunday')
      : null
  const cronExpr = buildRecurringCronExpression({
    cadenceKind: job.cadenceKind,
    time,
    weekday,
  })
  const cadenceLabel = makeRecurringCadenceLabel({
    cadenceKind: job.cadenceKind,
    time,
    weekday,
    timezone,
  })

  const workItem = createWorkItem(
    {
      title: job.title,
      scope: job.scope,
      priority: job.priority,
      status: 'scheduled',
      sourceConversationId: null,
    },
    rootDir,
  )

  const schedule = createSchedule(
    {
      sourceKind: 'runtime-native',
      sourceRef: workItem.id,
      label: job.title,
      status: 'pending_sync',
      scheduleKind: 'cron',
      scheduleExpr: cronExpr,
      metadata: {
        recommendedJobSlug: job.slug,
        cadenceKind: job.cadenceKind,
        cadenceLabel,
        timezone,
        promptTemplate: job.promptTemplate,
        agentId: job.agentId,
        priority: job.priority,
        outputType: job.outputType,
        outputSlot: job.outputSlot,
        outputTitle: job.outputTitle,
        presetId: savedPreset.id,
        syncStatus: 'pending_runtime_sync',
      },
    },
    rootDir,
  )

  const hydratedPrompt = renderRecommendedJobPrompt(job, schedule.id)

  const runtimeSync = createRuntimeRecurringSchedule({
    scheduleId: schedule.id,
    workItemId: workItem.id,
    title: job.title,
    prompt: hydratedPrompt,
    agentId: job.scope,
    cronExpr,
    timezone,
  })

  if (runtimeSync.status === 'synced') {
    updateSchedule(
      schedule.id,
      {
        status: 'scheduled',
        externalJobId: runtimeSync.externalJobId,
        nextRunAt: runtimeSync.nextRunAt,
        metadata: {
          ...(schedule.metadata ?? {}),
          prompt: hydratedPrompt,
          syncStatus: 'runtime_synced',
          runtimeSyncMode: runtimeSync.mode,
          externalJobId: runtimeSync.externalJobId,
        },
      },
      rootDir,
    )
  } else if (runtimeSync.status === 'failed') {
    updateSchedule(
      schedule.id,
      {
        status: 'sync_failed',
        metadata: {
          ...(schedule.metadata ?? {}),
          prompt: hydratedPrompt,
          syncStatus: 'runtime_sync_failed',
          runtimeSyncMode: runtimeSync.mode,
          syncError: runtimeSync.syncError,
        },
      },
      rootDir,
    )
  } else {
    updateSchedule(
      schedule.id,
      {
        metadata: {
          ...(schedule.metadata ?? {}),
          prompt: hydratedPrompt,
          syncStatus: runtimeSync.syncReason ?? 'pending_runtime_sync',
        },
      },
      rootDir,
    )
  }

  syncWorkItemSummary(workItem.id, rootDir)
  syncScheduleSummary(schedule.id, rootDir)

  return {
    created: true,
    workItemId: workItem.id,
    scheduleId: schedule.id,
    runtimeSyncStatus: runtimeSync.status,
    externalJobId: runtimeSync.externalJobId,
    runtimeSyncError: runtimeSync.syncError,
  }
}
