'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

export function ReconcileSchedulesButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          setStatus(null)
          setError(null)
          startTransition(async () => {
            try {
              const response = await fetch('/api/product-state/schedules/reconcile', {
                method: 'POST',
              })
              const result = await response.json()

              if (!response.ok) {
                throw new Error(result.error ?? 'Reconciliation failed')
              }

              setStatus(
                `Checked ${result.reconciliation.checked} schedule${result.reconciliation.checked === 1 ? '' : 's'} and updated ${result.reconciliation.updated}.`,
              )
              router.refresh()
            } catch (reconcileError) {
              setError(
                reconcileError instanceof Error
                  ? reconcileError.message
                  : 'Reconciliation failed',
              )
            }
          })
        }}
        style={{
          minHeight: 42,
          padding: '0 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--separator)',
          background: 'var(--material-thick)',
          color: 'var(--text-primary)',
          fontWeight: 600,
          cursor: isPending ? 'wait' : 'pointer',
        }}
      >
        {isPending ? 'Refreshing…' : 'Refresh from runtime'}
      </button>
      {status ? <span style={{ color: 'var(--system-green)' }}>{status}</span> : null}
      {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}
    </div>
  )
}
