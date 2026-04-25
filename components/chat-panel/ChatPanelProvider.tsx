'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { MessageSquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ConversationIntent =
  | 'general_chat'
  | 'create_work'
  | 'create_schedule'
  | 'review_output'
  | 'project_planning'
  | 'spec_planning'
  | 'spec_decomposition'
  | 'edit_existing';

export interface ChatPanelContextValue {
  entityType?: 'home' | 'project' | 'work_item' | 'schedule' | 'review_item';
  entityId?: string | null;
  projectId?: string | null;
  page: string;
  suggestedPrompt?: string | null;
  draftPrompt?: string | null;
  starterProjectTitle?: string | null;
  starterRepoList?: string[] | null;
  starterAgentId?: string | null;
  starterWorkspacePath?: string | null;
  starterSpecId?: string | null;
  starterSpecTitle?: string | null;
  workspaceAction?: 'bind_existing' | 'bootstrap' | null;
  pinnedConversationId?: string | null;
}

interface ChatPanelState {
  isOpen: boolean;
  intent: ConversationIntent;
  context: ChatPanelContextValue;
}

interface OpenChatPanelInput {
  intent?: ConversationIntent;
  context?: Partial<ChatPanelContextValue>;
}

interface ChatPanelController {
  isOpen: boolean;
  intent: ConversationIntent;
  context: ChatPanelContextValue;
  openPanel: (input?: OpenChatPanelInput) => void;
  closePanel: () => void;
}

const DEFAULT_CONTEXT: ChatPanelContextValue = {
  entityType: 'home',
  entityId: null,
  projectId: null,
  page: 'briefing',
  suggestedPrompt: 'Help me decide what matters next and turn it into the next move.',
  draftPrompt: null,
  starterProjectTitle: null,
  starterRepoList: null,
  starterAgentId: null,
  starterWorkspacePath: null,
  starterSpecId: null,
  starterSpecTitle: null,
  workspaceAction: null,
  pinnedConversationId: null,
};

const ChatPanelContext = createContext<ChatPanelController>({
  isOpen: false,
  intent: 'general_chat',
  context: DEFAULT_CONTEXT,
  openPanel: () => {},
  closePanel: () => {},
});

export function useChatPanel() {
  return useContext(ChatPanelContext);
}

function formatIntentLabel(intent: ConversationIntent) {
  switch (intent) {
    case 'create_work':
      return 'Delegate Work';
    case 'create_schedule':
      return 'Standing Delegation';
    case 'review_output':
      return 'Review Output';
    case 'project_planning':
      return 'Project Planning';
    case 'spec_planning':
      return 'Plan Project Work';
    case 'spec_decomposition':
      return 'Turn Plan Into Cards';
    case 'edit_existing':
      return 'Edit Existing';
    case 'general_chat':
      return 'Assistant';
  }
}

function formatProposalKind(kind: DraftProposal['kind']) {
  switch (kind) {
    case 'spec':
      return 'plan';
    case 'spec_decomposition':
      return 'card breakdown';
    case 'workspace_bind':
      return 'workspace bind';
    case 'workspace_bootstrap':
      return 'workspace bootstrap';
    default:
      return kind.replaceAll('_', ' ');
  }
}

function deriveTitle(context: ChatPanelContextValue) {
  switch (context.entityType) {
    case 'project':
      return 'Project context';
    case 'work_item':
      return 'Work context';
    case 'schedule':
      return 'Schedule context';
    case 'review_item':
      return 'Review context';
    case 'home':
    default:
      return 'Briefing context';
  }
}

