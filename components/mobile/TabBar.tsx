'use client';

import type React from 'react';
import type { ActiveTab } from './types';
import { MB } from './tokens';

interface TabBarProps {
  active: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  waitingJobCount: number;
}

function TerminalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 11h16" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="9" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14" width="14" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const TABS: { id: ActiveTab; Icon: () => React.ReactElement; label: string }[] = [
  { id: 'command', Icon: TerminalIcon, label: 'command' },
  { id: 'jobs', Icon: BriefcaseIcon, label: 'jobs' },
  { id: 'context', Icon: LayersIcon, label: 'context' },
];

export function TabBar({ active, onChange, waitingJobCount }: TabBarProps) {
  return (
    <nav
      aria-label="Main"
      style={{
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        height: '48px',
        background: MB.bgDeep,
        borderTop: `1px solid ${MB.border}`,
        fontFamily: MB.font,
      }}
    >
      {TABS.map(({ id, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0px',
              border: 'none',
              background: 'transparent',
              color: isActive ? MB.green : MB.textMuted,
              cursor: 'pointer',
              position: 'relative',
              paddingBottom: '0px',
            }}
          >
            <Icon />
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '2px',
                  background: MB.green,
                  borderRadius: '999px 999px 0 0',
                }}
              />
            )}
            {id === 'jobs' && waitingJobCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: 'calc(50% - 18px)',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '999px',
                  background: MB.orange,
                  color: '#000',
                  fontSize: '9px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  fontFamily: MB.font,
                }}
              >
                {waitingJobCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
