'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

type ApprovalDecision = 'allow-once' | 'deny'

export function ApprovalResolutionActions({
  approvalId,
  disabled = false,
}: {
  approvalId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  function resolveApproval(decision: ApprovalDecision) {
    setError(null)
    setStatus(null)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/product-state/approvals/${approvalId}/resolve`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ decision }),
        })
        const result = (await response.json()) as {
          error?: string
          resolution?: {
            runtime?: {
              status?: string
              message?: string
            }
          }
        }

        if (!response.ok) {
          throw new Error(result.error ?? 'Approval resolution failed')
        }

        setStatus(decision === 'allow-once' ? 'Approved once.' : 'Denied.')
        router.push('/inbox?filter=approvals')
      } catch (resolutionError) {
        setError(
          resolutionError instanceof Error
            ? resolutionError.message
            : 'Approval resolution failed',
        )
      }
    })
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Button
          type="button"
          size="sm"
          disabled={disabled || isPending}
          onClick={() => resolveApproval('allow-once')}
        >
          {isPending ? 'Working…' : 'Approve once'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || isPending}
          onClick={() => resolveApproval('deny')}
        >
          Deny
        </Button>
      </div>
      {status ? (
        <span style={{ color: 'var(--system-green)', fontSize: '0.9rem' }}>{status}</span>
      ) : null}
      {error ? (
        <span style={{ color: 'var(--system-red)', fontSize: '0.9rem' }}>{error}</span>
      ) : null}
    </div>
  )
}
