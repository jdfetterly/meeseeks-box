// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { closeProductStateDb } from '@/lib/product-state/db';
import {
  attachConversationToWorkItem,
  createArtifactVersion,
  createConversation,
  createLaunchDraft,
  createMessage,
  createRun,
  createSavedLaunchPreset,
  createSchedule,
  getArtifactFamilyByFamilyKey,
  getLaunchDraftById,
  createWorkItem,
  findRunByExternalRef,
  getApprovalById,
  listNotificationDeliveries,
  listArtifactFamilies,
  listArtifactVersionsByFamilyId,
  listLaunchDrafts,
  getScheduleById,
  listApprovals,
  listConversations,
  upsertInboxItem,
  listMessages,
  listRuns,
  listSavedLaunchPresets,
  listSchedules,
  listWorkItems,
  updateSchedule,
  upsertArtifactFamily,
  upsertNotificationDelivery,
  upsertApproval,
} from '@/lib/product-state/repositories';
import {
  installAllRecommendedJobs,
  installRecommendedJob,
  listRecommendedJobInstallations,
} from '@/lib/recommended-jobs';

const tempRoots: string[] = [];

function makeTempRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-repo-'));
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    closeProductStateDb(root);
    rmSync(root, { recursive: true, force: true });
  }
});

describe('product-state repositories', () => {
  it('creates and lists conversations in reverse update order', () => {
    const root = makeTempRoot();
    const first = createConversation({ scope: 'ops', title: 'Ops review' }, root);
    const second = createConversation({ scope: 'personal', title: 'Personal thread' }, root);

    const conversations = listConversations(root);

    expect(conversations).toHaveLength(2);
    expect(conversations[0].id).toBe(second.id);
    expect(conversations[1].id).toBe(first.id);
  });

  it('creates linked work items and runs', () => {
    const root = makeTempRoot();
    const conversation = createConversation({ scope: 'ops', title: 'Launch run' }, root);
    const workItem = createWorkItem(
      {
        title: 'Investigate overnight failures',
        scope: 'ops',
        sourceConversationId: conversation.id,
      },
      root,
    );

    const run = createRun(
      {
        scope: 'ops',
        triggerKind: 'manual',
        workItemId: workItem.id,
        conversationId: conversation.id,
        agentId: 'mini-ops',
        externalRunId: 'openclaw-run-123',
        externalSessionId: 'session-123',
        externalSessionKey: 'agent:mini-ops:main',
        status: 'queued',
      },
      root,
    );

    expect(listWorkItems(root)[0]).toMatchObject({
      id: workItem.id,
      sourceConversationId: conversation.id,
      status: 'queued',
    });

    expect(listRuns(root)[0]).toMatchObject({
      id: run.id,
      workItemId: workItem.id,
      conversationId: conversation.id,
      agentId: 'mini-ops',
      externalRunId: 'openclaw-run-123',
      externalSessionId: 'session-123',
      externalSessionKey: 'agent:mini-ops:main',
      triggerKind: 'manual',
    });

    expect(
      findRunByExternalRef(
        {
          externalRunId: 'openclaw-run-123',
        },
        root,
      ),
    ).toMatchObject({ id: run.id });
  });

  it('creates launch presets and schedules', () => {
    const root = makeTempRoot();

    const preset = createSavedLaunchPreset(
      {
        title: 'Morning review',
        scope: 'ops',
        agentId: 'mini-ops',
        timingPreference: 'now',
      },
      root,
    );
    const schedule = createSchedule(
      {
        sourceKind: 'runtime-native',
        sourceRef: 'work-123',
        label: 'Morning review at 9',
        status: 'pending_sync',
        scheduleKind: 'at',
        scheduleExpr: '2026-03-21T16:00:00.000Z',
        nextRunAt: '2026-03-21T16:00:00.000Z',
      },
      root,
    );

    expect(listSavedLaunchPresets(root)[0]).toMatchObject({
      id: preset.id,
      title: 'Morning review',
      agentId: 'mini-ops',
    });
    expect(listSchedules(root)[0]).toMatchObject({
      id: schedule.id,
      status: 'pending_sync',
      scheduleKind: 'at',
    });
  });

  it('installs starter jobs as deduped presets with childcare instructions intact', () => {
    const root = makeTempRoot();

    const before = listRecommendedJobInstallations(root);
    expect(before).toHaveLength(2);
    expect(before.every((job) => job.installedPresetId === null)).toBe(true);

    const firstInstall = installRecommendedJob('morning-ops-brief', root);
    expect(firstInstall.created).toBe(true);
    expect(firstInstall.preset.title).toBe('Morning Ops Brief');
    expect(firstInstall.preset.promptTemplate).toContain('docs.google.com/spreadsheets');
    expect(firstInstall.preset.promptTemplate).toContain('My childcare days are blue');
    expect(firstInstall.preset.promptTemplate).toContain('Do not modify the sheet');

    const secondInstall = installRecommendedJob('morning-ops-brief', root);
    expect(secondInstall.created).toBe(false);
    expect(secondInstall.preset.id).toBe(firstInstall.preset.id);

    const allInstalls = installAllRecommendedJobs(root);
    expect(allInstalls).toHaveLength(2);
    expect(listSavedLaunchPresets(root)).toHaveLength(2);
    expect(listRecommendedJobInstallations(root).every((job) => typeof job.installedPresetId === 'string')).toBe(true);

    const recurring = createSchedule(
      {
        sourceKind: 'runtime-native',
        sourceRef: 'work-123',
        label: 'Morning Ops Brief',
        status: 'scheduled',
        scheduleKind: 'cron',
        scheduleExpr: '0 7 * * *',
        metadata: { recommendedJobSlug: 'morning-ops-brief' },
      },
      root,
    );

    const afterSchedule = listRecommendedJobInstallations(root);
    expect(afterSchedule.find((job) => job.slug === 'morning-ops-brief')).toMatchObject({
      scheduledScheduleId: recurring.id,
      scheduledStatus: 'scheduled',
    });
  });

  it('creates and lists launch drafts separately from work items', () => {
    const root = makeTempRoot();

    const draft = createLaunchDraft(
      {
        title: 'Competitor research',
        prompt: 'Research competitor pricing',
        scope: 'ops',
        agentId: 'mini-ops',
      },
      root,
    );

    expect(getLaunchDraftById(draft.id, root)).toMatchObject({
      id: draft.id,
      title: 'Competitor research',
    });
    expect(listLaunchDrafts(root)).toHaveLength(1);
    expect(listWorkItems(root)).toHaveLength(0);
  });

  it('attaches a conversation to an existing work item when not already linked elsewhere', () => {
    const root = makeTempRoot();
    const conversation = createConversation({ scope: 'ops', title: 'Attach me' }, root);
    const workItem = createWorkItem(
      {
        title: 'Existing work',
        scope: 'ops',
      },
      root,
    );

    const updated = attachConversationToWorkItem(workItem.id, conversation.id, root);

    expect(updated.sourceConversationId).toBe(conversation.id);
  });

  it('updates schedules after runtime sync', () => {
    const root = makeTempRoot();
    const schedule = createSchedule(
      {
        sourceKind: 'runtime-native',
        sourceRef: 'work-123',
        label: 'Morning review at 9',
        status: 'pending_sync',
        scheduleKind: 'at',
        scheduleExpr: '2026-03-21T16:00:00.000Z',
        nextRunAt: '2026-03-21T16:00:00.000Z',
        metadata: { syncStatus: 'pending_runtime_sync' },
      },
      root,
    );

    const updated = updateSchedule(
      schedule.id,
      {
        status: 'scheduled',
        externalJobId: 'job-123',
        metadata: {
          syncStatus: 'runtime_synced',
          externalJobId: 'job-123',
        },
      },
      root,
    );

    expect(updated).toMatchObject({
      id: schedule.id,
      status: 'scheduled',
      externalJobId: 'job-123',
    });
    expect(getScheduleById(schedule.id, root)).toMatchObject({
      id: schedule.id,
      status: 'scheduled',
      externalJobId: 'job-123',
      metadata: {
        syncStatus: 'runtime_synced',
        externalJobId: 'job-123',
      },
    });
  });

  it('creates messages and keeps conversation ordering server-backed', () => {
    const root = makeTempRoot();
    const conversation = createConversation({ scope: 'ops', title: 'Shared chat' }, root);

    createMessage(
      {
        conversationId: conversation.id,
        role: 'user',
        contentText: 'Hello from the canonical chat layer',
      },
      root,
    );

    expect(listMessages(conversation.id, root)).toHaveLength(1);
    expect(listMessages(conversation.id, root)[0].contentText).toBe(
      'Hello from the canonical chat layer',
    );
    expect(listConversations(root)[0].id).toBe(conversation.id);
  });

  it('stores artifact families and immutable versions with stable ordering', () => {
    const root = makeTempRoot();
    const family = upsertArtifactFamily(
      {
        familyKey: 'work_item:work-123:summary-md',
        title: 'Summary output',
        scope: 'ops',
        producerKind: 'work_item',
        producerId: 'work-123',
        outputSlot: 'summary-md',
      },
      root,
    );

    const firstVersion = createArtifactVersion(
      {
        artifactFamilyId: family.id,
        name: 'summary.md',
        storagePath: '/tmp/summary-v1.md',
      },
      root,
    );
    const secondVersion = createArtifactVersion(
      {
        artifactFamilyId: family.id,
        name: 'summary.md',
        storagePath: '/tmp/summary-v2.md',
      },
      root,
    );

    expect(getArtifactFamilyByFamilyKey('work_item:work-123:summary-md', root)).toMatchObject({
      id: family.id,
      title: 'Summary output',
    });
    expect(listArtifactFamilies(root)).toHaveLength(1);
    expect(listArtifactVersionsByFamilyId(family.id, root)).toMatchObject([
      expect.objectContaining({
        id: secondVersion.id,
        versionNumber: 2,
        versionLabel: 'v0002',
      }),
      expect.objectContaining({
        id: firstVersion.id,
        versionNumber: 1,
        versionLabel: 'v0001',
      }),
    ]);
  });

  it('upserts approval records and derives work context from the stored request', () => {
    const root = makeTempRoot();
    const workItem = createWorkItem(
      {
        title: 'Approval target',
        scope: 'ops',
      },
      root,
    );
    const run = createRun(
      {
        scope: 'ops',
        triggerKind: 'manual',
        workItemId: workItem.id,
        externalRunId: 'run-approval-1',
      },
      root,
    );

    upsertApproval(
      {
        id: 'approval-1',
        runId: run.id,
        status: 'pending',
        request: {
          approvalType: 'confirm',
          requestedActionType: 'exec.write',
          workItemId: workItem.id,
        },
        requestedAt: '2026-03-20T12:00:00.000Z',
      },
      root,
    );

    expect(getApprovalById('approval-1', root)).toMatchObject({
      id: 'approval-1',
      runId: run.id,
      workItemId: workItem.id,
      status: 'pending',
      requestedActionType: 'exec.write',
    });
    expect(listApprovals(root)[0]).toMatchObject({
      id: 'approval-1',
      workItemId: workItem.id,
    });
  });

  it('stores notification deliveries with dedupe protection', () => {
    const root = makeTempRoot();

    upsertInboxItem(
      {
        id: 'inbox-1',
        sourceKind: 'approval',
        sourceRef: 'approval-1',
        category: 'approval_required',
        status: 'open',
        title: 'Approval required',
        detail: {},
        dedupeKey: 'approval:approval-1:required',
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:00.000Z',
        resolvedAt: null,
      },
      root,
    );

    upsertNotificationDelivery(
      {
        id: 'delivery-1',
        inboxItemId: 'inbox-1',
        channel: 'slack',
        category: 'approval_required',
        status: 'sent',
        dedupeKey: 'slack:approval:approval-1:required',
        payload: { text: 'Approval required' },
        response: { ok: true },
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:00.000Z',
      },
      root,
    );

    upsertNotificationDelivery(
      {
        id: 'delivery-2',
        inboxItemId: 'inbox-1',
        channel: 'slack',
        category: 'approval_required',
        status: 'sent',
        dedupeKey: 'slack:approval:approval-1:required',
        payload: { text: 'Approval required' },
        response: { ok: true, duplicate: true },
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:01.000Z',
      },
      root,
    );

    expect(listNotificationDeliveries(root)).toHaveLength(1);
    expect(listNotificationDeliveries(root)[0]).toMatchObject({
      channel: 'slack',
      response: { ok: true, duplicate: true },
    });
  });
});
