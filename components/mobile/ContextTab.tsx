'use client';

import { useState } from 'react';
import type { MobileBundle, MobileProject, ActiveSheet } from './types';
import { MB } from './tokens';

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      {filled ? (
        <path
          d="M7 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9.5l-3 1.5.5-3.5L2 5l3.5-.5L7 1.5z"
          fill={MB.green}
          stroke={MB.green}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M7 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9.5l-3 1.5.5-3.5L2 5l3.5-.5L7 1.5z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1 3a1 1 0 0 1 1-1h3l1.5 2H11a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

interface ContextTabProps {
  bundles: MobileBundle[];
  activeProject: MobileProject | null;
  onTogglePin: (id: string) => void;
  onOpenSheet: (sheet: ActiveSheet) => void;
}

function BundleRow({
  bundle,
  onTogglePin,
}: {
  bundle: MobileBundle;
  onTogglePin: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: MB.bgCard,
        border: `1px solid ${MB.border}`,
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 12px',
        }}
      >
        <div
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '999px',
            background: bundle.pinned ? MB.green : MB.orange,
            flexShrink: 0,
          }}
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            minWidth: 0,
            padding: 0,
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 400,
              color: MB.text,
              fontFamily: MB.font,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
            }}
          >
            {bundle.name}
          </span>
        </button>
        <button
          type="button"
          onClick={onTogglePin}
          aria-label={bundle.pinned ? 'Unpin' : 'Pin'}
          style={{
            background: 'transparent',
            border: 'none',
            color: bundle.pinned ? MB.green : MB.textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
            flexShrink: 0,
          }}
        >
          <PinIcon filled={bundle.pinned} />
        </button>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: 'transparent',
            border: 'none',
            color: MB.textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '2px',
            flexShrink: 0,
          }}
        >
          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>
      {expanded && bundle.summary && (
        <div
          style={{
            padding: '0 12px 10px',
            borderTop: `1px solid ${MB.border}`,
          }}
        >
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '11px',
              color: MB.textSecondary,
              fontFamily: MB.font,
              lineHeight: 1.5,
            }}
          >
            {bundle.summary}
          </p>
        </div>
      )}
    </div>
  );
}

export function ContextTab({ bundles, activeProject, onTogglePin, onOpenSheet }: ContextTabProps) {
  const pinnedBundles = bundles.filter((b) => b.pinned);
  const allBundles = bundles;

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
          context
        </span>
        <button
          type="button"
          onClick={() => onOpenSheet({ kind: 'project-switcher' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: MB.bgCard,
            border: `1px solid ${MB.borderStrong}`,
            borderRadius: '999px',
            padding: '3px 10px',
            cursor: 'pointer',
          }}
        >
          <FolderIcon />
          <span style={{ fontSize: '11px', color: MB.textSecondary, fontFamily: MB.font }}>
            {activeProject?.title ?? 'No project'}
          </span>
          <ChevronDownSmall />
        </button>
      </header>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px', display: 'grid', gap: '14px', alignContent: 'start', paddingBottom: '14px' }}>

        {/* Pinned section */}
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
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
              pinned
            </span>
            <span style={{ fontSize: '10px', color: MB.textMuted, fontFamily: MB.font }}>
              always in context
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {pinnedBundles.length === 0 ? (
              <span style={{ fontSize: '11px', color: MB.textMuted, fontFamily: MB.font }}>
                no pinned bundles
              </span>
            ) : (
              pinnedBundles.map((bundle) => (
                <button
                  key={bundle.id}
                  type="button"
                  onClick={() => onTogglePin(bundle.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: MB.greenBg,
                    border: `1px solid ${MB.greenBorder}`,
                    borderRadius: '999px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    color: MB.green,
                  }}
                >
                  <div
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '999px',
                      background: MB.green,
                    }}
                  />
                  <span style={{ fontSize: '11px', fontFamily: MB.font }}>{bundle.name}</span>
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>✕</span>
                </button>
              ))
            )}
          </div>
        </section>

        {/* All bundles section */}
        <section>
          <div style={{ marginBottom: '8px' }}>
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
              all bundles
            </span>
          </div>
          <div style={{ display: 'grid', gap: '6px' }}>
            {allBundles.map((bundle) => (
              <BundleRow key={bundle.id} bundle={bundle} onTogglePin={() => onTogglePin(bundle.id)} />
            ))}
          </div>

          {/* Add bundle button */}
          <button
            type="button"
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '10px',
              background: 'transparent',
              border: `1px dashed ${MB.border}`,
              borderRadius: '10px',
              color: MB.textMuted,
              fontSize: '11px',
              fontFamily: MB.font,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span style={{ fontSize: '13px' }}>+</span> add bundle
          </button>
        </section>
      </div>
    </div>
  );
}
