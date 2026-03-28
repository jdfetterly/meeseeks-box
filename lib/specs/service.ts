import 'server-only';

import {
  createSpec,
  createSpecCardLink,
  createWorkItem,
  getProjectById,
  getProjectPlaybookByProjectId,
  getProjectWorkspaceByProjectId,
  getSpecById,
  getWorkItemById,
  listSpecCardLinks,
  listSpecs,
  updateSpec,
} from '@/lib/product-state/repositories';
import type {
  ProjectRecord,
  SpecCardLinkRecord,
  SpecExecutionMode,
  SpecRecord,
  WorkItemRecord,
} from '@/lib/product-state/entities';
import { syncWorkItemSummary } from '@/lib/product-state/projections';

export interface SpecReadiness {
  isReady: boolean;
  reasons: string[];
  workspaceStatus: 'ready' | 'missing' | 'not_required';
}

export interface SpecCardProposal {
  title: string;
  intentSummary: string;
  decompositionReason: string;
  acceptanceCriteria: string[];
  expectedOutput: string;
  executionMode: SpecExecutionMode;
  delegatedAgentId: string | null;
  linkedRepos: string[];
}

export interface ProjectSpecDetail {
  spec: SpecRecord;
  readiness: SpecReadiness;
  links: Array<{
    link: SpecCardLinkRecord;
    workItem: WorkItemRecord | null;
  }>;
}

function normalizeList(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [] as string[];
}

function preferAgent(projectId: string, rootDir: string) {
  const playbook = getProjectPlaybookByProjectId(projectId, rootDir);
  return playbook?.preferredAgents[0] ?? null;
}

function deriveExecutionMode(input: {
  explicit?: SpecExecutionMode | null;
  workspaceRequired?: boolean | null;
  project: ProjectRecord;
}) {
  if (input.explicit) {
    return input.explicit;
  }

  if (input.workspaceRequired) {
    return 'workspace_required' as const;
  }

  return input.project.linkedRepos.length > 0 ? ('workspace_required' as const) : ('planning_only' as const);
}

export function evaluateSpecReadiness(spec: SpecRecord, rootDir = process.cwd()): SpecReadiness {
  const reasons: string[] = [];
  const workspace = getProjectWorkspaceByProjectId(spec.projectId, rootDir);

  if (!spec.title.trim()) {
    reasons.push('Spec title is missing.');
  }

  if (!spec.intent.trim()) {
    reasons.push('Spec intent is missing.');
  }

  if (!spec.outcome.trim()) {
    reasons.push('Spec outcome is missing.');
  }

  if (spec.acceptanceCriteria.length === 0) {
    reasons.push('Add at least one acceptance criterion before decomposition.');
  }

  if (spec.executionMode === 'workspace_required' && workspace?.status !== 'ready') {
    reasons.push('Bind or bootstrap a workspace before creating execution-ready code cards.');
  }

  return {
    isReady: reasons.length === 0 && spec.status === 'approved',
    reasons,
    workspaceStatus:
      spec.executionMode === 'workspace_required'
        ? workspace?.status === 'ready'
          ? 'ready'
          : 'missing'
        : 'not_required',
  };
}

export function createProjectSpec(
  input: {
    projectId: string;
    title: string;
    intent: string;
    outcome: string;
    inScope?: string[];
    outOfScope?: string[];
    currentContext?: string | null;
    dependencies?: string[];
    executionNotes?: string | null;
    acceptanceCriteria?: string[];
    reviewExpectations?: string | null;
    status?: SpecRecord['status'];
    executionMode?: SpecExecutionMode | null;
    workspaceRequired?: boolean | null;
  },
  rootDir = process.cwd(),
) {
  const project = getProjectById(input.projectId, rootDir);

  if (!project) {
    throw new Error(`Unknown project: ${input.projectId}`);
  }

  const executionMode = deriveExecutionMode({
    explicit: input.executionMode ?? null,
    workspaceRequired: input.workspaceRequired ?? null,
    project,
  });

  return createSpec(
    {
      projectId: input.projectId,
      title: input.title.trim(),
      intent: input.intent.trim(),
      outcome: input.outcome.trim(),
      inScope: input.inScope ?? [],
      outOfScope: input.outOfScope ?? [],
      currentContext: input.currentContext ?? null,
      dependencies: input.dependencies ?? [],
      executionNotes: input.executionNotes ?? null,
      acceptanceCriteria: input.acceptanceCriteria ?? [],
      reviewExpectations: input.reviewExpectations ?? null,
      status: input.status ?? 'draft',
      executionMode,
      workspaceRequired: executionMode === 'workspace_required',
    },
    rootDir,
  );
}

