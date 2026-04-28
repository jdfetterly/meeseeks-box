'use client';

import { useState } from 'react';
import type { MobileApproval, MobileConversation, MobileProject, ActiveSheet } from './types';
import { MB } from './tokens';

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7l3.5 3.5 5.5-6" stroke={MB.bgDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function FolderIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1 3a1 1 0 0 1 1-1h3l1.5 2H11a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M12 7a5 5 0 0 1-5 5H3l-1 1V7a5 5 0 0 1 5-5 5 5 0 0 1 5 5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
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

function ChevronDownSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface CommandTabProps {
  approvals: MobileApproval[];
  conversation: MobileConversation | null;
  activeProject: MobileProject | null;
  onApprove: (id: string) => void;
  onSkip: (id: string) => void;
  onOpenSheet: (sheet: ActiveSheet) => void;
}

function ApprovalCard({
  approval,
  onApprove,
  onSkip,
}: {
  approval: MobileApproval;
  onApprove: () => void;
  onSkip: () => void;
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
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '10px 12px 8px',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: MB.text, fontFamily: MB.font, lineHeight: 1.3 }}>
            {approval.title}
          </span>
          <span style={{ color: MB.textMuted, flexShrink: 0, marginTop: '2px' }}>
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: MB.greenBg,
            border: `1px solid ${MB.greenBorder}`,
            borderRadius: '6px',
            padding: '4px 8px',
          }}
        >
          <span style={{ color: MB.green, fontSize: '10px', fontFamily: MB.font }}>→</span>
          <span style={{ color: MB.green, fontSize: '10px', fontFamily: MB.font }}>
            {approval.recommendation}
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 12px 8px', display: 'grid', gap: '6px' }}>
          <p style={{ margin: 0, fontSize: '11px', color: MB.textSecondary, fontFamily: MB.font, lineHeight: 1.5 }}>
            {approval.description}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {approval.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '9px',
                  fontWeight: 400,
                  color: MB.textMuted,
                  background: `rgba(255,255,255,0.04)`,
                  border: `1px solid ${MB.border}`,
                  borderRadius: '999px',
                  padding: '2px 7px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: MB.font,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px 10px',
          borderTop: `1px solid ${MB.border}`,
        }}
      >
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onSkip}
          aria-label="Skip"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '999px',
            border: `1px solid ${MB.borderStrong}`,
            background: 'transparent',
            color: MB.textMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <SkipIcon />
        </button>
        <button
          type="button"
          onClick={onApprove}
          aria-label="Approve"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '999px',
            border: 'none',
            background: MB.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <CheckIcon />
        </button>
      </div>
    </div>
  );
}

export function CommandTab({ approvals, conversation, activeProject, onApprove, onSkip, onOpenSheet }: CommandTabProps) {
  function formatTime(iso: string) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  }

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: MB.greenBg,
            border: `1px solid ${MB.greenBorder}`,
            borderRadius: '999px',
            padding: '3px 10px',
          }}
        >
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '999px',
              background: MB.green,
            }}
          />
          <span style={{ fontSize: '10px', color: MB.green, fontFamily: MB.font }}>connected</span>
        </div>
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
            color: MB.textSecondary,
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
        {/* Needs your input section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
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
              needs your input
            </span>
            {approvals.length > 0 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: MB.orange,
                  background: MB.orangeBg,
                  border: `1px solid ${MB.orangeBorder}`,
                  borderRadius: '999px',
                  padding: '1px 8px',
                  fontFamily: MB.font,
                }}
              >
                {approvals.length}
              </span>
            )}
          </div>
          {approvals.length === 0 ? (
            <div
              style={{
                fontSize: '11px',
                color: MB.textMuted,
                fontFamily: MB.font,
                padding: '12px',
                background: MB.bgCard,
                border: `1px solid ${MB.border}`,
                borderRadius: '10px',
                textAlign: 'center',
              }}
            >
              all clear
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {approvals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  onApprove={() => onApprove(approval.id)}
                  onSkip={() => onSkip(approval.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recent chat section */}
        {conversation && (
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
                recent chat
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                onOpenSheet({ kind: 'chat', conversationId: conversation.id, title: conversation.title })
              }
              style={{
                width: '100%',
                background: MB.bgCard,
                border: `1px solid ${MB.border}`,
                borderRadius: '10px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ color: MB.textMuted, display: 'flex' }}>
                <ChatIcon />
              </span>
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
                  {conversation.title}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: MB.textMuted,
                    fontFamily: MB.font,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {conversation.lastMessage}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', color: MB.textMuted, fontFamily: MB.font }}>
                  {formatTime(conversation.updatedAt)}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    color: MB.green,
                    background: MB.greenBg,
                    border: `1px solid ${MB.greenBorder}`,
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontFamily: MB.font,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  resume <ChevronRightIcon />
                </span>
              </div>
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
