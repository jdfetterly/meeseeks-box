'use client'

import type React from 'react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

export function RegisterScheduleArtifactForm({
  scheduleId,
}: {
  scheduleId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filePath, setFilePath] = useState('')
  const [outputSlot, setOutputSlot] = useState('')
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/product-state/schedules/${scheduleId}/report-output`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath,
            outputSlot: outputSlot || null,
            title: title || null,
          }),
        })

        const result = (await response.json()) as {
          error?: string
          registration?: { version?: { versionLabel?: string; name?: string } }
        }

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to register schedule artifact')
        }

        setStatus(
          `Reported ${
            result.registration?.version?.name ?? 'artifact'
          } as ${result.registration?.version?.versionLabel ?? 'new version'}.`,
        )
        setFilePath('')
        setOutputSlot('')
        setTitle('')
        router.refresh()
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : 'Failed to register schedule artifact',
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
        This is an operator-facing fallback for local validation and recovery. The intended v1
        path is for the producing job to call the report-output helper directly after it writes
        the file. Meeseek Box will reference the original file path, version it by
        schedule/output slot, and mark the schedule output as completed.
      </p>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <label htmlFor="schedule-artifact-path" style={{ fontWeight: 600 }}>
          Workspace file path
        </label>
        <input
          id="schedule-artifact-path"
          value={filePath}
          onChange={(event) => setFilePath(event.target.value)}
          placeholder="/path/to/workspace/output.md"
          style={fieldStyle}
          required
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label htmlFor="schedule-artifact-slot" style={{ fontWeight: 600 }}>
            Output slot
          </label>
          <input
            id="schedule-artifact-slot"
            value={outputSlot}
            onChange={(event) => setOutputSlot(event.target.value)}
            placeholder="weekly-brief"
            style={fieldStyle}
          />
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label htmlFor="schedule-artifact-title" style={{ fontWeight: 600 }}>
            Family title
          </label>
          <input
            id="schedule-artifact-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Optional override"
            style={fieldStyle}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Reporting output…' : 'Report schedule output'}
        </Button>
        {status ? <span style={{ color: 'var(--system-green)' }}>{status}</span> : null}
        {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}
      </div>
    </form>
  )
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 42,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
}