export function updateProjectSpec(
  specId: string,
  updates: {
    title?: string;
    intent?: string;
    outcome?: string;
    inScope?: string[];
    outOfScope?: string[];
    currentContext?: string | null;
    dependencies?: string[];
    executionNotes?: string | null;
    acceptanceCriteria?: string[];
    reviewExpectations?: string | null;
    status?: SpecRecord['status'];
    executionMode?: SpecExecutionMode;
    workspaceRequired?: boolean;
  },
  rootDir = process.cwd(),
) {
  const spec = getSpecById(specId, rootDir);
  if (!spec) {
    throw new Error(`Unknown spec: ${specId}`);
  }

  const nextExecutionMode = updates.executionMode ?? spec.executionMode;
  return updateSpec(
    specId,
    {
      title: updates.title?.trim(),
      intent: updates.intent?.trim(),
      outcome: updates.outcome?.trim(),
      inScope: updates.inScope,
      outOfScope: updates.outOfScope,
      currentContext: updates.currentContext,
      dependencies: updates.dependencies,
      executionNotes: updates.executionNotes,
      acceptanceCriteria: updates.acceptanceCriteria,
      reviewExpectations: updates.reviewExpectations,
      status: updates.status,
      executionMode: nextExecutionMode,
      workspaceRequired:
        typeof updates.workspaceRequired === 'boolean'
          ? updates.workspaceRequired
          : nextExecutionMode === 'workspace_required',
    },
    rootDir,
  );
}

export function listProjectSpecDetails(projectId: string, rootDir = process.cwd()) {
  return listSpecs({ projectId }, rootDir).map((spec) => getProjectSpecDetail(spec.id, rootDir)).filter(Boolean) as ProjectSpecDetail[];
}

export function getProjectSpecDetail(specId: string, rootDir = process.cwd()): ProjectSpecDetail | null {
  const spec = getSpecById(specId, rootDir);
  if (!spec) {
    return null;
  }

  return {
    spec,
    readiness: evaluateSpecReadiness(spec, rootDir),
    links: listSpecCardLinks({ specId }, rootDir).map((link) => ({
      link,
      workItem: getWorkItemById(link.workItemId, rootDir),
    })),
  };
}

function distributeAcceptanceCriteria(spec: SpecRecord, count: number) {
  const criteria = [...spec.acceptanceCriteria];
  if (count <= 1) {
    return [criteria];
  }

  const buckets: string[][] = Array.from({ length: count }, () => []);
  criteria.forEach((criterion, index) => {
    buckets[index % count].push(criterion);
  });

  return buckets.map((bucket, index) => bucket.length > 0 ? bucket : [spec.acceptanceCriteria[index] ?? 'Satisfy the scoped outcome for this card.']);
}

export function proposeSpecDecomposition(specId: string, rootDir = process.cwd()): {
  spec: SpecRecord;
  readiness: SpecReadiness;
  cards: SpecCardProposal[];
} {
  const spec = getSpecById(specId, rootDir);
  if (!spec) {
    throw new Error(`Unknown spec: ${specId}`);
  }

  const project = getProjectById(spec.projectId, rootDir);
  if (!project) {
    throw new Error(`Unknown project for spec: ${spec.projectId}`);
  }

  const readiness = evaluateSpecReadiness(spec, rootDir);
  const scopedSlices = spec.inScope.length > 0 ? spec.inScope : [spec.outcome];
  const splitCount = Math.min(
    Math.max(scopedSlices.length, spec.acceptanceCriteria.length > 3 ? 2 : 1),
    4,
  );
  const acceptanceBuckets = distributeAcceptanceCriteria(spec, splitCount);
  const cards: SpecCardProposal[] = Array.from({ length: splitCount }, (_, index) => {
    const scopeEntry = scopedSlices[index] ?? scopedSlices[scopedSlices.length - 1] ?? spec.outcome;
    const localCriteria = acceptanceBuckets[index] ?? spec.acceptanceCriteria;
    return {
      title:
        splitCount === 1
          ? spec.title
          : `${spec.title}: ${scopeEntry.replace(/[.]+$/, '')}`,
      intentSummary: scopeEntry,
      decompositionReason:
        splitCount === 1
          ? 'Single reviewable outcome with one acceptance boundary.'
          : `Split from the parent spec because "${scopeEntry}" has its own review boundary.`,
      acceptanceCriteria: localCriteria,
      expectedOutput:
        spec.reviewExpectations ??
        `Deliver a review-ready output for ${scopeEntry.replace(/[.]+$/, '')}.`,
      executionMode: spec.executionMode,
      delegatedAgentId: preferAgent(spec.projectId, rootDir),
      linkedRepos: project.linkedRepos,
    };
  });

  return { spec, readiness, cards };
}

