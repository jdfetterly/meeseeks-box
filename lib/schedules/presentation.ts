export function formatScheduleTime(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function describeScheduleStatus(status: string) {
  switch (status) {
    case 'pending_sync':
      return 'Waiting for runtime sync'
    case 'sync_failed':
      return 'Needs runtime retry'
    case 'scheduled':
      return 'Scheduled'
    case 'paused':
      return 'Paused'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'missed':
      return 'Missed'
    case 'deleted':
      return 'Deleted'
    default:
      return status.replaceAll('_', ' ')
  }
}

export function describeScheduleCadence(
  scheduleKind: string,
  metadata: Record<string, unknown> | null,
) {
  const cadenceLabel = typeof metadata?.cadenceLabel === 'string' ? metadata.cadenceLabel : null

  if (cadenceLabel) {
    return cadenceLabel
  }

  if (scheduleKind === 'at') {
    return 'One-time'
  }

  if (scheduleKind === 'cron') {
    return 'Recurring'
  }

  return scheduleKind.replaceAll('_', ' ')
}

export function describeScheduleSyncState(
  metadata: Record<string, unknown> | null,
  options?: {
    scheduleStatus?: string | null
    hasExternalJobId?: boolean
  },
) {
  const syncStatus = typeof metadata?.syncStatus === 'string' ? metadata.syncStatus : null
  const syncError = typeof metadata?.syncError === 'string' ? metadata.syncError : null
  const removedExternalJobId =
    typeof metadata?.removedExternalJobId === 'string' ? metadata.removedExternalJobId : null
  const hasExternalJobId = options?.hasExternalJobId ?? false
  const scheduleStatus = options?.scheduleStatus ?? null

  if (!hasExternalJobId && syncStatus === 'runtime_paused') {
    if (scheduleStatus === 'paused' || (scheduleStatus === 'deleted' && !removedExternalJobId)) {
      return 'Runtime sync disabled in this environment'
    }
  }

  switch (syncStatus) {
    case 'runtime_synced':
      return 'Synced to runtime'
    case 'runtime-sync-disabled':
      return 'Runtime sync disabled in this environment'
    case 'pending_runtime_sync':
      return 'Waiting for runtime sync'
    case 'runtime_sync_failed':
      return 'Runtime sync failed'
    case 'runtime_paused':
      return 'Paused in runtime'
    case 'runtime_deleted':
      return 'Removed from runtime'
    case 'runtime_pause_failed':
      return 'Failed to pause in runtime'
    case 'runtime_resume_failed':
      return 'Failed to resume in runtime'
    case 'runtime_edit_failed':
      return 'Failed to update in runtime'
    case 'runtime_delete_failed':
      return 'Failed to remove from runtime'
    default:
      break
  }

  if (syncError === 'runtime-sync-disabled') {
    return 'Runtime sync disabled in this environment'
  }

  if (syncError) {
    return `Runtime sync error: ${syncError}`
  }

  return `Sync ${String(syncStatus ?? 'pending_runtime_sync')}`
}

export function describeSchedulePurpose(input: {
  metadata: Record<string, unknown> | null
}) {
  const outputExpectation =
    typeof input.metadata?.outputExpectation === 'string'
      ? input.metadata.outputExpectation
      : null
  const prompt = typeof input.metadata?.prompt === 'string' ? input.metadata.prompt : null

  return outputExpectation ?? prompt ?? 'Recurring delegated work with reviewable output.'
}

export function describeScheduleUsefulness(input: {
  missedRun: boolean
  consecutiveFailureCount: number
  lastSuccessfulOutputAt: string | null
}) {
  if (input.missedRun || input.consecutiveFailureCount > 0) {
    return 'unclear value'
  }

  if (input.lastSuccessfulOutputAt) {
    return 'useful'
  }

  return 'review value'
}
