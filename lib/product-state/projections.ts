import { generateId } from '@/lib/id'
import { maybeSendSlackFallbackForInboxItem } from '@/lib/notifications/slack'
import { openProductStateDb } from '@/lib/product-state/db'
import type {
  ApprovalRecord,
  InboxItemRecord,
  RunEventRecord,
  RunStatus,
  RunSummaryRecord,
  ScheduleSummaryRecord,
  WorkItemStatus,
  WorkItemSummaryRecord,
} from '@/lib/product-state/entities'
import {
  getRunById,
  getWorkItemById,
  listRunEvents,
  resolveInboxItemsBySource,
  updateRunLifecycle,
  upsertInboxItem,
  upsertRunSummary,
  upsertScheduleSummary,
  upsertWorkItemSummary,
} from '@/lib/product-state/repositories'

function extractLastErrorText(event: RunEventRecord | null) {
  if (!event) {
    return null
  }

  if (typeof event.payload === 'string') {
    return event.payload
  }

  const payload = event.payload as Record<string, unknown>
  const rawText = typeof payload.rawText === 'string' ? payload.rawText : null
  const summary = typeof payload.summary === 'string' ? payload.summary : null
  const resultText = typeof payload.resultText === 'string' ? payload.resultText : null

  return rawText ?? summary ?? resultText
}

function extractRetryable(event: RunEventRecord) {
  if (typeof event.payload === 'string') {
    return null
  }

  const payload = event.payload as Record<string, unknown>
  const metadata =
    payload.metadata && typeof payload.metadata === 'object'
      ? (payload.metadata as Record<string, unknown>)
      : null

  return typeof metadata?.retryable === 'boolean' ? metadata.retryable : null
}

function deriveDisplayStatus(
  baseStatus: WorkItemStatus,
  latestRunStatus: RunStatus | null,
): WorkItemStatus {
  if (baseStatus === 'archived') {
    return 'archived'
  }

  if (!latestRunStatus) {
    return baseStatus
  }

  switch (latestRunStatus) {
    case 'running':
      return 'running'
    case 'waiting_approval':
      return 'needs_approval'
    case 'blocked':
      return 'blocked'
    case 'failed':
      return 'failed'
    case 'completed':
      return baseStatus === 'scheduled' ? 'scheduled' : 'completed'
    case 'queued':
      return baseStatus
  }
}

function deriveBadges(
  displayStatus: WorkItemStatus,
  latestEventType: string | null,
): string[] {
  const badges = new Set<string>()

  if (displayStatus === 'archived') {
    badges.add('archived')
    return [...badges]
  }

  if (displayStatus === 'failed' || latestEventType === 'tool_failed') {
    badges.add('failed')
  }

  if (displayStatus === 'needs_approval') {
    badges.add('needs-approval')
  }

  if (displayStatus === 'scheduled') {
    badges.add('scheduled')
  }

  return [...badges]
}

export function syncRunSummary(runId: string, rootDir = process.cwd()) {
  const run = getRunById(runId, rootDir)

  if (!run) {
    throw new Error(`Unknown run: ${runId}`)
  }

  const latestEvent = listRunEvents(runId, rootDir).at(-1) ?? null
  const summary: RunSummaryRecord = {
    runId: run.id,
    workItemId: run.workItemId,
    conversationId: run.conversationId,
    scope: run.scope,
    status: run.status,
    triggerKind: run.triggerKind,
    agentId: run.agentId,
    model: run.model,
    externalRunId: run.externalRunId,
    externalSessionId: run.externalSessionId,
    externalSessionKey: run.externalSessionKey,
    lastEventType: latestEvent?.eventType ?? null,
    lastEventAt: latestEvent?.createdAt ?? null,
    lastErrorText:
      latestEvent && (latestEvent.eventType === 'run_failed' || latestEvent.eventType === 'tool_failed')
        ? extractLastErrorText(latestEvent)
        : null,
    createdAt: run.createdAt,
    updatedAt: latestEvent?.createdAt ?? run.updatedAt,
  }

  return upsertRunSummary(summary, rootDir)
}

