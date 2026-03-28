import type { DomainScope } from '@/lib/product-state/entities'

export type OpenClawEventSurface =
  | 'agent-result'
  | 'cron-run'
  | 'runtime-log'
  | 'gateway-event'

export interface OpenClawCorrelationIds {
  runId?: string | null
  jobId?: string | null
  sessionId?: string | null
  sessionKey?: string | null
}

export interface OpenClawEventEnvelope {
  source: 'openclaw'
  surface: OpenClawEventSurface
  eventType: string
  sequenceKey: string
  occurredAt: string | null
  correlation: OpenClawCorrelationIds
  raw: Record<string, unknown> | string
  retryable: boolean
  metadata?: Record<string, unknown>
}

export interface ApprovalEnvelope {
  id: string
  approvalType: 'confirm' | 'data_input' | 'task_completion' | 'path_selection'
  requestedActionType: string
  runId: string | null
  workItemId: string | null
  context: Record<string, unknown>
  timeoutAt: string | null
  requestedAt: string
}

export interface ApprovalResolution {
  approvalId: string
  status: 'approved' | 'denied'
  resolvedAt: string
  inputText?: string | null
}

export interface WorkspaceMemoryWriteRequest {
  scope: DomainScope
  relativePath: string
  content: string
  contentType: 'markdown' | 'json'
}

export interface WorkspaceMemoryWriteResult {
  status: 'written' | 'rejected' | 'unavailable'
  absolutePath: string | null
  reason: string | null
}

export interface WorkspaceMemorySourceSnapshot {
  scope: DomainScope
  absolutePath: string
  exists: boolean
}

export interface EventSource {
  push(envelope: OpenClawEventEnvelope): Promise<void>
  list(): Promise<readonly OpenClawEventEnvelope[]>
}

export interface ApprovalBridge {
  listPending(): Promise<readonly ApprovalEnvelope[]>
  resolve(input: {
    approvalId: string
    status: ApprovalResolution['status']
    inputText?: string | null
  }): Promise<ApprovalResolution>
}

export interface WorkspaceBridge {
  listMemorySources(scope: DomainScope): Promise<readonly WorkspaceMemorySourceSnapshot[]>
  writeMemoryFile(input: WorkspaceMemoryWriteRequest): Promise<WorkspaceMemoryWriteResult>
}

export interface OpenClawIntegrationAdapter {
  events: EventSource
  approvals: ApprovalBridge
  workspace: WorkspaceBridge
}

export function createOpenClawEventEnvelope(
  input: Omit<OpenClawEventEnvelope, 'source'>,
): OpenClawEventEnvelope {
  return {
    source: 'openclaw',
    ...input,
  }
}

export function makeOpenClawSequenceKey(
  surface: OpenClawEventSurface,
  correlation: OpenClawCorrelationIds,
  suffix: string,
) {
  const primary =
    correlation.runId ??
    (correlation.jobId && correlation.sessionId
      ? `${correlation.jobId}:${correlation.sessionId}`
      : null) ??
    correlation.sessionKey ??
    'unscoped'

  return `${surface}:${primary}:${suffix}`
}
