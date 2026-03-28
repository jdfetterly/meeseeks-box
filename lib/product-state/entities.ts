export type DomainScope = string;
export type ProjectStatus = 'active' | 'paused' | 'archived';
export type ProjectPriority = 'low' | 'normal' | 'high';
export type ProjectWorkspaceMode = 'existing' | 'bootstrapped';
export type ProjectWorkspaceStatus = 'unbound' | 'ready' | 'bootstrap_pending' | 'bootstrap_failed';
export type SpecStatus = 'draft' | 'approved' | 'superseded' | 'archived';
export type SpecExecutionMode = 'planning_only' | 'non_code' | 'workspace_required';
export type WorkItemReviewState = 'not_ready' | 'review_ready' | 'reviewed';
export type ReviewItemStatus = 'open' | 'reviewed';
export type ProjectLearningSuggestionStatus = 'open' | 'accepted' | 'rejected';

export type ConversationStatus =
  | 'active'
  | 'waiting_on_user'
  | 'waiting_on_agent'
  | 'needs_follow_up'
  | 'resolved'
  | 'superseded'
  | 'archived';
export type ConversationKind = 'planning' | 'delegation' | 'review' | 'schedule' | 'general';
export type ProposalKind =
  | 'project'
  | 'plan'
  | 'plan_breakdown'
  | 'card'
  | 'delegation'
  | 'schedule'
  | 'review_follow_up'
  | 'open_loop_resolution';
export type OpenLoopPriority = 'low' | 'medium' | 'high';
export type OpenLoopStatus = 'open' | 'snoozed' | 'resolved';
export type OpenLoopOwner = 'user' | 'agent' | 'system';
export type OpenLoopWaitingOn = 'user' | 'agent' | 'system' | 'external';
export type OpenLoopSourceKind =
  | 'conversation_proposal'
  | 'conversation_follow_up'
  | 'review_follow_up'
  | 'manual';

export interface ConversationLinkedObject {
  kind: 'project' | 'spec' | 'work_item' | 'review_item' | 'schedule' | 'open_loop';
  id: string;
  label: string | null;
}
export type WorkItemStatus =
  | 'queued'
  | 'running'
  | 'scheduled'
  | 'needs_input'
  | 'needs_approval'
  | 'blocked'
  | 'failed'
  | 'completed'
  | 'archived';
export type RunStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'blocked'
  | 'failed'
  | 'completed';
export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired';
export type NotificationDeliveryStatus = 'sent' | 'failed' | 'skipped';
export type RunEventType =
  | 'run_completed'
  | 'run_failed'
  | 'tool_failed'
  | 'schedule_triggered';

