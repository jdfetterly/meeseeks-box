'use client';

import { useEffect, useRef, useState } from 'react';
import { BottomSheet } from '../BottomSheet';
import type { MobileMessage } from '../types';
import { MB } from '../tokens';

interface ChatSheetProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  title: string;
}

interface ApiMessage {
  id: string;
  role: string;
  content_text?: string | null;
  contentText?: string | null;
  created_at?: string;
  createdAt?: string;
}

function mapApiMessage(message: ApiMessage): MobileMessage {
  return {
    id: message.id,
    role: message.role as MobileMessage['role'],
    content: message.contentText ?? message.content_text ?? '…',
    createdAt: message.createdAt ?? message.created_at ?? new Date().toISOString(),
  };
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 7h10M8 3l4 4-4 4" stroke={MB.bgDeep} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="3.5" y="1" width="5" height="6" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 6a5 5 0 0 0 9 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6" y1="11" x2="6" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ChatSheet({ open, onClose, conversationId, title }: ChatSheetProps) {
  const [messages, setMessages] = useState<MobileMessage[]>([]);
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !conversationId) {
      setMessages([]);
      setValue('');
      return;
    }

    setMessages([]);
    setValue('');
    fetch(`/api/product-state/conversations/${conversationId}/messages`)
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data: { messages?: ApiMessage[] }) => {
        setMessages((data.messages ?? []).map(mapApiMessage));
      })
      .catch(() => setMessages([]));
  }, [open, conversationId]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (typeof bottomRef.current?.scrollIntoView === 'function') {
          bottomRef.current.scrollIntoView();
        }
      }, 50);
    }
  }, [open, messages.length]);

  async function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || sending || !conversationId) return;
    setValue('');
    setSending(true);

    const optimistic: MobileMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const response = await fetch(`/api/product-state/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role: 'user', contentText: trimmed }),
      });
      if (!response.ok) {
        throw new Error('Message send failed');
      }

      const refreshed = await fetch(`/api/product-state/conversations/${conversationId}/messages`)
        .then((r) => (r.ok ? r.json() : { messages: [] }))
        .catch(() => ({ messages: [] }));
      setMessages(
        (refreshed as { messages?: ApiMessage[] }).messages?.map(mapApiMessage) ?? [optimistic],
      );
    } catch {
      setMessages((prev) => prev.filter((msg) => msg.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} heightPercent={82}>
      {/* Sheet header */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 14px 10px',
          borderBottom: `1px solid ${MB.border}`,
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: MB.text,
            fontFamily: MB.font,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: MB.textMuted,
            fontSize: '16px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: MB.textMuted,
              fontSize: '11px',
              fontFamily: MB.font,
              marginTop: '24px',
            }}
          >
            no messages yet
          </div>
        )}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '999px',
                    border: `1px solid ${MB.greenBorder}`,
                    background: MB.greenBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 600,
                    color: MB.green,
                    fontFamily: MB.font,
                    flexShrink: 0,
                  }}
                >
                  M
                </div>
              )}
              <div
                style={{
                  maxWidth: '72%',
                  padding: '8px 10px',
                  borderRadius: isUser ? '10px 0 10px 10px' : '0 10px 10px 10px',
                  background: isUser ? MB.greenBg : MB.bgCard,
                  border: `1px solid ${isUser ? MB.greenBorder : MB.border}`,
                  fontSize: '11px',
                  color: isUser ? MB.green : MB.text,
                  fontFamily: MB.font,
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        {/* Thinking indicator */}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '999px',
                border: `1px solid ${MB.greenBorder}`,
                background: MB.greenBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                color: MB.green,
                fontFamily: MB.font,
                flexShrink: 0,
              }}
            >
              M
            </div>
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '0 10px 10px 10px',
                background: MB.bgCard,
                border: `1px solid ${MB.border}`,
                fontSize: '14px',
                color: MB.textMuted,
                fontFamily: MB.font,
                letterSpacing: '2px',
              }}
            >
              ···
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px 12px',
          borderTop: `1px solid ${MB.border}`,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: MB.bgCard,
            border: `1px solid ${MB.borderStrong}`,
            borderRadius: '999px',
            padding: '0 12px',
            height: '34px',
          }}
        >
          <span style={{ color: MB.textMuted, display: 'flex', alignItems: 'center' }}>
            <MicIcon />
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Reply…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: MB.text,
              fontSize: '11px',
              fontFamily: MB.font,
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !value.trim()}
          aria-label="Send"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '999px',
            background: value.trim() ? MB.green : MB.bgCard,
            border: `1px solid ${value.trim() ? MB.green : MB.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: value.trim() ? 'pointer' : 'default',
            flexShrink: 0,
          }}
        >
          <SendIcon />
        </button>
      </div>
    </BottomSheet>
  );
}
