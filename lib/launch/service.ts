import { createRuntimeOneShotSchedule } from '@/lib/openclaw/runtime-schedules'
import type { DomainScope, SavedLaunchPresetRecord } from '@/lib/product-state/entities'
import {
  createLaunchDraft,
  createRun,
  createSchedule,
  createWorkItem,
  deleteLaunchDraft,
  getLaunchDraftById,
  getSavedLaunchPresetById,
  listLaunchDrafts,
  updateSchedule,
} from '@/lib/product-state/repositories'
import {
  syncRunSummary,
  syncScheduleSummary,
  syncWorkItemSummary,
} from '@/lib/product-state/projections'

export type LaunchTiming = 'now' | 'schedule_once' | 'draft'

export interface LaunchRequest {
  prompt: string
  title?: string | null
  scope?: DomainScope
  agentId?: string | null
  model?: string | null
  priority?: string | null
  outputType?: string | null
  timing?: LaunchTiming | null
  scheduledAt?: string | null
  presetId?: string | null
  draftId?: string | null
  conversationId?: string | null
}

export interface LaunchResult {
  timing: LaunchTiming
  workItemId?: string | null
  runId?: string | null
  scheduleId?: string | null
  draftId?: string | null
  workItemSummaryStatus: string
  runtimeSyncStatus?: 'pending' | 'synced' | 'failed' | null
  externalJobId?: string | null
  runtimeSyncError?: string | null
}

function deriveTitle(input: { title?: string | null; prompt: string; preset?: SavedLaunchPresetRecord | null }) {
  if (typeof input.title === 'string' && input.title.trim()) {
    return input.title.trim()
  }

  if (input.preset?.title) {
    return input.preset.title
  }

  return input.prompt.trim().slice(0, 72) || 'New work item'
}

function resolveLaunchConfig(input: LaunchRequest, preset: SavedLaunchPresetRecord | null) {
  return {
    title: deriveTitle({ title: input.title, prompt: input.prompt, preset }),
    scope: input.scope ?? preset?.scope,
    agentId: input.agentId ?? preset?.agentId ?? null,
    model: input.model ?? preset?.modelOverride ?? null,
    priority: input.priority ?? preset?.priority ?? null,
    outputType: input.outputType ?? preset?.outputType ?? null,
    timing: input.timing ?? (preset?.timingPreference as LaunchTiming | null) ?? 'now',
    scheduledAt: input.scheduledAt ?? null,
  }
}