export interface ConversationRecord {
  id: string;
  scope: DomainScope;
  agentId: string | null;
  projectId: string | null;
  kind: ConversationKind;
  status: ConversationStatus;
  title: string | null;
  currentObjective: string | null;
  summary: string | null;
  latestProposalKind: ProposalKind | null;
  recommendedNextAction: string | null;
  linkedObjects: ConversationLinkedObject[];
  parentConversationId: string | null;
  branchFromMessageId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  contentText: string | null;
  contentJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface WorkItemRecord {
  id: string;
  title: string;
  scope: DomainScope;
  status: WorkItemStatus;
  priority: string | null;
  projectId: string | null;
  delegatedAgentId: string | null;
  linkedRepos: string[];
  reviewState: WorkItemReviewState;
  sourceConversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RunRecord {
  id: string;
  workItemId: string | null;
  conversationId: string | null;
  agentId: string | null;
  externalRunId: string | null;
  externalSessionId: string | null;
  externalSessionKey: string | null;
  scope: DomainScope;
  status: RunStatus;
  triggerKind: string;
  model: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpenLoopRecord {
  id: string;
  projectId: string | null;
  conversationId: string | null;
  sourceKind: OpenLoopSourceKind;
  title: string;
  detail: string | null;
  owner: OpenLoopOwner;
  waitingOn: OpenLoopWaitingOn;
  blocking: boolean;
  priority: OpenLoopPriority;
  status: OpenLoopStatus;
  recommendedAction: string | null;
  dedupeKey: string;
  linkedObjects: ConversationLinkedObject[];
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface RunEventRecord {
  id: string;
  runId: string;
  eventType: RunEventType;
  sequenceKey: string;
  source: string;
  payload: Record<string, unknown> | string;
  createdAt: string;
}

export interface RunSummaryRecord {
  runId: string;
  workItemId: string | null;
  conversationId: string | null;
  scope: DomainScope;
  status: RunStatus;
  triggerKind: string;
  agentId: string | null;
  model: string | null;
  externalRunId: string | null;
  externalSessionId: string | null;
  externalSessionKey: string | null;
  lastEventType: string | null;
  lastEventAt: string | null;
  lastErrorText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkItemSummaryRecord {
  workItemId: string;
  title: string;
  scope: DomainScope;
  priority: string | null;
  projectId: string | null;
  delegatedAgentId: string | null;
  reviewState: WorkItemReviewState;
  baseStatus: WorkItemStatus;
  displayStatus: WorkItemStatus;
  sourceConversationId: string | null;
  latestRunId: string | null;
  latestRunStatus: RunStatus | null;
  latestEventType: string | null;
  latestEventAt: string | null;
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRecord {
  id: string;
  title: string;
  summary: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  linkedRepos: string[];
  activeGoal: string | null;
  currentFocus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPlaybookRecord {
  projectId: string;
  goals: string[];
  preferredAgents: string[];
  workingStyle: string | null;
  reviewPreferences: string | null;
  schedulePatterns: string | null;
  repoContext: string | null;
  recentDecisions: string[];
  updatedAt: string;
}

export interface ProjectWorkspaceRecord {
  id: string;
  projectId: string;
  mode: ProjectWorkspaceMode;
  workspacePath: string;
  repoName: string | null;
  repoUrl: string | null;
  defaultBranch: string | null;
  status: ProjectWorkspaceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SpecRecord {
  id: string;
  projectId: string;
  title: string;
  intent: string;
  outcome: string;
  inScope: string[];
  outOfScope: string[];
  currentContext: string | null;
  dependencies: string[];
  executionNotes: string | null;
  acceptanceCriteria: string[];
  reviewExpectations: string | null;
  status: SpecStatus;
  executionMode: SpecExecutionMode;
  workspaceRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpecCardLinkRecord {
  id: string;
  specId: string;
  workItemId: string;
  decompositionReason: string;
  acceptanceCriteria: string[];
  expectedOutput: string | null;
  createdAt: string;
}

export interface ProjectContextSummaryRecord {
  projectId: string;
  title: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  activeGoal: string | null;
  currentFocus: string | null;
  workCount: number;
  reviewCount: number;
  openAttentionCount: number;
  linkedRepos: string[];
  workspaceStatus: ProjectWorkspaceStatus;
  workspaceMode: ProjectWorkspaceMode | null;
  workspacePath: string | null;
  suggestedPrompt: string | null;
}

export interface ProjectLearningSuggestionRecord {
  id: string;
  projectId: string;
  suggestionType: string;
  title: string;
  detail: string;
  payload: Record<string, unknown> | null;
  status: ProjectLearningSuggestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewItemRecord {
  id: string;
  projectId: string | null;
  workItemId: string;
  artifactIds: string[];
  producedByAgentId: string | null;
  summary: string;
  reviewReason: string;
  status: ReviewItemStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
}

export interface InboxItemRecord {
  id: string;
  sourceKind: string;
  sourceRef: string;
  category: string;
  status: 'open' | 'resolved';
  title: string;
  detail: Record<string, unknown>;
  dedupeKey: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface ApprovalRecord {
  id: string;
  runId: string | null;
  workItemId: string | null;
  approvalType: 'confirm' | 'data_input' | 'task_completion' | 'path_selection';
  requestedActionType: string;
  status: ApprovalStatus;
  request: Record<string, unknown>;
  resolution: Record<string, unknown> | null;
  requestedAt: string;
  resolvedAt: string | null;
}

export interface NotificationDeliveryRecord {
  id: string;
  inboxItemId: string | null;
  channel: string;
  category: string;
  status: NotificationDeliveryStatus;
  dedupeKey: string;
  payload: Record<string, unknown>;
  response: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactFamilyRecord {
  id: string;
  familyKey: string;
  title: string;
  scope: DomainScope;
  producerKind: 'schedule' | 'work_item' | 'manual';
  producerId: string;
  outputSlot: string;
  createdAt: string;
  updatedAt: string;
}

export interface ArtifactVersionRecord {
  id: string;
  artifactFamilyId: string;
  versionNumber: number;
  versionLabel: string;
  runId: string | null;
  workItemId: string | null;
  name: string;
  mimeType: string | null;
  storagePath: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface MemoryEntryRecord {
  id: string;
  scope: DomainScope;
  entryType: string;
  title: string;
  summary: string | null;
  canonicalPath: string | null;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  reviewedAt: string | null;
  archivedAt: string | null;
  supersededById: string | null;
}

export interface MemorySourceRecord {
  id: string;
  memoryEntryId: string;
  sourceKind: string;
  sourceRef: string | null;
  sourcePath: string | null;
  excerptHash: string | null;
  notes: string | null;
  payload: Record<string, unknown> | null;
  observedAt: string;
}

export interface ScheduleSummaryRecord {
  scheduleId: string;
  sourceKind: string;
  sourceRef: string | null;
  label: string;
  status: string;
  scheduleKind: string;
  externalJobId: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastSuccessfulOutputAt: string | null;
  lastRunOutcome: string | null;
  consecutiveFailureCount: number;
  missedRun: boolean;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
}

export interface ScheduleRecord {
  id: string;
  sourceKind: string;
  sourceRef: string | null;
  label: string;
  status: string;
  scheduleKind: string;
  scheduleExpr: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  consecutiveFailures: number;
  missedRunFlag: boolean;
  externalJobId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedLaunchPresetRecord {
  id: string;
  title: string;
  scope: DomainScope;
  agentId: string | null;
  modelOverride: string | null;
  priority: string | null;
  outputType: string | null;
  timingPreference: string | null;
  promptTemplate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchDraftRecord {
  id: string;
  title: string;
  prompt: string;
  scope: DomainScope;
  agentId: string | null;
  model: string | null;
  priority: string | null;
  outputType: string | null;
  sourceConversationId: string | null;
  createdAt: string;
  updatedAt: string;
}
