import Link from 'next/link';
import { OpenChatPanelButton } from '@/components/chat-panel/OpenChatPanelButton';
import { ReconcileSchedulesButton } from '@/components/schedules/ReconcileSchedulesButton';
import { listScheduleSummaries } from '@/lib/product-state/repositories';
import {
  describeScheduleCadence,
  describeSchedulePurpose,
  describeScheduleStatus,
  describeScheduleSyncState,
  describeScheduleUsefulness,
  formatScheduleTime,
} from '@/lib/schedules/presentation';

export const dynamic = 'force-dynamic';

export default function SchedulesPage() {
  const scheduleSummaries = listScheduleSummaries().filter((summary) => summary.status !== 'deleted');
  const recurring = scheduleSummaries.filter((summary) => summary.scheduleKind === 'cron');
  const oneShots = scheduleSummaries.filter((summary) => summary.scheduleKind !== 'cron');

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <h1 style={titleStyle}>Schedules</h1>
            <p style={subtitleStyle}>Recurring work, recent output, and anything drifting.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <OpenChatPanelButton
              label="New schedule"
              intent="create_schedule"
              context={{
                entityType: 'home',
                page: 'schedules',
                suggestedPrompt: 'Create a recurring schedule and confirm only what is missing.',
              }}
            />
            <ReconcileSchedulesButton />
          </div>
        </div>

        {scheduleSummaries.length === 0 ? (
          <section style={emptyPanelStyle}>
            <h2 style={panelTitleStyle}>No schedules yet</h2>
            <p style={emptyStyle}>Use the assistant to create recurring work instead of configuring jobs by hand.</p>
            <Link href="/work?tab=jobs" style={linkStyle}>
              Open templates
            </Link>
          </section>
        ) : (
          <div style={groupGridStyle}>
            <ScheduleSection title="Recurring" items={recurring} />
            <ScheduleSection title="One-shot" items={oneShots} />
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleSection({
  title,
  items,
}: {
  title: string;
  items: ReturnType<typeof listScheduleSummaries>;
}) {
  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <span style={sectionLabelStyle}>Standing work</span>
          <h2 style={panelTitleStyle}>{title}</h2>
        </div>
        <span style={countStyle}>{items.length}</span>
      </div>
      <div style={listStyle}>
        {items.length === 0 ? (
          <p style={emptyStyle}>Nothing here yet.</p>
        ) : (
          items.map((summary) => (
            <Link key={summary.scheduleId} href={`/schedules/${summary.scheduleId}`} style={rowStyle}>
              <div style={{ display: 'grid', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
                  <strong>{summary.label}</strong>
                  <span style={statusStyle}>{describeScheduleStatus(summary.status)}</span>
                </div>
                <p style={purposeStyle}>{describeSchedulePurpose(summary)}</p>
                <div style={metaRowStyle}>
                  <span>{describeScheduleCadence(summary.scheduleKind, summary.metadata)}</span>
                  {summary.nextRunAt ? <span>next {formatScheduleTime(summary.nextRunAt)}</span> : null}
                  <span>
                    usefulness:{' '}
                    {describeScheduleUsefulness({
                      missedRun: summary.missedRun,
                      consecutiveFailureCount: summary.consecutiveFailureCount,
                      lastSuccessfulOutputAt: summary.lastSuccessfulOutputAt,
                    })}
                  </span>
                </div>
                <span style={syncStyle}>
                  {summary.externalJobId
                    ? `Runtime job ${summary.externalJobId}`
                    : describeScheduleSyncState(summary.metadata, {
                        scheduleStatus: summary.status,
                        hasExternalJobId: Boolean(summary.externalJobId),
                      })}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
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

const emptyPanelStyle = {
  display: 'grid',
  gap: '10px',
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid var(--separator)',
  background: 'var(--material-ultra-thin)',
};

const linkStyle = {
  color: 'var(--accent)',
  textDecoration: 'none',
  fontWeight: 700,
};

const groupGridStyle = {
  display: 'grid',
  gap: '18px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
};

const panelStyle = {
  display: 'grid',
  gap: '14px',
  padding: '20px',
  borderRadius: '24px',
  border: '1px solid var(--separator)',
  background: 'var(--material-ultra-thin)',
};

const panelHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
};

const sectionLabelStyle = {
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-quaternary)',
  fontWeight: 700,
};

const panelTitleStyle = {
  margin: '2px 0 0',
  fontSize: '1.1rem',
};

const countStyle = {
  fontSize: '0.9rem',
  color: 'var(--text-tertiary)',
  fontWeight: 700,
};

const listStyle = {
  display: 'grid',
  gap: '10px',
};

const rowStyle = {
  display: 'grid',
  gap: '8px',
  padding: '16px',
  borderRadius: '18px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  textDecoration: 'none',
  color: 'inherit',
};

const statusStyle = {
  color: 'var(--text-tertiary)',
  fontSize: '0.82rem',
  whiteSpace: 'nowrap' as const,
};

const purposeStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '0.94rem',
};

const metaRowStyle = {
  display: 'flex',
  gap: '8px 10px',
  flexWrap: 'wrap' as const,
  color: 'var(--text-tertiary)',
  fontSize: '0.82rem',
};

const syncStyle = {
  color: 'var(--text-quaternary)',
  fontSize: '0.8rem',
};

const emptyStyle = {
  margin: 0,
  color: 'var(--text-tertiary)',
};
