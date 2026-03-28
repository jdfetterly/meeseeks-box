'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function DraftActions({ draftId }: { draftId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scheduledAt, setScheduledAt] = useState('')
  const [error, setError] = useState<string | null>(null)

  function promote(timing: 'now' | 'schedule_once') {
    setError(null)
    startTransition(async () => {
      try {
        const scheduledAtIso =
          timing === 'schedule_once' && scheduledAt ? new Date(scheduledAt).toISOString() : null
        const response = await fetch(`/api/product-state/drafts/${draftId}/promote`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ timing, scheduledAt: scheduledAtIso }),
        })
        const result = (await response.json()) as {
          error?: string
          launch?: { workItemId?: string | null; scheduleId?: string | null }
        }

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to promote draft')
        }

        if (timing === 'schedule_once' && result.launch?.scheduleId) {
          router.push(`/schedules/${result.launch.scheduleId}`)
          return
        }
        if (result.launch?.workItemId) {
          router.push(`/work/${result.launch.workItemId}`)
          return
        }
        router.push('/work?tab=drafts')
      } catch (promoteError) {
        setError(promoteError instanceof Error ? promoteError.message : 'Failed to promote draft')
      }
    })
  }

  function discard() {
    setError(null)
    startTransition(async () => {
      try {
        const response = await fetch(`/api/product-state/drafts/${draftId}`, {
          method: 'DELETE',
        })
        const result = (await response.json()) as { error?: string }

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to delete draft')
        }

        router.push('/work?tab=drafts')
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete draft')
      }
    })
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(event) => setScheduledAt(event.target.value)}
        style={{
          width: '100%',
          minHeight: 42,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--separator)',
          background: 'var(--material-thin)',
          color: 'var(--text-primary)',
          padding: '10px 12px',
        }}
      />
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Button type="button" size="sm" disabled={isPending} onClick={() => promote('now')}>
          {isPending ? 'Working…' : 'Run now'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || !scheduledAt}
          onClick={() => promote('schedule_once')}
        >
          Schedule once
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={discard}>
          Discard
        </Button>
      </div>
      {error ? <span style={{ color: 'var(--system-red)', fontSize: '0.9rem' }}>{error}</span> : null}
    </div>
  )
}
