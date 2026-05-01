'use client';

import { useState } from 'react';
import { BottomSheet } from '../BottomSheet';
import { MB } from '../tokens';

interface ApiRunSummary {
  runId?: string;
  id?: string;
  scope?: 'ops' | 'personal' | null;
  agentId?: string | null;
  conversationId?: string | null;
}

interface FailedJobSheetProps {
  open: boolean;
  onClose: () => void;
  runId: string;
  name: string;
  errorText: string;
  recommendation: string;
  onStatus?: (status: { kind: 'success' | 'error' | 'loading'; message: string }) => void;
}

export function FailedJobSheet({ open, onClose, runId, name, errorText, recommendation, onStatus }: FailedJobSheetProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  async function handleRetry() {
    if (isRetrying) {
      return;
    }

    setIsRetrying(true);
    onStatus?.({ kind: 'loading', message: 'Retrying job…' });

    try {
      const response = await fetch('/api/product-state/runs');
      const payload = (await response.json()) as { runs?: ApiRunSummary[] };
      const run = (payload.runs ?? []).find((item) => (item.runId ?? item.id) === runId);

      if (!run?.scope || !run.agentId) {
        throw new Error(`Missing retry metadata for run ${runId}`);
      }

      const promptParts = [
        `Retry the failed job "${name}".`,
        recommendation ? `Guidance: ${recommendation}.` : null,
        errorText ? `Previous error: ${errorText}.` : null,
      ].filter((part): part is string => Boolean(part));

      const launchResponse = await fetch('/api/product-state/launch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          prompt: promptParts.join(' '),
          title: `${name} retry`,
          scope: run.scope,
          agentId: run.agentId,
          conversationId: run.conversationId ?? undefined,
          timing: 'now',
        }),
      });

      if (!launchResponse.ok) {
        throw new Error(`Failed to launch retry for run ${runId}`);
      }

      onStatus?.({ kind: 'success', message: 'Retry launched.' });
      onClose();
    } catch (error) {
      onStatus?.({ kind: 'error', message: error instanceof Error ? error.message : 'Failed to retry job.' });
      console.error('Failed to retry failed job with canonical launch', error);
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} heightPercent={52}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: MB.red,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: MB.text,
              fontFamily: MB.font,
              lineHeight: 1.3,
            }}
          >
            {name}
          </span>
        </div>

        {/* Error block */}
        {errorText && (
          <div
            style={{
              background: MB.redBg,
              border: `1px solid ${MB.redBorder}`,
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'grid',
              gap: '4px',
            }}
          >
            <span
              style={{
                fontSize: '9px',
                fontWeight: 600,
                color: MB.red,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: MB.font,
              }}
            >
              ERROR
            </span>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: MB.red,
                fontFamily: MB.font,
                lineHeight: 1.5,
              }}
            >
              {errorText}
            </p>
          </div>
        )}

        {/* Recommendation block */}
        {recommendation && (
          <div
            style={{
              background: MB.greenBg,
              border: `1px solid ${MB.greenBorder}`,
              borderRadius: '8px',
              padding: '10px 12px',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ color: MB.green, fontSize: '12px', fontFamily: MB.font, flexShrink: 0 }}>→</span>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: MB.green,
                fontFamily: MB.font,
                lineHeight: 1.5,
              }}
            >
              {recommendation}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              height: '40px',
              borderRadius: '999px',
              border: `1px solid ${MB.borderStrong}`,
              background: 'transparent',
              color: MB.textSecondary,
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: MB.font,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            style={{
              flex: 1,
              height: '40px',
              borderRadius: '999px',
              border: 'none',
              background: MB.green,
              color: MB.bgDeep,
              fontSize: '11px',
              fontWeight: 500,
              fontFamily: MB.font,
              cursor: 'pointer',
              opacity: isRetrying ? 0.7 : 1,
            }}
          >
            ↺ Retry with context
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
