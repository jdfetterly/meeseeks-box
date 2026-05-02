'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  ActiveSheet,
  ActiveTab,
  MobileApproval,
  MobileBundle,
  MobileConversation,
  MobileJob,
  MobileProject,
} from './types';
import { MB } from './tokens';
import { TabBar } from './TabBar';
import { CommandInput } from './CommandInput';
import { CommandTab } from './CommandTab';
import { JobsTab } from './JobsTab';
import { ContextTab } from './ContextTab';
import { ChatSheet } from './sheets/ChatSheet';
import { FailedJobSheet } from './sheets/FailedJobSheet';
import { ProjectSwitcherSheet } from './sheets/ProjectSwitcherSheet';

const ACTIVE_PROJECT_STORAGE_KEY = 'meeseeks-mobile.project-selection';
const PROJECT_SELECTION_EVENT = 'meeseeks-mobile-project-selection';
const MINI_OPS_CONTEXT = 'mini-ops';

// ─── API response shapes ────────────────────────────────────────────────────

interface ApiApproval {
  id: string;
  runId?: string | null;
  workItemId?: string | null;
  requestedActionType: string;
  approvalType: string;
  status: string;
  request: Record<string, unknown>;
}

interface ApiRunSummary {
  run_id?: string;
  id?: string;
  status: string;
  agent_id?: string | null;
  agentId?: string | null;
  work_item_id?: string | null;
  workItemId?: string | null;
  conversation_id?: string | null;
  conversationId?: string | null;
  last_error_text?: string | null;
  lastErrorText?: string | null;
  last_event_type?: string | null;
  lastEventType?: string | null;
}

interface ApiConversation {
  id: string;
  title?: string | null;
  summary?: string | null;
  projectId?: string | null;
  project_id?: string | null;
  status: string;
  updated_at?: string;
  updatedAt?: string;
}

interface ApiProject {
  id: string;
  title: string;
  summary?: string | null;
  activeGoal?: string | null;
  currentFocus?: string | null;
  linkedRepos: string[];
}

interface ApiProjectSummary {
  projectId: string;
  title: string;
  activeGoal: string | null;
  currentFocus: string | null;
  workCount: number;
  reviewCount: number;
  openAttentionCount: number;
  workspaceStatus: string;
  workspaceMode: string | null;
  workspacePath: string | null;
  suggestedPrompt: string | null;
}

