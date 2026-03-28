'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface BootstrapMemoryButtonProps {
  disabled?: boolean
}

export function BootstrapMemoryButton({ disabled = false }: BootstrapMemoryButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <Button
        type="button"
        disabled={disabled || isPending}
        onClick={() => {
          setStatus(null)
          setError(null)
          startTransition(async () => {
            try {
              const response = await fetch('/api/product-state/memory/bootstrap', {
                method: 'POST',
              })
              const result = await response.json()

              if (!response.ok && response.status !== 409) {
                throw new Error(result.error ?? result.message ?? 'Bootstrap failed')
              }

              setStatus(
                response.status === 201
                  ? 'Workspace memory bootstrapped.'
                  : 'Workspace memory is already available or bootstrap is disabled here.',
              )
              router.refresh()
            } catch (bootstrapError) {
              setError(
                bootstrapError instanceof Error ? bootstrapError.message : 'Bootstrap failed',
              )
            }
          })
        }}
      >
        {isPending ? 'Preparing memory…' : 'Bootstrap workspace memory'}
      </Button>
      {status ? <span style={{ color: 'var(--system-green)' }}>{status}</span> : null}
      {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}
    </div>
  )
}
