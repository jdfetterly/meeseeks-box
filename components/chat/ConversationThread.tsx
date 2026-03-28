'use client'

import { useState } from 'react'
import type { MessageRecord } from '@/lib/product-state/entities'
import { CanonicalMessageComposer } from '@/components/chat/CanonicalMessageComposer'

export function ConversationThread({
  conversationId,
  initialMessages,
}: {
  conversationId: string
  initialMessages: MessageRecord[]
}) {
  const [messages, setMessages] = useState(initialMessages)

  return (
    <>
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {messages.length === 0 ? (
          <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                border: '1px solid var(--separator)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                background:
                  message.role === 'user' ? 'var(--material-thick)' : 'var(--material-thin)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  alignItems: 'center',
                }}
              >
                <strong style={{ textTransform: 'capitalize' }}>{message.role}</strong>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              <p style={{ margin: 'var(--space-2) 0 0', whiteSpace: 'pre-wrap' }}>
                {message.contentText ?? JSON.stringify(message.contentJson)}
              </p>
            </div>
          ))
        )}
      </div>
      <CanonicalMessageComposer
        conversationId={conversationId}
        onCreated={(message) => {
          setMessages((currentMessages) => [...currentMessages, message])
        }}
      />
    </>
  )
}
