import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectSpecsManager } from '@/components/projects/ProjectSpecsManager';
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
        <CardTitle>{variant === 'board_os' ? 'Plan context' : 'Current plan'}</CardTitle>
        <CardDescription>
          {currentPlan?.title ?? 'No current plan yet.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'grid', gap: '14px' }}>
          {currentPlan ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {currentPlan.summary ? (
                <p style={bodyTextStyle}>{currentPlan.summary}</p>
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

          <details style={detailsStyle}>
            <summary style={summaryStyle}>Open plan details</summary>
            <div style={detailsBodyStyle}>
              <ProjectSpecsManager
                projectId={detail.project.id}
                projectTitle={detail.project.title}
                linkedRepos={detail.project.linkedRepos}
                workspacePath={detail.workspace?.workspacePath ?? null}
                specs={model.specs}
              />
            </div>
          </details>
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

          <section style={boardOsLeadStyle}>
            <div style={{ display: 'grid', gap: '6px' }}>
              <div style={eyebrowStyle}>Board-first shell</div>
              <h2 style={boardOsTitleStyle}>The board drives this workspace</h2>
              <p style={boardOsBodyStyle}>
                Assistant, memory, and review stay available, but they support board movement instead of co-owning the screen.
              </p>
            </div>
            <div style={boardOsChipRowStyle}>
              <span style={boardOsChipStyle}>Primary surface: board</span>
              <span style={boardOsChipStyle}>Secondary: assistant</span>
              <span style={boardOsChipStyle}>Review remains canonical</span>
            </div>
          </section>

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
      {model.view === 'plan' ? planPanel : null}
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

const boardOsLeadStyle = {
  display: 'grid',
  gap: '14px',
  padding: '20px 22px',
  borderRadius: '24px',
  border: '1px solid color-mix(in srgb, var(--accent) 26%, transparent)',
  background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, transparent), var(--material-thin))',
};

const eyebrowStyle = {
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-quaternary)',
  fontWeight: 700,
};

const boardOsTitleStyle = {
  margin: 0,
  fontSize: '1.15rem',
};

const boardOsBodyStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  maxWidth: '72ch',
};

const boardOsChipRowStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap' as const,
};

const boardOsChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 30,
  padding: '0 12px',
  borderRadius: '999px',
  border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
  color: 'var(--text-primary)',
  fontSize: '0.82rem',
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

const detailsStyle = {
  borderTop: '1px solid var(--separator)',
  paddingTop: '10px',
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
