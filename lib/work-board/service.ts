import {
  getProjectById,
  getSpecById,
  getSpecCardLinkByWorkItemId,
  listProjects,
  listScheduleSummaries,
  listWorkItemSummaries,
} from '@/lib/product-state/repositories';
import type { WorkItemStatus } from '@/lib/product-state/entities';

export type WorkBoardMode = 'project' | 'status';
export type WorkBoardProjectLane = 'todo' | 'in_progress' | 'in_review' | 'done';
export type WorkBoardLaneKey = WorkBoardProjectLane | WorkItemStatus;

export interface WorkBoardCard {
  workItemId: string;
  title: string;
  scope: string;
  priority: string | null;
  projectId: string | null;
  projectTitle: string | null;
  parentSpecId: string | null;
  parentSpecTitle: string | null;
  delegatedAgentId: string | null;
  linkedRepos: string[];
  sourceConversationId: string | null;
  displayStatus: WorkItemStatus;
  baseStatus: WorkItemStatus;
  reviewState: 'not_ready' | 'review_ready' | 'reviewed';
  latestRunId: string | null;
  latestRunStatus: string | null;
  latestEventType: string | null;
  latestEventAt: string | null;
  badges: string[];
  operationalBadges: string[];
  scheduleTime: string | null;
  scheduleStatus: string | null;
  scheduleSource: string | null;
}

export interface WorkBoardLane {
  lane: WorkBoardLaneKey;
  title: string;
  cards: WorkBoardCard[];
}

const PROJECT_LANES: Array<{ lane: WorkBoardProjectLane; title: string }> = [
  { lane: 'todo', title: 'To Do' },
  { lane: 'in_progress', title: 'In Progress' },
  { lane: 'in_review', title: 'In Review' },
  { lane: 'done', title: 'Done' },
];

const STATUS_LANES: WorkItemStatus[] = [
  'queued',
  'running',
  'scheduled',
  'needs_input',
  'needs_approval',
  'blocked',
  'failed',
  'completed',
];

function deriveProjectLane(card: Pick<WorkBoardCard, 'displayStatus' | 'reviewState'>): WorkBoardProjectLane | null {
  if (card.displayStatus === 'archived') {
    return null;
  }

  if (card.reviewState === 'review_ready') {
    return 'in_review';
  }

  if (card.reviewState === 'reviewed' || card.displayStatus === 'completed') {
    return card.reviewState === 'reviewed' ? 'done' : 'in_review';
  }

  if (
    card.displayStatus === 'running' ||
    card.displayStatus === 'blocked' ||
    card.displayStatus === 'needs_approval'
  ) {
    return 'in_progress';
  }

  return 'todo';
}

function formatStatusLabel(value: string) {
  return value.replaceAll('_', ' ');
}

export function listBoardLanes(
  inputOrRootDir: { mode?: WorkBoardMode; projectId?: string | null } | string = {},
  maybeRootDir = process.cwd(),
) {
  const input = typeof inputOrRootDir === 'string' ? {} : inputOrRootDir;
  const rootDir = typeof inputOrRootDir === 'string' ? inputOrRootDir : maybeRootDir;
  const mode = input.mode ?? 'project';
  const workSummaries = listWorkItemSummaries(rootDir);
  const scheduleSummaries = listScheduleSummaries(rootDir);
  const scheduleByWorkItemId = new Map(
    scheduleSummaries
      .filter((summary) => typeof summary.sourceRef === 'string' && summary.sourceRef)
      .map((summary) => [summary.sourceRef!, summary]),
  );
  const projectsById = new Map(listProjects(rootDir).map((project) => [project.id, project]));

  const cards = workSummaries
    .filter((summary) => (input.projectId ? summary.projectId === input.projectId : true))
    .map((summary) => {
      const schedule = scheduleByWorkItemId.get(summary.workItemId);
      const project = summary.projectId ? projectsById.get(summary.projectId) : null;
      const specLink = getSpecCardLinkByWorkItemId(summary.workItemId, rootDir);
      const spec = specLink ? getSpecById(specLink.specId, rootDir) : null;

      return {
        workItemId: summary.workItemId,
        title: summary.title,
        scope: summary.scope,
        priority: summary.priority,
        projectId: summary.projectId,
        projectTitle: project?.title ?? null,
        parentSpecId: spec?.id ?? null,
        parentSpecTitle: spec?.title ?? null,
        delegatedAgentId: summary.delegatedAgentId,
        linkedRepos: project?.linkedRepos ?? [],
        sourceConversationId: summary.sourceConversationId,
        displayStatus: summary.displayStatus,
        baseStatus: summary.baseStatus,
        reviewState: summary.reviewState,
        latestRunId: summary.latestRunId,
        latestRunStatus: summary.latestRunStatus,
        latestEventType: summary.latestEventType,
        latestEventAt: summary.latestEventAt,
        badges: summary.badges,
        operationalBadges: Array.from(
          new Set([
            summary.displayStatus !== summary.baseStatus ? summary.displayStatus : null,
            ...summary.badges,
          ].filter((value): value is string => Boolean(value))),
        ),
        scheduleTime: schedule?.nextRunAt ?? null,
        scheduleStatus: schedule?.status ?? null,
        scheduleSource: schedule?.sourceKind ?? null,
      } satisfies WorkBoardCard;
    })
    .filter((card) => card.displayStatus !== 'archived');

  if (mode === 'status') {
    return STATUS_LANES.map((lane) => ({
      lane,
      title: formatStatusLabel(lane),
      cards: cards.filter((card) => card.displayStatus === lane),
    })) satisfies WorkBoardLane[];
  }

  return PROJECT_LANES.map(({ lane, title }) => ({
    lane,
    title,
    cards: cards.filter((card) => deriveProjectLane(card) === lane),
  })) satisfies WorkBoardLane[];
}

export function getBoardProjectOptions(rootDir = process.cwd()) {
  return listProjects(rootDir).map((project) => ({
    id: project.id,
    title: project.title,
    activeGoal: project.activeGoal,
    currentFocus: project.currentFocus,
  }));
}

export function getBoardProjectLabel(projectId: string | null | undefined, rootDir = process.cwd()) {
  if (!projectId) {
    return 'All Projects';
  }

  return getProjectById(projectId, rootDir)?.title ?? 'Unknown Project';
}
