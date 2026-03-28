'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import type { RecommendedJobInstallation } from '@/lib/recommended-jobs'
import { describeScheduleStatus } from '@/lib/schedules/presentation'

export function RecommendedJobsPanel({
  jobs,
}: {
  jobs: RecommendedJobInstallation[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles')
  const [times, setTimes] = useState<Record<string, string>>(
    Object.fromEntries(jobs.map((job) => [job.slug, job.defaultTime])),
  )
  const [weekdays, setWeekdays] = useState<Record<string, string>>(
    Object.fromEntries(jobs.map((job) => [job.slug, job.defaultWeekday ?? 'sunday'])),
  )
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function installJob(slug: string) {
    setStatus(null)
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch('/api/product-state/presets/recommended', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug }),
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to install recommended job')
        }

        setStatus(result.created ? `Installed ${result.preset.title}.` : `${result.preset.title} is already installed.`)
        router.push('/work?tab=jobs')
      } catch (installError) {
        setError(installError instanceof Error ? installError.message : 'Failed to install recommended job')
      }
    })
  }

  function scheduleJob(job: RecommendedJobInstallation) {
    setStatus(null)
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch('/api/product-state/presets/recommended/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: job.slug,
            time: times[job.slug] ?? job.defaultTime,
            weekday: job.cadenceKind === 'weekly' ? weekdays[job.slug] ?? job.defaultWeekday ?? 'sunday' : null,
            timezone,
          }),
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to schedule starter job')
        }

        setStatus(
          result.created
            ? `Scheduled ${job.title}.`
            : `${job.title} already has a recurring schedule.`,
        )
        if (typeof result.scheduleId === 'string') {
          router.push(`/schedules/${result.scheduleId}`)
        } else {
          router.push('/schedules')
        }
      } catch (scheduleError) {
        setError(scheduleError instanceof Error ? scheduleError.message : 'Failed to schedule starter job')
      }
    })
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
        Job templates are self-contained recurring workflows. Each template declares its own
        prompt, output contract, and explicit report-output step.
      </p>
      {status ? <span style={{ color: 'var(--system-green)' }}>{status}</span> : null}
      {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {jobs.map((job) => (
          <div
            key={job.slug}
            style={{
              border: '1px solid var(--separator)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              background: 'var(--material-thin)',
              display: 'grid',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
              <div>
                <strong>{job.title}</strong>
                <p style={{ margin: 'var(--space-1) 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  {job.cadenceLabel} • {job.summary}
                </p>
              </div>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                {job.scheduledScheduleId ? 'Enabled' : job.installedPresetId ? 'Ready' : 'Template'}
              </span>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <strong style={{ fontSize: '0.95rem' }}>Includes</strong>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)' }}>
                {job.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
              <strong style={{ fontSize: '0.95rem' }}>Output</strong>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {job.outputTitle} • {job.outputPathExample}
              </p>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <strong style={{ fontSize: '0.95rem' }}>Suggested cadence</strong>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    job.cadenceKind === 'weekly'
                      ? 'minmax(0, 1fr) minmax(0, 1fr)'
                      : 'minmax(0, 1fr)',
                  gap: 'var(--space-2)',
                }}
              >
                {job.cadenceKind === 'weekly' ? (
                  <select
                    value={weekdays[job.slug] ?? job.defaultWeekday ?? 'sunday'}
                    onChange={(event) =>
                      setWeekdays((current) => ({ ...current, [job.slug]: event.target.value }))
                    }
                    style={fieldStyle}
                    disabled={isPending || Boolean(job.scheduledScheduleId)}
                  >
                    {WEEKDAYS.map((weekday) => (
                      <option key={weekday.value} value={weekday.value}>
                        {weekday.label}
                      </option>
                    ))}
                  </select>
                ) : null}
                <input
                  type="time"
                  value={times[job.slug] ?? job.defaultTime}
                  onChange={(event) =>
                    setTimes((current) => ({ ...current, [job.slug]: event.target.value }))
                  }
                  style={fieldStyle}
                  disabled={isPending || Boolean(job.scheduledScheduleId)}
                />
              </div>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Meeseek Box will sync this to the runtime in {timezone}.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <Button
                type="button"
                onClick={() => installJob(job.slug)}
                disabled={isPending || Boolean(job.installedPresetId)}
              >
                {job.installedPresetId ? 'Template ready' : 'Enable template'}
              </Button>
              <Button
                type="button"
                onClick={() => scheduleJob(job)}
                disabled={isPending || !job.installedPresetId || Boolean(job.scheduledScheduleId)}
              >
                {job.scheduledScheduleId
                  ? 'Recurring schedule active'
                  : job.cadenceKind === 'daily'
                    ? 'Create daily schedule'
                    : 'Create weekly schedule'}
              </Button>
              {job.scheduledScheduleId ? (
                <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Status: {describeScheduleStatus(job.scheduledStatus ?? 'scheduled')}
                  </span>
                  <Link
                    href={`/schedules/${job.scheduledScheduleId}`}
                    style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}
                  >
                    Open recurring schedule
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
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

const WEEKDAYS = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
] as const
