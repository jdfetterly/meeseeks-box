'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import type { RecurringWeekday } from '@/lib/schedules/recurring-cadence'

export function RecurringScheduleActions({
  scheduleId,
  status,
  cadenceKind,
  initialTime,
  initialWeekday,
  initialTimezone,
}: {
  scheduleId: string
  status: string
  cadenceKind: 'daily' | 'weekly'
  initialTime: string
  initialWeekday: RecurringWeekday | null
  initialTimezone: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [time, setTime] = useState(initialTime)
  const [weekday, setWeekday] = useState<RecurringWeekday>(initialWeekday ?? 'sunday')
  const [currentStatus, setCurrentStatus] = useState(status)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function runAction(action: 'pause' | 'resume' | 'delete') {
    setStatusMessage(null)
    setError(null)

    if (action === 'delete') {
      const confirmed = window.confirm(
        'Delete this recurring schedule? The linked standing work item will be archived and removed from the main board.',
      )

      if (!confirmed) {
        return
      }
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/product-state/schedules/${scheduleId}/${action}`, {
          method: 'POST',
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error ?? `Failed to ${action} recurring schedule`)
        }

        setStatusMessage(
          action === 'pause'
            ? 'Recurring schedule paused.'
            : action === 'resume'
              ? 'Recurring schedule resumed.'
              : 'Recurring schedule deleted and linked work archived.',
        )
        if (action === 'delete') {
          router.push('/schedules')
          return
        }

        setCurrentStatus(action === 'pause' ? 'paused' : 'scheduled')
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : `Failed to ${action} recurring schedule`)
      }
    })
  }

  function submitCadence() {
    setStatusMessage(null)
    setError(null)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/product-state/schedules/${scheduleId}/update-recurring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time,
            weekday: cadenceKind === 'weekly' ? weekday : null,
            timezone: initialTimezone,
          }),
        })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error ?? 'Failed to update recurring schedule')
        }

        setStatusMessage('Recurring schedule updated.')
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Failed to update recurring schedule')
      }
    })
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
        Edit cadence, pause/resume, or delete this recurring schedule. Deleting it archives the
        linked standing work item so it drops off the main Work board instead of looking completed.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cadenceKind === 'weekly' ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
          gap: 'var(--space-3)',
        }}
      >
        {cadenceKind === 'weekly' ? (
          <select
            value={weekday}
            onChange={(event) => setWeekday(event.target.value as RecurringWeekday)}
            style={fieldStyle}
            disabled={isPending || currentStatus === 'deleted'}
          >
            {WEEKDAYS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null}
        <input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          style={fieldStyle}
          disabled={isPending || currentStatus === 'deleted'}
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <Button type="button" onClick={submitCadence} disabled={isPending || currentStatus === 'deleted'}>
          {isPending ? 'Working…' : 'Save cadence'}
        </Button>
        {currentStatus === 'paused' ? (
          <Button type="button" variant="outline" onClick={() => runAction('resume')} disabled={isPending}>
            Resume recurring schedule
          </Button>
        ) : currentStatus !== 'deleted' ? (
          <Button type="button" variant="outline" onClick={() => runAction('pause')} disabled={isPending}>
            Pause recurring schedule
          </Button>
        ) : null}
        {currentStatus !== 'deleted' ? (
          <Button type="button" variant="destructive" onClick={() => runAction('delete')} disabled={isPending}>
            Delete recurring schedule
          </Button>
        ) : null}
      </div>

      {statusMessage ? <span style={{ color: 'var(--system-green)' }}>{statusMessage}</span> : null}
      {error ? <span style={{ color: 'var(--system-red)' }}>{error}</span> : null}
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

const WEEKDAYS: Array<{ value: RecurringWeekday; label: string }> = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
]
