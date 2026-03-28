// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { closeProductStateDb } from '@/lib/product-state/db';
import { createProject } from '@/lib/product-state/repositories';
import { bootstrapProjectWorkspace } from '@/lib/projects/service';
import {
  confirmSpecDecomposition,
  createProjectSpec,
  evaluateSpecReadiness,
  proposeSpecDecomposition,
} from '@/lib/specs/service';

const tempRoots: string[] = [];

function makeTempRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-specs-'));
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    closeProductStateDb(root);
    rmSync(root, { recursive: true, force: true });
  }
});

describe('spec service', () => {
  it('blocks decomposition when a workspace-required spec has no ready workspace', () => {
    const root = makeTempRoot();
    const project = createProject(
      {
        title: 'Spec Project',
        priority: 'high',
        linkedRepos: ['meeseeks-box'],
      },
      root,
    );

    const spec = createProjectSpec(
      {
        projectId: project.id,
        title: 'Project-first board',
        intent: 'Rework the board around project execution.',
        outcome: 'Board shows project execution flow.',
        inScope: ['Board lanes', 'Card badges'],
        acceptanceCriteria: ['Project flow is default.', 'Operational state remains visible.'],
        status: 'approved',
        executionMode: 'workspace_required',
      },
      root,
    );

    const readiness = evaluateSpecReadiness(spec, root);

    expect(readiness.isReady).toBe(false);
    expect(readiness.workspaceStatus).toBe('missing');
    expect(readiness.reasons[0]).toContain('Bind or bootstrap a workspace');
  });

  it('proposes and confirms cards from an approved spec when workspace is ready', () => {
    const root = makeTempRoot();
    const project = createProject(
      {
        title: 'Spec Project',
        priority: 'high',
        linkedRepos: ['meeseeks-box'],
      },
      root,
    );
    bootstrapProjectWorkspace(project.id, {}, root);

    const spec = createProjectSpec(
      {
        projectId: project.id,
        title: 'Project-first board',
        intent: 'Rework the board around project execution.',
        outcome: 'Board shows project execution flow.',
        inScope: ['Board lanes', 'Card badges'],
        acceptanceCriteria: ['Project flow is default.', 'Operational state remains visible.'],
        status: 'approved',
        executionMode: 'workspace_required',
      },
      root,
    );

    const proposal = proposeSpecDecomposition(spec.id, root);
    expect(proposal.readiness.isReady).toBe(true);
    expect(proposal.cards.length).toBeGreaterThan(0);

    const created = confirmSpecDecomposition(spec.id, proposal.cards, root);
    expect(created.length).toBe(proposal.cards.length);
    expect(created[0].link.specId).toBe(spec.id);
    expect(created[0].link.acceptanceCriteria.length).toBeGreaterThan(0);
  });
});
