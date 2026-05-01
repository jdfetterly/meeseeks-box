import 'server-only';

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { generateId } from '@/lib/id';
import type {
  ProjectContextSummaryRecord,
  ProjectLearningSuggestionRecord,
  ProjectPlaybookRecord,
  ProjectRecord,
  ProjectWorkspaceRecord,
  ReviewItemRecord,
  WorkItemSummaryRecord,
} from '@/lib/product-state/entities';
import {
  getProjectById,
  getProjectPlaybookByProjectId,
  getProjectWorkspaceByProjectId,
  listInboxItems,
  listProjectLearningSuggestions,
  listProjects,
  listProjectWorkspaces,
  listReviewItems,
  listWorkItemSummaries,
  upsertProjectWorkspace,
} from '@/lib/product-state/repositories';

export interface ProjectGitStatusRecord {
  isGitRepo: boolean;
  currentBranch: string | null;
  lastCommitShort: string | null;
  lastCommitMessage: string | null;
  lastCommitAt: string | null;
  remoteUrl: string | null;
  modifiedCount: number;
  untrackedCount: number;
}

export interface ProjectDetailRecord {
  project: ProjectRecord;
  workspace: ProjectWorkspaceRecord | null;
  git: ProjectGitStatusRecord | null;
  playbook: ProjectPlaybookRecord | null;
  workItems: WorkItemSummaryRecord[];
  reviewItems: ReviewItemRecord[];
  learningSuggestions: ProjectLearningSuggestionRecord[];
  summary: ProjectContextSummaryRecord;
}

function buildSuggestedPrompt(project: ProjectRecord, playbook: ProjectPlaybookRecord | null) {
  if (project.currentFocus) {
    return `Plan the next step for ${project.title} around ${project.currentFocus}.`;
  }

  if (project.activeGoal) {
    return `Break ${project.activeGoal} into executable work for ${project.title}.`;
  }

  if (playbook?.goals[0]) {
    return `Turn ${playbook.goals[0]} into the next set of deliverables.`;
  }

  return `Help me move ${project.title} forward.`;
}

function slugifyProjectTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'project';
}

