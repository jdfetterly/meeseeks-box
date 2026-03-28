import type { OpenClawEventEnvelope } from '@/lib/openclaw/contracts'
import type { ApprovalRecord, RunEventRecord, RunEventType } from '@/lib/product-state/entities'
import {
  createRunEvent,
  findRunByExternalRef,
  getApprovalById,
  upsertApproval,
  updateRunLifecycle,
} from '@/lib/product-state/repositories'
import {
  projectInboxFromApproval,
  projectInboxFromRunEvent,
  syncApprovalImpact,
  syncRunSummary,
  syncWorkItemSummary,
} from '@/lib/product-state/projections'

interface IngestedRunEventResult {
  kind: 'run_event'
  event: RunEventRecord
  duplicate: boolean
  canonicalRunId: string
}

interface IngestedApprovalEventResult {
  kind: 'approval_event'
  approval: ApprovalRecord
  duplicate: boolean
  canonicalRunId: string | null
}

export type IngestedOpenClawEventResult = IngestedRunEventResult | IngestedApprovalEventResult

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function deriveApprovalType(rawRequest: Record<string, unknown>) {
  const candidate = rawRequest.approvalType ?? rawRequest.type

  if (
    candidate === 'data_input' ||
    candidate === 'task_completion' ||
    candidate === 'path_selection'
  ) {
    return candidate
  }

  return 'confirm'
}

function deriveRequestedActionType(rawRequest: Record<string, unknown>) {
  if (typeof rawRequest.requestedActionType === 'string') {
    return rawRequest.requestedActionType
  }

  if (typeof rawRequest.actionType === 'string') {
    return rawRequest.actionType
  }

  const action = asRecord(rawRequest.action)
  return typeof action?.type === 'string' ? action.type : 'unknown'
}

function resolveCanonicalRun(
  envelope: OpenClawEventEnvelope,
  extraRequest?: Record<string, unknown> | null,
  rootDir = process.cwd(),
) {
  const request = extraRequest ?? {}
  const requestSessionKey =
    typeof request.sessionKey === 'string' ? request.sessionKey : null
  const requestSessionId =
    typeof request.sessionId === 'string' ? request.sessionId : null
  const requestRunId = typeof request.runId === 'string' ? request.runId : null

  return findRunByExternalRef(
    {
      externalRunId: envelope.correlation.runId ?? requestRunId,
      externalSessionId: envelope.correlation.sessionId ?? requestSessionId,
      externalSessionKey: envelope.correlation.sessionKey ?? requestSessionKey,
    },
    rootDir,
  )
}

function classifyOpenClawEventType(envelope: OpenClawEventEnvelope): RunEventType {
  if (envelope.surface === 'gateway-event') {
    throw new Error(`Gateway event type must be handled explicitly: ${envelope.eventType}`)
  }

  if (envelope.surface === 'runtime-log') {
    return 'tool_failed'
  }

  if (envelope.surface === 'cron-run') {
    return 'schedule_triggered'
  }

  if (envelope.surface === 'agent-result') {
    const raw =
      typeof envelope.raw === 'string'
        ? { rawText: envelope.raw }
        : (envelope.raw as Record<string, unknown>)

    return raw.status === 'ok' ? 'run_completed' : 'run_failed'
  }

  throw new Error(`Unsupported OpenClaw event surface: ${envelope.surface}`)
}

