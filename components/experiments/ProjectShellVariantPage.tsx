import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { AssistantWorkspacePanel } from '@/components/experiments/AssistantWorkspacePanel';
import { BoardExecutionSurface } from '@/components/experiments/BoardExecutionSurface';
import { MemoryContextRail } from '@/components/experiments/MemoryContextRail';
import { ProjectExecutionHeader } from '@/components/experiments/ProjectExecutionHeader';
import { ReviewPreviewPanel } from '@/components/experiments/ReviewPreviewPanel';
import { ActiveWorkPane } from '@/components/experiments/ActiveWorkPane';
import { InlineIntentInput } from '@/components/experiments/InlineIntentInput';
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
    <div style={{ display: 'grid', gap: '32px', paddingBottom: '24px' }}>
      {currentPlanDetail ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <h1 style={h1Style}>{currentPlanDetail.spec.title}</h1>
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

          <div>
            <p style={{ ...bodyTextStyle, fontSize: '1.1rem', lineHeight: 1.6 }}>{currentPlanDetail.spec.intent}</p>
            
            <h2 style={h2Style}>Scope</h2>
            <ul style={{ ...listStyle, fontSize: '1.05rem', lineHeight: 1.6, display: 'grid', gap: '4px' }}>
              {currentPlanDetail.spec.inScope.length > 0 ? (
                currentPlanDetail.spec.inScope.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>Scope still needs clarification.</li>
              )}
            </ul>
            
            <h2 style={h2Style}>Acceptance Criteria</h2>
            <ul style={{ ...listStyle, fontSize: '1.05rem', lineHeight: 1.6, display: 'grid', gap: '4px' }}>
              {currentPlanDetail.spec.acceptanceCriteria.length > 0 ? (
                currentPlanDetail.spec.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>Add acceptance criteria before decomposition.</li>
              )}
            </ul>
          </div>

          {!hasCards ? (
            <div style={{ marginTop: '24px' }}>
              <OpenChatPanelButton
                label={currentPlanDetail.readiness.isReady ? "Decompose into executable cards" : "Refinement needed before decomposition"}
                intent={currentPlanDetail.readiness.isReady ? "spec_decomposition" : "spec_planning"}
                context={{
                  entityType: 'project',
                  entityId: detail.project.id,
                  projectId: detail.project.id,
                  page: 'lab-project',
                  suggestedPrompt: currentPlanDetail.readiness.isReady 
                    ? `Turn the current plan for ${detail.project.title} into small reviewable cards.`
                    : `Help me refine the boundaries and acceptance criteria for ${detail.project.title}.`,
                  draftPrompt: currentPlanDetail.readiness.isReady 
                    ? `Turn the current plan for ${detail.project.title} into the smallest useful set of cards I can review cleanly.`
                    : `Help me define the remaining open items for ${detail.project.title}.`,
                  starterRepoList: detail.project.linkedRepos,
                  starterWorkspacePath: detail.workspace?.workspacePath ?? null,
                  starterSpecId: currentPlanDetail.spec.id,
                  starterSpecTitle: currentPlanDetail.spec.title,
                }}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px', alignItems: 'start' }}>
          <InlineIntentInput
            ghostedH1Style={ghostedH1Style}
            projectTitle={detail.project.title}
            context={{
              entityType: 'project',
              entityId: detail.project.id,
              projectId: detail.project.id,
              page: 'lab-project',
              starterRepoList: detail.project.linkedRepos,
              starterWorkspacePath: detail.workspace?.workspacePath ?? null,
            }}
          />
        </div>
      )}
    </div>
  );
  const boardStagePanel = hasCards ? board : null;

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
  const memoryDisclosure = (hasCards || model.activeWork !== null) ? (
    <details style={panelDisclosureStyle}>
      <summary style={summaryStyle}>Memory</summary>
      <div style={detailsBodyStyle}>{memory}</div>
    </details>
  ) : null;
  const reviewDisclosure = (hasCards || (model.reviewEntries && model.reviewEntries.length > 0)) ? (
    <details style={panelDisclosureStyle}>
      <summary style={summaryStyle}>Review</summary>
      <div style={detailsBodyStyle}>{review}</div>
    </details>
  ) : null;

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

const h1Style = { margin: 0, fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' };
const ghostedH1Style = { margin: 0, fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-quaternary)' };
const h2Style = { margin: '24px 0 12px', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' };
