'use client';

import { BottomSheet } from '../BottomSheet';
import { MB } from '../tokens';

interface FailedJobSheetProps {
  open: boolean;
  onClose: () => void;
  runId: string;
  name: string;
  errorText: string;
  recommendation: string;
}

export function FailedJobSheet({ open, onClose, name, errorText, recommendation }: FailedJobSheetProps) {
  async function handleRetry() {
    onClose();
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
            }}
          >
            ↺ Retry with context
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