export function normalizeOpenClawEvent(
  envelope: OpenClawEventEnvelope,
  rootDir = process.cwd(),
): IngestedOpenClawEventResult {
  if (envelope.surface === 'gateway-event') {
    return normalizeOpenClawGatewayEvent(envelope, rootDir)
  }

  const run = resolveCanonicalRun(envelope, null, rootDir)

  if (!run) {
    throw new Error('No canonical run found for the provided OpenClaw correlation identifiers')
  }

  const payload =
    typeof envelope.raw === 'string'
      ? {
          rawText: envelope.raw,
          correlation: envelope.correlation,
          metadata: {
            ...(envelope.metadata ?? {}),
            retryable: envelope.retryable,
          },
        }
      : {
          ...envelope.raw,
          correlation: envelope.correlation,
          metadata: {
            ...(envelope.metadata ?? {}),
            retryable: envelope.retryable,
          },
        }

  const { event, duplicate } = createRunEvent(
    {
      runId: run.id,
      eventType: classifyOpenClawEventType(envelope),
      sequenceKey: envelope.sequenceKey,
      source: `${envelope.source}:${envelope.surface}`,
      payload,
      createdAt: envelope.occurredAt,
    },
    rootDir,
  )

  if (!duplicate) {
    if (event.eventType === 'run_completed') {
      updateRunLifecycle(
        {
          id: run.id,
          status: 'completed',
          completedAt: event.createdAt,
        },
        rootDir,
      )
    } else if (event.eventType === 'run_failed') {
      updateRunLifecycle(
        {
          id: run.id,
          status: 'failed',
          completedAt: event.createdAt,
        },
        rootDir,
      )
    }

    syncRunSummary(run.id, rootDir)

    if (run.workItemId) {
      syncWorkItemSummary(run.workItemId, rootDir)
    }

    projectInboxFromRunEvent(event, rootDir)
  }

  return {
    kind: 'run_event',
    event,
    duplicate,
    canonicalRunId: run.id,
  }
}

function normalizeOpenClawGatewayEvent(
  envelope: OpenClawEventEnvelope,
  rootDir = process.cwd(),
): IngestedApprovalEventResult {
  if (
    envelope.eventType !== 'exec.approval.requested' &&
    envelope.eventType !== 'exec.approval.resolved'
  ) {
    throw new Error(`Unsupported OpenClaw gateway event type: ${envelope.eventType}`)
  }

  const raw = asRecord(envelope.raw)

  if (!raw || typeof raw.id !== 'string') {
    throw new Error('Approval gateway event is missing an approval id')
  }

  const rawRequest = asRecord(raw.request) ?? {}
  const correlatedRun = resolveCanonicalRun(envelope, rawRequest, rootDir)
  const approvalId = raw.id
  const existing = getApprovalById(approvalId, rootDir)
  const requestedAt =
    typeof raw.createdAtMs === 'number'
      ? new Date(raw.createdAtMs).toISOString()
      : existing?.requestedAt ?? envelope.occurredAt ?? new Date().toISOString()
  const resolvedAt =
    typeof raw.ts === 'number'
      ? new Date(raw.ts).toISOString()
      : envelope.eventType === 'exec.approval.resolved'
        ? envelope.occurredAt ?? new Date().toISOString()
        : null
  const decision = typeof raw.decision === 'string' ? raw.decision : null
  const nextStatus =
    envelope.eventType === 'exec.approval.requested'
      ? 'pending'
      : decision === 'deny'
        ? 'denied'
        : 'approved'
  const storedRequest = {
    ...rawRequest,
    approvalType: deriveApprovalType(rawRequest),
    requestedActionType: deriveRequestedActionType(rawRequest),
    workItemId: correlatedRun?.workItemId ?? existing?.workItemId ?? null,
  }
  const resolution =
    envelope.eventType === 'exec.approval.resolved'
      ? {
          decision: decision ?? 'allow-once',
          resolvedBy:
            typeof raw.resolvedBy === 'string' ? raw.resolvedBy : 'runtime',
          ts: resolvedAt,
          request: rawRequest,
        }
      : null

  const duplicate =
    existing?.status === nextStatus &&
    (nextStatus !== 'pending'
      ? JSON.stringify(existing.resolution ?? null) === JSON.stringify(resolution)
      : true)

  const approval = upsertApproval(
    {
      id: approvalId,
      runId: correlatedRun?.id ?? existing?.runId ?? null,
      status: nextStatus,
      request: storedRequest,
      resolution,
      requestedAt,
      resolvedAt,
    },
    rootDir,
  )

  if (!duplicate) {
    syncApprovalImpact(approval, rootDir)
  } else if (approval.status === 'pending') {
    projectInboxFromApproval(approval, rootDir)
  }

  return {
    kind: 'approval_event',
    approval,
    duplicate,
    canonicalRunId: approval.runId,
  }
}
