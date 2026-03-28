import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import {
  updateCanonicalRecurringSchedule,
} from '@/lib/schedules/lifecycle'
import type { RecurringWeekday } from '@/lib/schedules/recurring-cadence'

function isRecurringWeekday(value: unknown): value is RecurringWeekday {
  return (
    value === 'sunday' ||
    value === 'monday' ||
    value === 'tuesday' ||
    value === 'wednesday' ||
    value === 'thursday' ||
    value === 'friday' ||
    value === 'saturday'
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json()) as {
      time?: unknown
      weekday?: unknown
      timezone?: unknown
    }

    if (typeof body.time !== 'string' || !body.time.trim()) {
      return apiErrorResponse(
        new Error('Recurring schedule time is required'),
        'Invalid recurring schedule payload',
        400,
      )
    }

    const result = updateCanonicalRecurringSchedule({
      scheduleId: id,
      time: body.time.trim(),
      weekday: isRecurringWeekday(body.weekday) ? body.weekday : null,
      timezone: typeof body.timezone === 'string' ? body.timezone : null,
    })

    return NextResponse.json(result)
  } catch (error) {
    return apiErrorResponse(error, 'Failed to update recurring schedule', 422)
  }
}
