'use client'

import type React from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function WriteMemoryEntryForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [relativePath, setRelativePath] = useState('memory/operators/notes.md')
  const [content, setContent] = useState('# Operator Note\n\n')
  const [scope, setScope] = useState<'ops' | 'personal'>('ops')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch('/api/product-state/memory/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scope,
            relativePath,
            content,
            contentType: relativePath.endsWith('.json') ? 'json' : 'markdown',
            title: title || null,
            summary: summary || null,
            sourceKind: 'manual_operator_edit',
          }),
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error ?? result.message ?? 'Memory write failed')
        }

        setStatus(`Saved memory entry${result.memoryEntry?.title ? `: ${result.memoryEntry.title}` : '.'}`)
        setTitle('')
        setSummary('')
        setContent('# Operator Note\n\n')
        router.refresh()
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Memory write failed')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <label htmlFor="memory-title" style={{ fontWeight: 600 }}>
          Title
        </label>
        <input
          id="memory-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional title"
          style={fieldStyle}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label htmlFor="memory-scope" style={{ fontWeight: 600 }}>
            Scope
          </label>
          <select
            id="memory-scope"
            value={scope}
            onChange={(event) => setScope(event.target.value as 'ops' | 'personal')}
            style={fieldStyle}
          >
            <option value="ops">ops</option>
            <option value="personal">personal</option>
          </select>
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label htmlFor="memory-path" style={{ fontWeight: 600 }}>
            Relative path
          </label>
          <input
            id="memory-path"
            value={relativePath}
            onChange={(event) => setRelativePath(event.target.value)}
            style={fieldStyle}
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <label htmlFor="memory-summary" style={{ fontWeight: 600 }}>
          Summary
        </label>
        <input
          id="memory-summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Short description for the registry"
          style={fieldStyle}
        />
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <label htmlFor="memory-content" style={{ fontWeight: 600 }}>
          Content
        </label>
        <textarea
          id="memory-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={8}
          style={{ ...fieldStyle, resize: 'vertical', minHeight: 180 }}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving memory…' : 'Write memory entry'}
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