function parseList(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

interface DraftProposalCard {
  title: string;
  decompositionReason: string;
  acceptanceCriteria: string[];
  expectedOutput: string | null;
  delegatedAgentId: string | null;
  linkedRepos: string[];
}

interface DraftProposal {
  kind:
    | 'project'
    | 'work'
    | 'schedule'
    | 'workspace_bind'
    | 'workspace_bootstrap'
    | 'spec'
    | 'spec_decomposition';
  title: string;
  summary: string;
  projectId: string | null;
  specId: string | null;
  activeGoal: string | null;
  currentFocus: string | null;
  linkedRepos: string[];
  delegatedAgentId: string | null;
  workspacePath: string | null;
  repoName: string | null;
  defaultBranch: string | null;
  acceptanceCriteria: string[];
  reviewExpectations: string | null;
  cards: DraftProposalCard[];
  cadence: string | null;
  scheduleExpr: string | null;
  nextRunAt: string | null;
}

function inferCadence(prompt: string) {
  const lower = prompt.toLowerCase();

  if (lower.includes('daily')) {
    return {
      cadence: 'Daily at 9:00 AM',
      scheduleExpr: '0 9 * * *',
      nextRunAt: null,
      scheduleKind: 'cron' as const,
    };
  }

  if (lower.includes('weekly')) {
    return {
      cadence: 'Weekly on Monday at 9:00 AM',
      scheduleExpr: '0 9 * * 1',
      nextRunAt: null,
      scheduleKind: 'cron' as const,
    };
  }

  if (lower.includes('tomorrow')) {
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(9, 0, 0, 0);
    return {
      cadence: 'One time tomorrow at 9:00 AM',
      scheduleExpr: nextRun.toISOString(),
      nextRunAt: nextRun.toISOString(),
      scheduleKind: 'at' as const,
    };
  }

  return {
    cadence: 'Weekly on Monday at 9:00 AM',
    scheduleExpr: '0 9 * * 1',
    nextRunAt: null,
    scheduleKind: 'cron' as const,
  };
}

function buildProposal(input: {
  prompt: string;
  intent: ConversationIntent;
  context: ChatPanelContextValue;
  projectTitle: string;
  repoList: string;
  delegatedAgentId: string;
  workspacePath: string;
}) {
  const prompt = input.prompt.trim();
  const title = prompt.slice(0, 72) || 'New delegation';
  const linkedRepos = parseList(input.repoList);
  const normalizedWorkspacePath = input.workspacePath.trim() || input.context.starterWorkspacePath || null;

  if (input.intent === 'project_planning' && input.context.projectId && input.context.workspaceAction) {
    const repoName = linkedRepos[0] ?? null;

    return {
      kind: input.context.workspaceAction === 'bind_existing' ? 'workspace_bind' : 'workspace_bootstrap',
      title:
        input.context.workspaceAction === 'bind_existing'
          ? `Bind workspace for ${input.projectTitle.trim() || 'project'}`
          : `Bootstrap workspace for ${input.projectTitle.trim() || 'project'}`,
      summary:
        input.context.workspaceAction === 'bind_existing'
          ? `Bind ${normalizedWorkspacePath ?? 'the selected path'} as the execution workspace for this project.`
          : `Create and attach a new build workspace at ${normalizedWorkspacePath ?? 'the suggested path'} for this project.`,
      projectId: input.context.projectId,
      specId: null,
      activeGoal: null,
      currentFocus: prompt || null,
      linkedRepos,
      delegatedAgentId: input.delegatedAgentId.trim() || null,
      workspacePath: normalizedWorkspacePath,
      repoName,
      defaultBranch: 'main',
      acceptanceCriteria: [],
      reviewExpectations: null,
      cards: [],
      cadence: null,
      scheduleExpr: null,
      nextRunAt: null,
    } satisfies DraftProposal;
  }

  if (input.intent === 'project_planning' && !input.context.projectId) {
    return {
      kind: 'project',
      title: input.projectTitle.trim() || title,
      summary: `Create a planning-first project for ${input.projectTitle.trim() || title}, then decide later whether to bind or bootstrap a workspace.`,
      projectId: null,
      specId: null,
      activeGoal: prompt || null,
      currentFocus: prompt || null,
      linkedRepos,
      delegatedAgentId: input.delegatedAgentId.trim() || null,
      workspacePath: null,
      repoName: null,
      defaultBranch: null,
      acceptanceCriteria: [],
      reviewExpectations: null,
      cards: [],
      cadence: null,
      scheduleExpr: null,
      nextRunAt: null,
    } satisfies DraftProposal;
  }

  if (input.intent === 'spec_planning' && input.context.projectId) {
    const specTitle = input.projectTitle.trim() || title;
    return {
      kind: 'spec',
      title: specTitle,
      summary: `Save ${specTitle} as the current lightweight plan for this project, then use it to break the work into reviewable execution cards.`,
      projectId: input.context.projectId,
      specId: input.context.starterSpecId ?? null,
      activeGoal: prompt || null,
      currentFocus: prompt || null,
      linkedRepos,
      delegatedAgentId: input.delegatedAgentId.trim() || null,
      workspacePath: normalizedWorkspacePath,
      repoName: null,
      defaultBranch: null,
      acceptanceCriteria: [
        'The scoped outcome is implemented or otherwise delivered.',
        'The work is small enough to review cleanly.',
      ],
      reviewExpectations: 'Provide a review-ready summary of what changed and any outputs produced.',
      cards: [],
      cadence: null,
      scheduleExpr: null,
      nextRunAt: null,
    } satisfies DraftProposal;
  }

  if (input.intent === 'create_schedule') {
    const cadence = inferCadence(prompt);
    return {
      kind: 'schedule',
      title,
      summary: `Ask the agent to own "${title}" on a ${cadence.cadence.toLowerCase()} cadence and deliver output into the review queue.`,
      projectId: input.context.projectId ?? null,
      specId: null,
      activeGoal: null,
      currentFocus: prompt || null,
      linkedRepos,
      delegatedAgentId: input.delegatedAgentId.trim() || null,
      workspacePath: null,
      repoName: null,
      defaultBranch: null,
      acceptanceCriteria: [],
      reviewExpectations: null,
      cards: [],
      cadence: cadence.cadence,
      scheduleExpr: cadence.scheduleExpr,
      nextRunAt: cadence.nextRunAt,
    } satisfies DraftProposal;
  }

  return {
    kind: 'work',
    title,
    summary: `Break "${title}" into an executable feature card and delegate it with review-ready output.`,
    projectId: input.context.projectId ?? null,
    specId: null,
    activeGoal: null,
    currentFocus: prompt || null,
    linkedRepos,
    delegatedAgentId: input.delegatedAgentId.trim() || null,
    workspacePath: null,
    repoName: null,
    defaultBranch: null,
    acceptanceCriteria: [],
    reviewExpectations: null,
    cards: [],
    cadence: null,
    scheduleExpr: null,
    nextRunAt: null,
  } satisfies DraftProposal;
}

function toConversationKind(intent: ConversationIntent) {
  switch (intent) {
    case 'project_planning':
    case 'spec_planning':
    case 'spec_decomposition':
      return 'planning' as const;
    case 'create_schedule':
      return 'schedule' as const;
    case 'review_output':
      return 'review' as const;
    case 'create_work':
    case 'edit_existing':
      return 'delegation' as const;
    case 'general_chat':
    default:
      return 'general' as const;
  }
}

function buildConversationTitle(
  proposal: DraftProposal | null,
  prompt: string,
  context: ChatPanelContextValue,
) {
  if (proposal?.title) {
    return proposal.title;
  }

  if (context.starterSpecTitle) {
    return context.starterSpecTitle;
  }

  const trimmed = prompt.trim();
  return trimmed ? trimmed.slice(0, 72) : 'Assistant follow-up';
}

interface PersistedConversationState {
  id: string;
  title: string | null;
  status: string;
  summary: string | null;
  recommendedNextAction: string | null;
}

interface PanelMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  createdAt: string;
}

