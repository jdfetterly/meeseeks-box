'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function SupersedeMemoryEntryForm({
  memoryEntryId,
  options,
}: {
  memoryEntryId: string
  options: Array<{ id: string; title: string }>
}) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (options.length === 0) {
    return (
      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
        Create a replacement entry before superseding this one.
      </span>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
        Replace this entry with
      </span>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          aria-label="Select replacement memory entry"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          style={{
            minHeight: 36,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--separator)',
            background: 'var(--material-thin)',
            color: 'var(--text-primary)',
            padding: '8px 10px',
          }}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || !selectedId}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              try {
                const response = await fetch(
                  `/api/product-state/memory/entries/${memoryEntryId}/supersede`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ supersededById: selectedId }),
                  },
                )
                const result = (await response.json()) as { error?: string }

                if (!response.ok) {
                  throw new Error(result.error ?? 'Failed to supersede memory entry')
                }

                router.refresh()
              } catch (supersedeError) {
                setError(
                  supersedeError instanceof Error
                    ? supersedeError.message
                    : 'Failed to supersede memory entry',
                )
              }
            })
          }}
        >
          {isPending ? 'Superseding…' : 'Supersede'}
        </Button>
      </div>
      {error ? (
        <span style={{ color: 'var(--system-red)', fontSize: '0.9rem' }}>{error}</span>
      ) : null}
    </div>
  )
}
