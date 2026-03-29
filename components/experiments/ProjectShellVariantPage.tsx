'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { AssistantWorkspacePanel } from '@/components/experiments/AssistantWorkspacePanel';
import { BoardExecutionSurface } from '@/components/experiments/BoardExecutionSurface';
import { MemoryContextRail } from '@/components/experiments/MemoryContextRail';
import { ProjectExecutionHeader } from '@/components/experiments/ProjectExecutionHeader';
import { ReviewPreviewPanel } from '@/components/experiments/ReviewPreviewPanel';
import { StandingWorkPreviewPanel } from '@/components/experiments/StandingWorkPreviewPanel';
import { ActiveWorkPane } from '@/components/experiments/ActiveWorkPane';
import { ClipboardList, Brain, Plus } from 'lucide-react';
import type { ProjectShellModel, ActiveWorkPaneModel } from '@/lib/experiments/project-shell';
import type { ShellVariant } from '@/lib/experiments/shell-variants';
import type { WorkBoardLane, WorkBoardCard } from '@/lib/work-board/service';

export function ProjectShellVariantPage({
  basePath,
  model,
  variant,
}: {
  basePath: string;
  model: ProjectShellModel;
  variant: ShellVariant;
}) {
  const detail = model.projectDetail;
  const currentPlan = model.currentPlan?.spec ?? null;
  const currentPlanDetail = model.currentPlan;
  const hasCards = (currentPlanDetail?.links.length ?? 0) > 0;
  const workspaceReady = detail.summary.workspaceStatus === 'ready';

  const [localLanes, setLocalLanes] = useState<WorkBoardLane[]>(model.lanes);
  const [localActiveMockData, setLocalActiveMockData] = useState<ActiveWorkPaneModel | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  const handleAddNewTask = (title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    const mockId = `mock-${Date.now()}`;
    const newCard = {
      workItemId: mockId,
      title: trimmedTitle,
      scope: 'Manual Entry',
      priority: 'default',
      projectId: detail.project.id,
      projectTitle: detail.project.title,
      parentSpecId: currentPlan?.id ?? null,
      parentSpecTitle: currentPlan?.title ?? null,
      delegatedAgentId: null,
      linkedRepos: detail.project.linkedRepos,
      sourceConversationId: null,
      displayStatus: 'queued',
      baseStatus: 'queued',
      reviewState: 'not_ready',
      latestRunId: null,
      latestRunStatus: null,
      latestEventType: null,
      latestEventAt: null,
      badges: ['draft'],
      operationalBadges: ['draft'],
      scheduleTime: null,
      scheduleStatus: null,
      scheduleSource: null,
    } as WorkBoardCard;

    const mockActiveWork: ActiveWorkPaneModel = {
      sourceConversationTitle: null,
      openReviewEntry: null,
      workItem: {
        id: mockId,
        projectId: detail.project.id,
        status: 'queued',
        scope: 'Manual Entry',
        title: trimmedTitle,
        priority: 'default',
        delegatedAgentId: null,
        reviewState: 'not_ready',
        linkedRepos: [],
        sourceConversationId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      spec: {
        id: `spec-${mockId}`,
        title: trimmedTitle,
        intent: '',
        outcome: '',
      } as any,
    };

    setLocalLanes((previous) =>
      previous.map((lane) =>
        lane.title.toLowerCase() === 'to do'
          ? { ...lane, cards: [...lane.cards, newCard] }
          : lane,
      ),
    );
    setLocalActiveMockData(mockActiveWork);
    setIsDrafting(false);
  };

  const handleCreateDraft = () => {
    setLocalActiveMockData({
      sourceConversationTitle: null,
      openReviewEntry: null,
      workItem: {
        id: 'draft',
        projectId: detail.project.id,
        status: 'queued',
        scope: 'Draft',
        title: '',
        priority: 'default',
        delegatedAgentId: null,
        reviewState: 'not_ready',
        linkedRepos: [],
        sourceConversationId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      spec: {
        id: 'spec-draft',
        title: '',
        intent: '',
        outcome: '',
      } as any,
    });
    setIsDrafting(true);
  };

  const handleSelectMockCard = (mockId: string) => {
    const card = localLanes.flatMap((lane) => lane.cards).find((item) => item.workItemId === mockId);
    if (!card) {
      return;
    }

    setLocalActiveMockData({
      sourceConversationTitle: null,
      openReviewEntry: null,
      workItem: {
        id: mockId,
        projectId: detail.project.id,
        status: 'queued',
        scope: card.scope,
        title: card.title,
        priority: 'default',
        delegatedAgentId: null,
        reviewState: 'not_ready',
        linkedRepos: [],
        sourceConversationId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      spec: {
        id: `spec-${mockId}`,
        title: card.title,
        intent: '',
        outcome: '',
      } as any,
    });
    setIsDrafting(false);
  };

  const activeWorkToRender = localActiveMockData || model.activeWork;
  const hasActiveWork = !!activeWorkToRender;

  const assistant = (
    <AssistantWorkspacePanel
      detail={detail}
      currentPlan={model.currentPlan}
      compact={variant === 'board_os'}
    />
  );
  const memory = <MemoryContextRail detail={detail} compact={variant === 'board_os'} />;
  const review = <ReviewPreviewPanel reviewEntries={model.reviewEntries} projectId={detail.project.id} />;
  const standingWork = <StandingWorkPreviewPanel lanes={localLanes} projectId={detail.project.id} />;
  const supportStack = (
    <div className="grid gap-4">
      {assistant}
      {memory}
      {standingWork}
      {review}
    </div>
  );

  const board = (
    <BoardExecutionSurface
      basePath={basePath}
      view={model.view}
      currentPlanTitle={currentPlan?.title ?? null}
      lanes={localLanes}
      projectId={detail.project.id}
      projectTitle={detail.project.title}
      suggestedPrompt={detail.summary.suggestedPrompt ?? `Plan the next step for ${detail.project.title}.`}
      workspacePath={detail.workspace?.workspacePath ?? null}
      linkedRepos={detail.project.linkedRepos}
      starterSpecId={currentPlan?.id ?? null}
      onAddTask={handleAddNewTask}
      onSelectMockCard={handleSelectMockCard}
    />
  );

  const specSurface = (
    <Card>
      <CardHeader>
        <CardTitle>{currentPlanDetail ? 'Current spec' : 'Start with the spec'}</CardTitle>
        <CardDescription>
          {currentPlanDetail
            ? 'Shape the spec first. The board becomes useful after decomposition.'
            : 'Capture intent, outcome, and acceptance before the board appears.'}
        </CardDescription>
      </CardHeader>
      <CardContent style={{ display: 'grid', gap: '16px' }}>
        {currentPlanDetail ? (
          <>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'grid', gap: '6px' }}>
                <strong style={{ fontSize: '1.05rem' }}>{currentPlanDetail.spec.title}</strong>
                <p style={bodyTextStyle}>{currentPlanDetail.spec.outcome}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={miniChipStyle}>
                  {currentPlanDetail.readiness.isReady ? 'Ready to decompose' : 'Needs refinement'}
                </span>
                <span style={miniChipStyle}>
                  {hasCards ? `${currentPlanDetail.links.length} cards created` : 'No cards yet'}
                </span>
                <span style={miniChipStyle}>{workspaceReady ? 'Workspace ready' : 'Workspace not ready'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <OpenChatPanelButton
                label="Refine spec"
                intent="spec_planning"
                context={{
                  entityType: 'project',
                  entityId: detail.project.id,
                  projectId: detail.project.id,
                  page: 'lab-project',
                  suggestedPrompt: `Refine the current plan for ${detail.project.title}. Keep it sharp and lightweight.`,
                  draftPrompt: `Refine the current plan for ${detail.project.title}.

Plan title: ${currentPlanDetail.spec.title}
Intent:
${currentPlanDetail.spec.intent}

Outcome:
${currentPlanDetail.spec.outcome}

In scope:
${currentPlanDetail.spec.inScope.join('\n')}`,
                  starterRepoList: detail.project.linkedRepos,
                  starterWorkspacePath: detail.workspace?.workspacePath ?? null,
                  starterSpecId: currentPlanDetail.spec.id,
                  starterSpecTitle: currentPlanDetail.spec.title,
                }}
              />
              <OpenChatPanelButton
                label={hasCards ? 'Rework decomposition' : 'Turn into cards'}
                intent="spec_decomposition"
                context={{
                  entityType: 'project',
                  entityId: detail.project.id,
                  projectId: detail.project.id,
                  page: 'lab-project',
                  suggestedPrompt: `Turn the current plan for ${detail.project.title} into small reviewable cards.`,
                  draftPrompt: `Turn the current plan for ${detail.project.title} into the smallest useful set of cards I can review cleanly.`,
                  starterRepoList: detail.project.linkedRepos,
                  starterWorkspacePath: detail.workspace?.workspacePath ?? null,
                  starterSpecId: currentPlanDetail.spec.id,
                  starterSpecTitle: currentPlanDetail.spec.title,
                }}
                variant="outline"
              />
            </div>

            <details style={panelDisclosureStyle} open>
              <summary style={summaryStyle}>Intent and scope</summary>
              <div style={detailsBodyStyle}>
                <p style={bodyTextStyle}>{currentPlanDetail.spec.intent}</p>
                <ul style={listStyle}>
                  {currentPlanDetail.spec.inScope.length > 0 ? (
                    currentPlanDetail.spec.inScope.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>Scope still needs clarification.</li>
                  )}
                </ul>
              </div>
            </details>

            <details style={panelDisclosureStyle}>
              <summary style={summaryStyle}>Acceptance</summary>
              <div style={detailsBodyStyle}>
                <ul style={listStyle}>
                  {currentPlanDetail.spec.acceptanceCriteria.length > 0 ? (
                    currentPlanDetail.spec.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>Add acceptance criteria before decomposition.</li>
                  )}
                </ul>
              </div>
            </details>
          </>
        ) : (
          <>
            <p style={bodyTextStyle}>
              Start in assistant. Describe the outcome, what matters now, and what done should look like.
            </p>
            <OpenChatPanelButton
              label="Draft spec"
              intent="spec_planning"
              context={{
                entityType: 'project',
                entityId: detail.project.id,
                projectId: detail.project.id,
                page: 'lab-project',
                suggestedPrompt: `Help me shape the current plan for ${detail.project.title}. Keep it lightweight and only ask if something important is missing.`,
                draftPrompt: `Help me define the current plan for ${detail.project.title}.

What I want built:
What matters most right now:
Anything already known about repos or workspace:
What "done" should look like:

Draft the plan and get it ready to turn into cards.`,
                starterRepoList: detail.project.linkedRepos,
                starterWorkspacePath: detail.workspace?.workspacePath ?? null,
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );

  const boardStagePanel = hasCards ? (
    board
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>Execution board</CardTitle>
        <CardDescription>Board stays hidden until the spec has been turned into cards.</CardDescription>
      </CardHeader>
      <CardContent style={{ display: 'grid', gap: '12px' }}>
        <p style={bodyTextStyle}>Finish the spec and create reviewable execution cards first.</p>
        {currentPlanDetail ? (
          <OpenChatPanelButton
            label="Turn spec into cards"
            intent="spec_decomposition"
            context={{
              entityType: 'project',
              entityId: detail.project.id,
              projectId: detail.project.id,
              page: 'lab-project',
              suggestedPrompt: `Turn the current plan for ${detail.project.title} into small reviewable cards.`,
              draftPrompt: `Turn the current plan for ${detail.project.title} into the smallest useful set of cards I can review cleanly.`,
              starterRepoList: detail.project.linkedRepos,
              starterWorkspacePath: detail.workspace?.workspacePath ?? null,
              starterSpecId: currentPlanDetail.spec.id,
              starterSpecTitle: currentPlanDetail.spec.title,
            }}
          />
        ) : null}
      </CardContent>
    </Card>
  );

  const activeWorkPlaceholder = (
    <section className="grid gap-3 rounded-[24px] border border-[var(--separator)] bg-[var(--material-ultra-thin)] p-5">
      <div className="grid gap-1">
        <span className="text-[0.72rem] uppercase tracking-[0.08em] font-bold text-[var(--text-quaternary)]">
          Active card zoom
        </span>
        <h2 className="m-0 text-[1.1rem] text-[var(--text-primary)]">Select a card to deepen execution</h2>
      </div>
      <p className="m-0 text-[0.94rem] text-[var(--text-secondary)]">
        Keep the board as the primary surface, then use the right rail for the card you are actively steering. Assistant, memory, and review stay visible so the shell does not collapse into a blind task board.
      </p>
    </section>
  );

  const activeWork = activeWorkToRender ? (
    <div className="flex h-full flex-col gap-4">
      {isDrafting ? (
        <div className="flex items-center justify-between rounded-lg border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] p-3 text-sm text-[var(--accent)]">
          <span>Drafting a new task...</span>
          <button
            onClick={() => {
              if (activeWorkToRender.workItem.title.trim()) {
                handleAddNewTask(activeWorkToRender.workItem.title);
              }
            }}
            className="cursor-pointer font-bold underline"
          >
            Save to Board
          </button>
        </div>
      ) : null}
      <ActiveWorkPane activeWork={activeWorkToRender} />
      <div className="border-t border-[var(--separator)] pt-4">{supportStack}</div>
    </div>
  ) : (
    <div className="grid gap-4">
      {activeWorkPlaceholder}
      {supportStack}
    </div>
  );

  const memoryDisclosure = (
    <details style={panelDisclosureStyle}>
      <summary style={summaryStyle}>Memory</summary>
      <div style={detailsBodyStyle}>{memory}</div>
    </details>
  );
  const reviewDisclosure = (
    <details style={panelDisclosureStyle}>
      <summary style={summaryStyle}>Review</summary>
      <div style={detailsBodyStyle}>{review}</div>
    </details>
  );
  const standingWorkDisclosure = (
    <details style={panelDisclosureStyle}>
      <summary style={summaryStyle}>Standing work</summary>
      <div style={detailsBodyStyle}>{standingWork}</div>
    </details>
  );

  if (variant === 'board_os') {
    return (
      <div className="flex h-full w-full overflow-hidden" style={{ background: 'var(--bg)' }}>
        <div className="hidden shrink-0 flex-col items-center gap-4 border-r border-[var(--separator)] py-5 md:flex md:w-14">
          <div className="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--separator)] bg-[var(--material-thin)] text-[var(--text-secondary)] transition-all hover:bg-[var(--material-ultra-thin)] hover:text-[var(--text-primary)]" title="Plan">
            <ClipboardList size={18} />
            <div className="pointer-events-none absolute left-12 rounded bg-[var(--foreground)] px-2 py-1 text-xs font-semibold whitespace-nowrap text-[var(--background)] opacity-0 transition-opacity group-hover:opacity-100">
              Project Plan
            </div>
          </div>
          <div className="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[var(--separator)] bg-[var(--material-thin)] text-[var(--text-secondary)] transition-all hover:bg-[var(--material-ultra-thin)] hover:text-[var(--text-primary)]" title="Memory">
            <Brain size={18} />
            <div className="pointer-events-none absolute left-12 rounded bg-[var(--foreground)] px-2 py-1 text-xs font-semibold whitespace-nowrap text-[var(--background)] opacity-0 transition-opacity group-hover:opacity-100">
              Project Memory
            </div>
          </div>
        </div>

        <div className="relative z-0 flex min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 transition-all duration-300 md:px-8">
          <ProjectExecutionHeader detail={detail} variant={variant} />
          {board}
        </div>

        <div
          className={`absolute top-0 right-0 bottom-0 z-20 flex h-full w-full flex-col border-l border-[var(--separator)] bg-[var(--material-ultra-thin)] shadow-2xl transition-transform duration-300 md:relative md:w-[35%] md:min-w-[380px] md:max-w-xl md:shadow-none ${hasActiveWork ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
        >
          {!hasActiveWork ? (
            <div className="absolute top-6 left-[-48px] hidden md:block">
              <button
                onClick={handleCreateDraft}
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-[var(--separator)] bg-[var(--bg)] text-[var(--text-secondary)] shadow-md transition-all hover:border-[var(--accent)] hover:bg-[var(--material-thin)] hover:text-[var(--text-primary)]"
                title="Create New Task"
              >
                <Plus size={20} className="transition-transform group-hover:scale-110" />
              </button>
            </div>
          ) : null}

          <div className="relative flex-1 overflow-y-auto p-4 pb-6 md:p-6">
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleCreateDraft}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--separator)] bg-[var(--material-thin)] text-[var(--text-secondary)] transition-all hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                title="Create New Task"
              >
                <Plus size={16} />
              </button>
              {hasActiveWork ? (
                <a
                  href={basePath}
                  onClick={() => setLocalActiveMockData(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--separator)] bg-[var(--material-thin)] text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
                  title="Close Pane"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </a>
              ) : null}
            </div>
            <div className="mt-8 pb-4 md:hidden">
              {hasActiveWork ? (
                <button onClick={() => setLocalActiveMockData(null)} className="text-sm font-medium text-[var(--text-secondary)]">← Close Card</button>
              ) : null}
            </div>
            <div className="pt-10">{activeWork}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={pageStyle}>
        <ProjectExecutionHeader detail={detail} variant={variant} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(300px, 0.72fr)', gap: '16px', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            {specSurface}
            {boardStagePanel}
            {activeWorkToRender ? <ActiveWorkPane activeWork={activeWorkToRender} /> : activeWorkPlaceholder}
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {assistant}
            {memoryDisclosure}
            {standingWorkDisclosure}
            {reviewDisclosure}
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  maxWidth: 1460,
  margin: '0 auto',
  padding: 'var(--space-6) var(--space-4) var(--space-12)',
  display: 'grid',
  gap: '18px',
};

const bodyTextStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
};

const listStyle = {
  margin: 0,
  paddingLeft: '1.1rem',
  color: 'var(--text-secondary)',
};

const miniChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 28,
  padding: '0 10px',
  borderRadius: '999px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  color: 'var(--text-secondary)',
  fontSize: '0.82rem',
};

const summaryStyle = {
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  fontSize: '0.92rem',
};

const detailsBodyStyle = {
  marginTop: '12px',
};

const panelDisclosureStyle = {
  borderRadius: '18px',
  border: '1px solid var(--separator)',
  background: 'var(--material-ultra-thin)',
  padding: '12px 14px',
};
