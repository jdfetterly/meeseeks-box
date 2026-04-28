'use client';

import type { ReactNode } from 'react';
import { MB } from './tokens';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  heightPercent?: number;
}

export function BottomSheet({ open, onClose, children, heightPercent = 60 }: BottomSheetProps) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 80,
          background: 'rgba(0,0,0,0.55)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.2s ease',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 90,
          height: `${heightPercent}%`,
          background: MB.bgSheet,
          borderTop: `1px solid ${MB.borderStrong}`,
          borderLeft: `1px solid ${MB.borderStrong}`,
          borderRight: `1px solid ${MB.borderStrong}`,
          borderRadius: '18px 18px 0 0',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: MB.font,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '999px',
              background: MB.borderStrong,
            }}
          />
        </div>
        {children}
      </div>
    </>
  );
}
