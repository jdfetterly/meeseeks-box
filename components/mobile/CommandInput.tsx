'use client';

import { useState } from 'react';
import { MB } from './tokens';

interface CommandInputProps {
  onSend?: (text: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
      <rect x="4" y="1" width="6" height="8" rx="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7" y1="12" x2="7" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke={muted ? MB.textMuted : MB.bgDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CommandInput({ onSend, placeholder = 'Send a command…', disabled = false }: CommandInputProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const trimmedValue = value.trim();
  const canSend = Boolean(trimmedValue) && !disabled && !sending;

  async function handleSend() {
    if (disabled || sending) return;
    const trimmed = trimmedValue;
    if (!trimmed) return;
    setSending(true);
    try {
      await onSend?.(trimmed);
      setValue('');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend();
  }

  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px 12px',
        background: MB.bgDeep,
        fontFamily: MB.font,
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
          padding: '0 14px',
          height: '48px',
        }}
      >
        <span style={{ color: MB.textMuted, display: 'flex', alignItems: 'center' }}>
          <MicIcon />
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: MB.text,
            fontSize: '15px',
            fontFamily: MB.font,
          }}
        />
      </div>
      <button
        type="button"
        onClick={handleSend}
        aria-label="Send"
        aria-disabled={!canSend}
        disabled={!canSend}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '999px',
          background: canSend ? MB.green : MB.bgCard,
          border: canSend ? 'none' : `1px solid ${MB.borderStrong}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canSend ? 'pointer' : 'default',
          flexShrink: 0,
          opacity: canSend ? 1 : 0.72,
        }}
      >
        <SendIcon muted={!canSend} />
      </button>
    </div>
  );
}
