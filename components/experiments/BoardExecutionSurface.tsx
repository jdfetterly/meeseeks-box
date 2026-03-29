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
}) {
  const todoCount = lanes.find((lane) => lane.lane === 'todo')?.cards.length ?? 0;
  const recommendedMove = todoCount > 0
    ? 'Select the next reviewable card from To Do and steer it from the same shell.'
    : 'No queued cards are visible. Use the board or Assistant to create the next reviewable slice.';

  return (
    <section style={panelStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <div style={eyebrowStyle}>Board execution surface</div>
          <h2 style={panelTitleStyle}>
            {view === 'plan' ? 'Plan-first execution' : 'Status lanes'}
          </h2>
          <p style={panelBodyStyle}>
            {view === 'plan'
              ? `Current plan${currentPlanTitle ? `: ${currentPlanTitle}` : ''}. Keep the board focused on plan-derived execution, not setup admin.`
              : 'Status view is still available, but it stays secondary to the plan-first board.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link href={buildHref(basePath, 'plan')} style={chipStyle(view === 'plan')}>
            Plan view
          </Link>
          <Link href={buildHref(basePath, 'status')} style={chipStyle(view === 'status')}>
            Status view
          </Link>
        </div>
      </div>

      <div style={calloutStyle}>
        <strong style={calloutLabelStyle}>Recommended next move</strong>
        <span>{recommendedMove}</span>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

      <div style={laneGridStyle}>
        {lanes.map((lane) => (
          <section key={lane.lane} style={laneStyle}>
            <div style={{ display: 'grid', gap: '4px' }}>
              <strong style={{ fontSize: '0.98rem' }}>{lane.title}</strong>
              <span style={laneMetaStyle}>{lane.cards.length} visible</span>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {lane.cards.length === 0 ? (
                <div style={emptyLaneStyle}>Nothing waiting here.</div>
              ) : (
                lane.cards.map((card) => (
                  <Link key={card.workItemId} href={buildHref(basePath, view, card.workItemId)} style={cardStyle}>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <strong style={{ fontSize: '0.96rem', lineHeight: 1.25 }}>{card.title}</strong>
                      <span style={metaStyle}>
                        {card.parentSpecTitle ? `Plan: ${card.parentSpecTitle}` : card.projectTitle ?? 'Unassigned project'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={detailPillStyle}>{card.delegatedAgentId ?? card.scope}</span>
                      {card.operationalBadges.slice(0, 2).map((badge) => (
                        <span key={badge} style={warningPillStyle}>
                          {badge.replaceAll('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

const panelStyle = {
  display: 'grid',
  gap: '16px',
  padding: '20px',
  borderRadius: '24px',
  border: '1px solid var(--separator)',
  background: 'var(--material-ultra-thin)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  flexWrap: 'wrap' as const,
  alignItems: 'flex-start',
};

const eyebrowStyle = {
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-quaternary)',
  fontWeight: 700,
};

const panelTitleStyle = {
  margin: 0,
  fontSize: '1.1rem',
};

const panelBodyStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '0.95rem',
  maxWidth: '70ch',
};

const calloutStyle = {
  display: 'grid',
  gap: '6px',
  borderRadius: '18px',
  border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
  padding: '14px 16px',
  color: 'var(--text-primary)',
};

const calloutLabelStyle = {
  fontSize: '0.82rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-quaternary)',
};

const laneGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '12px',
};

const laneStyle = {
  display: 'grid',
  gap: '10px',
  alignContent: 'start',
  padding: '14px',
  borderRadius: '20px',
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
  background: 'var(--material-ultra-thin)',
  textDecoration: 'none',
  color: 'inherit',
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
  background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
  color: 'var(--text-primary)',
  fontSize: '0.78rem',
};

const warningPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 24,
  padding: '0 10px',
  borderRadius: '999px',
  background: 'color-mix(in srgb, var(--system-orange) 14%, transparent)',
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
