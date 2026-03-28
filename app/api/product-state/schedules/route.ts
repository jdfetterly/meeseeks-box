import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { createSchedule, listSchedules } from '@/lib/product-state/repositories'
import { syncScheduleSummary } from '@/lib/product-state/projections'

export async function GET() {
  try {
    return NextResponse.json({ schedules: listSchedules() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load schedules')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sourceKind?: unknown
      sourceRef?: unknown
      label?: unknown
      status?: unknown
      scheduleKind?: unknown
      scheduleExpr?: unknown
      nextRunAt?: unknown
      metadata?: unknown
      externalJobId?: unknown
    }

    if (typeof body.sourceKind !== 'string' || !body.sourceKind.trim()) {
      return apiErrorResponse(new Error('Schedule sourceKind is required'), 'Invalid schedule payload', 400)
    }

    if (typeof body.label !== 'string' || !body.label.trim()) {
      return apiErrorResponse(new Error('Schedule label is required'), 'Invalid schedule payload', 400)
    }

    if (typeof body.status !== 'string' || !body.status.trim()) {
      return apiErrorResponse(new Error('Schedule status is required'), 'Invalid schedule payload', 400)
    }

    if (typeof body.scheduleKind !== 'string' || !body.scheduleKind.trim()) {
      return apiErrorResponse(new Error('Schedule kind is required'), 'Invalid schedule payload', 400)
    }

    const schedule = createSchedule({
      sourceKind: body.sourceKind.trim(),
      sourceRef: typeof body.sourceRef === 'string' ? body.sourceRef : null,
      label: body.label.trim(),
      status: body.status.trim(),
      scheduleKind: body.scheduleKind.trim(),
      scheduleExpr: typeof body.scheduleExpr === 'string' ? body.scheduleExpr : null,
      nextRunAt: typeof body.nextRunAt === 'string' ? body.nextRunAt : null,
      metadata:
        typeof body.metadata === 'object' && body.metadata !== null
          ? (body.metadata as Record<string, unknown>)
          : null,
      externalJobId: typeof body.externalJobId === 'string' ? body.externalJobId : null,
    })
    const summary = syncScheduleSummary(schedule.id)

    return NextResponse.json({ schedule, summary }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create schedule')
  }
}
