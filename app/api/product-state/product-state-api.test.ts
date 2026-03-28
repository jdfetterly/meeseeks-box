// @vitest-environment node

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { closeProductStateDb } from '@/lib/product-state/db';
import * as conversationRoute from '@/app/api/product-state/conversations/route';
import * as messageRoute from '@/app/api/product-state/conversations/[id]/messages/route';
import * as memoryArchiveRoute from '@/app/api/product-state/memory/entries/[id]/archive/route';
import * as memorySupersedeRoute from '@/app/api/product-state/memory/entries/[id]/supersede/route';
import * as memoryRoute from '@/app/api/product-state/memory/entries/route';
import * as workAttachRoute from '@/app/api/product-state/work-items/[id]/attach-conversation/route';
import * as artifactRoute from '@/app/api/product-state/artifacts/route';
import * as inboxRoute from '@/app/api/product-state/inbox/route';
import * as presetRoute from '@/app/api/product-state/presets/route';
import * as recommendedPresetRoute from '@/app/api/product-state/presets/recommended/route';
import * as recommendedScheduleRoute from '@/app/api/product-state/presets/recommended/schedule/route';
import * as projectRoute from '@/app/api/product-state/projects/route';
import * as reviewDecisionRoute from '@/app/api/product-state/review-items/[id]/decision/route';
import * as runSummaryRoute from '@/app/api/product-state/run-summaries/route';
import * as workItemRoute from '@/app/api/product-state/work-items/route';
import * as scheduleRoute from '@/app/api/product-state/schedules/route';
import * as scheduleArtifactRoute from '@/app/api/product-state/schedules/[id]/artifacts/route';
import * as scheduleDeleteRoute from '@/app/api/product-state/schedules/[id]/delete/route';
import * as schedulePauseRoute from '@/app/api/product-state/schedules/[id]/pause/route';
import * as scheduleReportOutputRoute from '@/app/api/product-state/schedules/[id]/report-output/route';
import * as scheduleResumeRoute from '@/app/api/product-state/schedules/[id]/resume/route';
import * as scheduleUpdateRecurringRoute from '@/app/api/product-state/schedules/[id]/update-recurring/route';
import * as scheduleSummaryRoute from '@/app/api/product-state/schedule-summaries/route';
import * as specDecomposeRoute from '@/app/api/product-state/specs/[id]/decompose/route';
import * as specDetailRoute from '@/app/api/product-state/specs/[id]/route';
import * as specRoute from '@/app/api/product-state/specs/route';
import * as workSummaryRoute from '@/app/api/product-state/work-summaries/route';
import * as runRoute from '@/app/api/product-state/runs/route';
import { bootstrapProjectWorkspace } from '@/lib/projects/service';
import { projectInboxFromScheduleSummary, syncScheduleSummary } from '@/lib/product-state/projections';
import {
  createConversation,
  createMessage,
  createSpec,
  createSpecCardLink,
  createWorkItem,
  getConversationById,
  getSpecCardLinkByWorkItemId,
  getWorkItemById,
  listReviewItems,
  upsertReviewItem,
} from '@/lib/product-state/repositories';

const tempDirs: string[] = [];

function useTempStateDir() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-api-'));
  tempDirs.push(dir);
  process.env.MEESEEKS_BOX_STATE_DIR = dir;
  process.env.WORKSPACE_PATH = path.join(dir, 'workspace');
  process.env.MEESEEKS_BOX_MEMORY_BOOTSTRAP_ENABLED = 'true';
  return dir;
}

