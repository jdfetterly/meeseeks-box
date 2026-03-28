'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function ArchiveMemoryEntryButton({ memoryEntryId }: { memoryEntryId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            try {
              const response = await fetch(
                `/api/product-state/memory/entries/${memoryEntryId}/archive`,
                { method: 'POST' },
              )
              const result = (await response.json()) as { error?: string }

              if (!response.ok) {
                throw new Error(result.error ?? 'Failed to archive memory entry')
              }

              router.refresh()
            } catch (archiveError) {
              setError(
                archiveError instanceof Error
                  ? archiveError.message
                  : 'Failed to archive memory entry',
              )
            }
          })
        }}
      >
        {isPending ? 'Archiving…' : 'Archive'}
      </Button>
      {error ? (
        <span style={{ color: 'var(--system-red)', fontSize: '0.9rem' }}>{error}</span>
      ) : null}
    </div>
  )
}
