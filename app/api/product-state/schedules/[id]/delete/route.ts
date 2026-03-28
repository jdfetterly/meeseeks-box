import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { deleteCanonicalRecurringSchedule } from '@/lib/schedules/lifecycle'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const result = deleteCanonicalRecurringSchedule(id)
    return NextResponse.json(result)
  } catch (error) {
    return apiErrorResponse(error, 'Failed to delete recurring schedule', 422)
  }
}
