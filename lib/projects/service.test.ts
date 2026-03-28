// @vitest-environment node

import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { closeProductStateDb } from '@/lib/product-state/db';
import { createProject } from '@/lib/product-state/repositories';
import {
  bindExistingProjectWorkspace,
  bootstrapProjectWorkspace,
  getProjectDetail,
  listProjectContextSummaries,
} from '@/lib/projects/service';

const tempRoots: string[] = [];

function makeTempRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-project-service-'));
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    closeProductStateDb(root);
    rmSync(root, { recursive: true, force: true });
  }
});

describe('projects service workspace flows', () => {
  it('bootstraps a project workspace and surfaces ready state in summaries', () => {
    const root = makeTempRoot();
    const project = createProject(
      {
        title: 'Fresh Build',
        priority: 'high',
      },
      root,
    );

    const workspace = bootstrapProjectWorkspace(project.id, {}, root);
    expect(workspace).not.toBeNull();
    if (!workspace) {
      throw new Error('Expected workspace to be created');
    }
    const detail = getProjectDetail(project.id, root);
    const summary = listProjectContextSummaries(root).find((item) => item.projectId === project.id);

    expect(workspace).toMatchObject({
      projectId: project.id,
      mode: 'bootstrapped',
      status: 'ready',
    });
    expect(existsSync(workspace.workspacePath)).toBe(true);
    expect(detail?.workspace?.workspacePath).toBe(workspace.workspacePath);
    expect(detail?.summary.workspaceStatus).toBe('ready');
    expect(summary).toMatchObject({
      projectId: project.id,
      workspaceStatus: 'ready',
      workspacePath: workspace.workspacePath,
    });
  });

  it('binds an existing workspace path to a planning-only project', () => {
    const root = makeTempRoot();
    const existingPath = path.join(root, 'external-workspaces', 'linked-repo');
    mkdirSync(existingPath, { recursive: true });
    const project = createProject(
      {
        title: 'Existing Repo',
        priority: 'normal',
        linkedRepos: ['linked-repo'],
      },
      root,
    );

    const workspace = bindExistingProjectWorkspace(
      project.id,
      {
        workspacePath: existingPath,
      },
      root,
    );
    expect(workspace).not.toBeNull();
    if (!workspace) {
      throw new Error('Expected workspace to be bound');
    }

    expect(workspace).toMatchObject({
      projectId: project.id,
      mode: 'existing',
      status: 'ready',
      repoName: 'linked-repo',
      workspacePath: path.resolve(existingPath),
    });
    expect(getProjectDetail(project.id, root)?.workspace?.mode).toBe('existing');
  });
});
