'use client';

import { useState } from 'react';
import type { MobileJob, ActiveSheet } from './types';
import { MB } from './tokens';

interface ApiApproval {
  id: string;
  runId: string | null;
  status: string;
}

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
        fontSize: '12px',
        fontWeight: 700,
        color,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        fontFamily: MB.mono,
      }}
    >
      {text}
    </span>
    <span
      style={{
        fontSize: '12px',
        fontWeight: 700,
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
  const [resolvingIds, setResolvingIds] = useState<Record<string, boolean>>({});
  const waitingJobs = jobs.filter((j) => j.status === 'waiting');
  const runningJobs = jobs.filter((j) => j.status === 'running');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  async function handleApprove(job: MobileJob) {
    if (resolvingIds[job.id]) {
      return;
    }

    setResolvingIds((prev) => ({ ...prev, [job.id]: true }));

    try {
      const approvalsResponse = await fetch('/api/product-state/approvals');
      const approvalsPayload = (await approvalsResponse.json()) as { approvals?: ApiApproval[] };
      const approval = (approvalsPayload.approvals ?? []).find((item) => item.runId === job.id && item.status === 'pending');

      if (!approval) {
        onDismissWaiting(job.id);
        return;
      }

      const resolveResponse = await fetch(`/api/product-state/approvals/${approval.id}/resolve`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision: 'allow-once' }),
      });

      if (!resolveResponse.ok) {
        throw new Error(`Failed to resolve approval ${approval.id}`);
      }

      onDismissWaiting(job.id);
    } catch (error) {
      console.error('Failed to resolve waiting job approval', error);
    } finally {
      setResolvingIds((prev) => {
        const next = { ...prev };
        delete next[job.id];
        return next;
      });
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 18px 12px',
          minHeight: '64px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 750,
            color: MB.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: MB.mono,
          }}
        >
          jobs
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {waitingJobs.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
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
                fontSize: '12px',
                fontWeight: 700,
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px', display: 'grid', gap: '20px', alignContent: 'start', paddingBottom: '22px' }}>

        {/* Waiting on you */}
        {waitingJobs.length > 0 && (
          <section>
            {sectionLabel(MB.orange, 'waiting on you', waitingJobs.length)}
            <div style={{ display: 'grid', gap: '10px' }}>
              {waitingJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    background: MB.bgCard,
                    border: `1px solid ${MB.border}`,
                    borderRadius: '14px',
                    padding: '15px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 700,
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
                        fontSize: '14px',
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
                    onClick={() => handleApprove(job)}
                    aria-label="Approve"
                    disabled={Boolean(resolvingIds[job.id])}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '999px',
                      border: 'none',
                      background: MB.green,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      opacity: resolvingIds[job.id] ? 0.7 : 1,
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
            <div style={{ display: 'grid', gap: '10px' }}>
              {runningJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() =>
                    onOpenSheet({
                      kind: 'failed-job',
                      runId: job.id,
                      conversationId: job.conversationId,
                      name: job.name,
                      errorText: job.errorText ?? '',
                      recommendation: job.recommendation,
                    })
                  }
                  style={{
                    background: MB.bgCard,
                    border: `1px solid ${MB.border}`,
                    borderRadius: '14px',
                    padding: '15px 16px',
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
                        fontSize: '16px',
                        fontWeight: 700,
                        color: MB.text,
                        fontFamily: MB.font,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {job.name}
                    </div>
                    <div style={{ fontSize: '14px', color: MB.textMuted, fontFamily: MB.font, marginTop: '4px' }}>
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
            <div style={{ display: 'grid', gap: '10px' }}>
              {failedJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() =>
                    onOpenSheet({
                      kind: 'failed-job',
                      runId: job.id,
                      conversationId: job.conversationId,
                      name: job.name,
                      errorText: job.errorText ?? 'Unknown error',
                      recommendation: job.recommendation,
                    })
                  }
                  style={{
                    background: MB.bgCard,
                    border: `1px solid ${MB.border}`,
                    borderRadius: '14px',
                    padding: '15px 16px',
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
                        fontSize: '16px',
                        fontWeight: 700,
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
                        fontSize: '14px',
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
              fontSize: '15px',
              color: MB.textSecondary,
              fontFamily: MB.font,
              padding: '28px 20px',
              textAlign: 'center',
              background: MB.bgCard,
              border: `1px solid ${MB.border}`,
              borderRadius: '14px',
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