export function syncWorkItemSummary(workItemId: string, rootDir = process.cwd()) {
  const workItem = getWorkItemById(workItemId, rootDir)

  if (!workItem) {
    throw new Error(`Unknown work item: ${workItemId}`)
  }

  const db = openProductStateDb(rootDir)
  const latestRunRow = db
    .prepare(
      `SELECT
         id,
         status,
         updated_at
       FROM runs
       WHERE work_item_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`,
    )
    .get<{ id: string; status: RunStatus; updated_at: string }>(workItemId)

  const latestEvent =
    latestRunRow ? listRunEvents(latestRunRow.id, rootDir).at(-1) ?? null : null
  const displayStatus = deriveDisplayStatus(workItem.status, latestRunRow?.status ?? null)
  const summary: WorkItemSummaryRecord = {
    workItemId: workItem.id,
    title: workItem.title,
    scope: workItem.scope,
    priority: workItem.priority,
    projectId: workItem.projectId,
    delegatedAgentId: workItem.delegatedAgentId,
    reviewState: workItem.reviewState,
    baseStatus: workItem.status,
    displayStatus,
    sourceConversationId: workItem.sourceConversationId,
    latestRunId: latestRunRow?.id ?? null,
    latestRunStatus: latestRunRow?.status ?? null,
    latestEventType: latestEvent?.eventType ?? null,
    latestEventAt: latestEvent?.createdAt ?? null,
    badges: deriveBadges(displayStatus, latestEvent?.eventType ?? null),
    createdAt: workItem.createdAt,
    updatedAt: latestEvent?.createdAt ?? latestRunRow?.updated_at ?? workItem.updatedAt,
  }

  return upsertWorkItemSummary(summary, rootDir)
}

export function syncScheduleSummary(scheduleId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir)
  const row = db
    .prepare(
      `SELECT
         id,
         source_kind,
         source_ref,
         label,
         status,
         schedule_kind,
         next_run_at,
         last_run_at,
         last_success_at,
         consecutive_failures,
         missed_run_flag,
         metadata_json,
         external_job_id,
         updated_at
       FROM schedules
       WHERE id = ?`,
    )
    .get<{
      id: string
      source_kind: string
      source_ref: string | null
      label: string
      status: string
      schedule_kind: string
      next_run_at: string | null
      last_run_at: string | null
      last_success_at: string | null
      consecutive_failures: number
      missed_run_flag: number
      metadata_json: string | null
      external_job_id: string | null
      updated_at: string
    }>(scheduleId)

  if (!row) {
    throw new Error(`Unknown schedule: ${scheduleId}`)
  }

  const metadata = row.metadata_json ? (JSON.parse(row.metadata_json) as Record<string, unknown>) : null
  const lastRunOutcome =
    typeof metadata?.lastRunOutcome === 'string'
      ? metadata.lastRunOutcome
      : row.consecutive_failures > 0
        ? 'failed'
        : row.last_run_at
          ? 'completed'
          : null

  const summary: ScheduleSummaryRecord = {
    scheduleId: row.id,
    sourceKind: row.source_kind,
    sourceRef: row.source_ref,
    label: row.label,
    status: row.status,
    scheduleKind: row.schedule_kind,
    externalJobId: row.external_job_id,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    lastSuccessfulOutputAt: row.last_success_at,
    lastRunOutcome,
    consecutiveFailureCount: row.consecutive_failures,
    missedRun: row.missed_run_flag === 1,
    metadata,
    updatedAt: row.updated_at,
  }

  return upsertScheduleSummary(summary, rootDir)
}

export function projectInboxFromScheduleSummary(
  scheduleSummary: ScheduleSummaryRecord,
  rootDir = process.cwd(),
) {
  if (scheduleSummary.status !== 'missed') {
    resolveInboxItemsBySource(
      {
        sourceKind: 'schedule',
        sourceRef: scheduleSummary.scheduleId,
        categories: ['missed_schedule'],
        resolvedAt: new Date().toISOString(),
      },
      rootDir,
    )
    return null
  }

  const inboxItem: InboxItemRecord = {
    id: generateId(),
    sourceKind: 'schedule',
    sourceRef: scheduleSummary.scheduleId,
    category: 'missed_schedule',
    status: 'open',
    title: `Missed schedule: ${scheduleSummary.label}`,
    detail: {
      scheduleId: scheduleSummary.scheduleId,
      workItemId: scheduleSummary.sourceRef,
      nextRunAt: scheduleSummary.nextRunAt,
      scheduleKind: scheduleSummary.scheduleKind,
      highSignal: scheduleSummary.scheduleKind === 'at',
    },
    dedupeKey: `schedule:${scheduleSummary.scheduleId}:missed_schedule`,
    createdAt: scheduleSummary.updatedAt,
    updatedAt: scheduleSummary.updatedAt,
    resolvedAt: null,
  }

  const record = upsertInboxItem(inboxItem, rootDir)
  void maybeSendSlackFallbackForInboxItem(record, rootDir)
  return record
}

