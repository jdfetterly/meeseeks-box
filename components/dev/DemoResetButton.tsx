'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export function DemoResetButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setStatus(null)
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch('/api/dev/demo/reset', { method: 'POST' })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to reset demo data')
        }

        setStatus('Demo data reset.')
        router.push('/')
      } catch (resetError) {
        setError(resetError instanceof Error ? resetError.message : 'Failed to reset demo data')
      }
    })
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <button
        type="button"
        onClick={reset}
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
        {isPending ? 'Resetting…' : 'Reset demo data'}
      </button>
      {status ? <span style={{ color: 'var(--system-green)' }}>{status}</span> : null}
      {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}
    </div>
  )
}
