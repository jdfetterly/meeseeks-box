import Link from 'next/link';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import {
  formatConversationKind,
  formatConversationStatus,
  groupConversationOverviews,
} from '@/lib/conversations/service';

export const dynamic = 'force-dynamic';

export default function ConversationsPage() {
  const groups = groupConversationOverviews();
  const conversationCount = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <h1 style={titleStyle}>Conversations</h1>
            <p style={subtitleStyle}>Saved context, active threads, and alternate paths.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={countStyle}>{conversationCount} saved</span>
            <OpenChatPanelButton
              label="Ask / Delegate"
              intent="general_chat"
              context={{
                entityType: 'home',
                page: 'conversations',
                suggestedPrompt: 'Help me start a new piece of work and attach it to the right project.',
              }}
            />
          </div>
        </div>

        {groups.length === 0 ? (
          <section style={emptyPanelStyle}>
            <h2 style={panelTitleStyle}>Nothing saved yet</h2>
            <p style={emptyStyle}>Start with the assistant. Active work will show up here once there is context worth returning to.</p>
          </section>
        ) : (
          <div style={groupGridStyle}>
            {groups.map((group) => (
              <section key={group.projectId ?? 'general'} style={groupPanelStyle}>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={sectionLabelStyle}>{group.projectId ? 'Project' : 'General'}</span>
                  <h2 style={panelTitleStyle}>{group.projectTitle}</h2>
                </div>
                <div style={listStyle}>
                  {group.items.map((overview) => (
                    <Link
                      key={overview.conversation.id}
                      href={`/chat/${overview.conversation.id}`}
                      style={conversationRowStyle}
                    >
                      <div style={{ display: 'grid', gap: '6px', minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'start' }}>
                          <strong>{overview.conversation.title ?? 'Untitled conversation'}</strong>
                          <span style={dateStyle}>
                            {new Date(overview.conversation.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span style={metaStyle}>
                          {formatConversationKind(overview.conversation.kind)} •{' '}
                          {formatConversationStatus(overview.conversation.status)}
                        </span>
                        <p style={summaryStyle}>
                          {overview.conversation.summary ?? overview.lastMessagePreview}
                        </p>
                        <div style={tagRowStyle}>
                          {overview.openLoopCount > 0 ? (
                            <span style={tagStyle}>
                              {overview.openLoopCount} open loop{overview.openLoopCount === 1 ? '' : 's'}
                            </span>
                          ) : null}
                          {overview.branchCount > 0 ? (
                            <span style={tagStyle}>
                              {overview.branchCount} branch{overview.branchCount === 1 ? '' : 'es'}
                            </span>
                          ) : null}
                          {overview.conversation.recommendedNextAction ? (
                            <span style={tagStyle}>{overview.conversation.recommendedNextAction}</span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  maxWidth: 1120,
  margin: '0 auto',
  padding: '32px 28px 56px',
  display: 'grid',
  gap: '22px',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '18px',
  alignItems: 'flex-start',
  flexWrap: 'wrap' as const,
};

const titleStyle = {
  margin: 0,
  fontSize: 'clamp(2rem, 3vw, 2.7rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.05em',
};

const subtitleStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
};

const countStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-tertiary)',
  fontWeight: 700,
};

const groupGridStyle = {
  display: 'grid',
  gap: '18px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
};

const groupPanelStyle = {
  display: 'grid',
  gap: '14px',
  padding: '20px',
  borderRadius: '24px',
  border: '1px solid var(--separator)',
  background: 'var(--material-ultra-thin)',
};

const emptyPanelStyle = {
  display: 'grid',
  gap: '8px',
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid var(--separator)',
  background: 'var(--material-ultra-thin)',
};

const sectionLabelStyle = {
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-quaternary)',
  fontWeight: 700,
};

const panelTitleStyle = {
  margin: 0,
  fontSize: '1.1rem',
  lineHeight: 1.1,
};

const listStyle = {
  display: 'grid',
  gap: '10px',
};

const conversationRowStyle = {
  display: 'grid',
  gap: '8px',
  padding: '16px',
  borderRadius: '18px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  textDecoration: 'none',
  color: 'inherit',
};

const metaStyle = {
  color: 'var(--text-tertiary)',
  fontSize: '0.84rem',
};

const dateStyle = {
  color: 'var(--text-quaternary)',
  fontSize: '0.8rem',
  whiteSpace: 'nowrap' as const,
};

const summaryStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '0.94rem',
};

const tagRowStyle = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap' as const,
};

const tagStyle = {
  padding: '4px 10px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--separator)',
  color: 'var(--text-tertiary)',
  fontSize: '0.78rem',
};

const emptyStyle = {
  margin: 0,
  color: 'var(--text-tertiary)',
};
