import Link from 'next/link';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import type { ProjectDetailRecord } from '@/lib/projects/service';

export function MemoryContextRail({
  detail,
  compact = false,
  surface = 'lab',
  pageContext = 'lab-project',
}: {
  detail: ProjectDetailRecord;
  compact?: boolean;
  surface?: 'lab' | 'control';
  pageContext?: 'lab-project' | 'project' | 'board';
}) {
  const playbook = detail.playbook;
  const suggestionItems = detail.learningSuggestions.filter((entry) => entry.status === 'open').slice(0, compact ? 2 : 4);
  const memorySections = [
    {
      title: 'Goals',
      items: playbook?.goals ?? [],
    },
    {
      title: 'Recent decisions',
      items: playbook?.recentDecisions ?? [],
    },
    {
      title: 'Preferred agents',
      items: playbook?.preferredAgents ?? [],
    },
  ].filter((section) => section.items.length > 0);

  return (
    <section style={panelStyle}>
      <div style={{ display: 'grid', gap: '6px' }}>
        <div style={eyebrowStyle}>Memory context</div>
        <h2 style={panelTitleStyle}>Persistent context the agent should inherit</h2>
        <p style={panelBodyStyle}>
          {surface === 'control'
            ? 'Keep decisions, constraints, and learned preferences visible so project work stays coherent across assistant sessions, boards, and review.'
            : 'Keep decisions, constraints, and learned preferences visible here so the lab variants can be judged on memory usefulness instead of raw board tightness.'}
        </p>
      </div>

      {playbook?.workingStyle ? (
        <div style={sectionStyle}>
          <strong>Working style</strong>
          <p style={bodyTextStyle}>{playbook.workingStyle}</p>
        </div>
      ) : null}

      {playbook?.reviewPreferences ? (
        <div style={sectionStyle}>
          <strong>Review preferences</strong>
          <p style={bodyTextStyle}>{playbook.reviewPreferences}</p>
        </div>
      ) : null}

      {playbook?.repoContext ? (
        <div style={sectionStyle}>
          <strong>Repo context</strong>
          <p style={bodyTextStyle}>{playbook.repoContext}</p>
        </div>
      ) : null}

      {memorySections.map((section) => (
        <div key={section.title} style={sectionStyle}>
          <strong>{section.title}</strong>
          <ul style={listStyle}>
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}

      {suggestionItems.length > 0 ? (
        <div style={sectionStyle}>
          <strong>Learning suggestions</strong>
          <div style={{ display: 'grid', gap: '8px' }}>
            {suggestionItems.map((suggestion) => (
              <div key={suggestion.id} style={learningCardStyle}>
                <strong style={{ fontSize: '0.92rem' }}>{suggestion.title}</strong>
                <p style={bodyTextStyle}>{suggestion.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <OpenChatPanelButton
          label="Strengthen context"
          intent="edit_existing"
          context={{
            entityType: 'project',
            entityId: detail.project.id,
            projectId: detail.project.id,
            page: pageContext,
            suggestedPrompt: `Capture or refine the durable context for ${detail.project.title}. Focus on constraints, decisions, and learned preferences.`,
          }}
          variant="outline"
        />
        <Link href="/memory" style={linkChipStyle}>
          Open memory registry
        </Link>
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

const sectionStyle = {
  display: 'grid',
  gap: '8px',
};

const bodyTextStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  whiteSpace: 'pre-wrap' as const,
};

const listStyle = {
  margin: 0,
  paddingLeft: '1rem',
  color: 'var(--text-secondary)',
  display: 'grid',
  gap: '6px',
};

const learningCardStyle = {
  display: 'grid',
  gap: '4px',
  borderRadius: '18px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  padding: '12px 14px',
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
