'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function AttachConversationToWork({
  conversationId,
  workItems,
}: {
  conversationId: string
  workItems: Array<{ id: string; title: string }>
}) {
  const router = useRouter()
  const [selectedWorkItemId, setSelectedWorkItemId] = useState(workItems[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  if (workItems.length === 0) {
    return <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>No attachable work items yet.</p>
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <select
        value={selectedWorkItemId}
        onChange={(event) => setSelectedWorkItemId(event.target.value)}
        style={{
          width: '100%',
          minHeight: 42,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--separator)',
          background: 'var(--material-thin)',
          color: 'var(--text-primary)',
          padding: '10px 12px',
        }}
      >
        {workItems.map((workItem) => (
          <option key={workItem.id} value={workItem.id}>
            {workItem.title}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          type="button"
          disabled={isPending || !selectedWorkItemId}
          onClick={() => {
            setError(null)
            setStatus(null)
            startTransition(async () => {
              try {
                const response = await fetch(
                  `/api/product-state/work-items/${selectedWorkItemId}/attach-conversation`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversationId }),
                  },
                )
                const result = (await response.json()) as { error?: string; workItem?: { id?: string; title?: string } }

                if (!response.ok) {
                  throw new Error(result.error ?? 'Failed to attach conversation')
                }

                setStatus(`Attached to ${result.workItem?.title ?? 'work item'}.`)
                if (result.workItem?.id) {
                  router.push(`/work/${result.workItem.id}`)
                }
              } catch (attachError) {
                setError(
                  attachError instanceof Error ? attachError.message : 'Failed to attach conversation',
                )
              }
            })
          }}
        >
          {isPending ? 'Attaching…' : 'Attach to existing work'}
        </Button>
        {status ? <span style={{ color: 'var(--system-green)' }}>{status}</span> : null}
        {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}
      </div>
    </div>
  )
}
