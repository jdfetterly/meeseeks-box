import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { generateId } from '@/lib/id'
import { listRecommendedJobInstallations, recommendedJobs } from '@/lib/recommended-jobs'
import { closeProductStateDb } from '@/lib/product-state/db'
import { getProductStatePaths } from '@/lib/product-state/config'
import {
  createArtifactVersion,
  createConversation,
  createLaunchDraft,
  createMemorySource,
  createMessage,
  createProject,
  createRun,
  createRunEvent,
  createSavedLaunchPreset,
  createSchedule,
  createSpec,
  createSpecCardLink,
  createWorkItem,
  upsertProjectLearningSuggestion,
  upsertProjectPlaybook,
  upsertProjectWorkspace,
  upsertReviewItem,
  upsertApproval,
  upsertArtifactFamily,
  upsertInboxItem,
  upsertMemoryEntry,
  upsertNotificationDelivery,
  updateRunLifecycle,
  updateSchedule,
} from '@/lib/product-state/repositories'
import { syncRunSummary, syncScheduleSummary, syncWorkItemSummary } from '@/lib/product-state/projections'

function nowOffset(days: number, hours = 0) {
  const now = new Date()
  now.setDate(now.getDate() + days)
  now.setHours(now.getHours() + hours)
  return now.toISOString()
}

