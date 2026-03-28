import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      {board}
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
