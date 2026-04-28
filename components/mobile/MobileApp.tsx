'use client';

import { useEffect, useState } from 'react';
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

// ─── API response shapes ────────────────────────────────────────────────────

interface ApiApproval {
  id: string;
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
  status: string;
  updated_at?: string;
  updatedAt?: string;
}

interface ApiProject {
  id: string;
  title: string;
}

interface ApiMemoryEntry {
  id: string;
  title: string;
  summary?: string | null;
  status: string;
}

// ─── Data mappers ────────────────────────────────────────────────────────────

function mapApprovals(raw: ApiApproval[]): MobileApproval[] {
  return raw
    .filter((a) => a.status === 'pending')
    .map((a) => ({
      id: a.id,
      title: typeof a.request.description === 'string'
        ? a.request.description
        : a.requestedActionType.replace(/_/g, ' '),
      description: typeof a.request.summary === 'string'
        ? a.request.summary
        : typeof a.request.context === 'string'
          ? a.request.context
          : `Approval required for: ${a.requestedActionType.replace(/_/g, ' ')}`,
      recommendation: typeof a.request.recommendation === 'string'
        ? a.request.recommendation
        : 'Review and approve to continue',
      tags: [a.approvalType.replace(/_/g, ' ')],
    }));
}

function mapRunSummaries(raw: ApiRunSummary[]): MobileJob[] {
  return raw
    .filter((r) => ['waiting_approval', 'running', 'failed'].includes(r.status))
    .map((r) => {
      const id = r.run_id ?? r.id ?? '';
      const name =
        r.agent_id ?? r.agentId ??
        r.work_item_id ?? r.workItemId ??
        `run ${id.slice(0, 6)}`;
      const status: MobileJob['status'] =
        r.status === 'waiting_approval' ? 'waiting'
        : r.status === 'running' ? 'running'
        : 'failed';
      const errorText = r.last_error_text ?? r.lastErrorText ?? null;
      const lastEvent = r.last_event_type ?? r.lastEventType;
      return {
        id,
        name,
        status,
        statusText: lastEvent ? lastEvent.replace(/_/g, ' ') : r.status,
        recommendation: status === 'failed'
          ? 'Retry with updated context or check logs'
          : status === 'waiting'
            ? 'Review and approve to continue'
            : 'In progress',
        errorText,
        conversationId: r.conversation_id ?? r.conversationId ?? null,
      };
    });
}

function mapConversation(raw: ApiConversation[]): MobileConversation | null {
  const active = raw
    .filter((c) => c.status !== 'archived' && c.status !== 'superseded')
    .sort((a, b) => {
      const aTime = a.updated_at ?? a.updatedAt ?? '';
      const bTime = b.updated_at ?? b.updatedAt ?? '';
      return bTime.localeCompare(aTime);
    })[0];

  if (!active) return null;
  return {
    id: active.id,
    title: active.title ?? active.summary ?? 'Untitled conversation',
    lastMessage: active.summary ?? 'Continue the conversation',
    updatedAt: active.updated_at ?? active.updatedAt ?? new Date().toISOString(),
  };
}

function mapProjects(raw: ApiProject[]): MobileProject[] {
  return raw.map((p) => ({ id: p.id, title: p.title }));
}

function mapMemoryEntries(raw: ApiMemoryEntry[]): MobileBundle[] {
  return raw
    .filter((m) => m.status !== 'archived')
    .map((m, i) => ({
      id: m.id,
      name: m.title,
      summary: m.summary ?? null,
      pinned: m.status === 'active' && i < 2,
    }));
}

// ─── Main component ──────────────────────────────────────────────────────────

export function MobileApp() {
  const [tab, setTab] = useState<ActiveTab>('command');
  const [sheet, setSheet] = useState<ActiveSheet>(null);

  const [approvals, setApprovals] = useState<MobileApproval[]>([]);
  const [jobs, setJobs] = useState<MobileJob[]>([]);
  const [conversation, setConversation] = useState<MobileConversation | null>(null);
  const [projects, setProjects] = useState<MobileProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [bundles, setBundles] = useState<MobileBundle[]>([]);

  useEffect(() => {
    // Load all data in parallel
    Promise.all([
      fetch('/api/product-state/approvals')
        .then((r) => r.json())
        .then((d: { approvals?: ApiApproval[] }) => setApprovals(mapApprovals(d.approvals ?? [])))
        .catch(() => {}),

      fetch('/api/product-state/run-summaries')
        .then((r) => r.json())
        .then((d: { runSummaries?: ApiRunSummary[] }) => setJobs(mapRunSummaries(d.runSummaries ?? [])))
        .catch(() => {}),

      fetch('/api/product-state/conversations')
        .then((r) => r.json())
        .then((d: { conversations?: ApiConversation[] }) => setConversation(mapConversation(d.conversations ?? [])))
        .catch(() => {}),

      fetch('/api/product-state/projects')
        .then((r) => r.json())
        .then((d: { projects?: ApiProject[] }) => {
          const mapped = mapProjects(d.projects ?? []);
          setProjects(mapped);
          if (mapped.length > 0) setActiveProjectId(mapped[0].id);
        })
        .catch(() => {}),

      fetch('/api/product-state/memory/entries')
        .then((r) => r.json())
        .then((d: { entries?: ApiMemoryEntry[] } | ApiMemoryEntry[]) => {
          const entries = Array.isArray(d) ? d : (d.entries ?? []);
          setBundles(mapMemoryEntries(entries));
        })
        .catch(() => {}),
    ]);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const waitingJobCount = jobs.filter((j) => j.status === 'waiting').length;

  function handleApprove(id: string) {
    fetch(`/api/product-state/approvals/${id}/resolve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'allow-once' }),
    }).catch(() => {});
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  }

  function handleSkip(id: string) {
    fetch(`/api/product-state/approvals/${id}/resolve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision: 'deny' }),
    }).catch(() => {});
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  }

  function handleDismissWaiting(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  function handleTogglePin(id: string) {
    setBundles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, pinned: !b.pinned } : b)),
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        background: MB.bg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: MB.font,
        overflowX: 'hidden',
        maxWidth: '430px',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Tab content area */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
          />
        )}
      </div>

      {/* Command input */}
      <CommandInput />

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
      />

      <ProjectSwitcherSheet
        open={sheet?.kind === 'project-switcher'}
        onClose={() => setSheet(null)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSwitch={setActiveProjectId}
      />
    </div>
  );
}
