import 'server-only';

import { generateId } from '@/lib/id';
import { openProductStateDb } from '@/lib/product-state/db';
import type {
  ApprovalRecord,
  ApprovalStatus,
  ArtifactFamilyRecord,
  ArtifactVersionRecord,
  ConversationKind,
  ConversationLinkedObject,
  ConversationRecord,
  ConversationStatus,
  DomainScope,
  InboxItemRecord,
  LaunchDraftRecord,
  MessageRecord,
  OpenLoopOwner,
  OpenLoopPriority,
  OpenLoopRecord,
  OpenLoopSourceKind,
  OpenLoopStatus,
  OpenLoopWaitingOn,
  MemoryEntryRecord,
  MemorySourceRecord,
  NotificationDeliveryRecord,
  NotificationDeliveryStatus,
  ProposalKind,
  ProjectContextSummaryRecord,
  ProjectLearningSuggestionRecord,
  ProjectLearningSuggestionStatus,
  ProjectPlaybookRecord,
  ProjectPriority,
  ProjectRecord,
  ProjectStatus,
  ProjectWorkspaceRecord,
  SpecCardLinkRecord,
  SpecExecutionMode,
  SpecRecord,
  SpecStatus,
  ReviewItemRecord,
  ReviewItemStatus,
  RunEventRecord,
  RunEventType,
  RunRecord,
  RunStatus,
  RunSummaryRecord,
  SavedLaunchPresetRecord,
  ScheduleRecord,
  ScheduleSummaryRecord,
  WorkItemRecord,
  WorkItemReviewState,
  WorkItemStatus,
  WorkItemSummaryRecord,
} from '@/lib/product-state/entities';

interface ConversationRow {
  id: string;
  scope: DomainScope;
  agent_id: string | null;
  project_id: string | null;
  kind: ConversationKind;
  status: ConversationStatus;
  title: string | null;
  current_objective: string | null;
  summary: string | null;
  latest_proposal_kind: ProposalKind | null;
  recommended_next_action: string | null;
  linked_objects_json: string | null;
  parent_conversation_id: string | null;
  branch_from_message_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content_text: string | null;
  content_json: string | null;
  created_at: string;
}

