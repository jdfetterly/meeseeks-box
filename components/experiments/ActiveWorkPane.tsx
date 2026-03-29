import Link from 'next/link';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import type { ActiveWorkPaneModel } from '@/lib/experiments/project-shell';

export function ActiveWorkPane({
  activeWork,
  surface = 'lab',
  pageContext = 'lab-project',
}: {
  activeWork: ActiveWorkPaneModel | null;
  surface?: 'lab' | 'control';
  pageContext?: 'lab-project' | 'project' | 'board';
}) {
  if (!activeWork) {
    return (
      <section style={panelStyle}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <div style={eyebrowStyle}>Active work pane</div>
          <h2 style={panelTitleStyle}>Select a card to zoom into execution context</h2>
          <p style={panelBodyStyle}>
            {surface === 'control'
              ? 'Stay on the project board while you inspect the selected card, then drop into the full work detail only when you need the deeper execution surface.'
              : 'This keeps the lab routes close to the Cline-like board-to-detail transition without replacing the control work detail route.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={panelStyle}>
      <div style={{ display: 'grid', gap: '6px' }}>
        <div style={eyebrowStyle}>Active work pane</div>
        <h2 style={panelTitleStyle}>{activeWork.workItem.title}</h2>
        <p style={metaStyle}>
          {activeWork.workItem.scope} • {activeWork.workItem.status} • {activeWork.workItem.priority ?? 'default'} priority
        </p>
      </div>

      {activeWork.spec ? (
        <div style={sectionStyle}>
          <strong>Plan context</strong>
          <p style={bodyTextStyle}>{activeWork.spec.title}</p>
          <p style={bodyTextStyle}>{activeWork.spec.outcome}</p>
        </div>
      ) : null}

      <div style={sectionStyle}>
        <strong>Execution context</strong>
        <p style={bodyTextStyle}>
          {activeWork.spec?.intent ??
            (surface === 'control'
              ? 'Open the full work detail or the linked conversation for the deeper brief. This pane stays lightweight so execution context remains visible on the board.'
              : 'Open the control work detail or the linked conversation for the full brief. This lab pane is intentionally lightweight and keeps the zoomed execution state in one place.')}
        </p>
      </div>

      {activeWork.sourceConversationTitle ? (
        <div style={sectionStyle}>
          <strong>Conversation linkage</strong>
          <p style={bodyTextStyle}>{activeWork.sourceConversationTitle}</p>
        </div>
      ) : null}

      {activeWork.openReviewEntry ? (
        <div style={reviewCalloutStyle}>
          <strong>Review waiting</strong>
          <p style={bodyTextStyle}>{activeWork.openReviewEntry.summary}</p>
          <Link href="/review" style={linkChipStyle}>
            Open Review Queue
          </Link>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link href={`/work/${activeWork.workItem.id}`} style={linkChipStyle}>
          Control work detail
        </Link>
        <OpenChatPanelButton
          label="Adjust in Assistant"
          intent="edit_existing"
          context={{
            entityType: 'work_item',
            entityId: activeWork.workItem.id,
            projectId: activeWork.workItem.projectId,
            page: pageContext,
            suggestedPrompt: `Adjust ${activeWork.workItem.title} without making me restate context.`,
          }}
          variant="outline"
        />
      </div>
    </section>
  );
}

const panelStyle = {
  display: 'grid',
  gap: '14px',
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

const panelBodyStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '0.95rem',
};

const metaStyle = {
  margin: 0,
  color: 'var(--text-tertiary)',
  fontSize: '0.9rem',
};

const sectionStyle = {
  display: 'grid',
  gap: '6px',
};

const bodyTextStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  whiteSpace: 'pre-wrap' as const,
};

const reviewCalloutStyle = {
  display: 'grid',
  gap: '6px',
  borderRadius: '18px',
  border: '1px solid color-mix(in srgb, var(--system-green) 24%, transparent)',
  background: 'color-mix(in srgb, var(--system-green) 10%, transparent)',
  padding: '14px 16px',
};

const linkChipStyle = {
  minHeight: 34,
  padding: '0 12px',
  borderRadius: '999px',
  border: '1px solid var(--separator)',
  display: 'inline-flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  background: 'var(--material-thin)',
};