export function resetDemoDataset(rootDir = process.cwd()) {
  const { dataDir } = getProductStatePaths(rootDir)
  closeProductStateDb(rootDir)
  rmSync(dataDir, { recursive: true, force: true })
  mkdirSync(dataDir, { recursive: true })

  const workspacePath = process.env.WORKSPACE_PATH?.trim() || path.join(rootDir, 'workspace')
  const outputsDir = path.join(workspacePath, 'outputs')
  mkdirSync(outputsDir, { recursive: true })

  const morningPreset = createSavedLaunchPreset({
    title: recommendedJobs[0].title,
    scope: 'mini-ops',
    agentId: 'jarvis',
    priority: 'normal',
    outputType: recommendedJobs[0].outputType,
    timingPreference: 'now',
    promptTemplate: recommendedJobs[0].promptTemplate,
  }, rootDir)
  const weeklyPreset = createSavedLaunchPreset({
    title: recommendedJobs[1].title,
    scope: 'mini-ops',
    agentId: 'jarvis',
    priority: 'normal',
    outputType: recommendedJobs[1].outputType,
    timingPreference: 'now',
    promptTemplate: recommendedJobs[1].promptTemplate,
  }, rootDir)

  const opsConversation = createConversation({ scope: 'mini-ops', agentId: 'jarvis', title: 'Ops follow-up thread' }, rootDir)
  const personalConversation = createConversation({ scope: 'jd-personal', agentId: 'jd-personal', title: 'Personal planning' }, rootDir)
  const defaultConversation = createConversation({ scope: 'main', agentId: 'main', title: 'General coordination' }, rootDir)

  const platformProject = createProject({
    title: 'Meeseek Box Redesign',
    summary: 'Turn the app into a project-first, AI-forward workspace.',
    priority: 'high',
    linkedRepos: ['meeseeks-box', 'openclaw'],
    activeGoal: 'Ship the first vertical slice for briefing, board, review, and copilot.',
    currentFocus: 'Rebuild the board and dispatch flows around real project execution.',
  }, rootDir)
  const personalProject = createProject({
    title: 'Family Ops',
    summary: 'Keep childcare and planning work organized without operational overhead.',
    priority: 'normal',
    linkedRepos: ['family-systems'],
    activeGoal: 'Keep childcare review and weekly planning lightweight.',
    currentFocus: 'Protect the morning brief and childcare handoff flow.',
  }, rootDir)

  upsertProjectPlaybook({
    projectId: platformProject.id,
    goals: ['Make chat the control plane', 'Keep projects first-class', 'Split review from inbox'],
    preferredAgents: ['main', 'jarvis'],
    workingStyle: 'Prefer small executable feature cards and agent-led setup.',
    reviewPreferences: 'Default to review-ready output with clear summaries.',
    schedulePatterns: 'Use recurring jobs only when they clearly support a project.',
    repoContext: 'Main app repo plus openclaw reference implementation.',
    recentDecisions: ['Projects come before repos.', 'Use the CLI as an adapter, not the product model.'],
    updatedAt: nowOffset(-1),
  }, rootDir)
  upsertProjectPlaybook({
    projectId: personalProject.id,
    goals: ['Keep childcare planning low-friction', 'Summarize tomorrow in the morning brief'],
    preferredAgents: ['jd-personal'],
    workingStyle: 'Keep tasks short and fit around daily planning.',
    reviewPreferences: 'Surface only the outputs that need judgment.',
    schedulePatterns: 'Prefer weekly planning plus a daily brief.',
    repoContext: 'No heavy repo workflow; mostly recurring coordination.',
    recentDecisions: ['Avoid rebuilding the same childcare setup every week.'],
    updatedAt: nowOffset(-1),
  }, rootDir)

  const platformWorkspacePath = path.join(rootDir, 'workspaces', 'meeseek-box-redesign')
  mkdirSync(platformWorkspacePath, { recursive: true })
  writeFileSync(
    path.join(platformWorkspacePath, 'README.md'),
    '# Meeseek Box Redesign\n\nBootstrapped demo workspace.\n',
    'utf8',
  )
  upsertProjectWorkspace({
    id: generateId(),
    projectId: platformProject.id,
    mode: 'bootstrapped',
    workspacePath: platformWorkspacePath,
    repoName: 'meeseeks-box',
    repoUrl: 'https://github.com/jdfetterly/meeseeks-box',
    defaultBranch: 'main',
    status: 'ready',
    createdAt: nowOffset(-1),
    updatedAt: nowOffset(-1),
  }, rootDir)

  upsertProjectLearningSuggestion({
    id: generateId(),
    projectId: platformProject.id,
    suggestionType: 'agent_preference',
    title: 'Prefer smaller feature cards',
    detail: 'The recent project work keeps trending toward smaller, reviewable feature cards. Make that the default planning style for this project.',
    payload: { workingStyle: 'Bias toward smaller feature cards.' },
    status: 'open',
    createdAt: nowOffset(-1),
    updatedAt: nowOffset(-1),
  }, rootDir)

  createMessage({ conversationId: opsConversation.id, role: 'user', contentText: 'Turn the overnight failures into tracked work and summarize the childcare implications.' }, rootDir)
  createMessage({ conversationId: opsConversation.id, role: 'assistant', contentText: 'I found one failed schedule, one pending approval, and a conflict with tomorrow morning childcare coverage.' }, rootDir)
  createMessage({ conversationId: personalConversation.id, role: 'user', contentText: 'Plan the next few personal tasks around upcoming childcare days.' }, rootDir)
  createMessage({ conversationId: defaultConversation.id, role: 'user', contentText: 'Track the broad priorities for the week.' }, rootDir)

  const reviewWork = createWorkItem({
    title: 'Review Morning Ops Brief',
    scope: 'mini-ops',
    status: 'completed',
    projectId: platformProject.id,
    delegatedAgentId: 'jarvis',
    linkedRepos: ['meeseeks-box'],
    reviewState: 'review_ready',
    sourceConversationId: opsConversation.id,
  }, rootDir)
  const runningWork = createWorkItem({
    title: 'Investigate approval backlog',
    scope: 'mini-ops',
    status: 'running',
    projectId: platformProject.id,
    delegatedAgentId: 'vera',
    linkedRepos: ['meeseeks-box', 'openclaw'],
    sourceConversationId: opsConversation.id,
  }, rootDir)
  const failedWork = createWorkItem({
    title: 'Repair childcare sync job',
    scope: 'mini-ops',
    status: 'failed',
    projectId: personalProject.id,
    delegatedAgentId: 'scribe',
    linkedRepos: ['family-systems'],
  }, rootDir)
  const blockedWork = createWorkItem({
    title: 'Choose document storage path',
    scope: 'main',
    status: 'blocked',
    projectId: platformProject.id,
    delegatedAgentId: 'main',
    linkedRepos: ['meeseeks-box'],
  }, rootDir)
  const queuedWork = createWorkItem({
    title: 'Prepare weekly review notes',
    scope: 'jd-personal',
    status: 'queued',
    projectId: personalProject.id,
    delegatedAgentId: 'jd-personal',
    linkedRepos: ['family-systems'],
    sourceConversationId: personalConversation.id,
  }, rootDir)

  const redesignSpec = createSpec({
    projectId: platformProject.id,
    title: 'Board and copilot refresh',
    intent: 'Make the board and chat flow feel like a project-first AI workspace.',
    outcome: 'The board supports project execution and the copilot drives setup instead of forms.',
    inScope: ['Project-first board lanes', 'Copilot-led setup flow'],
    outOfScope: ['Full portfolio planning'],
    currentContext: 'This is the first vertical slice of the redesign.',
    dependencies: ['meeseeks-box', 'openclaw'],
    executionNotes: 'Keep cards small and reviewable.',
    acceptanceCriteria: [
      'Board reflects project workflow rather than operational lanes.',
      'Copilot can set up work with minimal manual form entry.',
    ],
    reviewExpectations: 'Show the board changes and summarize how the copilot flow works.',
    status: 'approved',
    executionMode: 'workspace_required',
    workspaceRequired: true,
  }, rootDir)
  createSpecCardLink({
    specId: redesignSpec.id,
    workItemId: runningWork.id,
    decompositionReason: 'Separate board execution changes from review flow changes.',
    acceptanceCriteria: ['Board supports project-first execution flow.'],
    expectedOutput: 'Updated board behavior ready for review.',
  }, rootDir)
  createSpecCardLink({
    specId: redesignSpec.id,
    workItemId: reviewWork.id,
    decompositionReason: 'Review output path should stay explicit and visible.',
    acceptanceCriteria: ['Completed outputs land in Review Queue with clear context.'],
    expectedOutput: 'Review-ready output summary and queue behavior.',
  }, rootDir)

  const completedRun = createRun({
    scope: 'mini-ops',
    triggerKind: 'cron',
    workItemId: reviewWork.id,
    conversationId: opsConversation.id,
    agentId: 'jarvis',
    status: 'completed',
    startedAt: nowOffset(-1),
    completedAt: nowOffset(-1),
  }, rootDir)
  createRunEvent({
    runId: completedRun.id,
    eventType: 'run_completed',
    sequenceKey: `demo-${completedRun.id}`,
    source: 'demo',
    payload: { resultText: 'Morning brief completed successfully.' },
  }, rootDir)

  const runningRun = createRun({
    scope: 'mini-ops',
    triggerKind: 'manual',
    workItemId: runningWork.id,
    conversationId: opsConversation.id,
    agentId: 'vera',
    status: 'waiting_approval',
    startedAt: nowOffset(0, -1),
  }, rootDir)
  createRunEvent({
    runId: runningRun.id,
    eventType: 'tool_failed',
    sequenceKey: `demo-${runningRun.id}`,
    source: 'demo',
    payload: { rawText: 'Write access requires explicit approval.', metadata: { retryable: true } },
  }, rootDir)

  const failedRun = createRun({
    scope: 'mini-ops',
    triggerKind: 'cron',
    workItemId: failedWork.id,
    agentId: 'scribe',
    status: 'failed',
    startedAt: nowOffset(-1, -3),
    completedAt: nowOffset(-1, -3),
  }, rootDir)
  createRunEvent({
    runId: failedRun.id,
    eventType: 'run_failed',
    sequenceKey: `demo-${failedRun.id}`,
    source: 'demo',
    payload: { rawText: 'Sheet read failed because the token expired.' },
  }, rootDir)

  const morningSchedule = createSchedule({
    sourceKind: 'runtime-native',
    sourceRef: reviewWork.id,
    label: 'Morning Ops Brief',
    status: 'scheduled',
    scheduleKind: 'cron',
    scheduleExpr: '0 7 * * *',
    nextRunAt: nowOffset(1),
    lastRunAt: nowOffset(-1),
    lastSuccessAt: nowOffset(-1),
    metadata: { recommendedJobSlug: 'morning-ops-brief', timezone: 'America/Los_Angeles' },
    externalJobId: 'cron-demo-morning',
  }, rootDir)
  const weeklySchedule = createSchedule({
    sourceKind: 'runtime-native',
    sourceRef: queuedWork.id,
    label: 'Weekly System Review',
    status: 'paused',
    scheduleKind: 'cron',
    scheduleExpr: '30 15 * * 5',
    nextRunAt: nowOffset(5),
    metadata: { recommendedJobSlug: 'weekly-system-review', timezone: 'America/Los_Angeles' },
    externalJobId: 'cron-demo-weekly',
  }, rootDir)
  const missedSchedule = createSchedule({
    sourceKind: 'runtime-native',
    sourceRef: failedWork.id,
    label: 'Childcare Digest',
    status: 'missed',
    scheduleKind: 'cron',
    scheduleExpr: '0 18 * * *',
    nextRunAt: nowOffset(0, 6),
    lastRunAt: nowOffset(-1),
    metadata: { timezone: 'America/Los_Angeles', lastRunOutcome: 'failed' },
    externalJobId: 'cron-demo-missed',
  }, rootDir)
  const oneShot = createSchedule({
    sourceKind: 'runtime-native',
    sourceRef: blockedWork.id,
    label: 'One-shot planning pass',
    status: 'scheduled',
    scheduleKind: 'at',
    scheduleExpr: nowOffset(0, 4),
    nextRunAt: nowOffset(0, 4),
    metadata: { syncStatus: 'runtime_synced' },
    externalJobId: 'cron-demo-once',
  }, rootDir)

  updateSchedule(missedSchedule.id, { missedRunFlag: true, consecutiveFailures: 1 }, rootDir)

  syncRunSummary(completedRun.id, rootDir)
  syncRunSummary(runningRun.id, rootDir)
  syncRunSummary(failedRun.id, rootDir)
  syncWorkItemSummary(reviewWork.id, rootDir)
  syncWorkItemSummary(runningWork.id, rootDir)
  syncWorkItemSummary(failedWork.id, rootDir)
  syncWorkItemSummary(blockedWork.id, rootDir)
  syncWorkItemSummary(queuedWork.id, rootDir)
  syncScheduleSummary(morningSchedule.id, rootDir)
  syncScheduleSummary(weeklySchedule.id, rootDir)
  syncScheduleSummary(missedSchedule.id, rootDir)
  syncScheduleSummary(oneShot.id, rootDir)

  upsertReviewItem({
    id: generateId(),
    projectId: platformProject.id,
    workItemId: reviewWork.id,
    artifactIds: [],
    producedByAgentId: 'jarvis',
    summary: 'Morning Ops Brief is ready to review.',
    reviewReason: 'The latest output should be judged before it becomes the default daily briefing pattern.',
    status: 'open',
    createdAt: nowOffset(-1),
    updatedAt: nowOffset(-1),
    reviewedAt: null,
  }, rootDir)

  const approval = upsertApproval({
    id: generateId(),
    runId: runningRun.id,
    status: 'pending',
    request: {
      workItemId: runningWork.id,
      approvalType: 'confirm',
      requestedActionType: 'workspace_write',
      command: 'write childcare brief',
    },
  }, rootDir)

  upsertInboxItem({
    id: generateId(),
    sourceKind: 'approval',
    sourceRef: approval.id,
    category: 'approval_required',
    status: 'open',
    title: 'Approval required for childcare brief write',
    detail: { approvalId: approval.id, workItemId: runningWork.id },
    dedupeKey: 'demo-approval-required',
    createdAt: nowOffset(0, -1),
    updatedAt: nowOffset(0, -1),
    resolvedAt: null,
  }, rootDir)
  upsertInboxItem({
    id: generateId(),
    sourceKind: 'run',
    sourceRef: failedRun.id,
    category: 'run_failure',
    status: 'open',
    title: 'Childcare digest failed',
    detail: { runId: failedRun.id, workItemId: failedWork.id, lastErrorText: 'Sheet read failed because the token expired.' },
    dedupeKey: 'demo-run-failure',
    createdAt: nowOffset(-1),
    updatedAt: nowOffset(-1),
    resolvedAt: null,
  }, rootDir)
  upsertInboxItem({
    id: generateId(),
    sourceKind: 'schedule',
    sourceRef: missedSchedule.id,
    category: 'missed_schedule',
    status: 'open',
    title: 'Childcare Digest missed its last run',
    detail: { scheduleId: missedSchedule.id, workItemId: failedWork.id },
    dedupeKey: 'demo-missed-schedule',
    createdAt: nowOffset(-1),
    updatedAt: nowOffset(-1),
    resolvedAt: null,
  }, rootDir)
  upsertInboxItem({
    id: generateId(),
    sourceKind: 'work_item',
    sourceRef: reviewWork.id,
    category: 'review_required',
    status: 'open',
    title: 'Morning Ops Brief is ready for review',
    detail: { workItemId: reviewWork.id },
    dedupeKey: 'demo-review-required',
    createdAt: nowOffset(-1),
    updatedAt: nowOffset(-1),
    resolvedAt: null,
  }, rootDir)
  const resolvedInbox = upsertInboxItem({
    id: generateId(),
    sourceKind: 'work_item',
    sourceRef: queuedWork.id,
    category: 'completed_review',
    status: 'resolved',
    title: 'Personal planning notes reviewed',
    detail: { workItemId: queuedWork.id },
    dedupeKey: 'demo-resolved-review',
    createdAt: nowOffset(-3),
    updatedAt: nowOffset(-2),
    resolvedAt: nowOffset(-2),
  }, rootDir)

  upsertNotificationDelivery({
    id: generateId(),
    inboxItemId: resolvedInbox.id,
    channel: 'slack',
    category: 'approval_required',
    status: 'sent',
    dedupeKey: 'demo-slack-delivery',
    payload: { channel: '#ops-alerts' },
    response: { ok: true },
    createdAt: nowOffset(-2),
    updatedAt: nowOffset(-2),
  }, rootDir)

  const morningPath = path.join(outputsDir, 'morning-ops-brief.md')
  const weeklyPath = path.join(outputsDir, 'weekly-system-review.md')
  writeFileSync(morningPath, '# Morning Ops Brief\n\n- Demo brief output\n')
  writeFileSync(weeklyPath, '# Weekly System Review\n\n- Demo weekly output\n')

  const morningFamily = upsertArtifactFamily({
    familyKey: 'schedule:' + morningSchedule.id + ':morning-ops-brief',
    title: 'Morning Ops Brief',
    scope: 'mini-ops',
    producerKind: 'schedule',
    producerId: morningSchedule.id,
    outputSlot: 'morning-ops-brief',
  }, rootDir)
  createArtifactVersion({
    artifactFamilyId: morningFamily.id,
    workItemId: reviewWork.id,
    runId: completedRun.id,
    name: 'morning-ops-brief.md',
    mimeType: 'text/markdown',
    storagePath: morningPath,
  }, rootDir)
  createArtifactVersion({
    artifactFamilyId: morningFamily.id,
    workItemId: reviewWork.id,
    name: 'morning-ops-brief-v2.md',
    mimeType: 'text/markdown',
    storagePath: morningPath,
  }, rootDir)

  const weeklyFamily = upsertArtifactFamily({
    familyKey: 'schedule:' + weeklySchedule.id + ':weekly-system-review',
    title: 'Weekly System Review',
    scope: 'mini-ops',
    producerKind: 'schedule',
    producerId: weeklySchedule.id,
    outputSlot: 'weekly-system-review',
  }, rootDir)
  createArtifactVersion({
    artifactFamilyId: weeklyFamily.id,
    workItemId: queuedWork.id,
    name: 'weekly-system-review.md',
    mimeType: 'text/markdown',
    storagePath: weeklyPath,
  }, rootDir)

  const parentMemory = upsertMemoryEntry({
    id: generateId(),
    scope: 'mini-ops',
    entryType: 'note',
    title: 'Childcare sheet is read-only',
    summary: 'All childcare schedule jobs must treat the Google Sheet as read-only.',
    canonicalPath: 'memory/childcare-guardrail.md',
    status: 'active',
    tags: ['childcare', 'guardrail'],
    createdAt: nowOffset(-4),
    updatedAt: nowOffset(-2),
    lastUsedAt: nowOffset(-1),
    reviewedAt: null,
    archivedAt: null,
    supersededById: null,
  }, rootDir)
  createMemorySource({
    memoryEntryId: parentMemory.id,
    sourceKind: 'manual_operator_edit',
    sourceRef: null,
    sourcePath: path.join(workspacePath, 'memory', 'childcare-guardrail.md'),
    notes: 'Seeded guardrail',
    payload: { demo: true },
    observedAt: nowOffset(-4),
  }, rootDir)
  const replacementMemory = upsertMemoryEntry({
    id: generateId(),
    scope: 'mini-ops',
    entryType: 'note',
    title: 'Morning brief must include childcare tomorrow',
    summary: 'Morning brief summaries should include today and tomorrow childcare ownership.',
    canonicalPath: 'memory/morning-brief-childcare.md',
    status: 'active',
    tags: ['childcare', 'brief'],
    createdAt: nowOffset(-2),
    updatedAt: nowOffset(-1),
    lastUsedAt: nowOffset(-1),
    reviewedAt: nowOffset(-1),
    archivedAt: null,
    supersededById: null,
  }, rootDir)
  createMemorySource({
    memoryEntryId: replacementMemory.id,
    sourceKind: 'conversation',
    sourceRef: opsConversation.id,
    sourcePath: null,
    notes: 'Derived from ops conversation',
    payload: { demo: true },
    observedAt: nowOffset(-2),
  }, rootDir)

  createLaunchDraft({
    title: 'Draft childcare follow-up',
    prompt: 'Draft a follow-up task for the childcare handoff next Wednesday.',
    scope: 'jd-personal',
    agentId: 'jd-personal',
    priority: 'normal',
    outputType: 'note',
    sourceConversationId: personalConversation.id,
  }, rootDir)

  return {
    presets: [morningPreset.id, weeklyPreset.id],
    contexts: ['main', 'jd-personal', 'mini-ops'],
    jobs: listRecommendedJobInstallations(rootDir).map((job) => job.slug),
  }
}
