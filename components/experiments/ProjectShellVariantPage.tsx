import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { AssistantWorkspacePanel } from '@/components/experiments/AssistantWorkspacePanel';
import { BoardExecutionSurface } from '@/components/experiments/BoardExecutionSurface';
import { MemoryContextRail } from '@/components/experiments/MemoryContextRail';
import { ProjectExecutionHeader } from '@/components/experiments/ProjectExecutionHeader';
import { ReviewPreviewPanel } from '@/components/experiments/ReviewPreviewPanel';
import { ActiveWorkPane } from '@/components/experiments/ActiveWorkPane';
import type { ProjectShellModel } from '@/lib/experiments/project-shell';
import type { ShellVariant } from '@/lib/experiments/shell-variants';

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
  const planPanel = (
    <Card>
      <CardHeader>
        <CardTitle>Plan</CardTitle>
        <CardDescription>{currentPlan?.title ?? 'No current plan yet.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'grid', gap: '14px' }}>
          {currentPlan ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {currentPlan.intent ? (
                <p style={bodyTextStyle}>{currentPlan.intent}</p>
              ) : null}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={miniChipStyle}>{model.lanes.reduce((sum, lane) => sum + lane.cards.length, 0)} cards</span>
                <span style={miniChipStyle}>{detail.summary.workspaceStatus.replaceAll('_', ' ')}</span>
                <span style={miniChipStyle}>{model.reviewEntries.length} in review</span>
              </div>
            </div>
          ) : (
            <p style={bodyTextStyle}>Draft the first plan before using the board as the main execution surface.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
  const board = (
    <BoardExecutionSurface
      basePath={basePath}
      view={model.view}
      currentPlanTitle={model.currentPlan?.spec.title ?? null}
      lanes={model.lanes}
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
        <p style={bodyTextStyle}>
          Finish the spec and create reviewable execution cards first.
        </p>
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

  const assistant = (
    <AssistantWorkspacePanel
      detail={detail}
      currentPlan={model.currentPlan}
      compact={variant === 'board_os'}
    />
  );
  const memory = <MemoryContextRail detail={detail} compact={variant === 'board_os'} />;
  const review = <ReviewPreviewPanel reviewEntries={model.reviewEntries} projectId={detail.project.id} />;
  const activeWork = <ActiveWorkPane activeWork={model.activeWork} />;
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

  if (variant === 'board_os') {
    return (
      <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
        <div style={pageStyle}>
          <ProjectExecutionHeader detail={detail} variant={variant} />

          {board}

          <div style={boardOsRailGridStyle}>
            <div style={{ display: 'grid', gap: '16px' }}>
              {activeWork}
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {model.view === 'plan' ? planPanel : null}
              {assistant}
              {memoryDisclosure}
              {reviewDisclosure}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const boardColumn = (
    <div style={{ display: 'grid', gap: '16px' }}>
      {specSurface}
      {boardStagePanel}
      {activeWork}
    </div>
  );

  const sideColumn = (
    <div style={{ display: 'grid', gap: '16px' }}>
      {assistant}
      {memoryDisclosure}
      {reviewDisclosure}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={pageStyle}>
        <ProjectExecutionHeader detail={detail} variant={variant} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: variant === 'cockpit'
              ? 'minmax(0, 1.25fr) minmax(320px, 0.85fr)'
              : 'minmax(0, 1.55fr) minmax(300px, 0.72fr)',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {boardColumn}
          {sideColumn}
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

const boardOsRailGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 0.9fr) minmax(300px, 0.72fr)',
  gap: '16px',
  alignItems: 'start',
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