function toPanelMessage(message: {
  id: string;
  role: 'user' | 'assistant' | 'system';
  contentText: string | null;
  contentJson: Record<string, unknown> | null;
  createdAt: string;
}): PanelMessage {
  return {
    id: message.id,
    role: message.role,
    text: message.contentText ?? JSON.stringify(message.contentJson),
    createdAt: message.createdAt,
  };
}

async function loadConversationState(conversationId: string) {
  const response = await fetch(`/api/product-state/conversations/${conversationId}`);

  if (!response.ok) {
    throw new Error('Failed to load conversation');
  }

  const payload = (await response.json()) as {
    conversation?: PersistedConversationState;
    messages?: Array<{
      id: string;
      role: 'user' | 'assistant' | 'system';
      contentText: string | null;
      contentJson: Record<string, unknown> | null;
      createdAt: string;
    }>;
  };

  return {
    conversation: payload.conversation ?? null,
    messages: (payload.messages ?? []).map(toPanelMessage),
  };
}

async function createConversationRecord(input: {
  intent: ConversationIntent;
  context: ChatPanelContextValue;
  title: string;
  currentObjective: string | null;
}) {
  const response = await fetch('/api/product-state/conversations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      scope: input.context.starterAgentId ?? 'main',
      agentContext: input.context.starterAgentId ?? 'main',
      agentId: input.context.starterAgentId ?? 'main',
      projectId: input.context.projectId ?? null,
      kind: toConversationKind(input.intent),
      title: input.title,
      status: 'active',
      currentObjective: input.currentObjective,
      summary: null,
      recommendedNextAction: null,
      linkedObjects: input.context.projectId
        ? [{ kind: 'project', id: input.context.projectId, label: input.context.starterProjectTitle ?? null }]
        : [],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }

  const payload = (await response.json()) as {
    conversation?: PersistedConversationState & { projectId?: string | null };
  };

  if (!payload.conversation) {
    throw new Error('Conversation payload was missing');
  }

  return payload.conversation;
}

async function patchConversationState(
  conversationId: string,
  input: Record<string, unknown>,
) {
  const response = await fetch(`/api/product-state/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error('Failed to update conversation');
  }

  const payload = (await response.json()) as { conversation?: PersistedConversationState };
  return payload.conversation ?? null;
}

async function appendConversationMessage(
  conversationId: string,
  message: { role: 'user' | 'assistant' | 'system'; contentText: string },
) {
  const response = await fetch(`/api/product-state/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error('Failed to append message');
  }

  const payload = (await response.json()) as {
    message?: {
      id: string;
      role: 'user' | 'assistant' | 'system';
      contentText: string | null;
      contentJson: Record<string, unknown> | null;
      createdAt: string;
    };
  };

  if (!payload.message) {
    throw new Error('Message payload was missing');
  }

  return toPanelMessage(payload.message);
}

async function syncProposalLoop(input: {
  conversationId: string;
  projectId: string | null;
  proposal: DraftProposal;
  resolve?: boolean;
}) {
  const dedupeKey = `proposal:${input.conversationId}:${input.proposal.kind}`;

  if (input.resolve) {
    await fetch('/api/product-state/open-loops', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        dedupeKey,
        resolve: true,
      }),
    });
    return;
  }

  await fetch('/api/product-state/open-loops', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      projectId: input.projectId,
      conversationId: input.conversationId,
      sourceKind: 'conversation_proposal',
      title: `Confirm ${formatProposalKind(input.proposal.kind)}`,
      detail: input.proposal.summary,
      owner: 'user',
      waitingOn: 'user',
      blocking: true,
      priority: 'medium',
      status: 'open',
      recommendedAction: 'Confirm or edit the proposal in Assistant.',
      dedupeKey,
      linkedObjects: input.projectId
        ? [{ kind: 'project', id: input.projectId, label: null }]
        : [],
    }),
  });
}

