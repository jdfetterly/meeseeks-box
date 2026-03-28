export type RecurringWeekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'

export const WEEKDAY_TO_CRON: Record<RecurringWeekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

const CRON_TO_WEEKDAY = new Map(
  Object.entries(WEEKDAY_TO_CRON).map(([weekday, value]) => [String(value), weekday as RecurringWeekday]),
)

export function normalizeRecurringTime(value: string | null | undefined, fallback: string) {
  const candidate = (value ?? fallback).trim()
  const match = /^(\d{2}):(\d{2})$/.exec(candidate)

  if (!match) {
    throw new Error('Recurring schedule time must use HH:MM format')
  }

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error('Recurring schedule hour must be between 00 and 23')
  }

  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    throw new Error('Recurring schedule minute must be between 00 and 59')
  }

  return { value: candidate, hour, minute }
}

export function normalizeRecurringWeekday(
  value: string | null | undefined,
  fallback: RecurringWeekday,
) {
  const normalized = (value ?? fallback).trim().toLowerCase() as RecurringWeekday

  if (!(normalized in WEEKDAY_TO_CRON)) {
    throw new Error('Recurring schedule weekday is invalid')
  }

  return normalized
}

export function ensureRecurringTimezone(value: string | null | undefined) {
  const timezone = value?.trim() || 'America/Los_Angeles'

  try {
    Intl.DateTimeFormat('en-US', { timeZone: timezone })
  } catch {
    throw new Error('Recurring schedule timezone is invalid')
  }

  return timezone
}

export function buildRecurringCronExpression(input: {
  cadenceKind: 'daily' | 'weekly'
  time: string
  weekday?: RecurringWeekday | null
}) {
  const normalizedTime = normalizeRecurringTime(input.time, input.time)

  if (input.cadenceKind === 'daily') {
    return `${normalizedTime.minute} ${normalizedTime.hour} * * *`
  }

  const weekday = normalizeRecurringWeekday(input.weekday, 'sunday')
  return `${normalizedTime.minute} ${normalizedTime.hour} * * ${WEEKDAY_TO_CRON[weekday]}`
}

export function makeRecurringCadenceLabel(input: {
  cadenceKind: 'daily' | 'weekly'
  time: string
  weekday?: RecurringWeekday | null
  timezone: string
}) {
  if (input.cadenceKind === 'daily') {
    return `Daily at ${input.time} ${input.timezone}`
  }

  return `Weekly on ${input.weekday} at ${input.time} ${input.timezone}`
}

export function parseRecurringCronExpression(expr: string | null | undefined) {
  if (!expr) {
    return null
  }

  const parts = expr.trim().split(/\s+/)
  if (parts.length !== 5) {
    return null
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

  if (dayOfMonth !== '*' || month !== '*') {
    return null
  }

  const numericMinute = Number(minute)
  const numericHour = Number(hour)

  if (
    !Number.isInteger(numericMinute) ||
    !Number.isInteger(numericHour) ||
    numericMinute < 0 ||
    numericMinute > 59 ||
    numericHour < 0 ||
    numericHour > 23
  ) {
    return null
  }

  const time = `${String(numericHour).padStart(2, '0')}:${String(numericMinute).padStart(2, '0')}`

  if (dayOfWeek === '*') {
    return {
      cadenceKind: 'daily' as const,
      time,
      weekday: null,
    }
  }

  const weekday = CRON_TO_WEEKDAY.get(dayOfWeek) ?? null

  if (!weekday) {
    return null
  }

  return {
    cadenceKind: 'weekly' as const,
    time,
    weekday,
  }
}
