'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function MarkInboxItemReviewedButton({
  inboxItemId,
  label = 'Mark reviewed',
}: {
  inboxItemId: string
  label?: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resolveItem() {
    setError(null)
    setStatus(null)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/product-state/inbox/${inboxItemId}/resolve`, {
          method: 'POST',
        })
        const result = (await response.json()) as { error?: string }

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to mark item reviewed')
        }

        setStatus('Marked reviewed.')
        router.refresh()
      } catch (reviewError) {
        setError(
          reviewError instanceof Error
            ? reviewError.message
            : 'Failed to mark item reviewed',
        )
      }
    })
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={resolveItem}>
        {isPending ? 'Saving…' : label}
      </Button>
      {status ? (
        <span style={{ color: 'var(--system-green)', fontSize: '0.9rem' }}>{status}</span>
      ) : null}
      {error ? (
        <span style={{ color: 'var(--system-red)', fontSize: '0.9rem' }}>{error}</span>
      ) : null}
    </div>
  )
}
