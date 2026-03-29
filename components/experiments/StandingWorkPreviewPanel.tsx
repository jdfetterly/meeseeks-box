import Link from 'next/link';
import type { WorkBoardLane } from '@/lib/work-board/service';

function formatTime(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function StandingWorkPreviewPanel({
  lanes,
  projectId,
  surface = 'lab',
}: {
  lanes: WorkBoardLane[];
  projectId: string;
  surface?: 'lab' | 'control';
}) {
  const scheduleCards = lanes
    .flatMap((lane) => lane.cards)
    .filter((card) => card.scheduleStatus || card.scheduleTime)
    .sort((a, b) => {
      const left = a.scheduleTime ?? '';
      const right = b.scheduleTime ?? '';
      return left.localeCompare(right);
    });

  return (
    <section style={panelStyle}>
      <div style={{ display: 'grid', gap: '6px' }}>
        <div style={eyebrowStyle}>Standing work</div>
        <h2 style={panelTitleStyle}>Recurring and scheduled outcomes</h2>
        <p style={panelBodyStyle}>
          {surface === 'control'
            ? 'Keep recurring and scheduled outcomes visible beside the board so delegated operational work is managed with the rest of the project.'
            : 'Keep non-code delegated work visible in the same shell so the experiment can be judged on more than coding cards.'}
        </p>
      </div>

      {scheduleCards.length === 0 ? (
        <div style={emptyStyle}>
          <strong>No standing work linked yet</strong>
          <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
            Use standing delegation when a project needs recurring output, not just one-off execution.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {scheduleCards.slice(0, 3).map((card) => (
            <div key={card.workItemId} style={cardStyle}>
              <strong style={{ fontSize: '0.94rem' }}>{card.title}</strong>
              <p style={bodyTextStyle}>
                {card.scheduleStatus ? `Status: ${card.scheduleStatus.replaceAll('_', ' ')}` : 'Scheduled'}
                {card.scheduleTime ? ` • next ${formatTime(card.scheduleTime)}` : ''}
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link href={`/work/${card.workItemId}`} style={linkChipStyle}>
                  Open work
                </Link>
                <Link href="/schedules" style={linkChipStyle}>
                  Open schedules
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link href={`/work?projectId=${projectId}`} style={linkChipStyle}>
          {surface === 'control' ? 'Project board' : 'Control board'}
        </Link>
        <Link href="/schedules" style={linkChipStyle}>
          Canonical schedules
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

const emptyStyle = {
  display: 'grid',
  gap: '6px',
  borderRadius: '18px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  padding: '14px 16px',
};

const cardStyle = {
  display: 'grid',
  gap: '6px',
  borderRadius: '18px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  padding: '14px 16px',
};

const bodyTextStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '0.92rem',
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
