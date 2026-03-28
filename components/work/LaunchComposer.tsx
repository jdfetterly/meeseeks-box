'use client'

import type { CSSProperties } from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AgentContextPicker } from '@/components/agents/AgentContextPicker'
import { Button } from '@/components/ui/button'
import type { SavedLaunchPresetRecord } from '@/lib/product-state/entities'

function humanizeRuntimeSync(result: {
  runtimeSyncStatus?: 'pending' | 'synced' | 'failed' | null
  runtimeSyncError?: string | null
  externalJobId?: string | null
}) {
  if (result.runtimeSyncStatus === 'synced') {
    return result.externalJobId
      ? `Scheduled in the runtime as job ${result.externalJobId}.`
      : 'Scheduled in the runtime.'
  }

  if (result.runtimeSyncStatus === 'failed') {
    return 'The work was saved, but runtime sync failed.'
  }

  if (result.runtimeSyncError === 'runtime-sync-disabled') {
    return 'The work was saved, but runtime sync is disabled in this environment.'
  }

  return 'The work was saved and is waiting for runtime sync.'
}

export function LaunchComposer({
  presets = [],
}: {
  presets?: SavedLaunchPresetRecord[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [presetId, setPresetId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [agentContext, setAgentContext] = useState('mini-ops')
  const [agentId, setAgentId] = useState('jarvis')
  const [timing, setTiming] = useState<'now' | 'schedule_once' | 'draft'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatus(null)

    startTransition(async () => {
      try {
        const payload = {
          title: title || null,
          prompt,
          agentContext,
          agentId,
          presetId,
          timing,
          scheduledAt:
            timing === 'schedule_once' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }

        const response = await fetch('/api/product-state/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error ?? result.message ?? 'Launch failed')
        }

        if (timing === 'draft') {
          setStatus('Saved draft.')
          router.push(`/work?tab=drafts&draft=${result.launch.draftId}`)
        } else if (timing === 'now') {
          setStatus('Created work and queued the run.')
          if (result.launch.workItemId) {
            router.push(`/work/${result.launch.workItemId}`)
          }
        } else {
          setStatus(`Created scheduled work. ${humanizeRuntimeSync(result.launch)}`)
          if (result.launch.scheduleId) {
            router.push(`/schedules/${result.launch.scheduleId}`)
          }
        }
        setTitle('')
        setPrompt('')
        setScheduledAt('')
        setPresetId(null)
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Launch failed')
      }
    })
  }

  function applyPreset(preset: SavedLaunchPresetRecord) {
    setPresetId(preset.id)
    setTitle(preset.title)
    setPrompt(preset.promptTemplate ?? '')
    setAgentContext(preset.scope)
    setAgentId(preset.agentId ?? 'jarvis')
    setTiming(
      preset.timingPreference === 'schedule_once' || preset.timingPreference === 'draft'
        ? preset.timingPreference
        : 'now',
    )
    setStatus(`Applied preset: ${preset.title}`)
    setError(null)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-4)' }}>
      {presets.length > 0 ? (
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <strong style={{ fontSize: '0.95rem' }}>Installed presets</strong>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                style={{
                  minHeight: 38,
                  borderRadius: '999px',
                  border:
                    presetId === preset.id
                      ? '1px solid var(--accent)'
                      : '1px solid var(--separator)',
                  background:
                    presetId === preset.id ? 'var(--material-thick)' : 'var(--material-thin)',
                  color: 'var(--text-primary)',
                  padding: '0 14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <label htmlFor="launch-title" style={{ fontWeight: 600 }}>
          Title
        </label>
        <input
          id="launch-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Optional title"
          style={fieldStyle}
        />
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <label htmlFor="launch-prompt" style={{ fontWeight: 600 }}>
          Prompt
        </label>
        <textarea
          id="launch-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describe the work you want the agent to perform."
          rows={4}
          style={{ ...fieldStyle, resize: 'vertical', minHeight: 120 }}
          required
        />
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <AgentContextPicker
          value={agentContext}
          agentId={agentId}
          onContextChange={setAgentContext}
          onAgentChange={setAgentId}
          idPrefix="launch"
        />
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label htmlFor="launch-timing" style={{ fontWeight: 600 }}>
            Timing
          </label>
          <select
            id="launch-timing"
            value={timing}
            onChange={(event) => setTiming(event.target.value as 'now' | 'schedule_once' | 'draft')}
            style={fieldStyle}
          >
            <option value="now">Run now</option>
            <option value="schedule_once">Schedule once</option>
            <option value="draft">Save draft</option>
          </select>
        </div>
      </div>

      {timing === 'schedule_once' && (
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <label htmlFor="launch-scheduled-at" style={{ fontWeight: 600 }}>
            Scheduled time
          </label>
          <input
            id="launch-scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            style={fieldStyle}
            required
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Working…'
            : timing === 'now'
              ? 'Create work + run'
              : timing === 'schedule_once'
                ? 'Create work + schedule'
                : 'Save draft'}
        </Button>
        {status ? <span style={{ color: 'var(--system-green)' }}>{status}</span> : null}
        {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}
      </div>
    </form>
  )
}

const fieldStyle: CSSProperties = {
  width: '100%',
  minHeight: 42,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
}
