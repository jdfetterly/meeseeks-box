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
    <svg width="16" height="16" viewBox="0 0 13 13" fill="none">
      <path d="M1 3a1 1 0 0 1 1-1h3l1.5 2H11a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
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
        borderRadius: '14px',
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
          padding: '14px 16px 12px',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 650, color: MB.text, fontFamily: MB.font, lineHeight: 1.25 }}>
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
            borderRadius: '8px',
            padding: '6px 9px',
          }}
        >
          <span style={{ color: MB.green, fontSize: '12px', fontFamily: MB.mono }}>→</span>
          <span style={{ color: MB.green, fontSize: '13px', fontFamily: MB.font, lineHeight: 1.3 }}>
            {approval.recommendation}
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 12px', display: 'grid', gap: '8px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: MB.textSecondary, fontFamily: MB.font, lineHeight: 1.45 }}>
            {approval.description}
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {approval.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '11px',
                  fontWeight: 400,
                  color: MB.textMuted,
                  background: `rgba(255,255,255,0.04)`,
                  border: `1px solid ${MB.border}`,
                  borderRadius: '999px',
                  padding: '2px 7px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: MB.mono,
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
          padding: '10px 16px 14px',
          borderTop: `1px solid ${MB.border}`,
        }}
      >
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onSkip}
          aria-label="Skip"
          style={{
            width: '44px',
            height: '44px',
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
            width: '44px',
            height: '44px',
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0, width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px 10px',
          minHeight: '76px',
          gap: '14px',
        }}
      >
        <div style={{ minWidth: 0, display: 'grid', gap: '5px' }}>
          <div
            style={{
              width: 'fit-content',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: MB.greenBg,
              border: `1px solid ${MB.greenBorder}`,
              borderRadius: '999px',
              padding: '4px 10px',
            }}
          >
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '999px',
                background: MB.green,
              }}
            />
            <span style={{ fontSize: '12px', color: MB.green, fontFamily: MB.font, fontWeight: 650 }}>connected</span>
          </div>
          <h1
            style={{
              margin: 0,
              color: MB.text,
              fontFamily: MB.font,
              fontSize: '21px',
              fontWeight: 720,
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {activeProject?.title ?? 'Project'}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onOpenSheet({ kind: 'project-switcher' })}
          aria-label="Switch project"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: MB.bgCard,
            border: `1px solid ${MB.borderStrong}`,
            borderRadius: '999px',
            padding: '0 12px',
            minHeight: '42px',
            cursor: 'pointer',
            color: MB.textSecondary,
            flexShrink: 0,
          }}
        >
          <FolderIcon />
          <span style={{ fontSize: '14px', color: MB.textSecondary, fontFamily: MB.font, fontWeight: 600 }}>
            Switch
          </span>
          <ChevronDownSmall />
        </button>
      </header>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '4px 18px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          paddingBottom: '22px',
        }}
      >
        {/* Needs your input section */}
        <section style={{ minWidth: 0, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
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
              needs your input
            </span>
            {approvals.length > 0 && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
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
                fontSize: '15px',
                color: MB.textSecondary,
                fontFamily: MB.font,
                padding: '18px 16px',
                background: MB.bgCard,
                border: `1px solid ${MB.border}`,
                borderRadius: '14px',
                textAlign: 'center',
                lineHeight: 1.35,
              }}
            >
              All clear. Start the next move from the command bar.
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
          <section style={{ minWidth: 0, width: '100%' }}>
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
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
                background: MB.bgCard,
                border: `1px solid ${MB.border}`,
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ color: MB.textMuted, display: 'flex', paddingTop: '2px' }}>
                <ChatIcon />
              </span>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: MB.text,
                    fontFamily: MB.font,
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {conversation.title}
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    color: MB.textSecondary,
                    fontFamily: MB.font,
                    lineHeight: 1.35,
                    marginTop: '5px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {conversation.lastMessage}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0, minWidth: 0 }}>
                <span style={{ fontSize: '12px', color: MB.textMuted, fontFamily: MB.font, whiteSpace: 'nowrap' }}>
                  {formatTime(conversation.updatedAt)}
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: MB.green,
                    background: MB.greenBg,
                    border: `1px solid ${MB.greenBorder}`,
                    borderRadius: '999px',
                    padding: '5px 10px',
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
