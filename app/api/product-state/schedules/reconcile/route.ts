import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { reconcileRuntimeNativeSchedules } from '@/lib/schedules/reconcile'

export async function POST() {
  try {
    const result = reconcileRuntimeNativeSchedules()
    return NextResponse.json({ reconciliation: result })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to reconcile runtime-native schedules', 422)
  }
}
