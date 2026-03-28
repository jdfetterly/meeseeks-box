import Link from 'next/link';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { formatConversationStatus } from '@/lib/conversations/service';
import { getBriefingModel } from '@/lib/briefing/service';

export const dynamic = 'force-dynamic';

export default function BriefingPage() {
  const briefing = getBriefingModel();
  const stats = [
    { label: 'Needs action', value: briefing.inboxPreview.length },
    { label: 'Review', value: briefing.reviewPreview.length },
    { label: 'Open loops', value: briefing.openLoopPreview.length },
    { label: 'Active threads', value: briefing.actionableConversations.length },
  ];

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <h1 style={titleStyle}>Briefing</h1>
            <p style={subtitleStyle}>Decide what needs you. Delegate the rest.</p>
            <div style={statRowStyle}>
              {stats.map((stat) => (
                <div key={stat.label} style={statPillStyle}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <OpenChatPanelButton
            label="Ask / Delegate"
            intent="general_chat"
            context={{
              entityType: 'home',
              page: 'briefing',
              suggestedPrompt: 'Tell me what matters next and move it forward.',
            }}
          />
        </div>

        <div style={primaryGridStyle}>
          <section style={heroPanelStyle}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <span style={sectionLabelStyle}>Do This Now</span>
              <h2 style={heroTitleStyle}>{briefing.hero?.title ?? 'No blocker is leading right now.'}</h2>
              <p style={heroDetailStyle}>
                {briefing.hero?.detail ?? 'Use the assistant to choose the next move instead of navigating by hand.'}
              </p>
            </div>
            <div style={heroActionsStyle}>
              {briefing.hero ? (
                <Link href={briefing.hero.href} style={primaryLinkStyle}>
                  {briefing.hero.actionLabel}
                </Link>
              ) : null}
              <OpenChatPanelButton
                label={briefing.hero ? 'Work this through Assistant' : 'Pick the next move'}
                intent="general_chat"
                context={{
                  entityType: 'home',
                  page: 'briefing',
                  suggestedPrompt:
                    briefing.hero?.title ?? 'Help me pick the most important next move.',
                }}
                variant={briefing.hero ? 'outline' : 'default'}
              />
            </div>
          </section>

          <section style={panelStyle}>
            <div style={{ display: 'grid', gap: '6px' }}>
              <span style={sectionLabelStyle}>Keep Moving</span>
              <h2 style={panelTitleStyle}>Resume active work</h2>
            </div>
            <div style={stackStyle}>
              {briefing.actionableConversations.length === 0 ? (
                <p style={emptyStyle}>Nothing is in motion right now.</p>
              ) : (
                briefing.actionableConversations.map((item) => (
                  <Link
                    key={item.conversation.id}
                    href={
                      item.conversation.projectId
                        ? `/projects/${item.conversation.projectId}`
                        : `/chat/${item.conversation.id}`
                    }
                    style={rowStyle}
                  >
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <strong>{item.conversation.title ?? 'Untitled conversation'}</strong>
                      <span style={rowMetaStyle}>
                        {formatConversationStatus(item.conversation.status)}
                        {item.projectTitle ? ` • ${item.projectTitle}` : ''}
                      </span>
                    </div>
                    <span style={rowActionStyle}>Open</span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        <div style={secondaryGridStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <span style={sectionLabelStyle}>Operational</span>
                <h2 style={panelTitleStyle}>Needs action</h2>
              </div>
              <Link href="/inbox" style={subtleLinkStyle}>
                Open Inbox
              </Link>
            </div>
            <div style={stackStyle}>
              {briefing.inboxPreview.length === 0 ? (
                <p style={emptyStyle}>Nothing is blocked.</p>
              ) : (
                briefing.inboxPreview.map((item) => (
                  <Link key={item.id} href="/inbox" style={rowStyle}>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <strong>{item.title}</strong>
                      <span style={rowMetaStyle}>{item.category.replaceAll('_', ' ')}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <span style={sectionLabelStyle}>Judgment</span>
                <h2 style={panelTitleStyle}>Ready for review</h2>
              </div>
              <Link href="/review" style={subtleLinkStyle}>
                Open Review Queue
              </Link>
            </div>
            <div style={stackStyle}>
              {briefing.reviewPreview.length === 0 ? (
                <p style={emptyStyle}>No output is waiting.</p>
              ) : (
                briefing.reviewPreview.map((item) => (
                  <Link key={item.id} href="/review" style={rowStyle}>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <strong>{item.summary}</strong>
                      <span style={rowMetaStyle}>
                        {item.projectTitle ?? 'No project'}
                        {item.workItemTitle ? ` • ${item.workItemTitle}` : ''}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <span style={sectionLabelStyle}>Unfinished</span>
                <h2 style={panelTitleStyle}>Open loops</h2>
              </div>
            </div>
            <div style={stackStyle}>
              {briefing.openLoopPreview.length === 0 ? (
                <p style={emptyStyle}>No blocking loops are active.</p>
              ) : (
                briefing.openLoopPreview.map((loop) => (
                  <Link
                    key={loop.id}
                    href={loop.projectId ? `/projects/${loop.projectId}` : '/chat'}
                    style={rowStyle}
                  >
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <strong>{loop.title}</strong>
                      <span style={rowMetaStyle}>
                        {loop.priority} priority • waiting on {loop.waitingOn}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  maxWidth: 1160,
  margin: '0 auto',
  padding: '32px 28px 56px',
  display: 'grid',
  gap: '24px',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '20px',
  alignItems: 'flex-start',
  flexWrap: 'wrap' as const,
};

const titleStyle = {
  margin: 0,
  fontSize: 'clamp(2rem, 3vw, 2.8rem)',
  lineHeight: 0.96,
  letterSpacing: '-0.05em',
};

const subtitleStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '1rem',
};

const statRowStyle = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap' as const,
};

const statPillStyle = {
  display: 'inline-flex',
  gap: '8px',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: '999px',
  background: 'var(--material-thin)',
  border: '1px solid var(--separator)',
  color: 'var(--text-secondary)',
  fontSize: '0.85rem',
};

const primaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '18px',
};

const secondaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '18px',
};

const heroPanelStyle = {
  display: 'grid',
  gap: '16px',
  padding: '22px',
  borderRadius: '24px',
  background:
    'linear-gradient(135deg, color-mix(in srgb, var(--accent-fill) 90%, rgba(255,255,255,0.02)), rgba(255,255,255,0.02))',
  border: '1px solid color-mix(in srgb, var(--accent) 24%, var(--separator))',
};

const panelStyle = {
  display: 'grid',
  gap: '16px',
  padding: '20px',
  borderRadius: '24px',
  background: 'var(--material-ultra-thin)',
  border: '1px solid var(--separator)',
};

const sectionLabelStyle = {
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-quaternary)',
  fontWeight: 700,
};

const heroTitleStyle = {
  margin: 0,
  fontSize: 'clamp(1.6rem, 2.4vw, 2.35rem)',
  lineHeight: 0.98,
  letterSpacing: '-0.05em',
};

const heroDetailStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  maxWidth: 560,
};

const panelTitleStyle = {
  margin: '2px 0 0',
  fontSize: '1.1rem',
  lineHeight: 1.1,
};

const panelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'flex-start',
};

const primaryLinkStyle = {
  height: 44,
  padding: '0 18px',
  borderRadius: '999px',
  background: 'var(--accent)',
  color: 'var(--accent-contrast)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 'fit-content',
  textDecoration: 'none',
  fontWeight: 700,
  whiteSpace: 'nowrap' as const,
  boxShadow: '0 10px 22px rgba(106,216,255,0.18)',
};

const heroActionsStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap' as const,
  alignItems: 'center',
};

const subtleLinkStyle = {
  color: 'var(--text-tertiary)',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: 600,
};

const stackStyle = {
  display: 'grid',
  gap: '10px',
};

const rowStyle = {
  display: 'grid',
  gap: '4px',
  padding: '14px 16px',
  borderRadius: '18px',
  background: 'var(--material-thin)',
  border: '1px solid var(--separator)',
  textDecoration: 'none',
  color: 'inherit',
};

const rowMetaStyle = {
  color: 'var(--text-tertiary)',
  fontSize: '0.85rem',
};

const rowActionStyle = {
  color: 'var(--text-quaternary)',
  fontSize: '0.85rem',
  fontWeight: 600,
};

const emptyStyle = {
  margin: 0,
  color: 'var(--text-tertiary)',
};
