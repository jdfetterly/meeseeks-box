'use client';

import type { MobileJob, ActiveSheet } from './types';
import { MB } from './tokens';

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2 6.5l3.5 3.5 5.5-6" stroke={MB.bgDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M3 2.5l7 3.5-7 3.5V2.5z" fill={MB.green} />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface JobsTabProps {
  jobs: MobileJob[];
  onDismissWaiting: (id: string) => void;
  onOpenSheet: (sheet: ActiveSheet) => void;
}

const sectionLabel = (color: string, text: string, count: number) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
    <span
      style={{
        fontSize: '10px',
        fontWeight: 400,
        color,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: MB.font,
      }}
    >
      {text}
    </span>
    <span
      style={{
        fontSize: '10px',
        fontWeight: 500,
        color,
        background: color === MB.green ? MB.greenBg : color === MB.orange ? MB.orangeBg : MB.redBg,
        border: `1px solid ${color === MB.green ? MB.greenBorder : color === MB.orange ? MB.orangeBorder : MB.redBorder}`,
        borderRadius: '999px',
        padding: '1px 7px',
        fontFamily: MB.font,
      }}
    >
      {count}
    </span>
  </div>
);

export function JobsTab({ jobs, onDismissWaiting, onOpenSheet }: JobsTabProps) {
  const waitingJobs = jobs.filter((j) => j.status === 'waiting');
  const runningJobs = jobs.filter((j) => j.status === 'running');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px 8px',
          height: '42px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            fontWeight: 400,
            color: MB.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: MB.font,
          }}
        >
          jobs
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {waitingJobs.length > 0 && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: MB.orange,
                background: MB.orangeBg,
                border: `1px solid ${MB.orangeBorder}`,
                borderRadius: '999px',
                padding: '2px 8px',
                fontFamily: MB.font,
              }}
            >
              {waitingJobs.length} waiting
            </span>
          )}
          {failedJobs.length > 0 && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                color: MB.red,
                background: MB.redBg,
                border: `1px solid ${MB.redBorder}`,
                borderRadius: '999px',
                padding: '2px 8px',
                fontFamily: MB.font,
              }}
            >
              {failedJobs.length} failed
            </span>
          )}
        </div>
      </header>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px', display: 'grid', gap: '14px', alignContent: 'start', paddingBottom: '14px' }}>

        {/* Waiting on you */}
        {waitingJobs.length > 0 && (
          <section>
            {sectionLabel(MB.orange, 'waiting on you', waitingJobs.length)}
            <div style={{ display: 'grid', gap: '6px' }}>
              {waitingJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    background: MB.bgCard,
                    border: `1px solid ${MB.border}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: MB.text,
                        fontFamily: MB.font,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {job.name}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: MB.green,
                        fontFamily: MB.font,
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      → {job.recommendation}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDismissWaiting(job.id)}
                    aria-label="Approve"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '999px',
                      border: 'none',
                      background: MB.green,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <CheckIcon />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Running */}
        {runningJobs.length > 0 && (
          <section>
            {sectionLabel(MB.green, 'running', runningJobs.length)}
            <div style={{ display: 'grid', gap: '6px' }}>
              {runningJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() =>
                    onOpenSheet({
                      kind: 'failed-job',
                      runId: job.id,
                      name: job.name,
                      errorText: job.errorText ?? '',
                      recommendation: job.recommendation,
                    })
                  }
                  style={{
                    background: MB.bgCard,
                    border: `1px solid ${MB.border}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <PulsingDot color={MB.green} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: MB.text,
                        fontFamily: MB.font,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {job.name}
                    </div>
                    <div style={{ fontSize: '10px', color: MB.textMuted, fontFamily: MB.font, marginTop: '2px' }}>
                      {job.statusText}
                    </div>
                  </div>
                  <span style={{ color: MB.textMuted }}>
                    <ChevronRightIcon />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Failed */}
        {failedJobs.length > 0 && (
          <section>
            {sectionLabel(MB.red, 'failed', failedJobs.length)}
            <div style={{ display: 'grid', gap: '6px' }}>
              {failedJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() =>
                    onOpenSheet({
                      kind: 'failed-job',
                      runId: job.id,
                      name: job.name,
                      errorText: job.errorText ?? 'Unknown error',
                      recommendation: job.recommendation,
                    })
                  }
                  style={{
                    background: MB.bgCard,
                    border: `1px solid ${MB.border}`,
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '999px',
                      background: MB.red,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: MB.text,
                        fontFamily: MB.font,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {job.name}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: MB.red,
                        fontFamily: MB.font,
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {job.errorText ?? 'run failed'}
                    </div>
                  </div>
                  <span style={{ color: MB.textMuted }}>
                    <ChevronRightIcon />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {jobs.length === 0 && (
          <div
            style={{
              fontSize: '11px',
              color: MB.textMuted,
              fontFamily: MB.font,
              padding: '24px',
              textAlign: 'center',
              background: MB.bgCard,
              border: `1px solid ${MB.border}`,
              borderRadius: '10px',
            }}
          >
            no active jobs
          </div>
        )}
      </div>
    </div>
  );
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '7px',
        height: '7px',
        borderRadius: '999px',
        background: color,
        flexShrink: 0,
        animation: 'mb-pulse 1.5s ease-in-out infinite',
      }}
    />
  );
}
