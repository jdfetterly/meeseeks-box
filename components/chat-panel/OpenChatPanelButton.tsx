'use client';

import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useChatPanel,
  type ChatPanelContextValue,
  type ConversationIntent,
} from '@/components/chat-panel/ChatPanelProvider';

export function OpenChatPanelButton({
  label,
  intent = 'general_chat',
  context,
  variant = 'secondary',
  fullWidth = false,
}: {
  label: string;
  intent?: ConversationIntent;
  context?: Partial<ChatPanelContextValue>;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline';
  fullWidth?: boolean;
}) {
  const { openPanel } = useChatPanel();

  return (
    <Button
      variant={variant}
      className={fullWidth ? 'w-full justify-center' : undefined}
      onClick={() => {
        openPanel({
          intent,
          context,
        });
      }}
    >
      <MessageSquarePlus size={16} />
      {label}
    </Button>
  );
}
