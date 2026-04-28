'use client';

import { useState } from 'react';
import { MB } from './tokens';

interface CommandInputProps {
  onSend?: (text: string) => void;
  placeholder?: string;
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="4" y="1" width="6" height="8" rx="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="7" y1="12" x2="7" y2="13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke={MB.bgDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CommandInput({ onSend, placeholder = 'Send a command…' }: CommandInputProps) {
  const [value, setValue] = useState('');

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setValue('');
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
        gap: '8px',
        padding: '8px 12px 10px',
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
          padding: '0 12px',
          height: '36px',
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
        aria-label="Send"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '999px',
          background: MB.green,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <SendIcon />
      </button>
    </div>
  );
}
