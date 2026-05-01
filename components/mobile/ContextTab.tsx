'use client';

import { useEffect, useState } from 'react';
import type { MobileBundle, MobileProject, ActiveSheet } from './types';
import { MB } from './tokens';

const PROJECT_SELECTION_STORAGE_KEY = 'meeseeks-mobile.project-selection';
const PROJECT_SELECTION_EVENT = 'meeseeks-mobile-project-selection';

interface PersistedProjectSelection {
  id: string;
  title: string;
}

function readPersistedProjectSelection(): PersistedProjectSelection | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(PROJECT_SELECTION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedProjectSelection> | null;
    if (typeof parsed?.id !== 'string' || !parsed.id.trim()) {
      return null;
    }

    return {
      id: parsed.id.trim(),
      title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : 'Project',
    };
  } catch {
    return null;
  }
}

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
  onCreateBundle: (input: { title: string; summary: string }) => Promise<void>;
  creatingBundle?: boolean;
  createBundleError?: string | null;
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
        borderRadius: '14px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 16px',
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
              fontSize: '16px',
              fontWeight: 700,
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
            padding: '8px',
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
            padding: '8px',
            flexShrink: 0,
          }}
        >
          {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>
      {expanded && bundle.summary && (
        <div
          style={{
            padding: '0 16px 14px',
            borderTop: `1px solid ${MB.border}`,
          }}
        >
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '14px',
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

export function ContextTab({
  bundles,
  activeProject,
  onTogglePin,
  onOpenSheet,
  onCreateBundle,
  creatingBundle = false,
  createBundleError = null,
}: ContextTabProps) {
  const pinnedBundles = bundles.filter((b) => b.pinned);
  const allBundles = bundles;
  const [projectSelection, setProjectSelection] = useState<PersistedProjectSelection | null>(null);
  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleSummary, setBundleSummary] = useState('');
  const [localBundleError, setLocalBundleError] = useState<string | null>(null);

  useEffect(() => {
    setProjectSelection(readPersistedProjectSelection());

    function handleProjectSelection(event: Event) {
      const selection = (event as CustomEvent<PersistedProjectSelection | null>).detail ?? null;
      if (selection) {
        setProjectSelection(selection);
        return;
      }

      setProjectSelection(readPersistedProjectSelection());
    }

    window.addEventListener(PROJECT_SELECTION_EVENT, handleProjectSelection as EventListener);
    return () => window.removeEventListener(PROJECT_SELECTION_EVENT, handleProjectSelection as EventListener);
  }, []);

  const displayProjectTitle =
    projectSelection && activeProject && projectSelection.id === activeProject.id
      ? activeProject.title
      : projectSelection?.title ?? activeProject?.title ?? 'No project';
  const canCreateBundle = Boolean(bundleTitle.trim()) && !creatingBundle;

  async function handleCreateBundle() {
    const title = bundleTitle.trim();
    if (!title || creatingBundle) {
      return;
    }

    setLocalBundleError(null);
    try {
      await onCreateBundle({ title, summary: bundleSummary.trim() });
      setBundleTitle('');
      setBundleSummary('');
      setIsAddingBundle(false);
    } catch (error) {
      setLocalBundleError(error instanceof Error ? error.message : 'Failed to add bundle');
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
          padding: '16px 18px 12px',
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
            padding: '0 12px',
            minHeight: '42px',
            cursor: 'pointer',
          }}
        >
          <FolderIcon />
          <span style={{ fontSize: '14px', color: MB.textSecondary, fontFamily: MB.font, fontWeight: 650, maxWidth: '190px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayProjectTitle}
          </span>
          <ChevronDownSmall />
        </button>
      </header>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px', display: 'grid', gap: '20px', alignContent: 'start', paddingBottom: '22px' }}>

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
                fontSize: '12px',
                fontWeight: 700,
                color: MB.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontFamily: MB.mono,
              }}
            >
              pinned
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {pinnedBundles.length === 0 ? (
              <span style={{ fontSize: '15px', color: MB.textSecondary, fontFamily: MB.font }}>
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
                    padding: '7px 12px',
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
                  <span style={{ fontSize: '14px', fontFamily: MB.font, fontWeight: 650 }}>{bundle.name}</span>
                  <span style={{ fontSize: '13px', opacity: 0.7 }}>✕</span>
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
                fontSize: '12px',
                fontWeight: 700,
                color: MB.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                fontFamily: MB.mono,
              }}
            >
              all bundles
            </span>
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {allBundles.map((bundle) => (
              <BundleRow key={bundle.id} bundle={bundle} onTogglePin={() => onTogglePin(bundle.id)} />
            ))}
          </div>

          {/* Add bundle button */}
          {isAddingBundle ? (
            <div
              style={{
                display: 'grid',
                gap: '8px',
                marginTop: '8px',
                padding: '12px',
                background: MB.bgCard,
                border: `1px dashed ${MB.border}`,
                borderRadius: '14px',
              }}
            >
              <input
                value={bundleTitle}
                onChange={(event) => setBundleTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setIsAddingBundle(false);
                    setLocalBundleError(null);
                  }
                }}
                autoFocus
                placeholder="Bundle title"
                disabled={creatingBundle}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: `1px solid ${MB.borderStrong}`,
                  borderRadius: '999px',
                  background: MB.bg,
                  color: MB.text,
                  fontSize: '14px',
                  fontFamily: MB.font,
                  outline: 'none',
                  padding: '10px 12px',
                }}
              />
              <textarea
                value={bundleSummary}
                onChange={(event) => setBundleSummary(event.target.value)}
                placeholder="Optional summary"
                disabled={creatingBundle}
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: `1px solid ${MB.borderStrong}`,
                  borderRadius: '12px',
                  background: MB.bg,
                  color: MB.text,
                  fontSize: '14px',
                  fontFamily: MB.font,
                  outline: 'none',
                  padding: '10px 12px',
                  resize: 'vertical',
                }}
              />
              {(localBundleError || createBundleError) && (
                <p style={{ margin: 0, color: MB.red, fontSize: '12px', fontFamily: MB.font }}>
                  {localBundleError ?? createBundleError}
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingBundle(false);
                    setLocalBundleError(null);
                  }}
                  disabled={creatingBundle}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '999px',
                    border: `1px solid ${MB.borderStrong}`,
                    background: 'transparent',
                    color: MB.textSecondary,
                    fontSize: '13px',
                    fontFamily: MB.font,
                    cursor: creatingBundle ? 'default' : 'pointer',
                  }}
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleCreateBundle()}
                  disabled={!canCreateBundle}
                  style={{
                    flex: 1,
                    height: '40px',
                    borderRadius: '999px',
                    border: 'none',
                    background: canCreateBundle ? MB.green : MB.bg,
                    color: canCreateBundle ? MB.bgDeep : MB.textMuted,
                    fontSize: '13px',
                    fontFamily: MB.font,
                    cursor: canCreateBundle ? 'pointer' : 'default',
                    opacity: canCreateBundle ? 1 : 0.7,
                  }}
                >
                  {creatingBundle ? 'adding…' : 'add bundle'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingBundle(true)}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '14px',
                background: 'transparent',
                border: `1px dashed ${MB.border}`,
                borderRadius: '14px',
                color: MB.textMuted,
                fontSize: '15px',
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
          )}
        </section>
      </div>
    </div>
  );
}