interface WorkItemRow {
  id: string;
  title: string;
  scope: DomainScope;
  status: WorkItemStatus;
  priority: string | null;
  project_id: string | null;
  delegated_agent_id: string | null;
  linked_repos_json: string | null;
  review_state: WorkItemReviewState;
  source_conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

interface RunRow {
  id: string;
  work_item_id: string | null;
  conversation_id: string | null;
  agent_id: string | null;
  external_run_id: string | null;
  external_session_id: string | null;
  external_session_key: string | null;
  scope: DomainScope;
  status: RunStatus;
  trigger_kind: string;
  model: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RunEventRow {
  id: string;
  run_id: string;
  event_type: RunEventType;
  sequence_key: string;
  source: string;
  payload_json: string;
  created_at: string;
}

interface RunSummaryRow {
  run_id: string;
  work_item_id: string | null;
  conversation_id: string | null;
  scope: DomainScope;
  status: RunStatus;
  trigger_kind: string;
  agent_id: string | null;
  model: string | null;
  external_run_id: string | null;
  external_session_id: string | null;
  external_session_key: string | null;
  last_event_type: string | null;
  last_event_at: string | null;
  last_error_text: string | null;
  created_at: string;
  updated_at: string;
}

interface OpenLoopRow {
  id: string;
  project_id: string | null;
  conversation_id: string | null;
  source_kind: OpenLoopSourceKind;
  title: string;
  detail: string | null;
  owner: OpenLoopOwner;
  waiting_on: OpenLoopWaitingOn;
  blocking: number;
  priority: OpenLoopPriority;
  status: OpenLoopStatus;
  recommended_action: string | null;
  dedupe_key: string;
  linked_objects_json: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface WorkItemSummaryRow {
  work_item_id: string;
  title: string;
  scope: DomainScope;
  priority: string | null;
  project_id: string | null;
  delegated_agent_id: string | null;
  review_state: WorkItemReviewState;
  base_status: WorkItemStatus;
  display_status: WorkItemStatus;
  source_conversation_id: string | null;
  latest_run_id: string | null;
  latest_run_status: RunStatus | null;
  latest_event_type: string | null;
  latest_event_at: string | null;
  badges_json: string;
  created_at: string;
  updated_at: string;
}

interface ProjectRow {
  id: string;
  title: string;
  summary: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  linked_repos_json: string;
  active_goal: string | null;
  current_focus: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectPlaybookRow {
  project_id: string;
  goals_json: string;
  preferred_agents_json: string;
  working_style: string | null;
  review_preferences: string | null;
  schedule_patterns: string | null;
  repo_context: string | null;
  recent_decisions_json: string;
  updated_at: string;
}

interface ProjectWorkspaceRow {
  id: string;
  project_id: string;
  mode: 'existing' | 'bootstrapped';
  workspace_path: string;
  repo_name: string | null;
  repo_url: string | null;
  default_branch: string | null;
  status: 'unbound' | 'ready' | 'bootstrap_pending' | 'bootstrap_failed';
  created_at: string;
  updated_at: string;
}

interface SpecRow {
  id: string;
  project_id: string;
  title: string;
  intent: string;
  outcome: string;
  in_scope_json: string;
  out_of_scope_json: string;
  current_context: string | null;
  dependencies_json: string;
  execution_notes: string | null;
  acceptance_criteria_json: string;
  review_expectations: string | null;
  status: SpecStatus;
  execution_mode: SpecExecutionMode;
  workspace_required: number;
  created_at: string;
  updated_at: string;
}

interface SpecCardLinkRow {
  id: string;
  spec_id: string;
  work_item_id: string;
  decomposition_reason: string;
  acceptance_criteria_json: string;
  expected_output: string | null;
  created_at: string;
}

interface ProjectLearningSuggestionRow {
  id: string;
  project_id: string;
  suggestion_type: string;
  title: string;
  detail: string;
  payload_json: string | null;
  status: ProjectLearningSuggestionStatus;
  created_at: string;
  updated_at: string;
}

interface ReviewItemRow {
  id: string;
  project_id: string | null;
  work_item_id: string;
  artifact_ids_json: string;
  produced_by_agent_id: string | null;
  summary: string;
  review_reason: string;
  status: ReviewItemStatus;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
}

interface InboxItemRow {
  id: string;
  source_kind: string;
  source_ref: string;
  category: string;
  status: 'open' | 'resolved';
  title: string;
  detail_json: string;
  dedupe_key: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface ApprovalRow {
  id: string;
  run_id: string | null;
  status: ApprovalStatus;
  request_json: string;
  resolution_json: string | null;
  requested_at: string;
  resolved_at: string | null;
}

interface ScheduleSummaryRow {
  schedule_id: string;
  source_kind: string;
  source_ref: string | null;
  label: string;
  status: string;
  schedule_kind: string;
  external_job_id: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  last_successful_output_at: string | null;
  last_run_outcome: string | null;
  consecutive_failure_count: number;
  missed_run: number;
  metadata_json: string | null;
  updated_at: string;
}

interface NotificationDeliveryRow {
  id: string;
  inbox_item_id: string | null;
  channel: string;
  category: string;
  status: NotificationDeliveryStatus;
  dedupe_key: string;
  payload_json: string;
  response_json: string | null;
  created_at: string;
  updated_at: string;
}

interface ScheduleRow {
  id: string;
  source_kind: string;
  source_ref: string | null;
  label: string;
  status: string;
  schedule_kind: string;
  schedule_expr: string | null;
  next_run_at: string | null;
  last_run_at: string | null;
  last_success_at: string | null;
  consecutive_failures: number;
  missed_run_flag: number;
  metadata_json: string | null;
  external_job_id: string | null;
  created_at: string;
  updated_at: string;
}

interface SavedLaunchPresetRow {
  id: string;
  title: string;
  scope: DomainScope;
  agent_id: string | null;
  model_override: string | null;
  priority: string | null;
  output_type: string | null;
  timing_preference: string | null;
  prompt_template: string | null;
  created_at: string;
  updated_at: string;
}

interface LaunchDraftRow {
  id: string;
  title: string;
  prompt: string;
  scope: DomainScope;
  agent_id: string | null;
  model: string | null;
  priority: string | null;
  output_type: string | null;
  source_conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MemoryEntryRow {
  id: string;
  scope: DomainScope;
  entry_type: string;
  title: string;
  summary: string | null;
  canonical_path: string | null;
  status: string;
  tags_json: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  reviewed_at: string | null;
  archived_at: string | null;
  superseded_by_id: string | null;
}

interface MemorySourceRow {
  id: string;
  memory_entry_id: string;
  source_kind: string;
  source_ref: string | null;
  source_path: string | null;
  excerpt_hash: string | null;
  notes: string | null;
  payload_json: string | null;
  observed_at: string;
}

interface ArtifactFamilyRow {
  id: string;
  family_key: string;
  title: string;
  scope: DomainScope;
  producer_kind: 'schedule' | 'work_item' | 'manual';
  producer_id: string;
  output_slot: string;
  created_at: string;
  updated_at: string;
}

interface ArtifactVersionRow {
  id: string;
  artifact_family_id: string;
  version_number: number;
  version_label: string;
  run_id: string | null;
  work_item_id: string | null;
  name: string;
  mime_type: string | null;
  storage_path: string | null;
  metadata_json: string | null;
  created_at: string;
}

function mapConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    scope: row.scope,
    agentId: row.agent_id,
    projectId: row.project_id,
    kind: row.kind,
    status: row.status,
    title: row.title,
    currentObjective: row.current_objective,
    summary: row.summary,
    latestProposalKind: row.latest_proposal_kind,
    recommendedNextAction: row.recommended_next_action,
    linkedObjects: row.linked_objects_json
      ? (JSON.parse(row.linked_objects_json) as ConversationLinkedObject[])
      : [],
    parentConversationId: row.parent_conversation_id,
    branchFromMessageId: row.branch_from_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

function mapMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    contentText: row.content_text,
    contentJson: row.content_json
      ? (JSON.parse(row.content_json) as Record<string, unknown>)
      : null,
    createdAt: row.created_at,
  };
}

function mapWorkItem(row: WorkItemRow): WorkItemRecord {
  return {
    id: row.id,
    title: row.title,
    scope: row.scope,
    status: row.status,
    priority: row.priority,
    projectId: row.project_id,
    delegatedAgentId: row.delegated_agent_id,
    linkedRepos: row.linked_repos_json ? (JSON.parse(row.linked_repos_json) as string[]) : [],
    reviewState: row.review_state,
    sourceConversationId: row.source_conversation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOpenLoop(row: OpenLoopRow): OpenLoopRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    conversationId: row.conversation_id,
    sourceKind: row.source_kind,
    title: row.title,
    detail: row.detail,
    owner: row.owner,
    waitingOn: row.waiting_on,
    blocking: row.blocking === 1,
    priority: row.priority,
    status: row.status,
    recommendedAction: row.recommended_action,
    dedupeKey: row.dedupe_key,
    linkedObjects: JSON.parse(row.linked_objects_json) as ConversationLinkedObject[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  };
}

function mapRun(row: RunRow): RunRecord {
  return {
    id: row.id,
    workItemId: row.work_item_id,
    conversationId: row.conversation_id,
    agentId: row.agent_id,
    externalRunId: row.external_run_id,
    externalSessionId: row.external_session_id,
    externalSessionKey: row.external_session_key,
    scope: row.scope,
    status: row.status,
    triggerKind: row.trigger_kind,
    model: row.model,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRunEvent(row: RunEventRow): RunEventRecord {
  return {
    id: row.id,
    runId: row.run_id,
    eventType: row.event_type,
    sequenceKey: row.sequence_key,
    source: row.source,
    payload: JSON.parse(row.payload_json) as Record<string, unknown> | string,
    createdAt: row.created_at,
  };
}

function mapRunSummary(row: RunSummaryRow): RunSummaryRecord {
  return {
    runId: row.run_id,
    workItemId: row.work_item_id,
    conversationId: row.conversation_id,
    scope: row.scope,
    status: row.status,
    triggerKind: row.trigger_kind,
    agentId: row.agent_id,
    model: row.model,
    externalRunId: row.external_run_id,
    externalSessionId: row.external_session_id,
    externalSessionKey: row.external_session_key,
    lastEventType: row.last_event_type,
    lastEventAt: row.last_event_at,
    lastErrorText: row.last_error_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkItemSummary(row: WorkItemSummaryRow): WorkItemSummaryRecord {
  return {
    workItemId: row.work_item_id,
    title: row.title,
    scope: row.scope,
    priority: row.priority,
    projectId: row.project_id,
    delegatedAgentId: row.delegated_agent_id,
    reviewState: row.review_state,
    baseStatus: row.base_status,
    displayStatus: row.display_status,
    sourceConversationId: row.source_conversation_id,
    latestRunId: row.latest_run_id,
    latestRunStatus: row.latest_run_status,
    latestEventType: row.latest_event_type,
    latestEventAt: row.latest_event_at,
    badges: JSON.parse(row.badges_json) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProject(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    status: row.status,
    priority: row.priority,
    linkedRepos: JSON.parse(row.linked_repos_json) as string[],
    activeGoal: row.active_goal,
    currentFocus: row.current_focus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProjectPlaybook(row: ProjectPlaybookRow): ProjectPlaybookRecord {
  return {
    projectId: row.project_id,
    goals: JSON.parse(row.goals_json) as string[],
    preferredAgents: JSON.parse(row.preferred_agents_json) as string[],
    workingStyle: row.working_style,
    reviewPreferences: row.review_preferences,
    schedulePatterns: row.schedule_patterns,
    repoContext: row.repo_context,
    recentDecisions: JSON.parse(row.recent_decisions_json) as string[],
    updatedAt: row.updated_at,
  };
}

function mapProjectWorkspace(row: ProjectWorkspaceRow): ProjectWorkspaceRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    mode: row.mode,
    workspacePath: row.workspace_path,
    repoName: row.repo_name,
    repoUrl: row.repo_url,
    defaultBranch: row.default_branch,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSpec(row: SpecRow): SpecRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    intent: row.intent,
    outcome: row.outcome,
    inScope: JSON.parse(row.in_scope_json) as string[],
    outOfScope: JSON.parse(row.out_of_scope_json) as string[],
    currentContext: row.current_context,
    dependencies: JSON.parse(row.dependencies_json) as string[],
    executionNotes: row.execution_notes,
    acceptanceCriteria: JSON.parse(row.acceptance_criteria_json) as string[],
    reviewExpectations: row.review_expectations,
    status: row.status,
    executionMode: row.execution_mode,
    workspaceRequired: row.workspace_required === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSpecCardLink(row: SpecCardLinkRow): SpecCardLinkRecord {
  return {
    id: row.id,
    specId: row.spec_id,
    workItemId: row.work_item_id,
    decompositionReason: row.decomposition_reason,
    acceptanceCriteria: JSON.parse(row.acceptance_criteria_json) as string[],
    expectedOutput: row.expected_output,
    createdAt: row.created_at,
  };
}

function mapProjectLearningSuggestion(
  row: ProjectLearningSuggestionRow,
): ProjectLearningSuggestionRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    suggestionType: row.suggestion_type,
    title: row.title,
    detail: row.detail,
    payload: row.payload_json ? (JSON.parse(row.payload_json) as Record<string, unknown>) : null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReviewItem(row: ReviewItemRow): ReviewItemRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    workItemId: row.work_item_id,
    artifactIds: JSON.parse(row.artifact_ids_json) as string[],
    producedByAgentId: row.produced_by_agent_id,
    summary: row.summary,
    reviewReason: row.review_reason,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at,
  };
}

function mapInboxItem(row: InboxItemRow): InboxItemRecord {
  return {
    id: row.id,
    sourceKind: row.source_kind,
    sourceRef: row.source_ref,
    category: row.category,
    status: row.status,
    title: row.title,
    detail: JSON.parse(row.detail_json) as Record<string, unknown>,
    dedupeKey: row.dedupe_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  };
}

function mapApproval(row: ApprovalRow): ApprovalRecord {
  const request = JSON.parse(row.request_json) as Record<string, unknown>;
  const resolution = row.resolution_json
    ? (JSON.parse(row.resolution_json) as Record<string, unknown>)
    : null;

  return {
    id: row.id,
    runId: row.run_id,
    workItemId: typeof request.workItemId === 'string' ? request.workItemId : null,
    approvalType:
      request.approvalType === 'data_input' ||
      request.approvalType === 'task_completion' ||
      request.approvalType === 'path_selection'
        ? request.approvalType
        : 'confirm',
    requestedActionType:
      typeof request.requestedActionType === 'string'
        ? request.requestedActionType
        : 'unknown',
    status: row.status,
    request,
    resolution,
    requestedAt: row.requested_at,
    resolvedAt: row.resolved_at,
  };
}

function mapScheduleSummary(row: ScheduleSummaryRow): ScheduleSummaryRecord {
  return {
    scheduleId: row.schedule_id,
    sourceKind: row.source_kind,
    sourceRef: row.source_ref,
    label: row.label,
    status: row.status,
    scheduleKind: row.schedule_kind,
    externalJobId: row.external_job_id,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    lastSuccessfulOutputAt: row.last_successful_output_at,
    lastRunOutcome: row.last_run_outcome,
    consecutiveFailureCount: row.consecutive_failure_count,
    missedRun: row.missed_run === 1,
    metadata: row.metadata_json ? (JSON.parse(row.metadata_json) as Record<string, unknown>) : null,
    updatedAt: row.updated_at,
  };
}

function mapMemoryEntry(row: MemoryEntryRow): MemoryEntryRecord {
  return {
    id: row.id,
    scope: row.scope,
    entryType: row.entry_type,
    title: row.title,
    summary: row.summary,
    canonicalPath: row.canonical_path,
    status: row.status,
    tags: row.tags_json ? (JSON.parse(row.tags_json) as string[]) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastUsedAt: row.last_used_at,
    reviewedAt: row.reviewed_at,
    archivedAt: row.archived_at,
    supersededById: row.superseded_by_id,
  }
}

function mapMemorySource(row: MemorySourceRow): MemorySourceRecord {
  return {
    id: row.id,
    memoryEntryId: row.memory_entry_id,
    sourceKind: row.source_kind,
    sourceRef: row.source_ref,
    sourcePath: row.source_path,
    excerptHash: row.excerpt_hash,
    notes: row.notes,
    payload: row.payload_json ? (JSON.parse(row.payload_json) as Record<string, unknown>) : null,
    observedAt: row.observed_at,
  }
}

function mapNotificationDelivery(row: NotificationDeliveryRow): NotificationDeliveryRecord {
  return {
    id: row.id,
    inboxItemId: row.inbox_item_id,
    channel: row.channel,
    category: row.category,
    status: row.status,
    dedupeKey: row.dedupe_key,
    payload: JSON.parse(row.payload_json) as Record<string, unknown>,
    response: row.response_json
      ? (JSON.parse(row.response_json) as Record<string, unknown>)
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapArtifactFamily(row: ArtifactFamilyRow): ArtifactFamilyRecord {
  return {
    id: row.id,
    familyKey: row.family_key,
    title: row.title,
    scope: row.scope,
    producerKind: row.producer_kind,
    producerId: row.producer_id,
    outputSlot: row.output_slot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapArtifactVersion(row: ArtifactVersionRow): ArtifactVersionRecord {
  return {
    id: row.id,
    artifactFamilyId: row.artifact_family_id,
    versionNumber: row.version_number,
    versionLabel: row.version_label,
    runId: row.run_id,
    workItemId: row.work_item_id,
    name: row.name,
    mimeType: row.mime_type,
    storagePath: row.storage_path,
    metadata: row.metadata_json ? (JSON.parse(row.metadata_json) as Record<string, unknown>) : null,
    createdAt: row.created_at,
  };
}

function mapSchedule(row: ScheduleRow): ScheduleRecord {
  return {
    id: row.id,
    sourceKind: row.source_kind,
    sourceRef: row.source_ref,
    label: row.label,
    status: row.status,
    scheduleKind: row.schedule_kind,
    scheduleExpr: row.schedule_expr,
    nextRunAt: row.next_run_at,
    lastRunAt: row.last_run_at,
    lastSuccessAt: row.last_success_at,
    consecutiveFailures: row.consecutive_failures,
    missedRunFlag: row.missed_run_flag === 1,
    externalJobId: row.external_job_id,
    metadata: row.metadata_json ? (JSON.parse(row.metadata_json) as Record<string, unknown>) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSavedLaunchPreset(row: SavedLaunchPresetRow): SavedLaunchPresetRecord {
  return {
    id: row.id,
    title: row.title,
    scope: row.scope,
    agentId: row.agent_id,
    modelOverride: row.model_override,
    priority: row.priority,
    outputType: row.output_type,
    timingPreference: row.timing_preference,
    promptTemplate: row.prompt_template,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLaunchDraft(row: LaunchDraftRow): LaunchDraftRecord {
  return {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    scope: row.scope,
    agentId: row.agent_id,
    model: row.model,
    priority: row.priority,
    outputType: row.output_type,
    sourceConversationId: row.source_conversation_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createConversation(
  input: Pick<ConversationRecord, 'scope'> & {
    agentId?: string | null;
    projectId?: string | null;
    kind?: ConversationKind;
    title?: string | null;
    status?: ConversationStatus;
    currentObjective?: string | null;
    summary?: string | null;
    latestProposalKind?: ProposalKind | null;
    recommendedNextAction?: string | null;
    linkedObjects?: ConversationLinkedObject[];
    parentConversationId?: string | null;
    branchFromMessageId?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = new Date().toISOString();
  const record: ConversationRecord = {
    id: generateId(),
    scope: input.scope,
    agentId: input.agentId ?? null,
    projectId: input.projectId ?? null,
    kind: input.kind ?? 'general',
    status: input.status ?? 'active',
    title: input.title ?? null,
    currentObjective: input.currentObjective ?? null,
    summary: input.summary ?? null,
    latestProposalKind: input.latestProposalKind ?? null,
    recommendedNextAction: input.recommendedNextAction ?? null,
    linkedObjects: input.linkedObjects ?? [],
    parentConversationId: input.parentConversationId ?? null,
    branchFromMessageId: input.branchFromMessageId ?? null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
  };

  db.prepare(
    `INSERT INTO conversations
      (
        id,
        scope,
        agent_id,
        project_id,
        kind,
        status,
        title,
        current_objective,
        summary,
        latest_proposal_kind,
        recommended_next_action,
        linked_objects_json,
        parent_conversation_id,
        branch_from_message_id,
        created_at,
        updated_at,
        archived_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.scope,
    record.agentId,
    record.projectId,
    record.kind,
    record.status,
    record.title,
    record.currentObjective,
    record.summary,
    record.latestProposalKind,
    record.recommendedNextAction,
    JSON.stringify(record.linkedObjects),
    record.parentConversationId,
    record.branchFromMessageId,
    record.createdAt,
    record.updatedAt,
    record.archivedAt,
  );

  return record;
}

export function updateConversation(
  conversationId: string,
  input: Partial<
    Pick<
      ConversationRecord,
      | 'projectId'
      | 'kind'
      | 'status'
      | 'title'
      | 'currentObjective'
      | 'summary'
      | 'latestProposalKind'
      | 'recommendedNextAction'
      | 'linkedObjects'
      | 'archivedAt'
    >
  >,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const existing = getConversationById(conversationId, rootDir);

  if (!existing) {
    return null;
  }

  const next: ConversationRecord = {
    ...existing,
    projectId: input.projectId === undefined ? existing.projectId : input.projectId,
    kind: input.kind ?? existing.kind,
    status: input.status ?? existing.status,
    title: input.title === undefined ? existing.title : input.title,
    currentObjective:
      input.currentObjective === undefined ? existing.currentObjective : input.currentObjective,
    summary: input.summary === undefined ? existing.summary : input.summary,
    latestProposalKind:
      input.latestProposalKind === undefined
        ? existing.latestProposalKind
        : input.latestProposalKind,
    recommendedNextAction:
      input.recommendedNextAction === undefined
        ? existing.recommendedNextAction
        : input.recommendedNextAction,
    linkedObjects: input.linkedObjects ?? existing.linkedObjects,
    updatedAt: new Date().toISOString(),
    archivedAt: input.archivedAt === undefined ? existing.archivedAt : input.archivedAt,
  };

  db.prepare(
    `UPDATE conversations
     SET project_id = ?,
         kind = ?,
         status = ?,
         title = ?,
         current_objective = ?,
         summary = ?,
         latest_proposal_kind = ?,
         recommended_next_action = ?,
         linked_objects_json = ?,
         updated_at = ?,
         archived_at = ?
     WHERE id = ?`,
  ).run(
    next.projectId,
    next.kind,
    next.status,
    next.title,
    next.currentObjective,
    next.summary,
    next.latestProposalKind,
    next.recommendedNextAction,
    JSON.stringify(next.linkedObjects),
    next.updatedAt,
    next.archivedAt,
    conversationId,
  );

  return next;
}

export function branchConversation(
  input: {
    parentConversationId: string;
    branchFromMessageId?: string | null;
    title?: string | null;
  },
  rootDir = process.cwd(),
) {
  const parent = getConversationById(input.parentConversationId, rootDir);

  if (!parent) {
    throw new Error(`Unknown conversation: ${input.parentConversationId}`);
  }

  const child = createConversation(
    {
      scope: parent.scope,
      agentId: parent.agentId,
      projectId: parent.projectId,
      kind: parent.kind,
      status: 'active',
      title: input.title ?? (parent.title ? `Alternative: ${parent.title}` : 'Alternative'),
      currentObjective: parent.currentObjective,
      summary: parent.summary,
      latestProposalKind: parent.latestProposalKind,
      recommendedNextAction: parent.recommendedNextAction,
      linkedObjects: parent.linkedObjects,
      parentConversationId: parent.id,
      branchFromMessageId: input.branchFromMessageId ?? null,
    },
    rootDir,
  );

  return child;
}

export function listConversations(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         scope,
         agent_id,
         project_id,
         kind,
         status,
         title,
         current_objective,
         summary,
         latest_proposal_kind,
         recommended_next_action,
         linked_objects_json,
         parent_conversation_id,
         branch_from_message_id,
         created_at,
         updated_at,
         archived_at
       FROM conversations
       ORDER BY
         CASE status
           WHEN 'waiting_on_user' THEN 0
           WHEN 'needs_follow_up' THEN 1
           WHEN 'active' THEN 2
           WHEN 'waiting_on_agent' THEN 3
           WHEN 'resolved' THEN 4
           WHEN 'superseded' THEN 5
           ELSE 6
         END,
         updated_at DESC`,
    )
    .all<ConversationRow>()
    .map(mapConversation);
}

export function getConversationById(conversationId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         scope,
         agent_id,
         project_id,
         kind,
         status,
         title,
         current_objective,
         summary,
         latest_proposal_kind,
         recommended_next_action,
         linked_objects_json,
         parent_conversation_id,
         branch_from_message_id,
         created_at,
         updated_at,
         archived_at
       FROM conversations
       WHERE id = ?`,
    )
    .get<ConversationRow>(conversationId);

  return row ? mapConversation(row) : null;
}

export function createMessage(
  input: Pick<MessageRecord, 'conversationId' | 'role'> & {
    contentText?: string | null;
    contentJson?: Record<string, unknown> | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = new Date().toISOString();
  const record: MessageRecord = {
    id: generateId(),
    conversationId: input.conversationId,
    role: input.role,
    contentText: input.contentText ?? null,
    contentJson: input.contentJson ?? null,
    createdAt: now,
  };

  db.prepare(
    `INSERT INTO messages
      (id, conversation_id, role, content_text, content_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.conversationId,
    record.role,
    record.contentText,
    record.contentJson ? JSON.stringify(record.contentJson) : null,
    record.createdAt,
  );

  db.prepare(
    `UPDATE conversations
     SET updated_at = ?,
         status = CASE
           WHEN ? = 'user' AND status NOT IN ('archived', 'superseded') THEN 'waiting_on_agent'
           WHEN ? = 'assistant' AND status NOT IN ('archived', 'superseded') THEN 'active'
           ELSE status
         END
     WHERE id = ?`,
  ).run(record.createdAt, record.role, record.role, record.conversationId);

  return record;
}

export function listMessages(conversationId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT id, conversation_id, role, content_text, content_json, created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
    )
    .all<MessageRow>(conversationId)
    .map(mapMessage);
}

export function upsertOpenLoop(
  input: Pick<
    OpenLoopRecord,
    | 'projectId'
    | 'conversationId'
    | 'sourceKind'
    | 'title'
    | 'detail'
    | 'owner'
    | 'waitingOn'
    | 'blocking'
    | 'priority'
    | 'status'
    | 'recommendedAction'
    | 'dedupeKey'
    | 'linkedObjects'
  > & { id?: string },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const existing = db
    .prepare(
      `SELECT
         id,
         project_id,
         conversation_id,
         source_kind,
         title,
         detail,
         owner,
         waiting_on,
         blocking,
         priority,
         status,
         recommended_action,
         dedupe_key,
         linked_objects_json,
         created_at,
         updated_at,
         resolved_at
       FROM open_loops
       WHERE dedupe_key = ?`,
    )
    .get<OpenLoopRow>(input.dedupeKey);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare(
      `UPDATE open_loops
       SET project_id = ?,
           conversation_id = ?,
           source_kind = ?,
           title = ?,
           detail = ?,
           owner = ?,
           waiting_on = ?,
           blocking = ?,
           priority = ?,
           status = ?,
           recommended_action = ?,
           linked_objects_json = ?,
           updated_at = ?,
           resolved_at = ?
       WHERE dedupe_key = ?`,
    ).run(
      input.projectId,
      input.conversationId,
      input.sourceKind,
      input.title,
      input.detail,
      input.owner,
      input.waitingOn,
      input.blocking ? 1 : 0,
      input.priority,
      input.status,
      input.recommendedAction,
      JSON.stringify(input.linkedObjects),
      now,
      input.status === 'resolved' ? now : null,
      input.dedupeKey,
    );

    return getOpenLoopById(existing.id, rootDir)!;
  }

  const record: OpenLoopRecord = {
    id: input.id ?? generateId(),
    projectId: input.projectId,
    conversationId: input.conversationId,
    sourceKind: input.sourceKind,
    title: input.title,
    detail: input.detail,
    owner: input.owner,
    waitingOn: input.waitingOn,
    blocking: input.blocking,
    priority: input.priority,
    status: input.status,
    recommendedAction: input.recommendedAction,
    dedupeKey: input.dedupeKey,
    linkedObjects: input.linkedObjects,
    createdAt: now,
    updatedAt: now,
    resolvedAt: input.status === 'resolved' ? now : null,
  };

  db.prepare(
    `INSERT INTO open_loops
      (
        id,
        project_id,
        conversation_id,
        source_kind,
        title,
        detail,
        owner,
        waiting_on,
        blocking,
        priority,
        status,
        recommended_action,
        dedupe_key,
        linked_objects_json,
        created_at,
        updated_at,
        resolved_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.projectId,
    record.conversationId,
    record.sourceKind,
    record.title,
    record.detail,
    record.owner,
    record.waitingOn,
    record.blocking ? 1 : 0,
    record.priority,
    record.status,
    record.recommendedAction,
    record.dedupeKey,
    JSON.stringify(record.linkedObjects),
    record.createdAt,
    record.updatedAt,
    record.resolvedAt,
  );

  return record;
}

export function getOpenLoopById(openLoopId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         project_id,
         conversation_id,
         source_kind,
         title,
         detail,
         owner,
         waiting_on,
         blocking,
         priority,
         status,
         recommended_action,
         dedupe_key,
         linked_objects_json,
         created_at,
         updated_at,
         resolved_at
       FROM open_loops
       WHERE id = ?`,
    )
    .get<OpenLoopRow>(openLoopId);

  return row ? mapOpenLoop(row) : null;
}

export function listOpenLoops(
  input: {
    projectId?: string | null;
    conversationId?: string | null;
    status?: OpenLoopStatus | 'all';
  } = {},
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const status = input.status ?? 'open';
  const rows = db
    .prepare(
      `SELECT
         id,
         project_id,
         conversation_id,
         source_kind,
         title,
         detail,
         owner,
         waiting_on,
         blocking,
         priority,
         status,
         recommended_action,
         dedupe_key,
         linked_objects_json,
         created_at,
         updated_at,
         resolved_at
       FROM open_loops
       WHERE (?1 IS NULL OR project_id = ?1)
         AND (?2 IS NULL OR conversation_id = ?2)
         AND (?3 = 'all' OR status = ?3)
       ORDER BY
         CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
         updated_at DESC`,
    )
    .all<OpenLoopRow>(input.projectId ?? null, input.conversationId ?? null, status);

  return rows.map(mapOpenLoop);
}

export function resolveOpenLoopByDedupeKey(dedupeKey: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const existing = db
    .prepare(
      `SELECT
         id,
         project_id,
         conversation_id,
         source_kind,
         title,
         detail,
         owner,
         waiting_on,
         blocking,
         priority,
         status,
         recommended_action,
         dedupe_key,
         linked_objects_json,
         created_at,
         updated_at,
         resolved_at
       FROM open_loops
       WHERE dedupe_key = ?`,
    )
    .get<OpenLoopRow>(dedupeKey);

  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE open_loops
     SET status = 'resolved',
         updated_at = ?,
         resolved_at = ?
     WHERE dedupe_key = ?`,
  ).run(now, now, dedupeKey);

  return getOpenLoopById(existing.id, rootDir);
}

export function createProject(
  input: Pick<ProjectRecord, 'title' | 'priority'> & {
    summary?: string | null;
    status?: ProjectStatus;
    linkedRepos?: string[];
    activeGoal?: string | null;
    currentFocus?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = new Date().toISOString();
  const record: ProjectRecord = {
    id: generateId(),
    title: input.title,
    summary: input.summary ?? null,
    status: input.status ?? 'active',
    priority: input.priority,
    linkedRepos: input.linkedRepos ?? [],
    activeGoal: input.activeGoal ?? null,
    currentFocus: input.currentFocus ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO projects
      (
        id,
        title,
        summary,
        status,
        priority,
        linked_repos_json,
        active_goal,
        current_focus,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.title,
    record.summary,
    record.status,
    record.priority,
    JSON.stringify(record.linkedRepos),
    record.activeGoal,
    record.currentFocus,
    record.createdAt,
    record.updatedAt,
  );

  return record;
}

export function listProjects(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         title,
         summary,
         status,
         priority,
         linked_repos_json,
         active_goal,
         current_focus,
         created_at,
         updated_at
       FROM projects
       ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, updated_at DESC`,
    )
    .all<ProjectRow>()
    .map(mapProject);
}

export function getProjectById(projectId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         title,
         summary,
         status,
         priority,
         linked_repos_json,
         active_goal,
         current_focus,
         created_at,
         updated_at
       FROM projects
       WHERE id = ?`,
    )
    .get<ProjectRow>(projectId);

  return row ? mapProject(row) : null;
}

export function updateProject(
  projectId: string,
  updates: Partial<
    Pick<ProjectRecord, 'title' | 'summary' | 'status' | 'priority' | 'linkedRepos' | 'activeGoal' | 'currentFocus'>
  >,
  rootDir = process.cwd(),
) {
  const existing = getProjectById(projectId, rootDir);

  if (!existing) {
    throw new Error(`Unknown project: ${projectId}`);
  }

  const db = openProductStateDb(rootDir);
  const updatedAt = new Date().toISOString();
  db.prepare(
    `UPDATE projects
     SET title = ?,
         summary = ?,
         status = ?,
         priority = ?,
         linked_repos_json = ?,
         active_goal = ?,
         current_focus = ?,
         updated_at = ?
     WHERE id = ?`,
  ).run(
    updates.title ?? existing.title,
    updates.summary ?? existing.summary,
    updates.status ?? existing.status,
    updates.priority ?? existing.priority,
    JSON.stringify(updates.linkedRepos ?? existing.linkedRepos),
    updates.activeGoal ?? existing.activeGoal,
    updates.currentFocus ?? existing.currentFocus,
    updatedAt,
    projectId,
  );

  return getProjectById(projectId, rootDir);
}

export function upsertProjectPlaybook(
  input: ProjectPlaybookRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `INSERT INTO project_playbooks
      (
        project_id,
        goals_json,
        preferred_agents_json,
        working_style,
        review_preferences,
        schedule_patterns,
        repo_context,
        recent_decisions_json,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        goals_json = excluded.goals_json,
        preferred_agents_json = excluded.preferred_agents_json,
        working_style = excluded.working_style,
        review_preferences = excluded.review_preferences,
        schedule_patterns = excluded.schedule_patterns,
        repo_context = excluded.repo_context,
        recent_decisions_json = excluded.recent_decisions_json,
        updated_at = excluded.updated_at`,
  ).run(
    input.projectId,
    JSON.stringify(input.goals),
    JSON.stringify(input.preferredAgents),
    input.workingStyle,
    input.reviewPreferences,
    input.schedulePatterns,
    input.repoContext,
    JSON.stringify(input.recentDecisions),
    input.updatedAt,
  );

  return getProjectPlaybookByProjectId(input.projectId, rootDir);
}

export function getProjectPlaybookByProjectId(projectId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         project_id,
         goals_json,
         preferred_agents_json,
         working_style,
         review_preferences,
         schedule_patterns,
         repo_context,
         recent_decisions_json,
         updated_at
       FROM project_playbooks
       WHERE project_id = ?`,
    )
    .get<ProjectPlaybookRow>(projectId);

  return row ? mapProjectPlaybook(row) : null;
}

export function listProjectPlaybooks(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         project_id,
         goals_json,
         preferred_agents_json,
         working_style,
         review_preferences,
         schedule_patterns,
         repo_context,
         recent_decisions_json,
         updated_at
       FROM project_playbooks
       ORDER BY updated_at DESC`,
    )
    .all<ProjectPlaybookRow>()
    .map(mapProjectPlaybook);
}

export function upsertProjectWorkspace(
  input: ProjectWorkspaceRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `INSERT INTO project_workspaces
      (
        id,
        project_id,
        mode,
        workspace_path,
        repo_name,
        repo_url,
        default_branch,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(project_id) DO UPDATE SET
        mode = excluded.mode,
        workspace_path = excluded.workspace_path,
        repo_name = excluded.repo_name,
        repo_url = excluded.repo_url,
        default_branch = excluded.default_branch,
        status = excluded.status,
        updated_at = excluded.updated_at`,
  ).run(
    input.id,
    input.projectId,
    input.mode,
    input.workspacePath,
    input.repoName,
    input.repoUrl,
    input.defaultBranch,
    input.status,
    input.createdAt,
    input.updatedAt,
  );

  return getProjectWorkspaceByProjectId(input.projectId, rootDir);
}

export function getProjectWorkspaceByProjectId(projectId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         project_id,
         mode,
         workspace_path,
         repo_name,
         repo_url,
         default_branch,
         status,
         created_at,
         updated_at
       FROM project_workspaces
       WHERE project_id = ?`,
    )
    .get<ProjectWorkspaceRow>(projectId);

  return row ? mapProjectWorkspace(row) : null;
}

export function listProjectWorkspaces(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         project_id,
         mode,
         workspace_path,
         repo_name,
         repo_url,
         default_branch,
         status,
         created_at,
         updated_at
       FROM project_workspaces
       ORDER BY updated_at DESC`,
    )
    .all<ProjectWorkspaceRow>()
    .map(mapProjectWorkspace);
}

export function createSpec(
  input: Omit<SpecRecord, 'id' | 'createdAt' | 'updatedAt'>,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = new Date().toISOString();
  const record: SpecRecord = {
    id: generateId(),
    projectId: input.projectId,
    title: input.title,
    intent: input.intent,
    outcome: input.outcome,
    inScope: input.inScope,
    outOfScope: input.outOfScope,
    currentContext: input.currentContext ?? null,
    dependencies: input.dependencies,
    executionNotes: input.executionNotes ?? null,
    acceptanceCriteria: input.acceptanceCriteria,
    reviewExpectations: input.reviewExpectations ?? null,
    status: input.status,
    executionMode: input.executionMode,
    workspaceRequired: input.workspaceRequired,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO specs
      (
        id,
        project_id,
        title,
        intent,
        outcome,
        in_scope_json,
        out_of_scope_json,
        current_context,
        dependencies_json,
        execution_notes,
        acceptance_criteria_json,
        review_expectations,
        status,
        execution_mode,
        workspace_required,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.projectId,
    record.title,
    record.intent,
    record.outcome,
    JSON.stringify(record.inScope),
    JSON.stringify(record.outOfScope),
    record.currentContext,
    JSON.stringify(record.dependencies),
    record.executionNotes,
    JSON.stringify(record.acceptanceCriteria),
    record.reviewExpectations,
    record.status,
    record.executionMode,
    record.workspaceRequired ? 1 : 0,
    record.createdAt,
    record.updatedAt,
  );

  return record;
}

export function getSpecById(specId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         project_id,
         title,
         intent,
         outcome,
         in_scope_json,
         out_of_scope_json,
         current_context,
         dependencies_json,
         execution_notes,
         acceptance_criteria_json,
         review_expectations,
         status,
         execution_mode,
         workspace_required,
         created_at,
         updated_at
       FROM specs
       WHERE id = ?`,
    )
    .get<SpecRow>(specId);

  return row ? mapSpec(row) : null;
}

export function listSpecs(
  input: { projectId?: string | null; status?: SpecStatus | null } = {},
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const filters: string[] = [];
  const values: string[] = [];

  if (input.projectId) {
    filters.push('project_id = ?');
    values.push(input.projectId);
  }

  if (input.status) {
    filters.push('status = ?');
    values.push(input.status);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  return db
    .prepare(
      `SELECT
         id,
         project_id,
         title,
         intent,
         outcome,
         in_scope_json,
         out_of_scope_json,
         current_context,
         dependencies_json,
         execution_notes,
         acceptance_criteria_json,
         review_expectations,
         status,
         execution_mode,
         workspace_required,
         created_at,
         updated_at
       FROM specs
       ${whereClause}
       ORDER BY CASE status WHEN 'draft' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, updated_at DESC`,
    )
    .all<SpecRow>(...values)
    .map(mapSpec);
}

export function updateSpec(
  specId: string,
  updates: Partial<
    Pick<
      SpecRecord,
      | 'title'
      | 'intent'
      | 'outcome'
      | 'inScope'
      | 'outOfScope'
      | 'currentContext'
      | 'dependencies'
      | 'executionNotes'
      | 'acceptanceCriteria'
      | 'reviewExpectations'
      | 'status'
      | 'executionMode'
      | 'workspaceRequired'
    >
  >,
  rootDir = process.cwd(),
) {
  const existing = getSpecById(specId, rootDir);

  if (!existing) {
    throw new Error(`Unknown spec: ${specId}`);
  }

  const db = openProductStateDb(rootDir);
  const updatedAt = new Date().toISOString();
  db.prepare(
    `UPDATE specs
     SET title = ?,
         intent = ?,
         outcome = ?,
         in_scope_json = ?,
         out_of_scope_json = ?,
         current_context = ?,
         dependencies_json = ?,
         execution_notes = ?,
         acceptance_criteria_json = ?,
         review_expectations = ?,
         status = ?,
         execution_mode = ?,
         workspace_required = ?,
         updated_at = ?
     WHERE id = ?`,
  ).run(
    updates.title ?? existing.title,
    updates.intent ?? existing.intent,
    updates.outcome ?? existing.outcome,
    JSON.stringify(updates.inScope ?? existing.inScope),
    JSON.stringify(updates.outOfScope ?? existing.outOfScope),
    updates.currentContext ?? existing.currentContext,
    JSON.stringify(updates.dependencies ?? existing.dependencies),
    updates.executionNotes ?? existing.executionNotes,
    JSON.stringify(updates.acceptanceCriteria ?? existing.acceptanceCriteria),
    updates.reviewExpectations ?? existing.reviewExpectations,
    updates.status ?? existing.status,
    updates.executionMode ?? existing.executionMode,
    (updates.workspaceRequired ?? existing.workspaceRequired) ? 1 : 0,
    updatedAt,
    specId,
  );

  return getSpecById(specId, rootDir);
}

export function createSpecCardLink(
  input: Omit<SpecCardLinkRecord, 'id' | 'createdAt'>,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const record: SpecCardLinkRecord = {
    id: generateId(),
    specId: input.specId,
    workItemId: input.workItemId,
    decompositionReason: input.decompositionReason,
    acceptanceCriteria: input.acceptanceCriteria,
    expectedOutput: input.expectedOutput ?? null,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO spec_card_links
      (id, spec_id, work_item_id, decomposition_reason, acceptance_criteria_json, expected_output, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.specId,
    record.workItemId,
    record.decompositionReason,
    JSON.stringify(record.acceptanceCriteria),
    record.expectedOutput,
    record.createdAt,
  );

  return record;
}

export function listSpecCardLinks(
  input: { specId?: string | null; workItemId?: string | null } = {},
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const filters: string[] = [];
  const values: string[] = [];

  if (input.specId) {
    filters.push('spec_id = ?');
    values.push(input.specId);
  }

  if (input.workItemId) {
    filters.push('work_item_id = ?');
    values.push(input.workItemId);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  return db
    .prepare(
      `SELECT id, spec_id, work_item_id, decomposition_reason, acceptance_criteria_json, expected_output, created_at
       FROM spec_card_links
       ${whereClause}
       ORDER BY created_at ASC`,
    )
    .all<SpecCardLinkRow>(...values)
    .map(mapSpecCardLink);
}

export function getSpecCardLinkByWorkItemId(workItemId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT id, spec_id, work_item_id, decomposition_reason, acceptance_criteria_json, expected_output, created_at
       FROM spec_card_links
       WHERE work_item_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .get<SpecCardLinkRow>(workItemId);

  return row ? mapSpecCardLink(row) : null;
}

export function createWorkItem(
  input: Pick<WorkItemRecord, 'title' | 'scope'> & {
    priority?: string | null;
    status?: WorkItemStatus;
    projectId?: string | null;
    delegatedAgentId?: string | null;
    linkedRepos?: string[];
    reviewState?: WorkItemReviewState;
    sourceConversationId?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = new Date().toISOString();
  const record: WorkItemRecord = {
    id: generateId(),
    title: input.title,
    scope: input.scope,
    status: input.status ?? 'queued',
    priority: input.priority ?? null,
    projectId: input.projectId ?? null,
    delegatedAgentId: input.delegatedAgentId ?? null,
    linkedRepos: input.linkedRepos ?? [],
    reviewState: input.reviewState ?? 'not_ready',
    sourceConversationId: input.sourceConversationId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO work_items
      (
        id,
        title,
        scope,
        status,
        priority,
        project_id,
        delegated_agent_id,
        linked_repos_json,
        review_state,
        source_conversation_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.title,
    record.scope,
    record.status,
    record.priority,
    record.projectId,
    record.delegatedAgentId,
    JSON.stringify(record.linkedRepos),
    record.reviewState,
    record.sourceConversationId,
    record.createdAt,
    record.updatedAt,
  );

  return record;
}

export function listWorkItems(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         title,
         scope,
         status,
         priority,
         project_id,
         delegated_agent_id,
         linked_repos_json,
         review_state,
         source_conversation_id,
         created_at,
         updated_at
       FROM work_items
       ORDER BY updated_at DESC`,
    )
    .all<WorkItemRow>()
    .map(mapWorkItem);
}

export function createRun(
  input: Pick<RunRecord, 'scope' | 'triggerKind'> & {
    workItemId?: string | null;
    conversationId?: string | null;
    agentId?: string | null;
    externalRunId?: string | null;
    externalSessionId?: string | null;
    externalSessionKey?: string | null;
    status?: RunStatus;
    model?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = new Date().toISOString();
  const record: RunRecord = {
    id: generateId(),
    workItemId: input.workItemId ?? null,
    conversationId: input.conversationId ?? null,
    agentId: input.agentId ?? null,
    externalRunId: input.externalRunId ?? null,
    externalSessionId: input.externalSessionId ?? null,
    externalSessionKey: input.externalSessionKey ?? null,
    scope: input.scope,
    status: input.status ?? 'queued',
    triggerKind: input.triggerKind,
    model: input.model ?? null,
    startedAt: input.startedAt ?? null,
    completedAt: input.completedAt ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO runs
      (
        id,
        work_item_id,
        conversation_id,
        agent_id,
        external_run_id,
        external_session_id,
        external_session_key,
        scope,
        status,
        trigger_kind,
        model,
        started_at,
        completed_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.workItemId,
    record.conversationId,
    record.agentId,
    record.externalRunId,
    record.externalSessionId,
    record.externalSessionKey,
    record.scope,
    record.status,
    record.triggerKind,
    record.model,
    record.startedAt,
    record.completedAt,
    record.createdAt,
    record.updatedAt,
  );

  return record;
}

export function updateRunLifecycle(
  input: {
    id: string;
    status?: RunStatus;
    startedAt?: string | null;
    completedAt?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const existing = db
    .prepare(
      `SELECT
         id,
         work_item_id,
         conversation_id,
         agent_id,
         external_run_id,
         external_session_id,
         external_session_key,
         scope,
         status,
         trigger_kind,
         model,
         started_at,
         completed_at,
         created_at,
         updated_at
       FROM runs
       WHERE id = ?`,
    )
    .get<RunRow>(input.id);

  if (!existing) {
    throw new Error(`Unknown run: ${input.id}`);
  }

  const updated: RunRow = {
    ...existing,
    status: input.status ?? existing.status,
    started_at: input.startedAt ?? existing.started_at,
    completed_at: input.completedAt ?? existing.completed_at,
    updated_at: new Date().toISOString(),
  };

  db.prepare(
    `UPDATE runs
     SET status = ?, started_at = ?, completed_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    updated.status,
    updated.started_at,
    updated.completed_at,
    updated.updated_at,
    updated.id,
  );

  return mapRun(updated);
}

export function listRuns(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         work_item_id,
         conversation_id,
         agent_id,
         external_run_id,
         external_session_id,
         external_session_key,
         scope,
         status,
         trigger_kind,
         model,
         started_at,
         completed_at,
         created_at,
         updated_at
       FROM runs
       ORDER BY updated_at DESC`,
    )
    .all<RunRow>()
    .map(mapRun);
}

export function getRunById(runId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         work_item_id,
         conversation_id,
         agent_id,
         external_run_id,
         external_session_id,
         external_session_key,
         scope,
         status,
         trigger_kind,
         model,
         started_at,
         completed_at,
         created_at,
         updated_at
       FROM runs
       WHERE id = ?`,
    )
    .get<RunRow>(runId);

  return row ? mapRun(row) : null;
}

export function getWorkItemById(workItemId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         title,
         scope,
         status,
         priority,
         project_id,
         delegated_agent_id,
         linked_repos_json,
         review_state,
         source_conversation_id,
         created_at,
         updated_at
       FROM work_items
       WHERE id = ?`,
    )
    .get<WorkItemRow>(workItemId);

  return row ? mapWorkItem(row) : null;
}

export function updateWorkItem(
  workItemId: string,
  updates: Partial<
    Pick<
      WorkItemRecord,
      | 'title'
      | 'scope'
      | 'status'
      | 'priority'
      | 'projectId'
      | 'delegatedAgentId'
      | 'linkedRepos'
      | 'reviewState'
      | 'sourceConversationId'
    >
  >,
  rootDir = process.cwd(),
) {
  const existing = getWorkItemById(workItemId, rootDir);

  if (!existing) {
    throw new Error(`Unknown work item: ${workItemId}`);
  }

  const db = openProductStateDb(rootDir);
  const updatedAt = new Date().toISOString();
  db.prepare(
    `UPDATE work_items
        SET title = ?,
            scope = ?,
            status = ?,
            priority = ?,
            project_id = ?,
            delegated_agent_id = ?,
            linked_repos_json = ?,
            review_state = ?,
            source_conversation_id = ?,
            updated_at = ?
      WHERE id = ?`,
  ).run(
    updates.title ?? existing.title,
    updates.scope ?? existing.scope,
    updates.status ?? existing.status,
    updates.priority ?? existing.priority,
    updates.projectId ?? existing.projectId,
    updates.delegatedAgentId ?? existing.delegatedAgentId,
    JSON.stringify(updates.linkedRepos ?? existing.linkedRepos),
    updates.reviewState ?? existing.reviewState,
    updates.sourceConversationId ?? existing.sourceConversationId,
    updatedAt,
    workItemId,
  );

  const row = db
    .prepare(
      `SELECT
         id,
         title,
         scope,
         status,
         priority,
         project_id,
         delegated_agent_id,
         linked_repos_json,
         review_state,
         source_conversation_id,
         created_at,
         updated_at
       FROM work_items
       WHERE id = ?`,
    )
    .get<WorkItemRow>(workItemId);

  if (!row) {
    throw new Error(`Failed to update work item: ${workItemId}`);
  }

  return mapWorkItem(row);
}

export function attachConversationToWorkItem(
  workItemId: string,
  conversationId: string,
  rootDir = process.cwd(),
) {
  const existing = getWorkItemById(workItemId, rootDir);

  if (!existing) {
    throw new Error(`Unknown work item: ${workItemId}`);
  }

  if (existing.sourceConversationId && existing.sourceConversationId !== conversationId) {
    throw new Error('Work item is already linked to a different conversation');
  }

  const db = openProductStateDb(rootDir);
  const updatedAt = new Date().toISOString();
  db.prepare(
    `UPDATE work_items
        SET source_conversation_id = ?,
            updated_at = ?
      WHERE id = ?`,
  ).run(conversationId, updatedAt, workItemId);

  const row = db
    .prepare(
      `SELECT
         id,
         title,
         scope,
         status,
         priority,
         project_id,
         delegated_agent_id,
         linked_repos_json,
         review_state,
         source_conversation_id,
         created_at,
         updated_at
       FROM work_items
       WHERE id = ?`,
    )
    .get<WorkItemRow>(workItemId);

  if (!row) {
    throw new Error(`Failed to update work item: ${workItemId}`);
  }

  return mapWorkItem(row);
}

export function findRunByExternalRef(
  input: {
    externalRunId?: string | null;
    externalSessionId?: string | null;
    externalSessionKey?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);

  if (typeof input.externalRunId === 'string' && input.externalRunId.trim()) {
    const row = db
      .prepare(
        `SELECT
           id,
           work_item_id,
           conversation_id,
           agent_id,
           external_run_id,
           external_session_id,
           external_session_key,
           scope,
           status,
           trigger_kind,
           model,
           started_at,
           completed_at,
           created_at,
           updated_at
         FROM runs
         WHERE external_run_id = ?`,
      )
      .get<RunRow>(input.externalRunId.trim());

    return row ? mapRun(row) : null;
  }

  if (typeof input.externalSessionKey === 'string' && input.externalSessionKey.trim()) {
    const row = db
      .prepare(
        `SELECT
           id,
           work_item_id,
           conversation_id,
           agent_id,
           external_run_id,
           external_session_id,
           external_session_key,
           scope,
           status,
           trigger_kind,
           model,
           started_at,
           completed_at,
           created_at,
           updated_at
         FROM runs
         WHERE external_session_key = ?`,
      )
      .get<RunRow>(input.externalSessionKey.trim());

    return row ? mapRun(row) : null;
  }

  if (typeof input.externalSessionId === 'string' && input.externalSessionId.trim()) {
    const row = db
      .prepare(
        `SELECT
           id,
           work_item_id,
           conversation_id,
           agent_id,
           external_run_id,
           external_session_id,
           external_session_key,
           scope,
           status,
           trigger_kind,
           model,
           started_at,
           completed_at,
           created_at,
           updated_at
         FROM runs
         WHERE external_session_id = ?`,
      )
      .get<RunRow>(input.externalSessionId.trim());

    return row ? mapRun(row) : null;
  }

  return null;
}

export function createRunEvent(
  input: Omit<RunEventRecord, 'id' | 'createdAt'> & {
    createdAt?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = input.createdAt ?? new Date().toISOString();
  const record: RunEventRecord = {
    id: generateId(),
    runId: input.runId,
    eventType: input.eventType,
    sequenceKey: input.sequenceKey,
    source: input.source,
    payload: input.payload,
    createdAt: now,
  };

  try {
    db.prepare(
      `INSERT INTO run_events
        (id, run_id, event_type, sequence_key, source, payload_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      record.id,
      record.runId,
      record.eventType,
      record.sequenceKey,
      record.source,
      JSON.stringify(record.payload),
      record.createdAt,
    );

    return { event: record, duplicate: false };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('UNIQUE constraint failed: run_events.source, run_events.sequence_key')
    ) {
      const existing = db
        .prepare(
          `SELECT id, run_id, event_type, sequence_key, source, payload_json, created_at
           FROM run_events
           WHERE source = ? AND sequence_key = ?`,
        )
        .get<RunEventRow>(record.source, record.sequenceKey);

      if (existing) {
        return { event: mapRunEvent(existing), duplicate: true };
      }
    }

    throw error;
  }
}

export function listRunEvents(runId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT id, run_id, event_type, sequence_key, source, payload_json, created_at
       FROM run_events
       WHERE run_id = ?
       ORDER BY created_at ASC`,
    )
    .all<RunEventRow>(runId)
    .map(mapRunEvent);
}

export function upsertRunSummary(
  input: RunSummaryRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `INSERT INTO run_summaries
      (
        run_id,
        work_item_id,
        conversation_id,
        scope,
        status,
        trigger_kind,
        agent_id,
        model,
        external_run_id,
        external_session_id,
        external_session_key,
        last_event_type,
        last_event_at,
        last_error_text,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(run_id) DO UPDATE SET
        work_item_id = excluded.work_item_id,
        conversation_id = excluded.conversation_id,
        scope = excluded.scope,
        status = excluded.status,
        trigger_kind = excluded.trigger_kind,
        agent_id = excluded.agent_id,
        model = excluded.model,
        external_run_id = excluded.external_run_id,
        external_session_id = excluded.external_session_id,
        external_session_key = excluded.external_session_key,
        last_event_type = excluded.last_event_type,
        last_event_at = excluded.last_event_at,
        last_error_text = excluded.last_error_text,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
  ).run(
    input.runId,
    input.workItemId,
    input.conversationId,
    input.scope,
    input.status,
    input.triggerKind,
    input.agentId,
    input.model,
    input.externalRunId,
    input.externalSessionId,
    input.externalSessionKey,
    input.lastEventType,
    input.lastEventAt,
    input.lastErrorText,
    input.createdAt,
    input.updatedAt,
  );

  return input;
}

export function listRunSummaries(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         run_id,
         work_item_id,
         conversation_id,
         scope,
         status,
         trigger_kind,
         agent_id,
         model,
         external_run_id,
         external_session_id,
         external_session_key,
         last_event_type,
         last_event_at,
         last_error_text,
         created_at,
         updated_at
       FROM run_summaries
       ORDER BY COALESCE(last_event_at, updated_at, created_at) DESC`,
    )
    .all<RunSummaryRow>()
    .map(mapRunSummary);
}

export function upsertWorkItemSummary(
  input: WorkItemSummaryRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `INSERT INTO work_item_summaries
      (
        work_item_id,
        title,
        scope,
        priority,
        project_id,
        delegated_agent_id,
        review_state,
        base_status,
        display_status,
        source_conversation_id,
        latest_run_id,
        latest_run_status,
        latest_event_type,
        latest_event_at,
        badges_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(work_item_id) DO UPDATE SET
        title = excluded.title,
        scope = excluded.scope,
        priority = excluded.priority,
        project_id = excluded.project_id,
        delegated_agent_id = excluded.delegated_agent_id,
        review_state = excluded.review_state,
        base_status = excluded.base_status,
        display_status = excluded.display_status,
        source_conversation_id = excluded.source_conversation_id,
        latest_run_id = excluded.latest_run_id,
        latest_run_status = excluded.latest_run_status,
        latest_event_type = excluded.latest_event_type,
        latest_event_at = excluded.latest_event_at,
        badges_json = excluded.badges_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
  ).run(
    input.workItemId,
    input.title,
    input.scope,
    input.priority,
    input.projectId,
    input.delegatedAgentId,
    input.reviewState,
    input.baseStatus,
    input.displayStatus,
    input.sourceConversationId,
    input.latestRunId,
    input.latestRunStatus,
    input.latestEventType,
    input.latestEventAt,
    JSON.stringify(input.badges),
    input.createdAt,
    input.updatedAt,
  );

  return input;
}

export function listWorkItemSummaries(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         work_item_id,
         title,
         scope,
         priority,
         project_id,
         delegated_agent_id,
         review_state,
         base_status,
         display_status,
         source_conversation_id,
         latest_run_id,
         latest_run_status,
         latest_event_type,
         latest_event_at,
         badges_json,
         created_at,
         updated_at
       FROM work_item_summaries
       ORDER BY COALESCE(latest_event_at, updated_at, created_at) DESC`,
    )
    .all<WorkItemSummaryRow>()
    .map(mapWorkItemSummary);
}

export function upsertProjectLearningSuggestion(
  input: ProjectLearningSuggestionRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `INSERT INTO project_learning_suggestions
      (
        id,
        project_id,
        suggestion_type,
        title,
        detail,
        payload_json,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        project_id = excluded.project_id,
        suggestion_type = excluded.suggestion_type,
        title = excluded.title,
        detail = excluded.detail,
        payload_json = excluded.payload_json,
        status = excluded.status,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
  ).run(
    input.id,
    input.projectId,
    input.suggestionType,
    input.title,
    input.detail,
    input.payload ? JSON.stringify(input.payload) : null,
    input.status,
    input.createdAt,
    input.updatedAt,
  );

  const row = db
    .prepare(
      `SELECT
         id,
         project_id,
         suggestion_type,
         title,
         detail,
         payload_json,
         status,
         created_at,
         updated_at
       FROM project_learning_suggestions
       WHERE id = ?`,
    )
    .get<ProjectLearningSuggestionRow>(input.id);

  if (!row) {
    throw new Error(`Failed to upsert project learning suggestion: ${input.id}`);
  }

  return mapProjectLearningSuggestion(row);
}

export function listProjectLearningSuggestions(
  input: { projectId?: string | null; status?: ProjectLearningSuggestionStatus | null } = {},
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const filters: string[] = [];
  const values: Array<string> = [];

  if (input.projectId) {
    filters.push('project_id = ?');
    values.push(input.projectId);
  }

  if (input.status) {
    filters.push('status = ?');
    values.push(input.status);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  return db
    .prepare(
      `SELECT
         id,
         project_id,
         suggestion_type,
         title,
         detail,
         payload_json,
         status,
         created_at,
         updated_at
       FROM project_learning_suggestions
       ${whereClause}
       ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, updated_at DESC`,
    )
    .all<ProjectLearningSuggestionRow>(...values)
    .map(mapProjectLearningSuggestion);
}

export function updateProjectLearningSuggestionStatus(
  suggestionId: string,
  status: ProjectLearningSuggestionStatus,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const updatedAt = new Date().toISOString();
  db.prepare(
    `UPDATE project_learning_suggestions
     SET status = ?, updated_at = ?
     WHERE id = ?`,
  ).run(status, updatedAt, suggestionId);

  const row = db
    .prepare(
      `SELECT
         id,
         project_id,
         suggestion_type,
         title,
         detail,
         payload_json,
         status,
         created_at,
         updated_at
       FROM project_learning_suggestions
       WHERE id = ?`,
    )
    .get<ProjectLearningSuggestionRow>(suggestionId);

  return row ? mapProjectLearningSuggestion(row) : null;
}

export function upsertReviewItem(
  input: ReviewItemRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `INSERT INTO review_items
      (
        id,
        project_id,
        work_item_id,
        artifact_ids_json,
        produced_by_agent_id,
        summary,
        review_reason,
        status,
        created_at,
        updated_at,
        reviewed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        project_id = excluded.project_id,
        work_item_id = excluded.work_item_id,
        artifact_ids_json = excluded.artifact_ids_json,
        produced_by_agent_id = excluded.produced_by_agent_id,
        summary = excluded.summary,
        review_reason = excluded.review_reason,
        status = excluded.status,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        reviewed_at = excluded.reviewed_at`,
  ).run(
    input.id,
    input.projectId,
    input.workItemId,
    JSON.stringify(input.artifactIds),
    input.producedByAgentId,
    input.summary,
    input.reviewReason,
    input.status,
    input.createdAt,
    input.updatedAt,
    input.reviewedAt,
  );

  const row = db
    .prepare(
      `SELECT
         id,
         project_id,
         work_item_id,
         artifact_ids_json,
         produced_by_agent_id,
         summary,
         review_reason,
         status,
         created_at,
         updated_at,
         reviewed_at
       FROM review_items
       WHERE id = ?`,
    )
    .get<ReviewItemRow>(input.id);

  if (!row) {
    throw new Error(`Failed to upsert review item: ${input.id}`);
  }

  return mapReviewItem(row);
}

export function listReviewItems(
  input: { projectId?: string | null; status?: ReviewItemStatus | null } = {},
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const filters: string[] = [];
  const values: Array<string> = [];

  if (input.projectId) {
    filters.push('project_id = ?');
    values.push(input.projectId);
  }

  if (input.status) {
    filters.push('status = ?');
    values.push(input.status);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  return db
    .prepare(
      `SELECT
         id,
         project_id,
         work_item_id,
         artifact_ids_json,
         produced_by_agent_id,
         summary,
         review_reason,
         status,
         created_at,
         updated_at,
         reviewed_at
       FROM review_items
       ${whereClause}
       ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, updated_at DESC`,
    )
    .all<ReviewItemRow>(...values)
    .map(mapReviewItem);
}

export function getReviewItemById(reviewItemId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         project_id,
         work_item_id,
         artifact_ids_json,
         produced_by_agent_id,
         summary,
         review_reason,
         status,
         created_at,
         updated_at,
         reviewed_at
       FROM review_items
       WHERE id = ?`,
    )
    .get<ReviewItemRow>(reviewItemId);

  return row ? mapReviewItem(row) : null;
}

export function resolveReviewItemById(
  reviewItemId: string,
  reviewedAt = new Date().toISOString(),
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `UPDATE review_items
     SET status = 'reviewed', updated_at = ?, reviewed_at = ?
     WHERE id = ?`,
  ).run(reviewedAt, reviewedAt, reviewItemId);

  const row = db
    .prepare(
      `SELECT
         id,
         project_id,
         work_item_id,
         artifact_ids_json,
         produced_by_agent_id,
         summary,
         review_reason,
         status,
         created_at,
         updated_at,
         reviewed_at
       FROM review_items
       WHERE id = ?`,
    )
    .get<ReviewItemRow>(reviewItemId);

  return row ? mapReviewItem(row) : null;
}

export function upsertInboxItem(
  input: InboxItemRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `INSERT INTO inbox_items
      (
        id,
        source_kind,
        source_ref,
        category,
        status,
        title,
        detail_json,
        dedupe_key,
        created_at,
        updated_at,
        resolved_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(dedupe_key) DO UPDATE SET
        source_kind = excluded.source_kind,
        source_ref = excluded.source_ref,
        category = excluded.category,
        status = excluded.status,
        title = excluded.title,
        detail_json = excluded.detail_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        resolved_at = excluded.resolved_at`,
  ).run(
    input.id,
    input.sourceKind,
    input.sourceRef,
    input.category,
    input.status,
    input.title,
    JSON.stringify(input.detail),
    input.dedupeKey,
    input.createdAt,
    input.updatedAt,
    input.resolvedAt,
  );

  const row = db
    .prepare(
      `SELECT
         id,
         source_kind,
         source_ref,
         category,
         status,
         title,
         detail_json,
         dedupe_key,
         created_at,
         updated_at,
         resolved_at
       FROM inbox_items
       WHERE dedupe_key = ?`,
    )
    .get<InboxItemRow>(input.dedupeKey);

  if (!row) {
    throw new Error(`Failed to upsert inbox item: ${input.dedupeKey}`);
  }

  return mapInboxItem(row);
}

export function resolveInboxItemsBySource(
  input: {
    sourceKind: string;
    sourceRef: string;
    categories?: string[];
    resolvedAt: string;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const filters =
    input.categories && input.categories.length > 0
      ? `AND category IN (${input.categories.map(() => '?').join(', ')})`
      : '';

  db.prepare(
    `UPDATE inbox_items
     SET status = 'resolved', updated_at = ?, resolved_at = ?
     WHERE source_kind = ? AND source_ref = ? ${filters}`,
  ).run(
    input.resolvedAt,
    input.resolvedAt,
    input.sourceKind,
    input.sourceRef,
    ...(input.categories ?? []),
  );
}

export function listInboxItems(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         source_kind,
         source_ref,
         category,
         status,
         title,
         detail_json,
         dedupe_key,
         created_at,
         updated_at,
         resolved_at
       FROM inbox_items
       ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, updated_at DESC`,
    )
    .all<InboxItemRow>()
    .map(mapInboxItem);
}

export function resolveInboxItemById(
  inboxItemId: string,
  resolvedAt = new Date().toISOString(),
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `UPDATE inbox_items
     SET status = 'resolved', updated_at = ?, resolved_at = ?
     WHERE id = ?`,
  ).run(resolvedAt, resolvedAt, inboxItemId);

  const row = db
    .prepare(
      `SELECT
         id,
         source_kind,
         source_ref,
         category,
         status,
         title,
         detail_json,
         dedupe_key,
         created_at,
         updated_at,
         resolved_at
       FROM inbox_items
       WHERE id = ?`,
    )
    .get<InboxItemRow>(inboxItemId);

  return row ? mapInboxItem(row) : null;
}

export function getApprovalById(approvalId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         run_id,
         status,
         request_json,
         resolution_json,
         requested_at,
         resolved_at
       FROM approvals
       WHERE id = ?`,
    )
    .get<ApprovalRow>(approvalId);

  return row ? mapApproval(row) : null;
}

export function upsertApproval(
  input: {
    id: string;
    runId?: string | null;
    status: ApprovalStatus;
    request: Record<string, unknown>;
    resolution?: Record<string, unknown> | null;
    requestedAt?: string | null;
    resolvedAt?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const existing = getApprovalById(input.id, rootDir);
  const requestedAt = input.requestedAt ?? existing?.requestedAt ?? new Date().toISOString();

  db.prepare(
    `INSERT INTO approvals
      (id, run_id, status, request_json, resolution_json, requested_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        run_id = excluded.run_id,
        status = excluded.status,
        request_json = excluded.request_json,
        resolution_json = excluded.resolution_json,
        requested_at = excluded.requested_at,
        resolved_at = excluded.resolved_at`,
  ).run(
    input.id,
    input.runId ?? existing?.runId ?? null,
    input.status,
    JSON.stringify(input.request),
    input.resolution ? JSON.stringify(input.resolution) : null,
    requestedAt,
    input.resolvedAt ?? null,
  );

  const row = db
    .prepare(
      `SELECT
         id,
         run_id,
         status,
         request_json,
         resolution_json,
         requested_at,
         resolved_at
       FROM approvals
       WHERE id = ?`,
    )
    .get<ApprovalRow>(input.id);

  if (!row) {
    throw new Error(`Failed to upsert approval: ${input.id}`);
  }

  return mapApproval(row);
}

export function listApprovals(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         run_id,
         status,
         request_json,
         resolution_json,
         requested_at,
         resolved_at
       FROM approvals
       ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, requested_at DESC`,
    )
    .all<ApprovalRow>()
    .map(mapApproval);
}

export function getNotificationDeliveryByDedupeKey(
  dedupeKey: string,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         inbox_item_id,
         channel,
         category,
         status,
         dedupe_key,
         payload_json,
         response_json,
         created_at,
         updated_at
       FROM notification_deliveries
       WHERE dedupe_key = ?`,
    )
    .get<NotificationDeliveryRow>(dedupeKey);

  return row ? mapNotificationDelivery(row) : null;
}

export function upsertNotificationDelivery(
  input: NotificationDeliveryRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `INSERT INTO notification_deliveries
      (
        id,
        inbox_item_id,
        channel,
        category,
        status,
        dedupe_key,
        payload_json,
        response_json,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(dedupe_key) DO UPDATE SET
        inbox_item_id = excluded.inbox_item_id,
        channel = excluded.channel,
        category = excluded.category,
        status = excluded.status,
        payload_json = excluded.payload_json,
        response_json = excluded.response_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
  ).run(
    input.id,
    input.inboxItemId,
    input.channel,
    input.category,
    input.status,
    input.dedupeKey,
    JSON.stringify(input.payload),
    input.response ? JSON.stringify(input.response) : null,
    input.createdAt,
    input.updatedAt,
  );

  const row = db
    .prepare(
      `SELECT
         id,
         inbox_item_id,
         channel,
         category,
         status,
         dedupe_key,
         payload_json,
         response_json,
         created_at,
         updated_at
       FROM notification_deliveries
       WHERE dedupe_key = ?`,
    )
    .get<NotificationDeliveryRow>(input.dedupeKey);

  if (!row) {
    throw new Error(`Failed to upsert notification delivery: ${input.dedupeKey}`);
  }

  return mapNotificationDelivery(row);
}

export function listNotificationDeliveries(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         inbox_item_id,
         channel,
         category,
         status,
         dedupe_key,
         payload_json,
         response_json,
         created_at,
         updated_at
       FROM notification_deliveries
       ORDER BY updated_at DESC`,
    )
    .all<NotificationDeliveryRow>()
    .map(mapNotificationDelivery);
}

export function getMemoryEntryByCanonicalPath(
  canonicalPath: string,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir)
  const row = db
    .prepare(
      `SELECT
         id,
         scope,
         entry_type,
         title,
         summary,
         canonical_path,
         status,
         tags_json,
         created_at,
         updated_at,
         last_used_at,
         reviewed_at,
         archived_at,
         superseded_by_id
       FROM memory_entries
       WHERE canonical_path = ?`,
    )
    .get<MemoryEntryRow>(canonicalPath)

  return row ? mapMemoryEntry(row) : null
}

export function upsertMemoryEntry(
  input: MemoryEntryRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir)
  db.prepare(
    `INSERT INTO memory_entries
      (
        id,
        scope,
        entry_type,
        title,
        summary,
        canonical_path,
        status,
        tags_json,
        created_at,
        updated_at,
        last_used_at,
        reviewed_at,
        archived_at,
        superseded_by_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        scope = excluded.scope,
        entry_type = excluded.entry_type,
        title = excluded.title,
        summary = excluded.summary,
        canonical_path = excluded.canonical_path,
        status = excluded.status,
        tags_json = excluded.tags_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_used_at = excluded.last_used_at,
        reviewed_at = excluded.reviewed_at,
        archived_at = excluded.archived_at,
        superseded_by_id = excluded.superseded_by_id`,
  ).run(
    input.id,
    input.scope,
    input.entryType,
    input.title,
    input.summary,
    input.canonicalPath,
    input.status,
    JSON.stringify(input.tags),
    input.createdAt,
    input.updatedAt,
    input.lastUsedAt,
    input.reviewedAt,
    input.archivedAt,
    input.supersededById,
  )

  const row = db
    .prepare(
      `SELECT
         id,
         scope,
         entry_type,
         title,
         summary,
         canonical_path,
         status,
       tags_json,
       created_at,
       updated_at,
       last_used_at,
       reviewed_at,
       archived_at,
       superseded_by_id
     FROM memory_entries
     WHERE id = ?`,
    )
    .get<MemoryEntryRow>(input.id)

  if (!row) {
    throw new Error(`Failed to upsert memory entry: ${input.id}`)
  }

  return mapMemoryEntry(row)
}

export function createMemorySource(
  input: Omit<MemorySourceRecord, 'id' | 'excerptHash'> & {
    id?: string
    excerptHash?: string | null
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir)
  const record: MemorySourceRecord = {
    id: input.id ?? generateId(),
    memoryEntryId: input.memoryEntryId,
    sourceKind: input.sourceKind,
    sourceRef: input.sourceRef,
    sourcePath: input.sourcePath,
    excerptHash: input.excerptHash ?? null,
    notes: input.notes,
    payload: input.payload,
    observedAt: input.observedAt,
  }

  db.prepare(
    `INSERT INTO memory_sources
      (
        id,
        memory_entry_id,
        source_kind,
        source_ref,
        source_path,
        excerpt_hash,
        notes,
        payload_json,
        observed_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.memoryEntryId,
    record.sourceKind,
    record.sourceRef,
    record.sourcePath,
    record.excerptHash,
    record.notes,
    record.payload ? JSON.stringify(record.payload) : null,
    record.observedAt,
  )

  return record
}

export function listMemoryEntries(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir)
  return db
    .prepare(
      `SELECT
         id,
         scope,
         entry_type,
         title,
         summary,
         canonical_path,
         status,
       tags_json,
       created_at,
       updated_at,
       last_used_at,
       reviewed_at,
       archived_at,
       superseded_by_id
     FROM memory_entries
     ORDER BY updated_at DESC`,
    )
    .all<MemoryEntryRow>()
    .map(mapMemoryEntry)
}

export function getMemoryEntryById(memoryEntryId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir)
  const row = db
    .prepare(
      `SELECT
         id,
         scope,
         entry_type,
         title,
         summary,
         canonical_path,
         status,
         tags_json,
         created_at,
         updated_at,
         last_used_at,
         reviewed_at,
         archived_at,
         superseded_by_id
       FROM memory_entries
       WHERE id = ?`,
    )
    .get<MemoryEntryRow>(memoryEntryId)

  return row ? mapMemoryEntry(row) : null
}

export function archiveMemoryEntry(memoryEntryId: string, rootDir = process.cwd()) {
  const existing = getMemoryEntryById(memoryEntryId, rootDir)

  if (!existing) {
    throw new Error(`Unknown memory entry: ${memoryEntryId}`)
  }

  return upsertMemoryEntry(
    {
      ...existing,
      status: 'archived',
      updatedAt: new Date().toISOString(),
      archivedAt: existing.archivedAt ?? new Date().toISOString(),
    },
    rootDir,
  )
}

export function supersedeMemoryEntry(
  memoryEntryId: string,
  supersededById: string,
  rootDir = process.cwd(),
) {
  const existing = getMemoryEntryById(memoryEntryId, rootDir)
  const replacement = getMemoryEntryById(supersededById, rootDir)

  if (!existing) {
    throw new Error(`Unknown memory entry: ${memoryEntryId}`)
  }

  if (!replacement) {
    throw new Error(`Unknown replacement memory entry: ${supersededById}`)
  }

  return upsertMemoryEntry(
    {
      ...existing,
      status: 'superseded',
      updatedAt: new Date().toISOString(),
      archivedAt: existing.archivedAt ?? new Date().toISOString(),
      supersededById,
    },
    rootDir,
  )
}

export function listMemorySources(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir)
  return db
    .prepare(
      `SELECT
         id,
         memory_entry_id,
         source_kind,
         source_ref,
         source_path,
         excerpt_hash,
         notes,
         payload_json,
         observed_at
       FROM memory_sources
       ORDER BY observed_at DESC`,
    )
    .all<MemorySourceRow>()
    .map(mapMemorySource)
}

export function upsertScheduleSummary(
  input: ScheduleSummaryRecord,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  db.prepare(
    `INSERT INTO schedule_summaries
      (
        schedule_id,
        source_kind,
        source_ref,
        label,
        status,
        schedule_kind,
        external_job_id,
        next_run_at,
        last_run_at,
        last_successful_output_at,
        last_run_outcome,
        consecutive_failure_count,
        missed_run,
        metadata_json,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(schedule_id) DO UPDATE SET
        source_kind = excluded.source_kind,
        source_ref = excluded.source_ref,
        label = excluded.label,
        status = excluded.status,
        schedule_kind = excluded.schedule_kind,
        external_job_id = excluded.external_job_id,
        next_run_at = excluded.next_run_at,
        last_run_at = excluded.last_run_at,
        last_successful_output_at = excluded.last_successful_output_at,
        last_run_outcome = excluded.last_run_outcome,
        consecutive_failure_count = excluded.consecutive_failure_count,
        missed_run = excluded.missed_run,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at`,
  ).run(
    input.scheduleId,
    input.sourceKind,
    input.sourceRef,
    input.label,
    input.status,
    input.scheduleKind,
    input.externalJobId,
    input.nextRunAt,
    input.lastRunAt,
    input.lastSuccessfulOutputAt,
    input.lastRunOutcome,
    input.consecutiveFailureCount,
    input.missedRun ? 1 : 0,
    input.metadata ? JSON.stringify(input.metadata) : null,
    input.updatedAt,
  );

  return input;
}

export function listScheduleSummaries(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         schedule_id,
         source_kind,
         source_ref,
         label,
         status,
         schedule_kind,
         external_job_id,
         next_run_at,
         last_run_at,
         last_successful_output_at,
         last_run_outcome,
         consecutive_failure_count,
         missed_run,
         metadata_json,
         updated_at
       FROM schedule_summaries
       ORDER BY COALESCE(next_run_at, updated_at) ASC`,
    )
    .all<ScheduleSummaryRow>()
    .map(mapScheduleSummary);
}

export function getScheduleSummaryById(scheduleId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         schedule_id,
         source_kind,
         source_ref,
         label,
         status,
         schedule_kind,
         external_job_id,
         next_run_at,
         last_run_at,
         last_successful_output_at,
         last_run_outcome,
         consecutive_failure_count,
         missed_run,
         metadata_json,
         updated_at
       FROM schedule_summaries
       WHERE schedule_id = ?`,
    )
    .get<ScheduleSummaryRow>(scheduleId);

  return row ? mapScheduleSummary(row) : null;
}

export function createSchedule(
  input: Pick<ScheduleRecord, 'sourceKind' | 'label' | 'status' | 'scheduleKind'> & {
    sourceRef?: string | null;
    scheduleExpr?: string | null;
    nextRunAt?: string | null;
    lastRunAt?: string | null;
    lastSuccessAt?: string | null;
    consecutiveFailures?: number;
    missedRunFlag?: boolean;
    metadata?: Record<string, unknown> | null;
    externalJobId?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = new Date().toISOString();
  const record: ScheduleRecord = {
    id: generateId(),
    sourceKind: input.sourceKind,
    sourceRef: input.sourceRef ?? null,
    label: input.label,
    status: input.status,
    scheduleKind: input.scheduleKind,
    scheduleExpr: input.scheduleExpr ?? null,
    nextRunAt: input.nextRunAt ?? null,
    lastRunAt: input.lastRunAt ?? null,
    lastSuccessAt: input.lastSuccessAt ?? null,
    consecutiveFailures: input.consecutiveFailures ?? 0,
    missedRunFlag: input.missedRunFlag ?? false,
    externalJobId: input.externalJobId ?? null,
    metadata: input.metadata ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO schedules
      (
        id,
        source_kind,
        source_ref,
        label,
        status,
        schedule_kind,
        schedule_expr,
        next_run_at,
        last_run_at,
        last_success_at,
        consecutive_failures,
        missed_run_flag,
        metadata_json,
        external_job_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.sourceKind,
    record.sourceRef,
    record.label,
    record.status,
    record.scheduleKind,
    record.scheduleExpr,
    record.nextRunAt,
    record.lastRunAt,
    record.lastSuccessAt,
    record.consecutiveFailures,
    record.missedRunFlag ? 1 : 0,
    record.metadata ? JSON.stringify(record.metadata) : null,
    record.externalJobId,
    record.createdAt,
    record.updatedAt,
  );

  return record;
}

export function getScheduleById(scheduleId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         source_kind,
         source_ref,
         label,
         status,
         schedule_kind,
         schedule_expr,
         next_run_at,
         last_run_at,
         last_success_at,
         consecutive_failures,
         missed_run_flag,
         metadata_json,
         external_job_id,
         created_at,
         updated_at
       FROM schedules
       WHERE id = ?`,
    )
    .get<ScheduleRow>(scheduleId);

  return row ? mapSchedule(row) : null;
}

export function updateSchedule(
  scheduleId: string,
  updates: Partial<
    Pick<
      ScheduleRecord,
      | 'status'
      | 'scheduleExpr'
      | 'nextRunAt'
      | 'lastRunAt'
      | 'lastSuccessAt'
      | 'consecutiveFailures'
      | 'missedRunFlag'
      | 'metadata'
      | 'externalJobId'
    >
  >,
  rootDir = process.cwd(),
) {
  const existing = getScheduleById(scheduleId, rootDir);

  if (!existing) {
    throw new Error(`Unknown schedule: ${scheduleId}`);
  }

  const db = openProductStateDb(rootDir);
  const updated: ScheduleRecord = {
    ...existing,
    status: updates.status ?? existing.status,
    scheduleExpr: updates.scheduleExpr ?? existing.scheduleExpr,
    nextRunAt: updates.nextRunAt ?? existing.nextRunAt,
    lastRunAt: updates.lastRunAt ?? existing.lastRunAt,
    lastSuccessAt: updates.lastSuccessAt ?? existing.lastSuccessAt,
    consecutiveFailures: updates.consecutiveFailures ?? existing.consecutiveFailures,
    missedRunFlag: updates.missedRunFlag ?? existing.missedRunFlag,
    metadata: updates.metadata ?? existing.metadata,
    externalJobId: updates.externalJobId ?? existing.externalJobId,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(
    `UPDATE schedules
        SET status = ?,
            schedule_expr = ?,
            next_run_at = ?,
            last_run_at = ?,
            last_success_at = ?,
            consecutive_failures = ?,
            missed_run_flag = ?,
            metadata_json = ?,
            external_job_id = ?,
            updated_at = ?
      WHERE id = ?`,
  ).run(
    updated.status,
    updated.scheduleExpr,
    updated.nextRunAt,
    updated.lastRunAt,
    updated.lastSuccessAt,
    updated.consecutiveFailures,
    updated.missedRunFlag ? 1 : 0,
    updated.metadata ? JSON.stringify(updated.metadata) : null,
    updated.externalJobId,
    updated.updatedAt,
    scheduleId,
  );

  return updated;
}

export function listSchedules(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         source_kind,
         source_ref,
         label,
         status,
         schedule_kind,
         schedule_expr,
         next_run_at,
         last_run_at,
         last_success_at,
         consecutive_failures,
         missed_run_flag,
         metadata_json,
         external_job_id,
         created_at,
         updated_at
       FROM schedules
       ORDER BY COALESCE(next_run_at, created_at) ASC`,
    )
    .all<ScheduleRow>()
    .map(mapSchedule);
}

export function createSavedLaunchPreset(
  input: Pick<SavedLaunchPresetRecord, 'title' | 'scope'> & {
    agentId?: string | null;
    modelOverride?: string | null;
    priority?: string | null;
    outputType?: string | null;
    timingPreference?: string | null;
    promptTemplate?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = new Date().toISOString();
  const record: SavedLaunchPresetRecord = {
    id: generateId(),
    title: input.title,
    scope: input.scope,
    agentId: input.agentId ?? null,
    modelOverride: input.modelOverride ?? null,
    priority: input.priority ?? null,
    outputType: input.outputType ?? null,
    timingPreference: input.timingPreference ?? null,
    promptTemplate: input.promptTemplate ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO saved_launch_presets
      (
        id,
        title,
        scope,
        agent_id,
        model_override,
        priority,
        output_type,
        timing_preference,
        prompt_template,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.title,
    record.scope,
    record.agentId,
    record.modelOverride,
    record.priority,
    record.outputType,
    record.timingPreference,
    record.promptTemplate,
    record.createdAt,
    record.updatedAt,
  );

  return record;
}

export function listSavedLaunchPresets(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         title,
         scope,
         agent_id,
         model_override,
         priority,
         output_type,
         timing_preference,
         prompt_template,
         created_at,
         updated_at
       FROM saved_launch_presets
       ORDER BY updated_at DESC`,
    )
    .all<SavedLaunchPresetRow>()
    .map(mapSavedLaunchPreset);
}

export function getSavedLaunchPresetById(presetId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         title,
         scope,
         agent_id,
         model_override,
         priority,
         output_type,
         timing_preference,
         prompt_template,
         created_at,
         updated_at
       FROM saved_launch_presets
       WHERE id = ?`,
    )
    .get<SavedLaunchPresetRow>(presetId);

  return row ? mapSavedLaunchPreset(row) : null;
}

export function createLaunchDraft(
  input: {
    title: string;
    prompt: string;
    scope: DomainScope;
    agentId?: string | null;
    model?: string | null;
    priority?: string | null;
    outputType?: string | null;
    sourceConversationId?: string | null;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const now = new Date().toISOString();
  const record: LaunchDraftRecord = {
    id: generateId(),
    title: input.title,
    prompt: input.prompt,
    scope: input.scope,
    agentId: input.agentId ?? null,
    model: input.model ?? null,
    priority: input.priority ?? null,
    outputType: input.outputType ?? null,
    sourceConversationId: input.sourceConversationId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO launch_drafts
      (
        id,
        title,
        prompt,
        scope,
        agent_id,
        model,
        priority,
        output_type,
        source_conversation_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.title,
    record.prompt,
    record.scope,
    record.agentId,
    record.model,
    record.priority,
    record.outputType,
    record.sourceConversationId,
    record.createdAt,
    record.updatedAt,
  );

  return record;
}

export function getLaunchDraftById(draftId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         title,
         prompt,
         scope,
         agent_id,
         model,
         priority,
         output_type,
         source_conversation_id,
         created_at,
         updated_at
       FROM launch_drafts
       WHERE id = ?`,
    )
    .get<LaunchDraftRow>(draftId);

  return row ? mapLaunchDraft(row) : null;
}

export function listLaunchDrafts(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         title,
         prompt,
         scope,
         agent_id,
         model,
         priority,
         output_type,
         source_conversation_id,
         created_at,
         updated_at
       FROM launch_drafts
       ORDER BY updated_at DESC`,
    )
    .all<LaunchDraftRow>()
    .map(mapLaunchDraft);
}

export function deleteLaunchDraft(draftId: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  db.prepare(`DELETE FROM launch_drafts WHERE id = ?`).run(draftId);
}

export function getArtifactFamilyByFamilyKey(familyKey: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         family_key,
         title,
         scope,
         producer_kind,
         producer_id,
         output_slot,
         created_at,
         updated_at
       FROM artifact_families
       WHERE family_key = ?`,
    )
    .get<ArtifactFamilyRow>(familyKey);

  return row ? mapArtifactFamily(row) : null;
}

export function getArtifactFamilyById(id: string, rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  const row = db
    .prepare(
      `SELECT
         id,
         family_key,
         title,
         scope,
         producer_kind,
         producer_id,
         output_slot,
         created_at,
         updated_at
       FROM artifact_families
       WHERE id = ?`,
    )
    .get<ArtifactFamilyRow>(id);

  return row ? mapArtifactFamily(row) : null;
}

export function upsertArtifactFamily(
  input: {
    id?: string;
    familyKey: string;
    title: string;
    scope: DomainScope;
    producerKind: 'schedule' | 'work_item' | 'manual';
    producerId: string;
    outputSlot: string;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const existing = getArtifactFamilyByFamilyKey(input.familyKey, rootDir);
  const now = new Date().toISOString();
  const record: ArtifactFamilyRecord = {
    id: existing?.id ?? input.id ?? generateId(),
    familyKey: input.familyKey,
    title: input.title,
    scope: input.scope,
    producerKind: input.producerKind,
    producerId: input.producerId,
    outputSlot: input.outputSlot,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  db.prepare(
    `INSERT INTO artifact_families
      (
        id,
        family_key,
        title,
        scope,
        producer_kind,
        producer_id,
        output_slot,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(family_key) DO UPDATE SET
        title = excluded.title,
        scope = excluded.scope,
        producer_kind = excluded.producer_kind,
        producer_id = excluded.producer_id,
        output_slot = excluded.output_slot,
        updated_at = excluded.updated_at`,
  ).run(
    record.id,
    record.familyKey,
    record.title,
    record.scope,
    record.producerKind,
    record.producerId,
    record.outputSlot,
    record.createdAt,
    record.updatedAt,
  );

  return getArtifactFamilyByFamilyKey(record.familyKey, rootDir) ?? record;
}

export function createArtifactVersion(
  input: {
    artifactFamilyId: string;
    runId?: string | null;
    workItemId?: string | null;
    name: string;
    mimeType?: string | null;
    storagePath?: string | null;
    metadata?: Record<string, unknown> | null;
    createdAt?: string;
  },
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  const family = db
    .prepare(`SELECT id FROM artifact_families WHERE id = ?`)
    .get<{ id: string }>(input.artifactFamilyId);

  if (!family) {
    throw new Error(`Unknown artifact family: ${input.artifactFamilyId}`);
  }

  const latest = db
    .prepare(
      `SELECT version_number
       FROM artifact_versions
       WHERE artifact_family_id = ?
       ORDER BY version_number DESC
       LIMIT 1`,
    )
    .get<{ version_number: number }>(input.artifactFamilyId);

  const versionNumber = (latest?.version_number ?? 0) + 1;
  const versionLabel = `v${String(versionNumber).padStart(4, '0')}`;
  const createdAt = input.createdAt ?? new Date().toISOString();
  const record: ArtifactVersionRecord = {
    id: generateId(),
    artifactFamilyId: input.artifactFamilyId,
    versionNumber,
    versionLabel,
    runId: input.runId ?? null,
    workItemId: input.workItemId ?? null,
    name: input.name,
    mimeType: input.mimeType ?? null,
    storagePath: input.storagePath ?? null,
    metadata: input.metadata ?? null,
    createdAt,
  };

  db.prepare(
    `INSERT INTO artifact_versions
      (
        id,
        artifact_family_id,
        version_number,
        version_label,
        run_id,
        work_item_id,
        name,
        mime_type,
        storage_path,
        metadata_json,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.id,
    record.artifactFamilyId,
    record.versionNumber,
    record.versionLabel,
    record.runId,
    record.workItemId,
    record.name,
    record.mimeType,
    record.storagePath,
    record.metadata ? JSON.stringify(record.metadata) : null,
    record.createdAt,
  );

  return record;
}

export function listArtifactFamilies(rootDir = process.cwd()) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         family_key,
         title,
         scope,
         producer_kind,
         producer_id,
         output_slot,
         created_at,
         updated_at
       FROM artifact_families
       ORDER BY updated_at DESC`,
    )
    .all<ArtifactFamilyRow>()
    .map(mapArtifactFamily);
}

export function listArtifactVersionsByFamilyId(
  artifactFamilyId: string,
  rootDir = process.cwd(),
) {
  const db = openProductStateDb(rootDir);
  return db
    .prepare(
      `SELECT
         id,
         artifact_family_id,
         version_number,
         version_label,
         run_id,
         work_item_id,
         name,
         mime_type,
         storage_path,
         metadata_json,
         created_at
       FROM artifact_versions
       WHERE artifact_family_id = ?
       ORDER BY version_number DESC, created_at DESC`,
    )
    .all<ArtifactVersionRow>(artifactFamilyId)
    .map(mapArtifactVersion);
}