export function confirmSpecDecomposition(
  specId: string,
  cards: Array<{
    title: string;
    intentSummary?: string;
    decompositionReason: string;
    acceptanceCriteria: string[];
    expectedOutput?: string | null;
    delegatedAgentId?: string | null;
    linkedRepos?: string[];
  }>,
  rootDir = process.cwd(),
) {
  const spec = getSpecById(specId, rootDir);
  if (!spec) {
    throw new Error(`Unknown spec: ${specId}`);
  }

  const project = getProjectById(spec.projectId, rootDir);
  if (!project) {
    throw new Error(`Unknown project for spec: ${spec.projectId}`);
  }

  const readiness = evaluateSpecReadiness(spec, rootDir);
  if (!readiness.isReady) {
    throw new Error(readiness.reasons.join(' '));
  }

  const created = cards.map((card) => {
    const workItem = createWorkItem(
      {
        title: card.title.trim(),
        scope: card.delegatedAgentId?.trim() || preferAgent(spec.projectId, rootDir) || 'main',
        status: spec.executionMode === 'planning_only' ? 'queued' : 'queued',
        projectId: spec.projectId,
        delegatedAgentId: card.delegatedAgentId?.trim() || preferAgent(spec.projectId, rootDir),
        linkedRepos: card.linkedRepos ?? project.linkedRepos,
        reviewState: 'not_ready',
      },
      rootDir,
    );
    const summary = syncWorkItemSummary(workItem.id, rootDir);
    const link = createSpecCardLink(
      {
        specId,
        workItemId: workItem.id,
        decompositionReason: card.decompositionReason,
        acceptanceCriteria: card.acceptanceCriteria,
        expectedOutput: card.expectedOutput ?? null,
      },
      rootDir,
    );

    return { workItem, summary, link };
  });

  return created;
}

export function createFollowUpCardProposal(
  specId: string,
  input: {
    feedback: string;
    workItemTitle?: string | null;
  },
  rootDir = process.cwd(),
) {
  const spec = getSpecById(specId, rootDir);
  if (!spec) {
    throw new Error(`Unknown spec: ${specId}`);
  }

  return {
    title: input.workItemTitle ? `${input.workItemTitle}: follow-up` : `${spec.title}: follow-up`,
    intentSummary: input.feedback.trim(),
    decompositionReason: 'Created from review feedback on the original spec card.',
    acceptanceCriteria: spec.acceptanceCriteria.slice(0, 2),
    expectedOutput: spec.reviewExpectations ?? 'Deliver a corrected review-ready output.',
    executionMode: spec.executionMode,
    delegatedAgentId: preferAgent(spec.projectId, rootDir),
    linkedRepos: getProjectById(spec.projectId, rootDir)?.linkedRepos ?? [],
  } satisfies SpecCardProposal;
}

export function parseSpecPayload(body: Record<string, unknown>) {
  return {
    title: typeof body.title === 'string' ? body.title : '',
    intent: typeof body.intent === 'string' ? body.intent : '',
    outcome: typeof body.outcome === 'string' ? body.outcome : '',
    inScope: normalizeList(body.inScope),
    outOfScope: normalizeList(body.outOfScope),
    currentContext: typeof body.currentContext === 'string' ? body.currentContext : null,
    dependencies: normalizeList(body.dependencies),
    executionNotes: typeof body.executionNotes === 'string' ? body.executionNotes : null,
    acceptanceCriteria: normalizeList(body.acceptanceCriteria),
    reviewExpectations: typeof body.reviewExpectations === 'string' ? body.reviewExpectations : null,
  };
}