function runGit(workspacePath: string, args: string[]) {
  try {
    return execFileSync('git', ['-C', workspacePath, ...args], {
      encoding: 'utf8',
      timeout: 1500,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function getProjectGitStatus(workspace: ProjectWorkspaceRecord | null): ProjectGitStatusRecord | null {
  if (!workspace || !existsSync(workspace.workspacePath)) {
    return null;
  }

  const isGitRepo = runGit(workspace.workspacePath, ['rev-parse', '--is-inside-work-tree']) === 'true';

  if (!isGitRepo) {
    return {
      isGitRepo: false,
      currentBranch: null,
      lastCommitShort: null,
      lastCommitMessage: null,
      lastCommitAt: null,
      remoteUrl: null,
      modifiedCount: 0,
      untrackedCount: 0,
    };
  }

  const statusLines = (runGit(workspace.workspacePath, ['status', '--porcelain']) ?? '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);

  return {
    isGitRepo: true,
    currentBranch: runGit(workspace.workspacePath, ['branch', '--show-current']),
    lastCommitShort: runGit(workspace.workspacePath, ['rev-parse', '--short', 'HEAD']),
    lastCommitMessage: runGit(workspace.workspacePath, ['log', '-1', '--format=%s']),
    lastCommitAt: runGit(workspace.workspacePath, ['log', '-1', '--format=%cI']),
    remoteUrl: runGit(workspace.workspacePath, ['config', '--get', 'remote.origin.url']),
    modifiedCount: statusLines.filter((line) => !line.startsWith('??')).length,
    untrackedCount: statusLines.filter((line) => line.startsWith('??')).length,
  };
}

function resolveWorkspaceRoot(rootDir: string) {
  const configured = process.env.WORKSPACE_PATH?.trim();
  if (configured) {
    return path.join(path.dirname(path.resolve(configured)), 'projects');
  }

  return path.join(rootDir, 'workspaces');
}

export function deriveDefaultWorkspacePath(project: Pick<ProjectRecord, 'title'>, rootDir = process.cwd()) {
  return path.join(resolveWorkspaceRoot(rootDir), slugifyProjectTitle(project.title));
}

export function buildProjectContextSummary(
  project: ProjectRecord,
  input: {
    workspace: ProjectWorkspaceRecord | null;
    playbook: ProjectPlaybookRecord | null;
    workItems: WorkItemSummaryRecord[];
    reviewItems: ReviewItemRecord[];
    openAttentionCount: number;
  },
): ProjectContextSummaryRecord {
  return {
    projectId: project.id,
    title: project.title,
    priority: project.priority,
    status: project.status,
    activeGoal: project.activeGoal,
    currentFocus: project.currentFocus,
    workCount: input.workItems.length,
    reviewCount: input.reviewItems.filter((item) => item.status === 'open').length,
    openAttentionCount: input.openAttentionCount,
    linkedRepos: project.linkedRepos,
    workspaceStatus: input.workspace?.status ?? 'unbound',
    workspaceMode: input.workspace?.mode ?? null,
    workspacePath: input.workspace?.workspacePath ?? null,
    suggestedPrompt: buildSuggestedPrompt(project, input.playbook),
  };
}

export function listProjectContextSummaries(rootDir = process.cwd()) {
  const projects = listProjects(rootDir);
  const workItems = listWorkItemSummaries(rootDir);
  const reviewItems = listReviewItems({}, rootDir);
  const openInboxItems = listInboxItems(rootDir).filter((item) => item.status === 'open');
  const workspacesByProjectId = new Map(
    listProjectWorkspaces(rootDir).map((workspace) => [workspace.projectId, workspace]),
  );

  return projects.map((project) => {
    const playbook = getProjectPlaybookByProjectId(project.id, rootDir);
    const workspace = workspacesByProjectId.get(project.id) ?? null;
    const projectWorkItems = workItems.filter((item) => item.projectId === project.id);
    const projectReviewItems = reviewItems.filter((item) => item.projectId === project.id);
    const workItemIds = new Set(projectWorkItems.map((item) => item.workItemId));
    const openAttentionCount = openInboxItems.filter((item) => {
      const workItemId = typeof item.detail.workItemId === 'string' ? item.detail.workItemId : null;
      return workItemId ? workItemIds.has(workItemId) : false;
    }).length;

    return buildProjectContextSummary(project, {
      workspace,
      playbook,
      workItems: projectWorkItems,
      reviewItems: projectReviewItems,
      openAttentionCount,
    });
  });
}

export function getProjectDetail(projectId: string, rootDir = process.cwd()): ProjectDetailRecord | null {
  const project = getProjectById(projectId, rootDir);

  if (!project) {
    return null;
  }

  const playbook = getProjectPlaybookByProjectId(project.id, rootDir);
  const workspace = getProjectWorkspaceByProjectId(project.id, rootDir);
  const workItems = listWorkItemSummaries(rootDir).filter((item) => item.projectId === project.id);
  const reviewItems = listReviewItems({ projectId }, rootDir);
  const learningSuggestions = listProjectLearningSuggestions({ projectId }, rootDir);
  const workItemIds = new Set(workItems.map((item) => item.workItemId));
  const openAttentionCount = listInboxItems(rootDir).filter((item) => {
    if (item.status !== 'open') {
      return false;
    }

    const workItemId = typeof item.detail.workItemId === 'string' ? item.detail.workItemId : null;
    return workItemId ? workItemIds.has(workItemId) : false;
  }).length;

  return {
    project,
    workspace,
    git: getProjectGitStatus(workspace),
    playbook,
    workItems,
    reviewItems,
    learningSuggestions,
    summary: buildProjectContextSummary(project, {
      workspace,
      playbook,
      workItems,
      reviewItems,
      openAttentionCount,
    }),
  };
}

export function getProjectWorkspace(projectId: string, rootDir = process.cwd()) {
  return getProjectWorkspaceByProjectId(projectId, rootDir);
}

export function bindExistingProjectWorkspace(
  projectId: string,
  input: {
    workspacePath: string;
    repoName?: string | null;
    repoUrl?: string | null;
    defaultBranch?: string | null;
  },
  rootDir = process.cwd(),
) {
  const project = getProjectById(projectId, rootDir);

  if (!project) {
    throw new Error(`Unknown project: ${projectId}`);
  }

  const now = new Date().toISOString();
  const existing = getProjectWorkspaceByProjectId(projectId, rootDir);
  const workspacePath = path.resolve(input.workspacePath.trim());

  return upsertProjectWorkspace(
    {
      id: existing?.id ?? generateId(),
      projectId,
      mode: 'existing',
      workspacePath,
      repoName: input.repoName?.trim() || project.linkedRepos[0] || null,
      repoUrl: input.repoUrl?.trim() || null,
      defaultBranch: input.defaultBranch?.trim() || 'main',
      status: 'ready',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    },
    rootDir,
  );
}

export function bootstrapProjectWorkspace(
  projectId: string,
  input: {
    workspacePath?: string | null;
    repoName?: string | null;
    repoUrl?: string | null;
    defaultBranch?: string | null;
  } = {},
  rootDir = process.cwd(),
) {
  const project = getProjectById(projectId, rootDir);

  if (!project) {
    throw new Error(`Unknown project: ${projectId}`);
  }

  const now = new Date().toISOString();
  const existing = getProjectWorkspaceByProjectId(projectId, rootDir);
  const targetPath = path.resolve(
    input.workspacePath?.trim() || deriveDefaultWorkspacePath(project, rootDir),
  );

  mkdirSync(targetPath, { recursive: true });
  const readmePath = path.join(targetPath, 'README.md');
  if (!existsSync(readmePath)) {
    writeFileSync(
      readmePath,
      `# ${project.title}\n\nThis workspace was bootstrapped from Meeseek Box.\n`,
      'utf8',
    );
  }

  return upsertProjectWorkspace(
    {
      id: existing?.id ?? generateId(),
      projectId,
      mode: 'bootstrapped',
      workspacePath: targetPath,
      repoName: input.repoName?.trim() || project.linkedRepos[0] || slugifyProjectTitle(project.title),
      repoUrl: input.repoUrl?.trim() || null,
      defaultBranch: input.defaultBranch?.trim() || 'main',
      status: 'ready',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    },
    rootDir,
  );
}