export function createLaunch(
  input: LaunchRequest,
  rootDir = process.cwd(),
): LaunchResult {
  const preset =
    typeof input.presetId === 'string' && input.presetId.trim()
      ? getSavedLaunchPresetById(input.presetId.trim(), rootDir)
      : null
  const draft =
    typeof input.draftId === 'string' && input.draftId.trim()
      ? getLaunchDraftById(input.draftId.trim(), rootDir)
      : null

  const config = resolveLaunchConfig(
    {
      ...input,
      title: input.title ?? draft?.title ?? null,
      prompt: draft?.prompt ?? input.prompt,
      scope: input.scope ?? draft?.scope,
      agentId: input.agentId ?? draft?.agentId ?? null,
      model: input.model ?? draft?.model ?? null,
      priority: input.priority ?? draft?.priority ?? null,
      outputType: input.outputType ?? draft?.outputType ?? null,
      conversationId: input.conversationId ?? draft?.sourceConversationId ?? null,
    },
    preset,
  )
  const effectivePrompt = (draft?.prompt ?? input.prompt).trim()
  const effectiveConversationId = input.conversationId ?? draft?.sourceConversationId ?? null

  if (!config.scope) {
    throw new Error('Launch scope is required')
  }

  if (!config.agentId) {
    throw new Error('Launch agentId is required')
  }

  if (!effectivePrompt) {
    throw new Error('Launch prompt is required')
  }

  if (config.timing === 'draft') {
    const createdDraft = createLaunchDraft(
      {
        title: config.title,
        prompt: effectivePrompt,
        scope: config.scope,
        agentId: config.agentId,
        model: config.model,
        priority: config.priority,
        outputType: config.outputType,
        sourceConversationId: effectiveConversationId,
      },
      rootDir,
    )

    return {
      timing: 'draft',
      draftId: createdDraft.id,
      workItemId: null,
      runId: null,
      scheduleId: null,
      workItemSummaryStatus: 'draft',
    }
  }

  const workItem = createWorkItem(
    {
      title: config.title,
      scope: config.scope,
      priority: config.priority,
      status: config.timing === 'schedule_once' ? 'scheduled' : 'queued',
      sourceConversationId: effectiveConversationId,
    },
    rootDir,
  )

  if (draft) {
    deleteLaunchDraft(draft.id, rootDir)
  }

  if (config.timing === 'now') {
    const run = createRun(
      {
        scope: config.scope,
        triggerKind: 'manual',
        workItemId: workItem.id,
        conversationId: effectiveConversationId,
        agentId: config.agentId,
        model: config.model,
        status: 'queued',
      },
      rootDir,
    )
    const workSummary = syncWorkItemSummary(workItem.id, rootDir)
    syncRunSummary(run.id, rootDir)

    return {
      timing: 'now',
      workItemId: workItem.id,
      runId: run.id,
      scheduleId: null,
      workItemSummaryStatus: workSummary.displayStatus,
    }
  }

  if (!config.scheduledAt) {
    throw new Error('scheduledAt is required for schedule_once launches')
  }

  const schedule = createSchedule(
    {
      sourceKind: 'runtime-native',
      sourceRef: workItem.id,
      label: config.title,
      status: 'pending_sync',
      scheduleKind: 'at',
      scheduleExpr: config.scheduledAt,
      nextRunAt: config.scheduledAt,
      metadata: {
        prompt: effectivePrompt,
        agentId: config.agentId,
        model: config.model,
        priority: config.priority,
        outputType: config.outputType,
        presetId: input.presetId ?? null,
        syncStatus: 'pending_runtime_sync',
      },
    },
    rootDir,
  )

  const runtimeSync = createRuntimeOneShotSchedule({
    scheduleId: schedule.id,
    workItemId: workItem.id,
    title: config.title,
    prompt: effectivePrompt,
    agentId: config.scope,
    scheduledAt: config.scheduledAt,
    model: config.model,
  })

  if (runtimeSync.status === 'synced') {
    updateSchedule(
      schedule.id,
      {
        status: 'scheduled',
        externalJobId: runtimeSync.externalJobId,
        nextRunAt: runtimeSync.nextRunAt ?? config.scheduledAt,
        metadata: {
          ...(schedule.metadata ?? {}),
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
          syncStatus: 'runtime_sync_failed',
          runtimeSyncMode: runtimeSync.mode,
          syncError: runtimeSync.syncError,
        },
      },
      rootDir,
    )
  } else if (runtimeSync.syncReason) {
    updateSchedule(
      schedule.id,
      {
        metadata: {
          ...(schedule.metadata ?? {}),
          syncStatus: runtimeSync.syncReason,
        },
      },
      rootDir,
    )
  }

  const workSummary = syncWorkItemSummary(workItem.id, rootDir)
  syncScheduleSummary(schedule.id, rootDir)

  return {
    timing: 'schedule_once',
    workItemId: workItem.id,
    runId: null,
    scheduleId: schedule.id,
    workItemSummaryStatus: workSummary.displayStatus,
    runtimeSyncStatus: runtimeSync.status,
    externalJobId: runtimeSync.externalJobId,
    runtimeSyncError: runtimeSync.syncError ?? runtimeSync.syncReason ?? null,
  }
}

export function listCanonicalLaunchDrafts(rootDir = process.cwd()) {
  return listLaunchDrafts(rootDir)
}