async function confirmProposal(
  proposal: DraftProposal,
  prompt: string,
  conversationId: string | null,
) {
  if (
    (proposal.kind === 'workspace_bind' || proposal.kind === 'workspace_bootstrap') &&
    proposal.projectId
  ) {
    const response = await fetch(`/api/product-state/projects/${proposal.projectId}/workspace`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: proposal.kind === 'workspace_bind' ? 'bind_existing' : 'bootstrap',
        workspacePath: proposal.workspacePath,
        repoName: proposal.repoName,
        defaultBranch: proposal.defaultBranch,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update project workspace');
    }

    return {
      type: 'workspace' as const,
      projectId: proposal.projectId,
      linkedObjects: [
        { kind: 'project' as const, id: proposal.projectId, label: null },
      ],
      recommendedNextAction: 'Return to the project and continue planning or delegation.',
    };
  }

  if (proposal.kind === 'project') {
    const response = await fetch('/api/product-state/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: proposal.title,
        summary: proposal.summary,
        priority: 'high',
        linkedRepos: proposal.linkedRepos,
        activeGoal: proposal.activeGoal,
        currentFocus: proposal.currentFocus,
        playbook: {
          goals: proposal.activeGoal ? [proposal.activeGoal] : [],
          preferredAgents: proposal.delegatedAgentId ? [proposal.delegatedAgentId] : [],
          workingStyle: 'Drive setup through agent-led conversation and keep cards small.',
          reviewPreferences: 'Default to human review on completed outputs.',
          repoContext: proposal.linkedRepos.join(', '),
          recentDecisions: ['Created from the dispatch copilot.'],
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create project');
    }

    const payload = (await response.json()) as { project?: { id?: string; title?: string } };
    const projectId = typeof payload.project?.id === 'string' ? payload.project.id : null;

    return {
      type: 'project' as const,
      projectId,
      linkedObjects: projectId
        ? [{ kind: 'project' as const, id: projectId, label: payload.project?.title ?? proposal.title }]
        : [],
      recommendedNextAction: 'Draft the current plan for this project.',
    };
  }

  if (proposal.kind === 'spec' && proposal.projectId) {
    const specUrl = proposal.specId
      ? `/api/product-state/specs/${proposal.specId}`
      : '/api/product-state/specs';
    const response = await fetch(specUrl, {
      method: proposal.specId ? 'PUT' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectId: proposal.projectId,
        title: proposal.title,
        intent: proposal.activeGoal ?? prompt,
        outcome: proposal.currentFocus ?? prompt,
        inScope: proposal.currentFocus ? [proposal.currentFocus] : [],
        dependencies: proposal.linkedRepos,
        acceptanceCriteria: proposal.acceptanceCriteria,
        reviewExpectations: proposal.reviewExpectations,
        executionMode: proposal.workspacePath ? 'workspace_required' : 'planning_only',
        workspaceRequired: Boolean(proposal.workspacePath),
        status: 'approved',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to ${proposal.specId ? 'update' : 'create'} plan`);
    }

    const payload = (await response.json()) as { spec?: { id?: string; title?: string } };
    return {
      type: 'spec' as const,
      projectId: proposal.projectId,
      linkedObjects: [
        { kind: 'project' as const, id: proposal.projectId, label: null },
        ...(typeof payload.spec?.id === 'string'
          ? [{ kind: 'spec' as const, id: payload.spec.id, label: payload.spec.title ?? proposal.title }]
          : []),
      ],
      recommendedNextAction: 'Turn the current plan into cards when it is ready.',
    };
  }

  if (proposal.kind === 'spec_decomposition' && proposal.specId) {
    const response = await fetch(`/api/product-state/specs/${proposal.specId}/decompose`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: true,
        cards: proposal.cards,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create cards from spec');
    }

    const payload = (await response.json()) as { created?: Array<{ id?: string; title?: string }> };
    return {
      type: 'spec_decomposition' as const,
      projectId: proposal.projectId,
      linkedObjects: (payload.created ?? [])
        .filter((item): item is { id: string; title?: string } => typeof item.id === 'string')
        .map((item) => ({ kind: 'work_item' as const, id: item.id, label: item.title ?? null })),
      recommendedNextAction: 'Review the derived cards on the Board.',
    };
  }

  let workItemId = proposal.projectId;

  if (proposal.kind === 'work' || proposal.kind === 'schedule') {
    const workResponse = await fetch('/api/product-state/work-items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: proposal.title,
        scope: proposal.delegatedAgentId || 'main',
        agentContext: proposal.delegatedAgentId || 'main',
        delegatedAgentId: proposal.delegatedAgentId,
        projectId: proposal.projectId,
        linkedRepos: proposal.linkedRepos,
        reviewState: proposal.kind === 'work' ? 'not_ready' : 'not_ready',
        status: proposal.kind === 'schedule' ? 'scheduled' : 'queued',
        sourceConversationId: conversationId,
      }),
    });

    if (!workResponse.ok) {
      throw new Error('Failed to create work item');
    }

    const workPayload = (await workResponse.json()) as { workItem?: { id?: string } };
    workItemId = typeof workPayload.workItem?.id === 'string' ? workPayload.workItem.id : null;
  }

  if (proposal.kind === 'schedule') {
    const cadence = inferCadence(prompt);
    const response = await fetch('/api/product-state/schedules', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sourceKind: 'runtime-native',
        sourceRef: workItemId,
        label: proposal.title,
        status: 'pending_sync',
        scheduleKind: cadence.scheduleKind,
        scheduleExpr: proposal.scheduleExpr,
        nextRunAt: proposal.nextRunAt,
        metadata: {
          requestedBy: 'chat-panel',
          prompt,
          outputExpectation: 'Deliver output for human review.',
          cadenceLabel: proposal.cadence,
          projectId: proposal.projectId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create schedule');
    }

    const payload = (await response.json()) as { schedule?: { id?: string; label?: string } };
    return {
      type: 'schedule' as const,
      projectId: proposal.projectId,
      linkedObjects: [
        ...(workItemId ? [{ kind: 'work_item' as const, id: workItemId, label: proposal.title }] : []),
        ...(typeof payload.schedule?.id === 'string'
          ? [{ kind: 'schedule' as const, id: payload.schedule.id, label: payload.schedule.label ?? proposal.title }]
          : []),
      ],
      recommendedNextAction: 'Check the first output and decide if the schedule is useful.',
    };
  }

  return {
    type: 'work' as const,
    projectId: proposal.projectId,
    linkedObjects: workItemId
      ? [{ kind: 'work_item' as const, id: workItemId, label: proposal.title }]
      : [],
    recommendedNextAction: 'Open the created work item and delegate it when ready.',
  };
}

function ChatPanel() {
  const { isOpen, closePanel, intent, context } = useChatPanel();
  const [isMobile, setIsMobile] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [repoList, setRepoList] = useState('');
  const [delegatedAgentId, setDelegatedAgentId] = useState('main');
  const [workspacePath, setWorkspacePath] = useState('');
  const [messages, setMessages] = useState<PanelMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [proposal, setProposal] = useState<DraftProposal | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headerText = useMemo(() => formatIntentLabel(intent), [intent]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!isOpen) {
      return;
    }

    setPrompt(context.draftPrompt ?? context.suggestedPrompt ?? '');
    setProjectTitle(context.starterProjectTitle ?? '');
    if (intent === 'spec_planning' || intent === 'spec_decomposition') {
      setProjectTitle(context.starterSpecTitle ?? context.starterProjectTitle ?? '');
    }
    setRepoList((context.starterRepoList ?? []).join(', '));
    setDelegatedAgentId(context.starterAgentId ?? 'main');
    setWorkspacePath(context.starterWorkspacePath ?? '');
    setProposal(null);
    setStatusText(null);
    setShowAdvanced(false);

    if (context.pinnedConversationId) {
      setConversationId(context.pinnedConversationId);
      loadConversationState(context.pinnedConversationId)
        .then((payload) => {
          if (cancelled) {
            return;
          }
          setMessages(payload.messages);
          setConversationTitle(payload.conversation?.title ?? null);
          setConversationStatus(payload.conversation?.status ?? null);
          if (!prompt.trim() && payload.conversation?.recommendedNextAction) {
            setPrompt(payload.conversation.recommendedNextAction);
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }
          setMessages([]);
          setStatusText(error instanceof Error ? error.message : 'Failed to load conversation.');
        });
    } else {
      setConversationId(null);
      setConversationTitle(null);
      setConversationStatus(null);
      setMessages([]);
    }

    return () => {
      cancelled = true;
    };
  }, [
    context.draftPrompt,
    context.pinnedConversationId,
    context.starterAgentId,
    context.starterProjectTitle,
    context.starterRepoList,
    context.starterSpecTitle,
    context.starterWorkspacePath,
    context.suggestedPrompt,
    intent,
    isOpen,
  ]);

  const hidesStructuredFields = intent === 'spec_planning' || intent === 'spec_decomposition';

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      style={{
        width: isMobile ? '100%' : 380,
        flexShrink: 0,
        borderLeft: isMobile ? 'none' : '1px solid var(--separator)',
        background: isMobile
          ? 'linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg) 100%)'
          : 'color-mix(in srgb, var(--sidebar-bg) 84%, black 16%)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        position: 'fixed',
        inset: isMobile ? 0 : '0 0 0 auto',
        zIndex: 70,
        boxShadow: isMobile ? 'none' : 'var(--shadow-overlay)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: isMobile
            ? 'max(env(safe-area-inset-top, 0px), var(--space-4)) var(--space-4) var(--space-3)'
            : 'var(--space-4)',
          borderBottom: '1px solid var(--separator)',
          background: isMobile ? 'color-mix(in srgb, var(--bg-secondary) 95%, black 5%)' : 'transparent',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <div style={{ display: 'grid', gap: '4px' }}>
          <strong style={{ fontSize: isMobile ? '0.95rem' : '1rem' }}>{headerText}</strong>
          <span style={{ color: 'var(--text-tertiary)', fontSize: isMobile ? '0.8rem' : '0.85rem' }}>
            {deriveTitle(context)} • {context.page}
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={closePanel} aria-label="Close chat panel">
          <X size={16} />
        </Button>
      </div>

      <div
        style={{
          padding: isMobile ? 'var(--space-3) var(--space-4) calc(var(--space-4) + env(safe-area-inset-bottom, 0px))' : 'var(--space-4)',
          display: 'grid',
          gap: 'var(--space-3)',
        }}
      >
        {conversationTitle ? (
          <div style={conversationMetaStyle}>
            <strong>{conversationTitle}</strong>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              {conversationStatus ? conversationStatus.replaceAll('_', ' ') : 'saved conversation'}
            </span>
          </div>
        ) : null}
        <div
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--separator)',
            background: isMobile ? 'var(--bg-tertiary)' : 'var(--material-thin)',
            color: 'var(--text-secondary)',
            fontSize: isMobile ? '0.95rem' : '0.9rem',
          }}
        >
          {context.suggestedPrompt ?? 'Tell the agent what you want to get done and it will turn it into a proposal.'}
        </div>

        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Tell the agent what you want to get done."
          style={{
            width: '100%',
            minHeight: isMobile ? 140 : 120,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--separator)',
            background: isMobile ? 'var(--bg)' : 'rgba(0,0,0,0.16)',
            color: 'var(--text-primary)',
            padding: 'var(--space-3)',
            resize: 'vertical',
          }}
        />

        {hidesStructuredFields ? (
          <div
            style={{
              border: '1px solid var(--separator)',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255,255,255,0.02)',
              padding: 'var(--space-3)',
              display: 'grid',
              gap: '6px',
              color: 'var(--text-tertiary)',
              fontSize: '0.85rem',
            }}
          >
            <span>Project context is carried in automatically.</span>
            {context.starterSpecTitle ? <span>Current plan: {context.starterSpecTitle}</span> : null}
            {(context.starterRepoList ?? []).length > 0 ? (
              <span>Repos: {(context.starterRepoList ?? []).join(', ')}</span>
            ) : null}
            {context.starterWorkspacePath ? <span>Workspace: {context.starterWorkspacePath}</span> : null}
          </div>
        ) : (
          <details open={showAdvanced} style={advancedStyle}>
            <summary
              onClick={(event) => {
                event.preventDefault();
                setShowAdvanced((current) => !current);
              }}
              style={summaryStyle}
            >
              {showAdvanced ? 'Hide advanced fields' : 'Show advanced fields'}
            </summary>
            {showAdvanced ? (
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <input
                  value={projectTitle}
                  onChange={(event) => setProjectTitle(event.target.value)}
                  placeholder="Project title"
                  style={inputStyle}
                />
                <input
                  value={repoList}
                  onChange={(event) => setRepoList(event.target.value)}
                  placeholder="Linked repos, comma separated"
                  style={inputStyle}
                />
                <input
                  value={delegatedAgentId}
                  onChange={(event) => setDelegatedAgentId(event.target.value)}
                  placeholder="Agent id"
                  style={inputStyle}
                />
                <input
                  value={workspacePath}
                  onChange={(event) => setWorkspacePath(event.target.value)}
                  placeholder="Workspace path"
                  style={inputStyle}
                />
              </div>
            ) : null}
          </details>
        )}

        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            onClick={async () => {
              const trimmed = prompt.trim() || context.suggestedPrompt || '';
              if (intent === 'spec_decomposition' && context.starterSpecId) {
                try {
                  setIsSubmitting(true);
                  const response = await fetch(`/api/product-state/specs/${context.starterSpecId}/decompose`, {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({}),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to draft card breakdown');
                  }

                  const payload = (await response.json()) as {
                    spec?: { id?: string; title?: string };
                    readiness?: { reasons?: string[] };
                    cards?: DraftProposalCard[];
                  };
                  const nextProposal: DraftProposal = {
                    kind: 'spec_decomposition',
                    title: payload.spec?.title ?? projectTitle ?? 'Plan breakdown',
                    summary:
                      payload.readiness?.reasons && payload.readiness.reasons.length > 0
                        ? payload.readiness.reasons.join(' ')
                        : `Break this approved plan into ${payload.cards?.length ?? 0} reviewable execution card${payload.cards?.length === 1 ? '' : 's'}.`,
                    projectId: context.projectId ?? null,
                    specId: context.starterSpecId,
                    activeGoal: null,
                    currentFocus: trimmed || null,
                    linkedRepos: parseList(repoList),
                    delegatedAgentId: delegatedAgentId.trim() || null,
                    workspacePath: workspacePath.trim() || context.starterWorkspacePath || null,
                    repoName: null,
                    defaultBranch: null,
                    acceptanceCriteria: [],
                    reviewExpectations: null,
                    cards: payload.cards ?? [],
                    cadence: null,
                    scheduleExpr: null,
                    nextRunAt: null,
                  };
                  const ensuredConversation =
                    conversationId
                      ? { id: conversationId, title: conversationTitle, status: conversationStatus }
                      : await createConversationRecord({
                          intent,
                          context,
                          title: buildConversationTitle(nextProposal, trimmed, context),
                          currentObjective: trimmed || 'Turn this plan into cards.',
                        });
                  setConversationId(ensuredConversation.id);
                  setConversationTitle(ensuredConversation.title ?? nextProposal.title);

                  const userMessage = await appendConversationMessage(ensuredConversation.id, {
                    role: 'user',
                    contentText: trimmed || 'Turn this plan into cards.',
                  });
                  const assistantMessage = await appendConversationMessage(ensuredConversation.id, {
                    role: 'assistant',
                    contentText: nextProposal.summary,
                  });

                  setMessages((current) => [...current, userMessage, assistantMessage]);
                  const updatedConversation = await patchConversationState(ensuredConversation.id, {
                    projectId: context.projectId ?? null,
                    kind: toConversationKind(intent),
                    status: 'waiting_on_user',
                    title: buildConversationTitle(nextProposal, trimmed, context),
                    currentObjective: trimmed || 'Turn this plan into cards.',
                    summary: nextProposal.summary,
                    latestProposalKind: 'plan_breakdown',
                    recommendedNextAction: 'Confirm or edit the proposed card breakdown.',
                    linkedObjects: context.projectId
                      ? [{ kind: 'project', id: context.projectId, label: context.starterProjectTitle ?? null }]
                      : [],
                  });
                  setConversationStatus(updatedConversation?.status ?? 'waiting_on_user');
                  await syncProposalLoop({
                    conversationId: ensuredConversation.id,
                    projectId: context.projectId ?? null,
                    proposal: nextProposal,
                  });
                  setProposal(nextProposal);
                  setStatusText(null);
                } catch (error) {
                  setStatusText(error instanceof Error ? error.message : 'Failed to draft proposal.');
                } finally {
                  setIsSubmitting(false);
                }
                return;
              }

              const nextProposal = buildProposal({
                prompt: trimmed,
                intent,
                context,
                projectTitle,
                repoList,
                delegatedAgentId,
                workspacePath,
              });
              try {
                setIsSubmitting(true);
                const ensuredConversation =
                  conversationId
                    ? { id: conversationId, title: conversationTitle, status: conversationStatus }
                    : await createConversationRecord({
                        intent,
                        context,
                        title: buildConversationTitle(nextProposal, trimmed, context),
                        currentObjective: trimmed,
                      });
                setConversationId(ensuredConversation.id);
                setConversationTitle(ensuredConversation.title ?? nextProposal.title);

                const userMessage = await appendConversationMessage(ensuredConversation.id, {
                  role: 'user',
                  contentText: trimmed,
                });
                const assistantMessage = await appendConversationMessage(ensuredConversation.id, {
                  role: 'assistant',
                  contentText: nextProposal.summary,
                });

                setMessages((current) => [...current, userMessage, assistantMessage]);
                const updatedConversation = await patchConversationState(ensuredConversation.id, {
                  projectId: context.projectId ?? null,
                  kind: toConversationKind(intent),
                  status: 'waiting_on_user',
                  title: buildConversationTitle(nextProposal, trimmed, context),
                  currentObjective: trimmed,
                  summary: nextProposal.summary,
                  latestProposalKind:
                    nextProposal.kind === 'spec'
                      ? 'plan'
                      : nextProposal.kind === 'schedule'
                          ? 'schedule'
                          : nextProposal.kind === 'project'
                            ? 'project'
                            : 'card',
                  recommendedNextAction: 'Confirm or edit the drafted proposal.',
                });
                setConversationStatus(updatedConversation?.status ?? 'waiting_on_user');
                await syncProposalLoop({
                  conversationId: ensuredConversation.id,
                  projectId: context.projectId ?? null,
                  proposal: nextProposal,
                });
                setProposal(nextProposal);
                setStatusText(null);
              } catch (error) {
                setStatusText(error instanceof Error ? error.message : 'Failed to draft proposal.');
              } finally {
                setIsSubmitting(false);
              }
            }}
            className={isMobile ? 'w-full justify-center' : undefined}
          >
            {isSubmitting ? 'Drafting...' : 'Draft proposal'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setMessages([]);
              setProposal(null);
              setStatusText(null);
              setPrompt('');
              setWorkspacePath(context.starterWorkspacePath ?? '');
            }}
            className={isMobile ? 'w-full justify-center' : undefined}
          >
            Reset
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 var(--space-4) var(--space-4)' : '0 var(--space-4) var(--space-4)' }}>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {messages.map((message, index) => (
            <div
              key={message.id ?? `${message.role}:${index}`}
              style={{
                justifySelf: message.role === 'user' ? 'end' : 'stretch',
                maxWidth: '100%',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                background:
                  message.role === 'user'
                    ? isMobile
                      ? 'color-mix(in srgb, var(--accent) 18%, var(--bg-secondary))'
                      : 'var(--accent-fill)'
                    : isMobile
                      ? 'var(--bg-tertiary)'
                      : 'var(--material-thin)',
                color:
                  message.role === 'user'
                    ? isMobile ? 'var(--text-primary)' : 'var(--accent)'
                    : 'var(--text-secondary)',
                border: '1px solid var(--separator)',
                whiteSpace: 'pre-wrap',
              }}
            >
              <div style={{ display: 'grid', gap: '4px' }}>
                <span>{message.text}</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {proposal ? (
            <div
              style={{
                border: '1px solid var(--separator)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-4)',
                background: isMobile
                  ? 'var(--bg-secondary)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.12))',
                display: 'grid',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                <strong>{proposal.title}</strong>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                  {formatProposalKind(proposal.kind)}
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{proposal.summary}</p>
              {proposal.cards.length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {proposal.cards.map((card) => (
                    <div
                      key={`${proposal.kind}:${card.title}`}
                      style={{
                        border: '1px solid var(--separator)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-3)',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'grid',
                        gap: '6px',
                      }}
                    >
                      <strong>{card.title}</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {card.decompositionReason}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
              {proposal.projectId ? (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  Project linked
                </span>
              ) : null}
              {proposal.linkedRepos.length > 0 ? (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  Repos: {proposal.linkedRepos.join(', ')}
                </span>
              ) : null}
              {proposal.workspacePath ? (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  Workspace: {proposal.workspacePath}
                </span>
              ) : null}
              {proposal.cadence ? (
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  Cadence: {proposal.cadence}
                </span>
              ) : null}
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                <Button
                  disabled={isSubmitting}
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      setStatusText(null);
                      const result = await confirmProposal(proposal, prompt, conversationId);
                      if (conversationId) {
                        await patchConversationState(conversationId, {
                          projectId: result.projectId ?? context.projectId ?? null,
                          kind: toConversationKind(intent),
                          status:
                            result.type === 'spec_decomposition' || result.type === 'schedule'
                              ? 'needs_follow_up'
                              : 'active',
                          title: buildConversationTitle(proposal, prompt, context),
                          summary: proposal.summary,
                          latestProposalKind: null,
                          recommendedNextAction: result.recommendedNextAction,
                          linkedObjects: result.linkedObjects,
                        });
                        setConversationStatus(
                          result.type === 'spec_decomposition' || result.type === 'schedule'
                            ? 'needs_follow_up'
                            : 'active',
                        );
                        await appendConversationMessage(conversationId, {
                          role: 'assistant',
                          contentText: result.recommendedNextAction,
                        }).then((message) => {
                          setMessages((current) => [...current, message]);
                        });
                        await syncProposalLoop({
                          conversationId,
                          projectId: result.projectId ?? context.projectId ?? null,
                          proposal,
                          resolve: true,
                        });
                      }
                      setStatusText(
                        proposal.kind === 'workspace_bind' || proposal.kind === 'workspace_bootstrap'
                          ? 'Confirmed. Workspace attached to the project.'
                          : proposal.kind === 'spec'
                            ? 'Confirmed. Current plan saved for the project.'
                            : proposal.kind === 'spec_decomposition'
                              ? 'Confirmed. Cards created from the current plan.'
                          : `Confirmed. ${proposal.kind} created and ready for follow-through.`,
                      );
                    } catch (error) {
                      setStatusText(error instanceof Error ? error.message : 'Failed to confirm proposal.');
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className={isMobile ? 'w-full justify-center' : undefined}
                >
                  {isSubmitting ? 'Creating...' : 'Confirm'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setProposal(null)}
                  className={isMobile ? 'w-full justify-center' : undefined}
                >
                  Keep editing
                </Button>
              </div>
            </div>
          ) : null}

          {statusText ? (
            <div
              style={{
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--separator)',
                background: 'var(--material-thin)',
                color: 'var(--text-secondary)',
              }}
            >
              {statusText}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

const conversationMetaStyle: CSSProperties = {
  border: '1px solid var(--separator)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-3)',
  background: 'var(--bg-secondary)',
  display: 'grid',
  gap: '4px',
};

const advancedStyle: CSSProperties = {
  border: '1px solid var(--separator)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-3)',
  background: 'var(--bg-secondary)',
};

const summaryStyle: CSSProperties = {
  cursor: 'pointer',
  listStyle: 'none',
  fontWeight: 600,
  color: 'var(--text-secondary)',
};

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--separator)',
  background: 'var(--bg)',
  color: 'var(--text-primary)',
  padding: '0 var(--space-3)',
};

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatPanelState>({
    isOpen: false,
    intent: 'general_chat',
    context: DEFAULT_CONTEXT,
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  const value = useMemo<ChatPanelController>(
    () => ({
      isOpen: state.isOpen,
      intent: state.intent,
      context: state.context,
      openPanel: (input) => {
        setState({
          isOpen: true,
          intent: input?.intent ?? 'general_chat',
          context: {
            ...DEFAULT_CONTEXT,
            ...input?.context,
          },
        });
      },
      closePanel: () => {
        setState((current) => ({ ...current, isOpen: false }));
      },
    }),
    [state],
  );

  return (
    <ChatPanelContext.Provider value={value}>
      <div
        aria-hidden={isMobile && state.isOpen}
        style={isMobile && state.isOpen ? { visibility: 'hidden', pointerEvents: 'none' } : undefined}
      >
        {children}
      </div>
      {isMobile && !state.isOpen ? (
        <Button
          onClick={() => value.openPanel({ intent: 'general_chat', context: { page: 'mobile' } })}
          style={{
            position: 'fixed',
            right: '16px',
            bottom: '94px',
            zIndex: 61,
            borderRadius: '999px',
            boxShadow: 'var(--shadow-overlay)',
          }}
        >
          <MessageSquarePlus size={16} />
          Ask / Delegate
        </Button>
      ) : null}
      <ChatPanel />
    </ChatPanelContext.Provider>
  );
}