interface ApiProjectDetail {
  project: ApiProject;
  workspace: {
    id: string;
    projectId: string;
    mode: string;
    workspacePath: string;
    repoName: string | null;
    repoUrl: string | null;
    defaultBranch: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  git: {
    isGitRepo: boolean;
    currentBranch: string | null;
    lastCommitShort: string | null;
    lastCommitMessage: string | null;
    lastCommitAt: string | null;
    remoteUrl: string | null;
    modifiedCount: number;
    untrackedCount: number;
  } | null;
  playbook: {
    projectId: string;
    goals: string[];
    preferredAgents: string[];
    workingStyle: string | null;
    reviewPreferences: string | null;
    schedulePatterns: string | null;
    repoContext: string | null;
    recentDecisions: string[];
    updatedAt: string;
  } | null;
  workItems: Array<{
    workItemId: string;
    title: string;
    scope: string;
    priority: string | null;
    projectId: string | null;
    delegatedAgentId: string | null;
    reviewState: string;
    baseStatus: string;
    displayStatus: string;
    sourceConversationId: string | null;
    latestRunId: string | null;
    latestRunStatus: string | null;
    latestEventType: string | null;
    latestEventAt: string | null;
    badges: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  reviewItems: Array<{
    id: string;
    projectId: string | null;
    workItemId: string;
    summary: string;
    reviewReason: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    reviewedAt: string | null;
  }>;
  learningSuggestions: Array<{
    id: string;
    projectId: string;
    suggestionType: string;
    title: string;
    detail: string;
    payload: Record<string, unknown> | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  summary: ApiProjectSummary;
}

interface ApiWorkItem {
  id: string;
  title: string;
  scope: string;
  status: string;
  priority: string | null;
  projectId: string | null;
  delegatedAgentId: string | null;
  linkedRepos: string[];
  reviewState: string;
  sourceConversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiMemoryEntry {
  id: string;
  title: string;
  summary?: string | null;
  status: string;
}

interface ApiMemorySource {
  memoryEntryId: string;
  sourceRef: string | null;
}

interface ApiMemoryState {
  memoryEntries?: ApiMemoryEntry[];
  memorySources?: ApiMemorySource[];
}

interface ScopedApproval extends MobileApproval {
  runId: string | null;
  workItemId: string | null;
  projectId: string | null;
}

interface ScopedJob extends MobileJob {
  runId: string;
  workItemId: string | null;
  projectId: string | null;
}

interface ScopedConversation extends MobileConversation {
  projectId: string | null;
}

interface ProjectScopeState {
  approvals: ScopedApproval[];
  jobs: ScopedJob[];
  conversation: ScopedConversation | null;
  bundles: MobileBundle[];
}

interface PersistedProjectSelection {
  id: string;
  title: string;
}

type MobileActionStatus = { kind: 'success' | 'error' | 'loading'; message: string } | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapProjects(raw: ApiProject[]): MobileProject[] {
  return raw.map((project) => ({ id: project.id, title: project.title }));
}

function mapMemoryEntries(raw: ApiMemoryEntry[], sources: ApiMemorySource[], projectId: string): MobileBundle[] {
  const projectLinkedMemoryIds = new Set(
    sources
      .filter((source) => source.sourceRef === projectId)
      .map((source) => source.memoryEntryId),
  );

  return raw
    .filter((entry) => entry.status !== 'archived' && projectLinkedMemoryIds.has(entry.id))
    .map((entry, index) => ({
      id: `memory:${entry.id}`,
      name: entry.title,
      summary: entry.summary ?? null,
      pinned: entry.status === 'active' && index < 2,
    }));
}

function buildProjectBriefSummary(detail: ApiProjectDetail) {
  const summary = detail.summary;
  const projectSummary = [summary.suggestedPrompt, detail.project.currentFocus, detail.project.activeGoal]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?? detail.project.summary
    ?? 'Project context';

  return projectSummary;
}

function formatRemoteLabel(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  return value
    .trim()
    .replace(/^git@github\.com:/, 'github.com/')
    .replace(/^https:\/\/github\.com\//, 'github.com/')
    .replace(/\.git$/, '');
}

function formatWorkingTree(detail: ApiProjectDetail) {
  const git = detail.git;
  if (!git?.isGitRepo) {
    return null;
  }

  if (git.modifiedCount === 0 && git.untrackedCount === 0) {
    return 'Working tree: clean';
  }

  return `Working tree: ${git.modifiedCount} changed · ${git.untrackedCount} untracked`;
}

function buildRepoScopeSummary(detail: ApiProjectDetail) {
  const workspace = detail.workspace;

  if (!workspace) {
    return [
      'Git: no repo connected',
      'Mode: planning-only',
      'Local scope: no workspace folder bound yet',
      'Mobile view: shows scope boundaries only; ask for the full file list when needed.',
    ].join('\n');
  }

  const git = detail.git;
  const remoteLabel = formatRemoteLabel(workspace.repoUrl) ?? formatRemoteLabel(git?.remoteUrl) ?? workspace.repoName ?? 'not configured';
  const branch = git?.currentBranch ?? workspace.defaultBranch ?? 'unknown';
  const commit =
    git?.lastCommitShort
      ? `${git.lastCommitShort}${git.lastCommitMessage ? ` · ${git.lastCommitMessage}` : ''}`
      : 'unavailable';
  const includedRoots = [
    workspace.workspacePath,
    ...detail.project.linkedRepos.map((repo) => `linked repo: ${repo}`),
  ].slice(0, 4);
  const hiddenCount = Math.max(0, 1 + detail.project.linkedRepos.length - includedRoots.length);
  const scopeLines = hiddenCount > 0
    ? [...includedRoots, `+ ${hiddenCount} more scoped item${hiddenCount === 1 ? '' : 's'}`]
    : includedRoots;

  return [
    `Git: ${git?.isGitRepo ? 'managed' : 'not detected'} · ${workspace.status}`,
    `GitHub: ${remoteLabel}`,
    `Branch: ${branch}`,
    `Last commit: ${commit}`,
    formatWorkingTree(detail),
    `Local scope: ${scopeLines.join(' · ')}`,
    'Mobile view: shows top scope roots only, not full file/folder lists.',
  ].filter((line): line is string => Boolean(line)).join('\n');
}

function mapConversation(raw: ApiConversation): ScopedConversation {
  return {
    id: raw.id,
    title: raw.title ?? raw.summary ?? 'Untitled conversation',
    lastMessage: raw.summary ?? 'Continue the conversation',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? new Date().toISOString(),
    projectId: raw.projectId ?? raw.project_id ?? null,
  };
}

function pickProjectConversation(conversations: ApiConversation[], projectId: string): ScopedConversation | null {
  const candidates = conversations
    .filter((conversation) => (conversation.projectId ?? conversation.project_id ?? null) === projectId)
    .filter((conversation) => conversation.status !== 'archived' && conversation.status !== 'superseded')
    .sort((a, b) => {
      const aTime = a.updated_at ?? a.updatedAt ?? '';
      const bTime = b.updated_at ?? b.updatedAt ?? '';
      return bTime.localeCompare(aTime);
    });

  return candidates[0] ? mapConversation(candidates[0]) : null;
}

function mapRunSummaries(
  raw: ApiRunSummary[],
  workItemsById: Map<string, ApiWorkItem>,
  conversationsById: Map<string, ApiConversation>,
): ScopedJob[] {
  return raw
    .filter((run) => ['waiting_approval', 'running', 'failed'].includes(run.status))
    .map((run) => {
      const runId = run.run_id ?? run.id ?? '';
      const workItemId = run.work_item_id ?? run.workItemId ?? null;
      const conversationId = run.conversation_id ?? run.conversationId ?? null;
      const mappedWorkItem = workItemId ? workItemsById.get(workItemId) ?? null : null;
      const mappedConversation = conversationId ? conversationsById.get(conversationId) ?? null : null;
      const status: ScopedJob['status'] =
        run.status === 'waiting_approval' ? 'waiting'
        : run.status === 'running' ? 'running'
        : 'failed';

      return {
        runId,
        id: runId,
        name:
          run.agent_id ?? run.agentId ??
          mappedWorkItem?.title ??
          mappedConversation?.title ??
          workItemId ??
          `run ${runId.slice(0, 6)}`,
        status,
        statusText: run.last_event_type ?? run.lastEventType ?? run.status,
        recommendation: status === 'failed'
          ? 'Retry with updated context or check logs'
          : status === 'waiting'
            ? 'Review and approve to continue'
            : 'In progress',
        errorText: run.last_error_text ?? run.lastErrorText ?? null,
        conversationId,
        workItemId,
        projectId: mappedWorkItem?.projectId ?? mappedConversation?.projectId ?? null,
      };
    });
}

function mapApprovals(
  raw: ApiApproval[],
  workItemsById: Map<string, ApiWorkItem>,
  runSummariesByRunId: Map<string, ScopedJob>,
): ScopedApproval[] {
  return raw
    .filter((approval) => approval.status === 'pending')
    .map((approval) => {
      const workItemId = approval.workItemId ?? null;
      const approvalFromWorkItem = workItemId ? workItemsById.get(workItemId) ?? null : null;
      const approvalFromRun = approval.runId ? runSummariesByRunId.get(approval.runId) ?? null : null;

      return {
        id: approval.id,
        runId: approval.runId ?? null,
        workItemId,
        projectId: approvalFromWorkItem?.projectId ?? approvalFromRun?.projectId ?? null,
        title:
          typeof approval.request.description === 'string'
            ? approval.request.description
            : approval.requestedActionType.replace(/_/g, ' '),
        description: typeof approval.request.summary === 'string'
          ? approval.request.summary
          : typeof approval.request.context === 'string'
            ? approval.request.context
            : `Approval required for: ${approval.requestedActionType.replace(/_/g, ' ')}`,
        recommendation: typeof approval.request.recommendation === 'string'
          ? approval.request.recommendation
          : 'Review and approve to continue',
        tags: [approval.approvalType.replace(/_/g, ' ')],
      };
    });
}

function buildProjectBundles(
  detail: ApiProjectDetail | null,
  memoryEntries: ApiMemoryEntry[],
  memorySources: ApiMemorySource[],
): MobileBundle[] {
  const bundles: MobileBundle[] = [];

  if (detail) {
    bundles.push({
      id: `project:${detail.project.id}`,
      name: 'Project Brief',
      summary: buildProjectBriefSummary(detail),
      pinned: true,
    });

    bundles.push({
      id: `repo-scope:${detail.project.id}`,
      name: 'Repo & Scope',
      summary: buildRepoScopeSummary(detail),
      pinned: false,
    });

    if (detail.playbook?.goals?.length) {
      bundles.push({
        id: `playbook:${detail.project.id}`,
        name: 'Playbook',
        summary: detail.playbook.goals.slice(0, 2).join(' · '),
        pinned: false,
      });
    }
  }

  return detail ? [...bundles, ...mapMemoryEntries(memoryEntries, memorySources, detail.project.id)] : bundles;
}

function mergeBundles(previous: MobileBundle[], next: MobileBundle[]) {
  const pinnedById = new Map(previous.map((bundle) => [bundle.id, bundle.pinned]));

  return next.map((bundle) => ({
    ...bundle,
    pinned: pinnedById.get(bundle.id) ?? bundle.pinned,
  }));
}

function readPersistedProjectSelection(): PersistedProjectSelection | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedProjectSelection> | null;
    if (typeof parsed?.id !== 'string' || !parsed.id.trim()) {
      return null;
    }

    return {
      id: parsed.id.trim(),
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Project',
    };
  } catch {
    return null;
  }
}

function persistProjectSelection(selection: PersistedProjectSelection) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, JSON.stringify(selection));
    window.dispatchEvent(new CustomEvent(PROJECT_SELECTION_EVENT, { detail: selection }));
  } catch {
    // Ignore storage failures in private browsing / test environments.
  }
}

function slugifyPathPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'bundle';
}

function buildBundleContent(title: string, summary: string) {
  const lines = [`# ${title.trim()}`];
  if (summary.trim()) {
    lines.push('', summary.trim());
  }
  return lines.join('\n');
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function fetchProjectScope(projectId: string): Promise<ProjectScopeState> {
  const [detailPayload, approvalsPayload, runSummariesPayload, conversationsPayload, workItemsPayload, memoryPayload] = await Promise.all([
    fetchJson<ApiProjectDetail>(`/api/product-state/projects/${projectId}`),
    fetchJson<{ approvals?: ApiApproval[] }>('/api/product-state/approvals'),
    fetchJson<{ runSummaries?: ApiRunSummary[] }>('/api/product-state/run-summaries'),
    fetchJson<{ conversations?: ApiConversation[] }>('/api/product-state/conversations'),
    fetchJson<{ workItems?: ApiWorkItem[] }>('/api/product-state/work-items'),
    fetchJson<ApiMemoryState>('/api/product-state/memory/entries'),
  ]);

  if (!detailPayload) {
    return {
      approvals: [],
      jobs: [],
      conversation: null,
      bundles: [],
    };
  }

  const workItems = workItemsPayload?.workItems ?? [];
  const conversations = conversationsPayload?.conversations ?? [];
  const memoryEntries = memoryPayload?.memoryEntries ?? [];
  const memorySources = memoryPayload?.memorySources ?? [];
  const workItemsById = new Map(workItems.map((item) => [item.id, item]));
  const conversationsById = new Map(conversations.map((conversation) => [conversation.id, conversation]));
  const projectWorkItemIds = new Set(detailPayload.workItems.map((item) => item.workItemId));
  const projectConversationIds = new Set(
    conversations
      .filter((conversation) => (conversation.projectId ?? conversation.project_id ?? null) === projectId)
      .map((conversation) => conversation.id),
  );

  const jobs = mapRunSummaries(runSummariesPayload?.runSummaries ?? [], workItemsById, conversationsById).filter((job) => {
    if (job.projectId === projectId) return true;
    if (job.workItemId && projectWorkItemIds.has(job.workItemId)) return true;
    return Boolean(job.conversationId && projectConversationIds.has(job.conversationId));
  });

  const jobsByRunId = new Map(jobs.map((job) => [job.runId, job]));
  const approvals = mapApprovals(approvalsPayload?.approvals ?? [], workItemsById, jobsByRunId).filter((approval) => {
    if (approval.projectId === projectId) return true;
    if (approval.workItemId && projectWorkItemIds.has(approval.workItemId)) return true;
    if (approval.runId) {
      const linkedJob = jobsByRunId.get(approval.runId);
      if (linkedJob?.projectId === projectId) return true;
      if (linkedJob?.workItemId && projectWorkItemIds.has(linkedJob.workItemId)) return true;
    }
    return false;
  });

  return {
    approvals,
    jobs,
    conversation: pickProjectConversation(conversations, projectId),
    bundles: buildProjectBundles(detailPayload, memoryEntries, memorySources),
  };
}

// ─── Main component ──────────────────────────────────────────────────────────

export function MobileApp() {
  const [tab, setTab] = useState<ActiveTab>('command');
  const [sheet, setSheet] = useState<ActiveSheet>(null);
  const scopeCacheRef = useRef<Map<string, ProjectScopeState>>(new Map());

  const [approvals, setApprovals] = useState<ScopedApproval[]>([]);
  const [jobs, setJobs] = useState<ScopedJob[]>([]);
  const [conversation, setConversation] = useState<ScopedConversation | null>(null);
  const [projects, setProjects] = useState<MobileProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [bundles, setBundles] = useState<MobileBundle[]>([]);
  const [isScopeLoading, setIsScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<MobileActionStatus>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [creatingBundle, setCreatingBundle] = useState(false);
  const [createBundleError, setCreateBundleError] = useState<string | null>(null);

  function showActionStatus(status: MobileActionStatus) {
    setActionStatus(status);
    if (status?.kind === 'success') {
      window.setTimeout(() => setActionStatus((current) => (current === status ? null : current)), 2500);
    }
  }

  function applyScope(scope: ProjectScopeState) {
    setApprovals(scope.approvals);
    setJobs(scope.jobs);
    setConversation(scope.conversation);
    setBundles((previous) => mergeBundles(previous, scope.bundles));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      const payload = await fetchJson<{ projects?: ApiProject[] }>('/api/product-state/projects');
      if (cancelled || !payload) return;

      const mapped = mapProjects(payload.projects ?? []);
      setProjects(mapped);

      const savedProjectSelection = readPersistedProjectSelection();

      setActiveProjectId((current) => {
        if (current && mapped.some((project) => project.id === current)) {
          return current;
        }

        if (savedProjectSelection && mapped.some((project) => project.id === savedProjectSelection.id)) {
          return savedProjectSelection.id;
        }

        return mapped[0]?.id ?? null;
      });
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeProjectId) return;

    const selectedProject = projects.find((project) => project.id === activeProjectId) ?? null;
    try {
      persistProjectSelection({
        id: activeProjectId,
        title: selectedProject?.title ?? 'Project',
      });
    } catch {
      // Ignore storage failures in private browsing / test environments.
    }
  }, [activeProjectId]);

  useEffect(() => {
    let cancelled = false;

    async function loadScope(projectId: string | null) {
      if (!projectId) {
        setApprovals([]);
        setJobs([]);
        setConversation(null);
        setBundles([]);
        setIsScopeLoading(false);
        setScopeError(null);
        return;
      }

      const cachedScope = scopeCacheRef.current.get(projectId);
      if (cachedScope) {
        applyScope(cachedScope);
      }

      setIsScopeLoading(true);
      setScopeError(null);

      try {
        const scope = await fetchProjectScope(projectId);

        if (cancelled) return;

        scopeCacheRef.current.set(projectId, scope);
        applyScope(scope);
        setScopeError(null);
      } catch (error) {
        if (!cancelled) {
          setScopeError(error instanceof Error ? error.message : 'Failed to load project.');
        }
      } finally {
        if (!cancelled) {
          setIsScopeLoading(false);
        }
      }
    }

    void loadScope(activeProjectId);

    return () => {
      cancelled = true;
    };
  }, [activeProjectId]);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;
  const waitingJobCount = jobs.filter((job) => job.status === 'waiting').length;

  async function refreshActiveProjectScope(projectId = activeProjectId) {
    if (!projectId) return null;

    setIsScopeLoading(true);
    try {
      const scope = await fetchProjectScope(projectId);
      scopeCacheRef.current.set(projectId, scope);
      if (projectId === activeProjectId) {
        applyScope(scope);
        setScopeError(null);
      }
      return scope;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh project.';
      setScopeError(message);
      throw error;
    } finally {
      setIsScopeLoading(false);
    }
  }

  async function resolveApprovalById(approvalId: string, decision: 'allow-once' | 'deny') {
    const response = await fetch(`/api/product-state/approvals/${approvalId}/resolve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision }),
    });

    if (!response.ok) {
      throw new Error(`Failed to resolve approval ${approvalId}`);
    }
  }

  async function handleApprove(id: string) {
    try {
      showActionStatus({ kind: 'loading', message: 'Approving…' });
      await resolveApprovalById(id, 'allow-once');
      await refreshActiveProjectScope();
      showActionStatus({ kind: 'success', message: 'Approved.' });
    } catch (error) {
      showActionStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to approve.' });
      throw error;
    }
  }

  async function handleSkip(id: string) {
    try {
      showActionStatus({ kind: 'loading', message: 'Skipping…' });
      await resolveApprovalById(id, 'deny');
      await refreshActiveProjectScope();
      showActionStatus({ kind: 'success', message: 'Skipped.' });
    } catch (error) {
      showActionStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to skip.' });
      throw error;
    }
  }

  async function handleDismissWaiting(runId: string) {
    setJobs((previous) => previous.filter((job) => job.id !== runId));
    try {
      await refreshActiveProjectScope();
    } catch (error) {
      showActionStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to refresh jobs.' });
    }
  }

  function handleTogglePin(id: string) {
    setBundles((previous) =>
      previous.map((bundle) => (bundle.id === id ? { ...bundle, pinned: !bundle.pinned } : bundle)),
    );
  }

  async function handleSendCommand(text: string) {
    const prompt = text.trim();
    if (!prompt) return;
    if (!activeProjectId) {
      throw new Error('No project is selected yet');
    }

    try {
      showActionStatus({ kind: 'loading', message: 'Sending command…' });
      const activeProjectTitle = activeProject?.title ?? 'Project';
      const existingConversation = conversation?.projectId === activeProjectId ? conversation : null;
      let conversationId = existingConversation?.id ?? null;

      if (!conversationId) {
        const createResponse = await fetch('/api/product-state/conversations', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            agentContext: MINI_OPS_CONTEXT,
            projectId: activeProjectId,
            kind: 'general',
            title: prompt.slice(0, 72),
            summary: prompt,
            currentObjective: prompt,
            recommendedNextAction: 'Continue from the mobile command surface.',
            linkedObjects: [
              {
                kind: 'project',
                id: activeProjectId,
                label: activeProjectTitle,
              },
            ],
          }),
        });

        const createPayload = (await createResponse.json()) as {
          conversation?: ApiConversation & { projectId?: string | null; project_id?: string | null };
          error?: string;
          message?: string;
        };

        if (!createResponse.ok || !createPayload.conversation) {
          throw new Error(createPayload.error ?? createPayload.message ?? 'Failed to create conversation');
        }

        conversationId = createPayload.conversation.id;
      }

      const messageResponse = await fetch(`/api/product-state/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'user', contentText: prompt }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to save the command message');
      }

      const launchResponse = await fetch('/api/product-state/launch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt,
          title: prompt.slice(0, 72),
          agentContext: MINI_OPS_CONTEXT,
          agentId: MINI_OPS_CONTEXT,
          scope: MINI_OPS_CONTEXT,
          conversationId,
          timing: 'now',
        }),
      });

      const launchPayload = (await launchResponse.json()) as {
        launch?: { workItemId?: string | null };
        error?: string;
        message?: string;
      };

      if (!launchResponse.ok) {
        throw new Error(launchPayload.error ?? launchPayload.message ?? 'Failed to launch work');
      }

      await refreshActiveProjectScope();

      setSheet({
        kind: 'chat',
        conversationId: conversationId ?? '',
        title: prompt.slice(0, 72),
      });

      showActionStatus({ kind: 'success', message: 'Command sent.' });

      if (launchPayload.launch?.workItemId) {
        setTab('jobs');
      }
    } catch (error) {
      showActionStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to send command.' });
      throw error;
    }
  }

  async function handleCreateProject(title: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error('Project title is required');
    }

    setCreatingProject(true);
    setCreateProjectError(null);
    showActionStatus({ kind: 'loading', message: 'Creating project…' });

    try {
      const response = await fetch('/api/product-state/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          summary: `Mobile project: ${trimmedTitle}`,
          priority: 'normal',
          activeGoal: trimmedTitle,
          currentFocus: trimmedTitle,
          playbook: {
            goals: [trimmedTitle],
            preferredAgents: [],
            workingStyle: 'Keep the project small and mobile-friendly.',
            reviewPreferences: 'Keep mobile actions reviewable.',
          },
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        project?: ApiProject;
        error?: string;
        message?: string;
      };

      if (!response.ok || !payload.project?.id) {
        throw new Error(payload.error ?? payload.message ?? 'Failed to create project');
      }

      const nextProject = { id: payload.project.id, title: payload.project.title };
      setProjects((previous) => {
        if (previous.some((project) => project.id === nextProject.id)) {
          return previous.map((project) => (project.id === nextProject.id ? nextProject : project));
        }
        return [...previous, nextProject];
      });
      persistProjectSelection(nextProject);
      setActiveProjectId(nextProject.id);
      await refreshActiveProjectScope(nextProject.id);
      showActionStatus({ kind: 'success', message: `Created ${nextProject.title}.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      setCreateProjectError(message);
      showActionStatus({ kind: 'error', message });
      throw error;
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleCreateBundle(input: { title: string; summary: string }) {
    const title = input.title.trim();
    if (!title) {
      throw new Error('Bundle title is required');
    }

    setCreatingBundle(true);
    setCreateBundleError(null);
    showActionStatus({ kind: 'loading', message: 'Adding bundle…' });

    try {
      const response = await fetch('/api/product-state/memory/entries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scope: 'ops',
          relativePath: `mobile-bundles/${slugifyPathPart(title)}-${Date.now()}.md`,
          content: buildBundleContent(title, input.summary),
          contentType: 'markdown',
          title,
          summary: input.summary.trim() || null,
          sourceKind: 'mobile_context_bundle',
          sourceRef: activeProjectId,
          notes: activeProject ? `Created from mobile context for ${activeProject.title}` : 'Created from mobile context',
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? payload.message ?? 'Failed to add bundle');
      }

      await refreshActiveProjectScope();
      showActionStatus({ kind: 'success', message: `Added ${title}.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add bundle';
      setCreateBundleError(message);
      showActionStatus({ kind: 'error', message });
      throw error;
    } finally {
      setCreatingBundle(false);
    }
  }

  return (
    <div
      style={{
        width: '100vw',
        maxWidth: '100%',
        height: '100dvh',
        maxHeight: '100dvh',
        background: MB.bg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: MB.font,
        minWidth: 0,
        overflowX: 'hidden',
        overflowY: 'hidden',
        overscrollBehaviorX: 'none',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Tab content area */}
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {tab === 'command' && (
          <CommandTab
            approvals={approvals}
            conversation={conversation}
            activeProject={activeProject}
            onApprove={handleApprove}
            onSkip={handleSkip}
            onOpenSheet={setSheet}
          />
        )}
        {tab === 'jobs' && (
          <JobsTab
            jobs={jobs}
            onDismissWaiting={handleDismissWaiting}
            onOpenSheet={setSheet}
          />
        )}
        {tab === 'context' && (
          <ContextTab
            bundles={bundles}
            activeProject={activeProject}
            onTogglePin={handleTogglePin}
            onOpenSheet={setSheet}
            onCreateBundle={handleCreateBundle}
            creatingBundle={creatingBundle}
            createBundleError={createBundleError}
          />
        )}
      </div>

      {(isScopeLoading || scopeError || actionStatus) && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            left: '14px',
            right: '14px',
            bottom: '126px',
            zIndex: 70,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              maxWidth: '100%',
              borderRadius: '999px',
              border: `1px solid ${
                actionStatus?.kind === 'error' || scopeError
                  ? MB.redBorder
                  : actionStatus?.kind === 'success'
                    ? MB.greenBorder
                    : MB.borderStrong
              }`,
              background:
                actionStatus?.kind === 'error' || scopeError
                  ? MB.redBg
                  : actionStatus?.kind === 'success'
                    ? MB.greenBg
                    : MB.bgCard,
              color:
                actionStatus?.kind === 'error' || scopeError
                  ? MB.red
                  : actionStatus?.kind === 'success'
                    ? MB.green
                    : MB.textSecondary,
              boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
              padding: '8px 12px',
              fontSize: '11px',
              fontFamily: MB.font,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {actionStatus?.message ?? scopeError ?? 'Refreshing project…'}
          </div>
        </div>
      )}

      {/* Command input */}
      <CommandInput
        onSend={handleSendCommand}
        disabled={!activeProjectId}
        placeholder={activeProject ? `Ask about ${activeProject.title}…` : 'Send a command…'}
      />

      {/* Tab bar */}
      <TabBar active={tab} onChange={setTab} waitingJobCount={waitingJobCount} />

      {/* Sheets */}
      <ChatSheet
        open={sheet?.kind === 'chat'}
        onClose={() => setSheet(null)}
        conversationId={sheet?.kind === 'chat' ? sheet.conversationId : ''}
        title={sheet?.kind === 'chat' ? sheet.title : ''}
      />

      <FailedJobSheet
        open={sheet?.kind === 'failed-job'}
        onClose={() => setSheet(null)}
        runId={sheet?.kind === 'failed-job' ? sheet.runId : ''}
        name={sheet?.kind === 'failed-job' ? sheet.name : ''}
        errorText={sheet?.kind === 'failed-job' ? sheet.errorText : ''}
        recommendation={sheet?.kind === 'failed-job' ? sheet.recommendation : ''}
        onStatus={showActionStatus}
      />

      <ProjectSwitcherSheet
        open={sheet?.kind === 'project-switcher'}
        onClose={() => setSheet(null)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSwitch={setActiveProjectId}
        onCreateProject={handleCreateProject}
        creatingProject={creatingProject}
        createProjectError={createProjectError}
      />
    </div>
  );
}
