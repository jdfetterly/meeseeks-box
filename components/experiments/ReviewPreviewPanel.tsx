import Link from 'next/link';
import type { ReviewQueueEntry } from '@/lib/review-queue/service';

export function ReviewPreviewPanel({
  reviewEntries,
  projectId,
}: {
  reviewEntries: ReviewQueueEntry[];
  projectId: string;
}) {
  return (
    <section style={panelStyle}>
      <div style={{ display: 'grid', gap: '6px' }}>
        <div style={eyebrowStyle}>Review preview</div>
        <h2 style={panelTitleStyle}>Review</h2>
      </div>

      {reviewEntries.length === 0 ? (
        <div style={emptyStyle}>
          <strong>Nothing waiting</strong>
        </div>
      ) : (
        <details style={detailsStyle} open>
          <summary style={summaryStyle}>{reviewEntries.length} item{reviewEntries.length === 1 ? '' : 's'} waiting</summary>
          <div style={detailsBodyStyle}>
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
        </details>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Link href={`/work?projectId=${projectId}`} style={linkChipStyle}>
          Control board
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

const emptyStyle = {
  display: 'grid',
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
