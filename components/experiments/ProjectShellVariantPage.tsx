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
  const planPanel = (
    <Card>
      <CardHeader>
        <CardTitle>Current plan</CardTitle>
        <CardDescription>
          Keep the current plan and decomposition controls visible while testing the shell, but do not let manual launch UI dominate the first screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProjectSpecsManager
          projectId={detail.project.id}
          projectTitle={detail.project.title}
          linkedRepos={detail.project.linkedRepos}
          workspacePath={detail.workspace?.workspacePath ?? null}
          specs={model.specs}
        />
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
    <AssistantWorkspacePanel detail={detail} currentPlan={model.currentPlan} />
  );
  const memory = <MemoryContextRail detail={detail} compact={variant === 'board_os'} />;
  const review = <ReviewPreviewPanel reviewEntries={model.reviewEntries} projectId={detail.project.id} />;
  const activeWork = <ActiveWorkPane activeWork={model.activeWork} />;

  const boardColumn = (
    <div style={{ display: 'grid', gap: '16px' }}>
      {variant === 'cockpit' && model.view === 'plan' ? planPanel : null}
      {board}
      {activeWork}
    </div>
  );

  const sideColumn = (
    <div style={{ display: 'grid', gap: '16px' }}>
      {assistant}
      {variant === 'board_os' && model.view === 'plan' ? planPanel : null}
      {memory}
      {review}
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
