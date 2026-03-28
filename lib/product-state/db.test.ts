// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  closeProductStateDb,
  getProductStateHealth,
  openProductStateDb,
} from '@/lib/product-state/db';

const tempRoots: string[] = [];

function makeTempRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-state-'));
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    closeProductStateDb(root);
    rmSync(root, { recursive: true, force: true });
  }
});

describe('product-state db', () => {
  it('bootstraps the latest schema and returns zeroed counts', () => {
    const root = makeTempRoot();

    const db = openProductStateDb(root);
    const health = getProductStateHealth(root);
    const runColumns = db
      .prepare("SELECT name FROM pragma_table_info('runs')")
      .all<{ name: string }>()
      .map((row) => row.name);
    const scheduleColumns = db
      .prepare("SELECT name FROM pragma_table_info('schedules')")
      .all<{ name: string }>()
      .map((row) => row.name);

    expect(health.dbPath).toBe(path.join(root, '.meeseeks-box', 'state.sqlite'));
    const projectionTables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all<{ name: string }>()
      .map((row) => row.name);

    expect(health.schemaVersion).toBe(11);
    expect(health.counts).toEqual({
      conversations: 0,
      messages: 0,
      projects: 0,
      specs: 0,
      workItems: 0,
      runs: 0,
      runEvents: 0,
      artifacts: 0,
      approvals: 0,
      reviewItems: 0,
      schedules: 0,
      memoryEntries: 0,
      memorySources: 0,
      savedLaunchPresets: 0,
      launchDrafts: 0,
    });
    expect(runColumns).toEqual(
      expect.arrayContaining([
        'external_run_id',
        'external_session_id',
        'external_session_key',
      ]),
    );
    expect(scheduleColumns).toContain('external_job_id');
    expect(projectionTables).toEqual(
      expect.arrayContaining([
        'run_summaries',
        'work_item_summaries',
        'inbox_items',
        'schedule_summaries',
      ]),
    );
  });

  it('reuses the same cached connection for the same root', () => {
    const root = makeTempRoot();

    const first = openProductStateDb(root);
    const second = openProductStateDb(root);

    expect(first).toBe(second);
  });
});