afterEach(() => {
  closeProductStateDb();
  delete process.env.MEESEEKS_BOX_STATE_DIR;
  delete process.env.WORKSPACE_PATH;
  delete process.env.MEESEEKS_BOX_MEMORY_BOOTSTRAP_ENABLED;

  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('product-state api routes', () => {
  it('creates and lists conversations', async () => {
    useTempStateDir();

    const createResponse = await conversationRoute.POST(
      new Request('http://localhost/api/product-state/conversations', {
        method: 'POST',
        body: JSON.stringify({ scope: 'ops', title: 'Morning review' }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );

    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    expect(created.conversation.scope).toBe('mini-ops');

    const listResponse = await conversationRoute.GET();
    const listed = await listResponse.json();

    expect(listed.conversations).toHaveLength(1);
    expect(listed.conversations[0].title).toBe('Morning review');
  });

  it('creates and lists work items and runs', async () => {
    useTempStateDir();

    const workItemResponse = await workItemRoute.POST(
      new Request('http://localhost/api/product-state/work-items', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Review overnight failures',
          scope: 'ops',
          status: 'queued',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );

    expect(workItemResponse.status).toBe(201);
    const createdWorkItem = await workItemResponse.json();

    const runResponse = await runRoute.POST(
      new Request('http://localhost/api/product-state/runs', {
        method: 'POST',
        body: JSON.stringify({
          scope: 'ops',
          triggerKind: 'manual',
          workItemId: createdWorkItem.workItem.id,
          agentId: 'mini-ops',
          externalRunId: 'openclaw-run-999',
          externalSessionId: 'session-999',
          externalSessionKey: 'agent:mini-ops:main',
          status: 'queued',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );

    expect(runResponse.status).toBe(201);

    const workItems = await (await workItemRoute.GET()).json();
    const runs = await (await runRoute.GET()).json();

    expect(workItems.workItems).toHaveLength(1);
    expect(runs.runs).toHaveLength(1);
    expect(runs.runs[0].workItemId).toBe(createdWorkItem.workItem.id);
    expect(runs.runs[0].externalRunId).toBe('openclaw-run-999');
    expect(runs.runs[0].externalSessionKey).toBe('agent:mini-ops:main');

    const runSummaries = await (await runSummaryRoute.GET()).json();
    const workSummaries = await (await workSummaryRoute.GET()).json();
    const inbox = await (await inboxRoute.GET()).json();

    expect(runSummaries.runSummaries).toHaveLength(1);
    expect(workSummaries.workSummaries).toHaveLength(1);
    expect(inbox.inboxItems).toHaveLength(0);
  });

  it('creates a spec and decomposes it into cards for a workspace-ready project', async () => {
    useTempStateDir();

    const projectResponse = await projectRoute.POST(
      new Request('http://localhost/api/product-state/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Spec Project',
          priority: 'high',
          linkedRepos: ['meeseeks-box'],
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    expect(projectResponse.status).toBe(201);
    const projectPayload = await projectResponse.json();
    const projectId = projectPayload.project.id as string;

    bootstrapProjectWorkspace(projectId);

    const createSpecResponse = await specRoute.POST(
      new Request('http://localhost/api/product-state/specs', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          title: 'Project-first board',
          intent: 'Rework the board around project execution.',
          outcome: 'Board shows project execution flow.',
          inScope: ['Board lanes', 'Card badges'],
          acceptanceCriteria: ['Project flow is default.', 'Operational state remains visible.'],
          executionMode: 'workspace_required',
          status: 'approved',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    expect(createSpecResponse.status).toBe(201);
    const specPayload = await createSpecResponse.json();
    const specId = specPayload.spec.id as string;

    const specDetail = await specDetailRoute.GET({} as never, { params: Promise.resolve({ id: specId }) });
    expect(specDetail.status).toBe(200);

    const draftDecomposition = await specDecomposeRoute.POST(
      new Request(`http://localhost/api/product-state/specs/${specId}/decompose`, {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
      { params: Promise.resolve({ id: specId }) },
    );
    expect(draftDecomposition.status).toBe(200);
    const draftPayload = await draftDecomposition.json();
    expect(draftPayload.cards.length).toBeGreaterThan(0);

    const confirmDecomposition = await specDecomposeRoute.POST(
      new Request(`http://localhost/api/product-state/specs/${specId}/decompose`, {
        method: 'POST',
        body: JSON.stringify({
          confirm: true,
          cards: draftPayload.cards,
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
      { params: Promise.resolve({ id: specId }) },
    );
    expect(confirmDecomposition.status).toBe(201);

    const workSummaries = await (await workSummaryRoute.GET()).json();
    expect(workSummaries.workSummaries.length).toBeGreaterThan(0);
  });

  it('creates and lists launch presets and schedules', async () => {
    useTempStateDir();

    const presetResponse = await presetRoute.POST(
      new Request('http://localhost/api/product-state/presets', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Morning review',
          scope: 'ops',
          agentId: 'mini-ops',
          timingPreference: 'now',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );

    expect(presetResponse.status).toBe(201);

    const scheduleResponse = await scheduleRoute.POST(
      new Request('http://localhost/api/product-state/schedules', {
        method: 'POST',
        body: JSON.stringify({
          sourceKind: 'runtime-native',
          sourceRef: 'work-123',
          label: 'Morning review at 9',
          status: 'pending_sync',
          scheduleKind: 'at',
          scheduleExpr: '2026-03-21T16:00:00.000Z',
          nextRunAt: '2026-03-21T16:00:00.000Z',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );

    expect(scheduleResponse.status).toBe(201);

    const presets = await (await presetRoute.GET()).json();
    const schedules = await (await scheduleRoute.GET()).json();
    const scheduleSummaries = await (await scheduleSummaryRoute.GET()).json();

    expect(presets.presets).toHaveLength(1);
    expect(schedules.schedules).toHaveLength(1);
    expect(scheduleSummaries.scheduleSummaries).toHaveLength(1);
    expect(scheduleSummaries.scheduleSummaries[0].status).toBe('pending_sync');
  });

  it('lists and installs recommended starter jobs without duplicating presets', async () => {
    useTempStateDir();

    const before = await recommendedPresetRoute.GET();
    const beforePayload = await before.json();
    expect(beforePayload.jobs).toHaveLength(2);
    expect(beforePayload.jobs[0].includes).toBeTruthy();

    const installResponse = await recommendedPresetRoute.POST(
      new Request('http://localhost/api/product-state/presets/recommended', {
        method: 'POST',
        body: JSON.stringify({ slug: 'morning-ops-brief' }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    expect(installResponse.status).toBe(201);
    const installed = await installResponse.json();
    expect(installed.created).toBe(true);
    expect(installed.preset.title).toBe('Morning Ops Brief');

    const duplicateResponse = await recommendedPresetRoute.POST(
      new Request('http://localhost/api/product-state/presets/recommended', {
        method: 'POST',
        body: JSON.stringify({ slug: 'morning-ops-brief' }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    expect(duplicateResponse.status).toBe(200);
    const duplicate = await duplicateResponse.json();
    expect(duplicate.created).toBe(false);

    const installAllResponse = await recommendedPresetRoute.POST(
      new Request('http://localhost/api/product-state/presets/recommended', {
        method: 'POST',
        body: JSON.stringify({ installAll: true }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    expect(installAllResponse.status).toBe(201);

    const presets = await (await presetRoute.GET()).json();
    expect(presets.presets).toHaveLength(2);
    expect(
      presets.presets.some((preset: { promptTemplate: string }) =>
        preset.promptTemplate.includes('Do not modify the sheet'),
      ),
    ).toBe(true);
  });

  it('creates a recurring schedule from an installed starter job', async () => {
    useTempStateDir();

    const response = await recommendedScheduleRoute.POST(
      new Request('http://localhost/api/product-state/presets/recommended/schedule', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'morning-ops-brief',
          time: '07:30',
          timezone: 'America/Los_Angeles',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.created).toBe(true);
    expect(payload.runtimeSyncStatus).toBe('pending');

    const schedules = await (await scheduleRoute.GET()).json();
    expect(schedules.schedules).toHaveLength(1);
    expect(schedules.schedules[0]).toMatchObject({
      scheduleKind: 'cron',
      scheduleExpr: '30 7 * * *',
      status: 'pending_sync',
    });
    expect(schedules.schedules[0].metadata).toMatchObject({
      recommendedJobSlug: 'morning-ops-brief',
      cadenceKind: 'daily',
      syncStatus: 'runtime-sync-disabled',
    });
    expect(schedules.schedules[0].metadata.prompt).toContain(`--schedule ${payload.scheduleId}`);
  });

  it('pauses, edits, resumes, and deletes recurring starter-job schedules through the API', async () => {
    useTempStateDir();

    const createResponse = await recommendedScheduleRoute.POST(
      new Request('http://localhost/api/product-state/presets/recommended/schedule', {
        method: 'POST',
        body: JSON.stringify({
          slug: 'weekly-system-review',
          time: '16:00',
          weekday: 'sunday',
          timezone: 'America/Los_Angeles',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    const created = await createResponse.json();

    const paused = await schedulePauseRoute.POST(
      new Request(`http://localhost/api/product-state/schedules/${created.scheduleId}/pause`, {
        method: 'POST',
      }) as never,
      { params: Promise.resolve({ id: created.scheduleId }) },
    );
    expect(paused.status).toBe(200);

    const updated = await scheduleUpdateRecurringRoute.POST(
      new Request(`http://localhost/api/product-state/schedules/${created.scheduleId}/update-recurring`, {
        method: 'POST',
        body: JSON.stringify({
          time: '15:30',
          weekday: 'friday',
          timezone: 'America/Los_Angeles',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
      { params: Promise.resolve({ id: created.scheduleId }) },
    );
    expect(updated.status).toBe(200);

    const resumed = await scheduleResumeRoute.POST(
      new Request(`http://localhost/api/product-state/schedules/${created.scheduleId}/resume`, {
        method: 'POST',
      }) as never,
      { params: Promise.resolve({ id: created.scheduleId }) },
    );
    expect(resumed.status).toBe(200);

    const deleted = await scheduleDeleteRoute.POST(
      new Request(`http://localhost/api/product-state/schedules/${created.scheduleId}/delete`, {
        method: 'POST',
      }) as never,
      { params: Promise.resolve({ id: created.scheduleId }) },
    );
    expect(deleted.status).toBe(200);

    const schedules = await (await scheduleRoute.GET()).json();
    const deletedSchedule = schedules.schedules.find((schedule: { id: string }) => schedule.id === created.scheduleId);
    expect(deletedSchedule).toMatchObject({
      status: 'deleted',
      externalJobId: null,
    });

    const workItems = await (await workItemRoute.GET()).json();
    const archivedWorkItem = workItems.workItems.find((workItem: { id: string }) => workItem.id === created.workItemId);
    expect(archivedWorkItem).toMatchObject({
      status: 'archived',
    });
  });

  it('creates and lists messages for a canonical conversation', async () => {
    useTempStateDir();

    const conversationResponse = await conversationRoute.POST(
      new Request('http://localhost/api/product-state/conversations', {
        method: 'POST',
        body: JSON.stringify({ scope: 'ops', title: 'Shared chat' }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    const conversation = await conversationResponse.json();

    const createResponse = await messageRoute.POST(
      new Request(
        `http://localhost/api/product-state/conversations/${conversation.conversation.id}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            role: 'user',
            contentText: 'Hello from the shared chat layer',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      ) as never,
      { params: Promise.resolve({ id: conversation.conversation.id }) },
    );

    expect(createResponse.status).toBe(201);

    const listResponse = await messageRoute.GET(
      new Request(
        `http://localhost/api/product-state/conversations/${conversation.conversation.id}/messages`,
      ) as never,
      { params: Promise.resolve({ id: conversation.conversation.id }) },
    );
    const listed = await listResponse.json();

    expect(listed.messages).toHaveLength(1);
    expect(listed.messages[0].contentText).toBe('Hello from the shared chat layer');
  });

  it('registers and lists artifact families with immutable versions', async () => {
    useTempStateDir();

    const registerResponse = await artifactRoute.POST(
      new Request('http://localhost/api/product-state/artifacts', {
        method: 'POST',
        body: JSON.stringify({
          scope: 'ops',
          producerKind: 'work_item',
          producerId: 'work-123',
          outputSlot: 'summary-md',
          title: 'Summary output',
          name: 'summary.md',
          storagePath: '/tmp/summary-v1.md',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );

    expect(registerResponse.status).toBe(201);

    const listResponse = await artifactRoute.GET();
    const listed = await listResponse.json();

    expect(listed.artifacts).toHaveLength(1);
    expect(listed.artifacts[0].family.familyKey).toBe('work_item:work-123:summary-md');
    expect(listed.artifacts[0].versions[0].versionLabel).toBe('v0001');
  });

  it('registers schedule-produced artifact files that already exist in the workspace', async () => {
    const stateDir = useTempStateDir();
    const workspaceDir = path.join(stateDir, 'workspace');
    const outputsDir = path.join(workspaceDir, 'outputs');
    mkdirSync(outputsDir, { recursive: true });
    const outputPath = path.join(outputsDir, 'weekly-brief.md');
    writeFileSync(outputPath, '# Weekly Brief\n\nHello.\n', 'utf8');

    const scheduleResponse = await scheduleRoute.POST(
      new Request('http://localhost/api/product-state/schedules', {
        method: 'POST',
        body: JSON.stringify({
          sourceKind: 'runtime-native',
          sourceRef: 'work-123',
          label: 'Morning review at 9',
          status: 'scheduled',
          scheduleKind: 'at',
          scheduleExpr: '2026-03-21T16:00:00.000Z',
          nextRunAt: '2026-03-21T16:00:00.000Z',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );

    const createdSchedule = await scheduleResponse.json();

    const registerResponse = await scheduleArtifactRoute.POST(
      new Request(
        `http://localhost/api/product-state/schedules/${createdSchedule.schedule.id}/artifacts`,
        {
          method: 'POST',
          body: JSON.stringify({
            filePath: outputPath,
            outputSlot: 'weekly-brief',
            title: 'Weekly Brief',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      ) as never,
      { params: Promise.resolve({ id: createdSchedule.schedule.id }) },
    );

    expect(registerResponse.status).toBe(201);

    const listed = await (await artifactRoute.GET()).json();
    expect(listed.artifacts).toHaveLength(1);
    expect(listed.artifacts[0].family.producerKind).toBe('schedule');
    expect(listed.artifacts[0].family.producerId).toBe(createdSchedule.schedule.id);
    expect(listed.artifacts[0].versions[0].storagePath).toBe(outputPath);
    expect(listed.artifacts[0].versions[0].metadata.registrationSource).toBe(
      'schedule_manual_registration',
    );
  });

  it('reports a scheduled output file and updates schedule health', async () => {
    const stateDir = useTempStateDir();
    const workspaceDir = path.join(stateDir, 'workspace');
    const outputsDir = path.join(workspaceDir, 'outputs');
    mkdirSync(outputsDir, { recursive: true });
    const outputPath = path.join(outputsDir, 'reported-brief.md');
    const secondOutputPath = path.join(outputsDir, 'reported-brief-v2.md');
    writeFileSync(outputPath, '# Reported Brief\n\nHello.\n', 'utf8');
    writeFileSync(secondOutputPath, '# Reported Brief v2\n\nHello again.\n', 'utf8');

    const scheduleResponse = await scheduleRoute.POST(
      new Request('http://localhost/api/product-state/schedules', {
        method: 'POST',
        body: JSON.stringify({
          sourceKind: 'runtime-native',
          sourceRef: 'work-123',
          label: 'Reported output job',
          status: 'missed',
          scheduleKind: 'at',
          scheduleExpr: '2026-03-21T16:00:00.000Z',
          nextRunAt: '2026-03-21T16:00:00.000Z',
          missedRunFlag: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );

    const createdSchedule = await scheduleResponse.json();
    projectInboxFromScheduleSummary(syncScheduleSummary(createdSchedule.schedule.id), stateDir);

    const inboxBefore = await (await inboxRoute.GET()).json();
    expect(inboxBefore.inboxItems).toHaveLength(1);
    expect(inboxBefore.inboxItems[0].category).toBe('missed_schedule');

    const reportResponse = await scheduleReportOutputRoute.POST(
      new Request(
        `http://localhost/api/product-state/schedules/${createdSchedule.schedule.id}/report-output`,
        {
          method: 'POST',
          body: JSON.stringify({
            filePath: outputPath,
            outputSlot: 'reported-brief',
            title: 'Reported Brief',
            reportedAt: '2026-03-22T17:00:00.000Z',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      ) as never,
      { params: Promise.resolve({ id: createdSchedule.schedule.id }) },
    );

    expect(reportResponse.status).toBe(201);
    const payload = await reportResponse.json();
    expect(payload.registration.family.producerKind).toBe('schedule');
    expect(payload.registration.version.metadata.registrationSource).toBe(
      'schedule_reported_output',
    );
    expect(payload.schedule.status).toBe('completed');
    expect(payload.schedule.lastSuccessAt).toBe('2026-03-22T17:00:00.000Z');
    expect(payload.scheduleSummary.status).toBe('completed');
    expect(payload.scheduleSummary.lastSuccessfulOutputAt).toBe('2026-03-22T17:00:00.000Z');

    const inboxAfterFirstReport = await (await inboxRoute.GET()).json();
    expect(inboxAfterFirstReport.inboxItems).toHaveLength(1);
    expect(inboxAfterFirstReport.inboxItems[0]).toMatchObject({
      category: 'missed_schedule',
      status: 'resolved',
      sourceRef: createdSchedule.schedule.id,
    });

    const secondReportResponse = await scheduleReportOutputRoute.POST(
      new Request(
        `http://localhost/api/product-state/schedules/${createdSchedule.schedule.id}/report-output`,
        {
          method: 'POST',
          body: JSON.stringify({
            filePath: secondOutputPath,
            outputSlot: 'reported-brief',
            title: 'Reported Brief',
            reportedAt: '2026-03-22T18:00:00.000Z',
          }),
          headers: { 'Content-Type': 'application/json' },
        },
      ) as never,
      { params: Promise.resolve({ id: createdSchedule.schedule.id }) },
    );

    expect(secondReportResponse.status).toBe(201);
    const secondPayload = await secondReportResponse.json();
    expect(secondPayload.registration.family.id).toBe(payload.registration.family.id);
    expect(secondPayload.registration.version.versionLabel).toBe('v0002');

    const artifacts = await (await artifactRoute.GET()).json();
    expect(artifacts.artifacts).toHaveLength(1);
    expect(artifacts.artifacts[0].versions).toHaveLength(2);
    expect(artifacts.artifacts[0].versions[0].versionLabel).toBe('v0002');
    expect(artifacts.artifacts[0].versions[1].versionLabel).toBe('v0001');
    expect(artifacts.artifacts[0].versions[0].metadata.registrationSource).toBe(
      'schedule_reported_output',
    );
  });

  it('archives and supersedes memory entries without deleting source content', async () => {
    useTempStateDir();

    const firstResponse = await memoryRoute.POST(
      new Request('http://localhost/api/product-state/memory/entries', {
        method: 'POST',
        body: JSON.stringify({
          scope: 'ops',
          relativePath: 'first.md',
          content: '# First\n',
          contentType: 'markdown',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    const secondResponse = await memoryRoute.POST(
      new Request('http://localhost/api/product-state/memory/entries', {
        method: 'POST',
        body: JSON.stringify({
          scope: 'ops',
          relativePath: 'second.md',
          content: '# Second\n',
          contentType: 'markdown',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    const first = await firstResponse.json();
    const second = await secondResponse.json();

    const archiveResponse = await memoryArchiveRoute.POST(
      new Request(
        `http://localhost/api/product-state/memory/entries/${first.memoryEntry.id}/archive`,
        { method: 'POST' },
      ) as never,
      { params: Promise.resolve({ id: first.memoryEntry.id }) },
    );
    expect(archiveResponse.status).toBe(200);

    const supersedeResponse = await memorySupersedeRoute.POST(
      new Request(
        `http://localhost/api/product-state/memory/entries/${first.memoryEntry.id}/supersede`,
        {
          method: 'POST',
          body: JSON.stringify({ supersededById: second.memoryEntry.id }),
          headers: { 'Content-Type': 'application/json' },
        },
      ) as never,
      { params: Promise.resolve({ id: first.memoryEntry.id }) },
    );
    expect(supersedeResponse.status).toBe(200);

    const listed = await (await memoryRoute.GET()).json();
    expect(listed.memoryEntries.find((entry: { id: string }) => entry.id === first.memoryEntry.id))
      .toMatchObject({
        status: 'superseded',
        supersededById: second.memoryEntry.id,
      });
  });

  it('attaches a conversation to an existing work item through the API', async () => {
    useTempStateDir();

    const conversationResponse = await conversationRoute.POST(
      new Request('http://localhost/api/product-state/conversations', {
        method: 'POST',
        body: JSON.stringify({ scope: 'ops', title: 'Existing thread' }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    const conversation = await conversationResponse.json();

    const workItemResponse = await workItemRoute.POST(
      new Request('http://localhost/api/product-state/work-items', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Already tracked work',
          scope: 'ops',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    const workItem = await workItemResponse.json();

    const attachResponse = await workAttachRoute.POST(
      new Request(
        `http://localhost/api/product-state/work-items/${workItem.workItem.id}/attach-conversation`,
        {
          method: 'POST',
          body: JSON.stringify({ conversationId: conversation.conversation.id }),
          headers: { 'Content-Type': 'application/json' },
        },
      ) as never,
      { params: Promise.resolve({ id: workItem.workItem.id }) },
    );

    expect(attachResponse.status).toBe(200);

    const workItems = await (await workItemRoute.GET()).json();
    expect(workItems.workItems[0].sourceConversationId).toBe(conversation.conversation.id);
  });

  it('creates a follow-up work item when review requests changes', async () => {
    useTempStateDir();

    const conversation = createConversation({
      scope: 'mini-ops',
      title: 'Planning thread',
      kind: 'planning',
      status: 'active',
    });
    createMessage({
      conversationId: conversation.id,
      role: 'user',
      contentText: 'Break this plan into work.',
    });

    const projectResponse = await projectRoute.POST(
      new Request('http://localhost/api/product-state/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Review follow-up project',
          priority: 'high',
          linkedRepos: ['meeseeks-box'],
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    );
    const projectPayload = await projectResponse.json();
    const projectId = projectPayload.project.id as string;

    const spec = createSpec({
      projectId,
      title: 'Review-aware execution',
      intent: 'Keep review as a primary decision surface.',
      outcome: 'Review can create follow-up work.',
      inScope: ['Review decision actions'],
      outOfScope: [],
      currentContext: null,
      dependencies: [],
      executionNotes: null,
      acceptanceCriteria: ['Request changes creates follow-up work.'],
      reviewExpectations: 'Return with corrected output.',
      status: 'approved',
      executionMode: 'planning_only',
      workspaceRequired: false,
    });

    const originalWork = createWorkItem({
      title: 'Draft review surface changes',
      scope: 'mini-ops',
      status: 'completed',
      projectId,
      linkedRepos: ['meeseeks-box'],
      reviewState: 'review_ready',
      sourceConversationId: conversation.id,
    });

    createSpecCardLink({
      specId: spec.id,
      workItemId: originalWork.id,
      decompositionReason: 'Review needs a concrete decision surface.',
      acceptanceCriteria: ['User can accept or request changes.'],
      expectedOutput: 'Updated review queue behavior.',
    });

    const now = new Date().toISOString();
    const reviewItem = upsertReviewItem({
      id: 'review-item-1',
      projectId,
      workItemId: originalWork.id,
      artifactIds: [],
      producedByAgentId: 'mini-ops',
      summary: 'Review queue output is ready',
      reviewReason: 'The output still needs a follow-up path for requested changes.',
      status: 'open',
      createdAt: now,
      updatedAt: now,
      reviewedAt: null,
    });

    const decisionResponse = await reviewDecisionRoute.POST(
      new Request(`http://localhost/api/product-state/review-items/${reviewItem.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision: 'request_changes',
          feedback: 'Create a follow-up work item that preserves plan lineage.',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
      { params: Promise.resolve({ id: reviewItem.id }) },
    );

    expect(decisionResponse.status).toBe(201);
    const payload = await decisionResponse.json();
    expect(payload.followUpWorkItem.title).toContain('follow-up');

    const reviewItems = listReviewItems({ projectId });
    expect(reviewItems.find((item) => item.id === reviewItem.id)?.status).toBe('reviewed');

    const createdFollowUp = getWorkItemById(payload.followUpWorkItem.id);
    expect(createdFollowUp?.projectId).toBe(projectId);
    expect(createdFollowUp?.sourceConversationId).toBe(conversation.id);
    expect(createdFollowUp?.reviewState).toBe('not_ready');

    const followUpLink = getSpecCardLinkByWorkItemId(payload.followUpWorkItem.id);
    expect(followUpLink?.specId).toBe(spec.id);
    expect(followUpLink?.expectedOutput).toBe('Return with corrected output.');

    const updatedConversation = getConversationById(conversation.id);
    expect(updatedConversation?.status).toBe('needs_follow_up');
    expect(updatedConversation?.recommendedNextAction).toContain(payload.followUpWorkItem.title);
  });
});
