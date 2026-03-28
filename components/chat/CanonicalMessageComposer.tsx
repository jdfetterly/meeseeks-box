'use client'

import type React from 'react'
import { useState, useTransition } from 'react'
import type { MessageRecord } from '@/lib/product-state/entities'

export function CanonicalMessageComposer({
  conversationId,
  onCreated,
}: {
  conversationId: string
  onCreated?: (message: MessageRecord) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/product-state/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'user',
            contentText: content,
          }),
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error ?? result.message ?? 'Failed to create message')
        }

        setContent('')
        onCreated?.(result.message)
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Failed to create message')
      }
    })
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Send a message into the shared conversation."
        rows={4}
        style={{
          width: '100%',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--separator)',
          background: 'var(--material-thin)',
          color: 'var(--text-primary)',
          padding: '12px 14px',
          minHeight: 120,
          resize: 'vertical',
        }}
        required
      />
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="submit"
          disabled={isPending}
          style={{
            minHeight: 42,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--separator)',
            background: 'var(--material-thick)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            cursor: isPending ? 'wait' : 'pointer',
          }}
        >
          {isPending ? 'Sending…' : 'Send message'}
        </button>
        {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}
      </div>
    </form>
  )
}
