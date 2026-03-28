import Link from 'next/link';
import { ReviewDecisionActions } from '@/components/review/ReviewDecisionActions';
import { listReviewQueue } from '@/lib/review-queue/service';

export const dynamic = 'force-dynamic';

export default function ReviewQueuePage() {
  const reviewItems = listReviewQueue();
  const openItems = reviewItems.filter((item) => item.status === 'open');

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <h1 style={titleStyle}>Review Queue</h1>
            <p style={subtitleStyle}>Finished output waiting for judgment.</p>
          </div>
          <span style={countStyle}>{openItems.length} open</span>
        </div>

        {openItems.length === 0 ? (
          <section style={emptyPanelStyle}>
            <h2 style={panelTitleStyle}>Nothing waiting</h2>
            <p style={emptyStyle}>When agents finish work, it will show up here for a decision.</p>
          </section>
        ) : (
          <div style={stackStyle}>
            {openItems.map((item) => (
              <section key={item.id} style={itemCardStyle}>
                <div style={itemHeaderStyle}>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <strong style={{ fontSize: '1.05rem' }}>{item.summary}</strong>
                    <span style={metaStyle}>
                      {item.projectTitle ?? 'Unassigned project'} • {item.workItemTitle}
                    </span>
                    {item.specTitle ? <span style={subtleMetaStyle}>Plan: {item.specTitle}</span> : null}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link href={`/work/${item.workItemId}`} style={linkChipStyle}>
                      Open work
                    </Link>
                    {item.artifactIds.length > 0 ? (
                      <Link href={`/artifacts/${item.artifactIds[0]}`} style={linkChipStyle}>
                        Open artifact
                      </Link>
                    ) : null}
                  </div>
                </div>

                <p style={reasonStyle}>{item.reviewReason}</p>

                {item.acceptanceCriteria.length > 0 ? (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <span style={sectionLabelStyle}>Acceptance</span>
                    <ul style={listStyle}>
                      {item.acceptanceCriteria.map((criterion) => (
                        <li key={criterion}>{criterion}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {item.expectedOutput ? (
                  <p style={subtleMetaStyle}>Expected output: {item.expectedOutput}</p>
                ) : null}

                <ReviewDecisionActions reviewItemId={item.id} />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle = {
  maxWidth: 1080,
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

const emptyPanelStyle = {
  display: 'grid',
  gap: '8px',
  padding: '24px',
  borderRadius: '24px',
  border: '1px solid var(--separator)',
  background: 'var(--material-ultra-thin)',
};

const panelTitleStyle = {
  margin: 0,
  fontSize: '1.1rem',
};

const stackStyle = {
  display: 'grid',
  gap: '14px',
};

const itemCardStyle = {
  display: 'grid',
  gap: '16px',
  padding: '22px',
  borderRadius: '24px',
  border: '1px solid var(--separator)',
  background: 'var(--material-ultra-thin)',
};

const itemHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '16px',
  alignItems: 'flex-start',
  flexWrap: 'wrap' as const,
};

const metaStyle = {
  color: 'var(--text-secondary)',
  fontSize: '0.94rem',
};

const subtleMetaStyle = {
  margin: 0,
  color: 'var(--text-tertiary)',
  fontSize: '0.88rem',
};

const reasonStyle = {
  margin: 0,
  color: 'var(--text-secondary)',
  fontSize: '0.98rem',
};

const sectionLabelStyle = {
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-quaternary)',
  fontWeight: 700,
};

const listStyle = {
  margin: 0,
  paddingLeft: '1.1rem',
  color: 'var(--text-secondary)',
  display: 'grid',
  gap: '6px',
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

const emptyStyle = {
  margin: 0,
  color: 'var(--text-tertiary)',
};
