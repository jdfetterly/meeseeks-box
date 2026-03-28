'use client'

import type { CSSProperties } from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AgentContextPicker } from '@/components/agents/AgentContextPicker'

export function ConversationToWorkComposer({
  conversationId,
  defaultTitle,
}: {
  conversationId: string
  defaultTitle: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(defaultTitle)
  const [prompt, setPrompt] = useState('')
  const [agentContext, setAgentContext] = useState('mini-ops')
  const [agentId, setAgentId] = useState('jarvis')
  const [timing, setTiming] = useState<'now' | 'schedule_once'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatus(null)

    startTransition(async () => {
      try {
        const response = await fetch('/api/product-state/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            prompt,
            agentContext,
            agentId,
            timing,
            conversationId,
            scheduledAt:
              timing === 'schedule_once' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
          }),
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error ?? result.message ?? 'Failed to create work')
        }

        setStatus(`Created work item ${result.launch.workItemId}.`)
        setPrompt('')
        setScheduledAt('')
        if (timing === 'schedule_once' && result.launch.scheduleId) {
          router.push(`/schedules/${result.launch.scheduleId}`)
          return
        }
        if (result.launch.workItemId) {
          router.push(`/work/${result.launch.workItemId}`)
        }
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Failed to create work')
      }
    })
  }

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <input value={title} onChange={(event) => setTitle(event.target.value)} style={fieldStyle} />
      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Describe the work to create from this conversation."
        rows={4}
        style={{ ...fieldStyle, minHeight: 120, resize: 'vertical' }}
        required
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <AgentContextPicker
          value={agentContext}
          agentId={agentId}
          onContextChange={setAgentContext}
          onAgentChange={setAgentId}
          idPrefix="conversation-work"
        />
        <select
          value={timing}
          onChange={(event) => setTiming(event.target.value as 'now' | 'schedule_once')}
          style={fieldStyle}
        >
          <option value="now">Run now</option>
          <option value="schedule_once">Schedule once</option>
        </select>
      </div>
      {timing === 'schedule_once' ? (
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
          style={fieldStyle}
          required
        />
      ) : null}
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
          {isPending ? 'Creating…' : 'Create work from conversation'}
        </button>
        {status ? <span style={{ color: 'var(--system-green)' }}>{status}</span> : null}
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