export function projectInboxFromRunEvent(runEvent: RunEventRecord, rootDir = process.cwd()) {
  if (runEvent.eventType === 'run_completed') {
    resolveInboxItemsBySource(
      {
        sourceKind: 'run',
        sourceRef: runEvent.runId,
        categories: ['run_failure', 'tool_failure'],
        resolvedAt: runEvent.createdAt,
      },
      rootDir,
    )
    return null
  }

  if (runEvent.eventType !== 'run_failed' && runEvent.eventType !== 'tool_failed') {
    return null
  }

  const run = getRunById(runEvent.runId, rootDir)
  const category = runEvent.eventType === 'run_failed' ? 'run_failure' : 'tool_failure'
  const title = run?.workItemId
    ? `Run attention required for ${run.workItemId}`
    : 'Run attention required'

  const inboxItem: InboxItemRecord = {
    id: generateId(),
    sourceKind: 'run',
    sourceRef: runEvent.runId,
    category,
    status: 'open',
    title,
    detail: {
      eventType: runEvent.eventType,
      runId: runEvent.runId,
      workItemId: run?.workItemId ?? null,
      lastErrorText: extractLastErrorText(runEvent),
      retryable: extractRetryable(runEvent),
    },
    dedupeKey: `run:${runEvent.runId}:${category}`,
    createdAt: runEvent.createdAt,
    updatedAt: runEvent.createdAt,
    resolvedAt: null,
  }

  const record = upsertInboxItem(inboxItem, rootDir)
  void maybeSendSlackFallbackForInboxItem(record, rootDir)
  return record
}

function describeApprovalTitle(approval: ApprovalRecord) {
  if (approval.workItemId) {
    return `Approval required for ${approval.workItemId}`
  }

  if (approval.requestedActionType !== 'unknown') {
    return `Approval required for ${approval.requestedActionType}`
  }

  return 'Approval required'
}

export function projectInboxFromApproval(approval: ApprovalRecord, rootDir = process.cwd()) {
  if (approval.status !== 'pending') {
    resolveInboxItemsBySource(
      {
        sourceKind: 'approval',
        sourceRef: approval.id,
        categories: ['approval_required'],
        resolvedAt: approval.resolvedAt ?? new Date().toISOString(),
      },
      rootDir,
    )
    return null
  }

  const inboxItem: InboxItemRecord = {
    id: generateId(),
    sourceKind: 'approval',
    sourceRef: approval.id,
    category: 'approval_required',
    status: 'open',
    title: describeApprovalTitle(approval),
    detail: {
      approvalId: approval.id,
      approvalType: approval.approvalType,
      requestedActionType: approval.requestedActionType,
      runId: approval.runId,
      workItemId: approval.workItemId,
      requestedAt: approval.requestedAt,
      status: approval.status,
    },
    dedupeKey: `approval:${approval.id}:required`,
    createdAt: approval.requestedAt,
    updatedAt: approval.requestedAt,
    resolvedAt: null,
  }

  const record = upsertInboxItem(inboxItem, rootDir)
  void maybeSendSlackFallbackForInboxItem(record, rootDir)
  return record
}

export function syncApprovalImpact(
  approval: ApprovalRecord,
  rootDir = process.cwd(),
) {
  if (approval.runId) {
    const runStatus: RunStatus =
      approval.status === 'pending'
        ? 'waiting_approval'
        : approval.status === 'denied' || approval.status === 'expired'
          ? 'blocked'
          : 'running'

    updateRunLifecycle(
      {
        id: approval.runId,
        status: runStatus,
      },
      rootDir,
    )
    syncRunSummary(approval.runId, rootDir)
  }

  if (approval.workItemId) {
    syncWorkItemSummary(approval.workItemId, rootDir)
  }

  return projectInboxFromApproval(approval, rootDir)
}
