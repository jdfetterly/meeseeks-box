import 'server-only';

import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { getProductStatePaths } from '@/lib/product-state/config';
import type { ProductStateCounts, ProductStateHealth } from '@/lib/product-state/types';

const dbCache = new Map<string, DatabaseSync>();

const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        agent_id TEXT,
        status TEXT NOT NULL,
        title TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content_text TEXT,
        content_json TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

      CREATE TABLE IF NOT EXISTS work_items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        scope TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT,
        source_conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
        conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
        agent_id TEXT,
        scope TEXT NOT NULL,
        status TEXT NOT NULL,
        trigger_kind TEXT NOT NULL,
        model TEXT,
        started_at TEXT,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_runs_work_item_id ON runs(work_item_id);
      CREATE INDEX IF NOT EXISTS idx_runs_conversation_id ON runs(conversation_id);

      CREATE TABLE IF NOT EXISTS run_events (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        sequence_key TEXT NOT NULL,
        source TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(source, sequence_key)
      );
      CREATE INDEX IF NOT EXISTS idx_run_events_run_id ON run_events(run_id);

      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
        work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
        family_key TEXT NOT NULL,
        name TEXT NOT NULL,
        mime_type TEXT,
        storage_path TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_artifacts_family_key ON artifacts(family_key);

      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
        status TEXT NOT NULL,
        request_json TEXT NOT NULL,
        resolution_json TEXT,
        requested_at TEXT NOT NULL,
        resolved_at TEXT
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        source_kind TEXT NOT NULL,
        source_ref TEXT,
        label TEXT NOT NULL,
        status TEXT NOT NULL,
        schedule_kind TEXT NOT NULL,
        schedule_expr TEXT,
        next_run_at TEXT,
        last_run_at TEXT,
        last_success_at TEXT,
        consecutive_failures INTEGER NOT NULL DEFAULT 0,
        missed_run_flag INTEGER NOT NULL DEFAULT 0,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        entry_type TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        canonical_path TEXT,
        status TEXT NOT NULL,
        tags_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_used_at TEXT,
        reviewed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS memory_sources (
        id TEXT PRIMARY KEY,
        memory_entry_id TEXT NOT NULL REFERENCES memory_entries(id) ON DELETE CASCADE,
        source_kind TEXT NOT NULL,
        source_ref TEXT,
        source_path TEXT,
        excerpt_hash TEXT,
        notes TEXT,
        payload_json TEXT,
        observed_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memory_sources_entry_id ON memory_sources(memory_entry_id);

      CREATE TABLE IF NOT EXISTS saved_launch_presets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        scope TEXT NOT NULL,
        agent_id TEXT,
        model_override TEXT,
        priority TEXT,
        output_type TEXT,
        timing_preference TEXT,
        prompt_template TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      ALTER TABLE runs ADD COLUMN external_run_id TEXT;
      ALTER TABLE runs ADD COLUMN external_session_id TEXT;
      ALTER TABLE runs ADD COLUMN external_session_key TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_runs_external_run_id
        ON runs(external_run_id)
        WHERE external_run_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_runs_external_session_id
        ON runs(external_session_id)
        WHERE external_session_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_runs_external_session_key
        ON runs(external_session_key)
        WHERE external_session_key IS NOT NULL;

      ALTER TABLE schedules ADD COLUMN external_job_id TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_external_job_id
        ON schedules(external_job_id)
        WHERE external_job_id IS NOT NULL;
    `,
  },
  {
    version: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS run_summaries (
        run_id TEXT PRIMARY KEY REFERENCES runs(id) ON DELETE CASCADE,
        work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
        conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
        scope TEXT NOT NULL,
        status TEXT NOT NULL,
        trigger_kind TEXT NOT NULL,
        agent_id TEXT,
        model TEXT,
        external_run_id TEXT,
        external_session_id TEXT,
        external_session_key TEXT,
        last_event_type TEXT,
        last_event_at TEXT,
        last_error_text TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_run_summaries_work_item_id ON run_summaries(work_item_id);

      CREATE TABLE IF NOT EXISTS work_item_summaries (
        work_item_id TEXT PRIMARY KEY REFERENCES work_items(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        scope TEXT NOT NULL,
        priority TEXT,
        base_status TEXT NOT NULL,
        display_status TEXT NOT NULL,
        source_conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
        latest_run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
        latest_run_status TEXT,
        latest_event_type TEXT,
        latest_event_at TEXT,
        badges_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_work_item_summaries_display_status
        ON work_item_summaries(display_status);

      CREATE TABLE IF NOT EXISTS inbox_items (
        id TEXT PRIMARY KEY,
        source_kind TEXT NOT NULL,
        source_ref TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        title TEXT NOT NULL,
        detail_json TEXT NOT NULL,
        dedupe_key TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        resolved_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_inbox_items_status ON inbox_items(status);

      CREATE TABLE IF NOT EXISTS schedule_summaries (
        schedule_id TEXT PRIMARY KEY REFERENCES schedules(id) ON DELETE CASCADE,
        source_kind TEXT NOT NULL,
        source_ref TEXT,
        label TEXT NOT NULL,
        status TEXT NOT NULL,
        schedule_kind TEXT NOT NULL,
        external_job_id TEXT,
        next_run_at TEXT,
        last_run_at TEXT,
        last_successful_output_at TEXT,
        last_run_outcome TEXT,
        consecutive_failure_count INTEGER NOT NULL DEFAULT 0,
        missed_run INTEGER NOT NULL DEFAULT 0,
        metadata_json TEXT,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    version: 4,
    sql: `
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id TEXT PRIMARY KEY,
        inbox_item_id TEXT REFERENCES inbox_items(id) ON DELETE SET NULL,
        channel TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        dedupe_key TEXT NOT NULL UNIQUE,
        payload_json TEXT NOT NULL,
        response_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notification_deliveries_channel
        ON notification_deliveries(channel);
    `,
  },
  {
    version: 5,
    sql: `
      CREATE TABLE IF NOT EXISTS artifact_families (
        id TEXT PRIMARY KEY,
        family_key TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        scope TEXT NOT NULL,
        producer_kind TEXT NOT NULL,
        producer_id TEXT NOT NULL,
        output_slot TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_artifact_families_scope
        ON artifact_families(scope);

      CREATE TABLE IF NOT EXISTS artifact_versions (
        id TEXT PRIMARY KEY,
        artifact_family_id TEXT NOT NULL REFERENCES artifact_families(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        version_label TEXT NOT NULL,
        run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
        work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        mime_type TEXT,
        storage_path TEXT,
        metadata_json TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(artifact_family_id, version_number)
      );
      CREATE INDEX IF NOT EXISTS idx_artifact_versions_family_id
        ON artifact_versions(artifact_family_id, version_number DESC);
    `,
  },
  {
    version: 6,
    sql: `
      ALTER TABLE memory_entries ADD COLUMN archived_at TEXT;
      ALTER TABLE memory_entries ADD COLUMN superseded_by_id TEXT REFERENCES memory_entries(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_memory_entries_archived_at
        ON memory_entries(archived_at);
      CREATE INDEX IF NOT EXISTS idx_memory_entries_superseded_by_id
        ON memory_entries(superseded_by_id)
        WHERE superseded_by_id IS NOT NULL;
    `,
  },
  {
    version: 7,
    sql: `
      CREATE TABLE IF NOT EXISTS launch_drafts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        scope TEXT NOT NULL,
        agent_id TEXT,
        model TEXT,
        priority TEXT,
        output_type TEXT,
        source_conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_launch_drafts_updated_at
        ON launch_drafts(updated_at DESC);
    `,
  },
  {
    version: 8,
    sql: `
      SELECT 1;
    `,
  },
  {
    version: 9,
    sql: `
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        linked_repos_json TEXT NOT NULL,
        active_goal TEXT,
        current_focus TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

      CREATE TABLE IF NOT EXISTS project_playbooks (
        project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
        goals_json TEXT NOT NULL,
        preferred_agents_json TEXT NOT NULL,
        working_style TEXT,
        review_preferences TEXT,
        schedule_patterns TEXT,
        repo_context TEXT,
        recent_decisions_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS project_learning_suggestions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        suggestion_type TEXT NOT NULL,
        title TEXT NOT NULL,
        detail TEXT NOT NULL,
        payload_json TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_project_learning_suggestions_project_id
        ON project_learning_suggestions(project_id, status, updated_at DESC);

      CREATE TABLE IF NOT EXISTS review_items (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
        artifact_ids_json TEXT NOT NULL,
        produced_by_agent_id TEXT,
        summary TEXT NOT NULL,
        review_reason TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        reviewed_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_review_items_status
        ON review_items(status, updated_at DESC);

      ALTER TABLE work_items ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
      ALTER TABLE work_items ADD COLUMN delegated_agent_id TEXT;
      ALTER TABLE work_items ADD COLUMN linked_repos_json TEXT;
      ALTER TABLE work_items ADD COLUMN review_state TEXT NOT NULL DEFAULT 'not_ready';
      CREATE INDEX IF NOT EXISTS idx_work_items_project_id ON work_items(project_id);

      ALTER TABLE work_item_summaries ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
      ALTER TABLE work_item_summaries ADD COLUMN delegated_agent_id TEXT;
      ALTER TABLE work_item_summaries ADD COLUMN review_state TEXT NOT NULL DEFAULT 'not_ready';
    `,
  },
  {
    version: 10,
    sql: `
      CREATE TABLE IF NOT EXISTS project_workspaces (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
        mode TEXT NOT NULL,
        workspace_path TEXT NOT NULL,
        repo_name TEXT,
        repo_url TEXT,
        default_branch TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_project_workspaces_status
        ON project_workspaces(status, updated_at DESC);
    `,
  },
  {
    version: 11,
    sql: `
      CREATE TABLE IF NOT EXISTS specs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        intent TEXT NOT NULL,
        outcome TEXT NOT NULL,
        in_scope_json TEXT NOT NULL,
        out_of_scope_json TEXT NOT NULL,
        current_context TEXT,
        dependencies_json TEXT NOT NULL,
        execution_notes TEXT,
        acceptance_criteria_json TEXT NOT NULL,
        review_expectations TEXT,
        status TEXT NOT NULL,
        execution_mode TEXT NOT NULL,
        workspace_required INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_specs_project_id
        ON specs(project_id, status, updated_at DESC);

      CREATE TABLE IF NOT EXISTS spec_card_links (
        id TEXT PRIMARY KEY,
        spec_id TEXT NOT NULL REFERENCES specs(id) ON DELETE CASCADE,
        work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
        decomposition_reason TEXT NOT NULL,
        acceptance_criteria_json TEXT NOT NULL,
        expected_output TEXT,
        created_at TEXT NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_spec_card_links_unique
        ON spec_card_links(spec_id, work_item_id);
      CREATE INDEX IF NOT EXISTS idx_spec_card_links_work_item_id
        ON spec_card_links(work_item_id);
    `,
  },
  {
    version: 12,
    sql: `
      ALTER TABLE conversations ADD COLUMN project_id TEXT REFERENCES projects(id) ON DELETE SET NULL;
      ALTER TABLE conversations ADD COLUMN kind TEXT NOT NULL DEFAULT 'general';
      ALTER TABLE conversations ADD COLUMN current_objective TEXT;
      ALTER TABLE conversations ADD COLUMN summary TEXT;
      ALTER TABLE conversations ADD COLUMN latest_proposal_kind TEXT;
      ALTER TABLE conversations ADD COLUMN recommended_next_action TEXT;
      ALTER TABLE conversations ADD COLUMN linked_objects_json TEXT;
      ALTER TABLE conversations ADD COLUMN parent_conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL;
      ALTER TABLE conversations ADD COLUMN branch_from_message_id TEXT;

      CREATE INDEX IF NOT EXISTS idx_conversations_project_id
        ON conversations(project_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_conversations_parent_conversation_id
        ON conversations(parent_conversation_id)
        WHERE parent_conversation_id IS NOT NULL;

      CREATE TABLE IF NOT EXISTS open_loops (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
        conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
        source_kind TEXT NOT NULL,
        title TEXT NOT NULL,
        detail TEXT,
        owner TEXT NOT NULL,
        waiting_on TEXT NOT NULL,
        blocking INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        recommended_action TEXT,
        dedupe_key TEXT NOT NULL UNIQUE,
        linked_objects_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        resolved_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_open_loops_status
        ON open_loops(status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_open_loops_project_id
        ON open_loops(project_id, status, updated_at DESC);
    `,
  },
] as const;

function ensureMigrationsTable(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
}

function applyMigrations(db: DatabaseSync) {
  ensureMigrationsTable(db);
  const applied = new Set(
    db
      .prepare('SELECT version FROM schema_migrations')
      .all<{ version: number }>()
      .map((row) => row.version),
  );

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) {
      continue;
    }

    db.exec('BEGIN');

    try {
      db.exec(migration.sql);
      db.prepare(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      ).run(migration.version, new Date().toISOString());
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

export function openProductStateDb(rootDir = process.cwd()) {
  const { dataDir, dbPath } = getProductStatePaths(rootDir);
  mkdirSync(dataDir, { recursive: true });

  const cached = dbCache.get(dbPath);
  if (cached) {
    return cached;
  }

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  applyMigrations(db);
  dbCache.set(dbPath, db);
  return db;
}

export function closeProductStateDb(rootDir = process.cwd()) {
  const { dbPath } = getProductStatePaths(rootDir);
  const db = dbCache.get(dbPath);
  if (!db) {
    return;
  }
  db.close();
  dbCache.delete(dbPath);
}

function countTable(db: DatabaseSync, table: string) {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
    .get<{ count: number }>();
  return row?.count ?? 0;
}

export function getProductStateHealth(rootDir = process.cwd()): ProductStateHealth {
  const db = openProductStateDb(rootDir);
  const { dbPath } = getProductStatePaths(rootDir);
  const schemaVersion =
    db
      .prepare('SELECT MAX(version) AS version FROM schema_migrations')
      .get<{ version: number | null }>()?.version ?? 0;

  const counts: ProductStateCounts = {
    conversations: countTable(db, 'conversations'),
    messages: countTable(db, 'messages'),
    projects: countTable(db, 'projects'),
    specs: countTable(db, 'specs'),
    workItems: countTable(db, 'work_items'),
    runs: countTable(db, 'runs'),
    runEvents: countTable(db, 'run_events'),
    artifacts: countTable(db, 'artifacts'),
    approvals: countTable(db, 'approvals'),
    reviewItems: countTable(db, 'review_items'),
    schedules: countTable(db, 'schedules'),
    memoryEntries: countTable(db, 'memory_entries'),
    memorySources: countTable(db, 'memory_sources'),
    savedLaunchPresets: countTable(db, 'saved_launch_presets'),
    launchDrafts: countTable(db, 'launch_drafts'),
  };

  return {
    dbPath,
    schemaVersion,
    counts,
  };
}
