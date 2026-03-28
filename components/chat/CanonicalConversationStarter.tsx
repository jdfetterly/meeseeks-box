'use client'

import type { CSSProperties } from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AgentContextPicker } from '@/components/agents/AgentContextPicker'

export function CanonicalConversationStarter() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [agentContext, setAgentContext] = useState('mini-ops')
  const [agentId, setAgentId] = useState('jarvis')
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)

        startTransition(async () => {
          try {
            const response = await fetch('/api/product-state/conversations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: title || null,
                agentContext,
                agentId,
              }),
            })
            const result = await response.json()

            if (!response.ok) {
              throw new Error(result.error ?? result.message ?? 'Failed to create conversation')
            }

            setTitle('')
            router.push(`/chat/${result.conversation.id}`)
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Failed to create conversation')
          }
        })
      }}
      style={{ display: 'grid', gap: 'var(--space-3)' }}
    >
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <label htmlFor="conversation-title" style={{ fontWeight: 600 }}>
          Conversation title
        </label>
        <input
          id="conversation-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional title"
          style={fieldStyle}
        />
      </div>
      <AgentContextPicker
        value={agentContext}
        agentId={agentId}
        onContextChange={setAgentContext}
        onAgentChange={setAgentId}
        idPrefix="conversation"
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
          {isPending ? 'Creating…' : 'Create conversation'}
        </button>
        {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}
      </div>
    </form>
  )
}

const fieldStyle: CSSProperties = {
  width: '100%',
  minHeight: 42,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
}
