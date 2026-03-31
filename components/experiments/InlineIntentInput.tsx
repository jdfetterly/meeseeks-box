'use client';

import { useState } from 'react';
import {
  useChatPanel,
  type ChatPanelContextValue,
} from '@/components/chat-panel/ChatPanelProvider';

export function InlineIntentInput({
  ghostedH1Style,
  context,
  projectTitle,
}: {
  ghostedH1Style: React.CSSProperties;
  context: Partial<ChatPanelContextValue>;
  projectTitle: string;
}) {
  const { openPanel } = useChatPanel();
  const [value, setValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        openPanel({
          intent: 'spec_planning',
          context: {
            ...context,
            suggestedPrompt: `Let's draft a lightweight plan for ${projectTitle}.`,
            draftPrompt: value.trim(), // The user's inline text is passed to the side panel
            autoSubmit: true,
          },
        });
      }
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Type your intent and hit enter to draft the spec..."
      style={{
        ...ghostedH1Style,
        width: '100%',
        background: 'transparent',
        border: 'none',
        outline: 'none',
      }}
      autoFocus
    />
  );
}
