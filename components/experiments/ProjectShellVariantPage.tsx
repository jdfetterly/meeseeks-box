'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Local state for mock cards during the exploration
  const [localLanes, setLocalLanes] = useState<WorkBoardLane[]>(model.lanes);
  const [localActiveMockData, setLocalActiveMockData] = useState<ActiveWorkPaneModel | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  const handleAddNewTask = (title: string) => {
    const mockId = `mock-${Date.now()}`;
    const newCard = {
      workItemId: mockId,
      title,
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
    
    // Create the mock full model so the right pane can render it
    const mockActiveWork: ActiveWorkPaneModel = {
      sourceConversationTitle: null,
      openReviewEntry: null,
      workItem: {
        id: mockId,
        projectId: detail.project.id,
        status: 'queued',
        scope: 'Manual Entry',
        title: title,
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
        title: title,
        intent: '',
        outcome: '',
      } as any
    };

    setLocalLanes(prev => prev.map(lane => {
      if (lane.title.toLowerCase() === 'to do') {
        return { ...lane, cards: [...lane.cards, newCard] };
      }
      return lane;
    }));
    
    setLocalActiveMockData(mockActiveWork);
    setIsDrafting(false); // Task is added, now we are editing it!
  };

  const handleCreateDraft = () => {
    // Open the right pane with an empty template
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
        id: `spec-draft`,
        title: '',
        intent: '',
        outcome: '',
      } as any
    });
    setIsDrafting(true);
  };

  const handleSelectMockCard = (mockId: string) => {
    // If they click a mock card in the board, simulate it opening
    const card = localLanes.flatMap(l => l.cards).find(c => c.workItemId === mockId);
    if (card) {
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
        } as any
      });
      setIsDrafting(false);
    }
  };

  const activeWorkToRender = localActiveMockData || model.activeWork;
  const hasActiveWork = !!activeWorkToRender;
  const supportStack = (
    <div className="grid gap-4">
      <AssistantWorkspacePanel
        detail={detail}
        currentPlan={model.currentPlan}
        compact
      />
      <MemoryContextRail detail={detail} compact />
      <StandingWorkPreviewPanel lanes={localLanes} projectId={detail.project.id} />
      <ReviewPreviewPanel reviewEntries={model.reviewEntries} projectId={detail.project.id} />
    </div>
  );

  const board = (
    <BoardExecutionSurface
      basePath={basePath}
      view={model.view}
      currentPlanTitle={model.currentPlan?.spec.title ?? null}
      lanes={localLanes}
      projectId={detail.project.id}
      projectTitle={detail.project.title}
      suggestedPrompt={detail.summary.suggestedPrompt ?? `Plan the next step for ${detail.project.title}.`}
      workspacePath={detail.workspace?.workspacePath ?? null}
      linkedRepos={detail.project.linkedRepos}
      starterSpecId={model.currentPlan?.spec.id ?? null}
      onAddTask={handleAddNewTask}
      onSelectMockCard={handleSelectMockCard}
    />
  );

  const activeWork = activeWorkToRender ? (
    <div className="h-full flex flex-col gap-4">
      {isDrafting && (
        <div className="bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-lg p-3 text-sm text-[var(--accent)] flex items-center justify-between">
          <span>Drafting a new task...</span>
          <button
            onClick={() => {
              if (activeWorkToRender.workItem.title.trim()) {
                handleAddNewTask(activeWorkToRender.workItem.title);
              }
            }}
            className="font-bold underline cursor-pointer"
          >
            Save to Board
          </button>
        </div>
      )}
      <ActiveWorkPane activeWork={activeWorkToRender} />
      <div className="border-t border-[var(--separator)] pt-4">
        {supportStack}
      </div>
    </div>
  ) : (
    <div className="grid gap-4">
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
      {supportStack}
    </div>
  );

  if (variant === 'board_os') {
    return (
      <div className="h-full w-full flex overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* LEFT PANE - Context Navigation */}
        <div className="hidden md:flex flex-col items-center w-14 shrink-0 border-r border-[var(--separator)] py-5 gap-4 z-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--material-thin)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] border border-[var(--separator)] hover:bg-[var(--material-ultra-thin)] hover:text-[var(--text-primary)] transition-all group relative" title="Plan">
            <ClipboardList size={18} />
            <div className="absolute left-12 bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Project Plan
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[var(--material-thin)] flex items-center justify-center cursor-pointer text-[var(--text-secondary)] border border-[var(--separator)] hover:bg-[var(--material-ultra-thin)] hover:text-[var(--text-primary)] transition-all group relative" title="Memory">
            <Brain size={18} />
            <div className="absolute left-12 bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Project Memory
            </div>
          </div>
        </div>

        {/* CENTER PANE - Execution Core */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto px-4 md:px-8 py-6 gap-6 transition-all duration-300 relative z-0">
          <ProjectExecutionHeader detail={detail} variant={variant} />
          {board}
        </div>

        {/* RIGHT PANE - Active Context Zoom + Support Surfaces */}
        <div 
          className={`flex flex-col h-full bg-[var(--material-ultra-thin)] border-l border-[var(--separator)] transition-transform duration-300 absolute md:relative right-0 top-0 bottom-0 z-20 w-full md:w-[35%] md:min-w-[380px] md:max-w-xl shadow-2xl md:shadow-none ${hasActiveWork ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
        >
          {/* Floating 'New Task' Button attached to the Right Pane's edge (always accessible from the right side) */}
          {!hasActiveWork && (
            <div className="absolute left-[-48px] top-6 hidden md:block">
              <button
                onClick={handleCreateDraft}
                className="w-10 h-10 bg-[var(--bg)] border border-[var(--separator)] shadow-md rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--material-thin)] transition-all group"
                title="Create New Task"
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-6 relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={handleCreateDraft} className="w-8 h-8 rounded-full bg-[var(--material-thin)] border border-[var(--separator)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all" title="Create New Task">
                <Plus size={16} />
              </button>
              {hasActiveWork ? (
                <a href={basePath} onClick={() => setLocalActiveMockData(null)} className="w-8 h-8 rounded-full bg-[var(--material-thin)] border border-[var(--separator)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Close Pane">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </a>
              ) : null}
            </div>
            <div className="md:hidden pb-4 mt-8">
              {hasActiveWork ? (
                <button onClick={() => setLocalActiveMockData(null)} className="text-sm font-medium text-[var(--text-secondary)]">← Close Card</button>
              ) : null}
            </div>
            <div className="pt-10">
              {activeWork}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback views code below remains mostly unchanged...
  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <ProjectExecutionHeader detail={detail} variant={variant} />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.55fr) minmax(300px, 0.72fr)', gap: '16px' }}>
         {board}
         {activeWork}
      </div>
    </div>
  );
}
