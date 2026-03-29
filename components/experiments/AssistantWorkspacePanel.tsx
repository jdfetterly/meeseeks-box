import Link from 'next/link';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import type { ProjectDetailRecord } from '@/lib/projects/service';
import type { ProjectSpecDetail } from '@/lib/specs/service';

export function AssistantWorkspacePanel({
  detail,
  currentPlan,
  compact = false,
  surface = 'lab',
  pageContext = 'lab-project',
}: {
  detail: ProjectDetailRecord;
  currentPlan: ProjectSpecDetail | null;
  compact?: boolean;
  surface?: 'lab' | 'control';
  pageContext?: 'lab-project' | 'project' | 'board';
}) {
  const workspaceReady = detail.summary.workspaceStatus === 'ready';
  const nextStepLabel = currentPlan
    ? workspaceReady
      ? 'Refine the plan or redirect work.'
      : 'Finish workspace setup before starting execution.'
    : 'Use Assistant to draft the first plan.';

  return (
    <section style={panelStyle}>
      <div style={{ display: 'grid', gap: '6px' }}>
        <div style={eyebrowStyle}>Assistant</div>
        <h2 style={panelTitleStyle}>{compact ? 'Secondary support' : 'Next move'}</h2>
        <p style={bodyTextStyle}>{nextStepLabel}</p>
      </div>

      <div style={stackStyle}>
        <OpenChatPanelButton
          label={compact ? 'Open assistant' : 'Open assistant'}
          intent="project_planning"
          context={{
            entityType: 'project',
            entityId: detail.project.id,
            projectId: detail.project.id,
            page: pageContext,
            suggestedPrompt: detail.summary.suggestedPrompt,
          }}
        />
        <details style={detailsStyle}>
          <summary style={summaryStyle}>More actions</summary>
          <div style={detailsBodyStyle}>
            <OpenChatPanelButton
              label={currentPlan ? 'Turn plan into cards' : 'Draft current plan'}
              intent={currentPlan ? 'spec_decomposition' : 'spec_planning'}
              context={{
                entityType: 'project',
                entityId: detail.project.id,
                projectId: detail.project.id,
                page: pageContext,
                suggestedPrompt: currentPlan
                  ? `Turn the current plan for ${detail.project.title} into small reviewable cards.`
                  : `Draft the current plan for ${detail.project.title}.`,
                starterSpecId: currentPlan?.spec.id ?? null,
                starterSpecTitle: currentPlan?.spec.title ?? null,
                starterWorkspacePath: detail.workspace?.workspacePath ?? null,
                starterRepoList: detail.project.linkedRepos,
              }}
              variant="outline"
            />
            <OpenChatPanelButton
              label={workspaceReady ? 'Standing delegation' : 'Prepare workspace'}
              intent={workspaceReady ? 'create_schedule' : 'project_planning'}
              context={{
                entityType: 'project',
                entityId: detail.project.id,
                projectId: detail.project.id,
                page: pageContext,
                suggestedPrompt: workspaceReady
                  ? `Create a standing delegated outcome for ${detail.project.title}.`
                  : `This project needs a workspace before code execution. Help me bind or bootstrap it.`,
                workspaceAction: workspaceReady ? null : 'bind_existing',
                starterWorkspacePath: detail.workspace?.workspacePath ?? null,
              }}
              variant="outline"
            />
          </div>
        </details>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link href="/review" style={linkChipStyle}>
          Open Review Queue
        </Link>
        <Link href={`/projects/${detail.project.id}`} style={linkChipStyle}>
          {surface === 'control' ? 'Project detail' : 'Control project'}
        </Link>
      </div>
    </section>
  );
}

const panelStyle = {
  display: 'grid',
  gap: '12px',
  padding: '20px',
  borderRadius: '24px',
  border: '1px solid var(--separator)',
  background: 'var(--material-ultra-thin)',
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

const bodyTextStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
};

const stackStyle = {
  display: 'grid',
  gap: '10px',
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
  display: 'grid',
  gap: '10px',
  marginTop: '10px',
};

const linkChipStyle = {
  minHeight: 36,
  padding: '0 12px',
  borderRadius: '999px',
  border: '1px solid var(--separator)',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  background: 'var(--material-thin)',
};
