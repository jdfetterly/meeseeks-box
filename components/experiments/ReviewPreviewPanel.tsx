import Link from 'next/link';
import type { ReviewQueueEntry } from '@/lib/review-queue/service';

export function ReviewPreviewPanel({
  reviewEntries,
  projectId,
  surface = 'lab',
}: {
  reviewEntries: ReviewQueueEntry[];
  projectId: string;
  surface?: 'lab' | 'control';
}) {
  return (
    <section style={panelStyle}>
      <div style={{ display: 'grid', gap: '6px' }}>
        <div style={eyebrowStyle}>Review preview</div>
        <h2 style={panelTitleStyle}>Completion still flows through Review Queue</h2>
        <p style={panelBodyStyle}>
          {surface === 'control'
            ? 'This stays a lightweight preview. The canonical decision surface remains `/review`.'
            : 'Keep review read-only in the lab shell. The canonical decision surface remains `/review`.'}
        </p>
      </div>

      {reviewEntries.length === 0 ? (
        <div style={emptyStyle}>
          <strong>Nothing waiting</strong>
          <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
            When outputs finish, they should appear here first as a preview and in Review Queue as the source of truth.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {reviewEntries.slice(0, 3).map((entry) => (
            <div key={entry.id} style={reviewCardStyle}>
              <strong style={{ fontSize: '0.95rem' }}>{entry.summary}</strong>
              <span style={metaStyle}>
                {entry.workItemTitle}
                {entry.specTitle ? ` • ${entry.specTitle}` : ''}
              </span>
              <p style={reasonStyle}>{entry.reviewReason}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link href={`/work/${entry.workItemId}`} style={linkChipStyle}>
                  Open work
                </Link>
                <Link href="/review" style={linkChipStyle}>
                  Open Review Queue
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
        <Link href="/review" style={linkChipStyle}>
          Canonical queue
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

const reviewCardStyle = {
  display: 'grid',
  gap: '6px',
  borderRadius: '18px',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  padding: '14px 16px',
};

const metaStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.88rem',
};

const reasonStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '0.93rem',
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
