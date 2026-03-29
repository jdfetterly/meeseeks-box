'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import type { WorkBoardLane } from '@/lib/work-board/service';
import type { ProjectShellView } from '@/lib/experiments/shell-variants';

function buildHref(basePath: string, view: ProjectShellView, cardId?: string | null) {
  const params = new URLSearchParams();
  if (view === 'status') {
    params.set('view', 'status');
  }
  if (cardId) {
    params.set('card', cardId);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function BoardExecutionSurface({
  basePath,
  view,
  currentPlanTitle,
  lanes,
  projectId,
  projectTitle,
  suggestedPrompt,
  workspacePath,
  linkedRepos,
  starterSpecId,
  onAddTask,
  onSelectMockCard,
}: {
  basePath: string;
  view: ProjectShellView;
  currentPlanTitle: string | null;
  lanes: WorkBoardLane[];
  projectId: string;
  projectTitle: string;
  suggestedPrompt: string;
  workspacePath: string | null;
  linkedRepos: string[];
  starterSpecId?: string | null;
  onAddTask?: (title: string) => void;
  onSelectMockCard?: (id: string) => void;
}) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      if (onAddTask) {
        onAddTask(newTaskTitle.trim());
      } else {
        console.log("Submitting new task:", newTaskTitle);
      }
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const activeLanes = lanes.filter((lane) => lane.title.toLowerCase() !== 'done');
  const todoCount = activeLanes.find((lane) => lane.lane === 'todo')?.cards.length ?? 0;
  const recommendedMove = todoCount > 0
    ? 'Select the next reviewable card from To Do and steer it from the right rail.'
    : 'No queued cards are visible. Use the board or Assistant to create the next reviewable slice.';

  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-3 rounded-[24px] border border-[var(--separator)] bg-[var(--material-ultra-thin)] p-5">
        <div className="grid gap-1">
          <span className="text-[0.72rem] uppercase tracking-[0.08em] font-bold text-[var(--text-quaternary)]">
            Board execution surface
          </span>
          <h2 className="m-0 text-[1.1rem] text-[var(--text-primary)]">
            {view === 'plan' ? 'Plan-first execution' : 'Status lanes'}
          </h2>
          <p className="m-0 text-[0.94rem] text-[var(--text-secondary)]">
            {view === 'plan'
              ? `Current plan${currentPlanTitle ? `: ${currentPlanTitle}` : ''}. Keep the board focused on plan-derived execution, not setup admin.`
              : 'Status view is still available, but it stays secondary to the plan-first board.'}
          </p>
        </div>
        <div className="rounded-[18px] border border-[color-mix(in_srgb,var(--accent)_18%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-4 py-3 text-sm text-[var(--text-primary)]">
          <strong className="block text-[0.82rem] uppercase tracking-[0.08em] text-[var(--text-quaternary)]">Recommended next move</strong>
          <span>{recommendedMove}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <OpenChatPanelButton
            label="Plan with Assistant"
            intent="project_planning"
            context={{
              entityType: 'project',
              entityId: projectId,
              projectId,
              page: 'lab-project',
              suggestedPrompt,
            }}
          />
          <OpenChatPanelButton
            label={currentPlanTitle ? 'Turn plan into cards' : 'Draft current plan'}
            intent={currentPlanTitle ? 'spec_decomposition' : 'spec_planning'}
            context={{
              entityType: 'project',
              entityId: projectId,
              projectId,
              page: 'lab-project',
              suggestedPrompt: currentPlanTitle
                ? `Turn the current plan for ${projectTitle} into small reviewable cards.`
                : `Draft the current plan for ${projectTitle}.`,
              starterSpecId: starterSpecId ?? null,
              starterSpecTitle: currentPlanTitle,
              starterWorkspacePath: workspacePath,
              starterRepoList: linkedRepos,
            }}
            variant="outline"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Link href={buildHref(basePath, 'plan')} style={chipStyle(view === 'plan')}>
          Plan view
        </Link>
        <Link href={buildHref(basePath, 'status')} style={chipStyle(view === 'status')}>
          Status view
        </Link>
      </div>

      <div style={laneGridStyle}>
        {activeLanes.map((lane) => (
          <section key={lane.lane} style={laneStyle}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <strong style={{ fontSize: '0.98rem' }}>{lane.title}</strong>
              <span style={laneMetaStyle}>{lane.cards.length} active</span>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {lane.cards.length === 0 ? (
                <div style={emptyLaneStyle}>Nothing waiting here.</div>
              ) : (
                lane.cards.map((card) => {
                  const isMock = card.workItemId.startsWith('mock-');
                  return (
                    <Link 
                      key={card.workItemId} 
                      href={buildHref(basePath, view, card.workItemId)} 
                      style={cardStyle}
                      onClick={(e) => {
                        if (isMock && onSelectMockCard) {
                          e.preventDefault();
                          onSelectMockCard(card.workItemId);
                        }
                      }}
                    >
                      <div style={{ display: 'grid', gap: '4px' }}>
                        <strong style={{ fontSize: '0.96rem', lineHeight: 1.25 }}>{card.title}</strong>
                        <span style={metaStyle}>
                          {card.parentSpecTitle ? `Plan: ${card.parentSpecTitle}` : card.projectTitle ?? 'Unassigned project'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={detailPillStyle}>{card.delegatedAgentId ?? card.scope}</span>
                        {card.operationalBadges?.slice(0, 2).map((badge) => (
                          <span key={badge} style={warningPillStyle}>
                            {badge.replaceAll('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })
              )}

              {lane.title.toLowerCase() === 'to do' && (
                <div className="mt-1">
                  {isAddingTask ? (
                    <form onSubmit={handleTaskSubmit} className="grid gap-2 p-3 rounded-xl border border-[var(--separator)] bg-[var(--material-ultra-thin)]">
                      <input 
                        type="text" 
                        autoFocus
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="What needs doing?" 
                        className="bg-transparent border-none text-sm outline-none w-full text-[var(--text-primary)]"
                      />
                      <div className="flex gap-2 justify-end mt-2">
                        <button type="button" onClick={() => setIsAddingTask(false)} className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 transition-colors">Cancel</button>
                        <button type="submit" className="text-xs font-medium bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--text-primary)] border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] px-3 py-1 rounded-full hover:bg-[color-mix(in_srgb,var(--accent)_24%,transparent)] transition-colors">Save</button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setIsAddingTask(true)}
                      className="w-full text-left text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--material-ultra-thin)] py-2 px-3 rounded-xl transition-colors flex items-center gap-2"
                    >
                      <span className="text-lg leading-none">+</span> Add task
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

const laneGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '12px',
};

const laneStyle = {
  display: 'grid',
  gap: '10px',
  alignContent: 'start',
  padding: '16px',
  borderRadius: '24px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
};

const laneMetaStyle = {
  color: 'var(--text-tertiary)',
  fontSize: '0.84rem',
};

const emptyLaneStyle = {
  borderRadius: '16px',
  border: '1px dashed var(--separator)',
  padding: '14px',
  color: 'var(--text-tertiary)',
  fontSize: '0.9rem',
};

const cardStyle = {
  display: 'grid',
  gap: '10px',
  padding: '14px',
  borderRadius: '18px',
  border: '1px solid var(--separator)',
  background: 'var(--bg)',
  textDecoration: 'none',
  color: 'inherit',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
};

const metaStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.88rem',
};

const detailPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 24,
  padding: '0 10px',
  borderRadius: '999px',
  background: 'var(--material-ultra-thin)',
  border: '1px solid var(--separator)',
  color: 'var(--text-secondary)',
  fontSize: '0.78rem',
};

const warningPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 24,
  padding: '0 10px',
  borderRadius: '999px',
  background: 'color-mix(in srgb, var(--system-orange) 12%, transparent)',
  border: '1px solid color-mix(in srgb, var(--system-orange) 18%, transparent)',
  color: 'var(--text-secondary)',
  fontSize: '0.78rem',
};

function chipStyle(active: boolean) {
  return {
    minHeight: 34,
    padding: '0 12px',
    borderRadius: '999px',
    border: `1px solid ${active ? 'color-mix(in srgb, var(--accent) 36%, transparent)' : 'var(--separator)'}`,
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'var(--text-primary)',
    background: active ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'var(--material-thin)',
  };
}
