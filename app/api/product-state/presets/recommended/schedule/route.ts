import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { scheduleRecommendedJob } from '@/lib/recommended-job-schedules'
import type { RecurringWeekday as RecommendedWeekday } from '@/lib/schedules/recurring-cadence'

function isRecommendedWeekday(value: unknown): value is RecommendedWeekday {
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      slug?: unknown
      time?: unknown
      weekday?: unknown
      timezone?: unknown
    }

    if (typeof body.slug !== 'string' || !body.slug.trim()) {
      return apiErrorResponse(
        new Error('Recommended job slug is required'),
        'Invalid recommended schedule payload',
        400,
      )
    }

    const result = scheduleRecommendedJob({
      slug: body.slug.trim(),
      time: typeof body.time === 'string' ? body.time : null,
      weekday: isRecommendedWeekday(body.weekday) ? body.weekday : null,
      timezone: typeof body.timezone === 'string' ? body.timezone : null,
    })

    return NextResponse.json(result, { status: result.created ? 201 : 200 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to schedule recommended job')
  }
}
