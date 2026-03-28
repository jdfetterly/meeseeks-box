import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { resetDemoDataset } from '@/lib/demo-data'

function isAllowed() {
  return process.env.NODE_ENV !== 'production'
}

export async function POST() {
  try {
    if (!isAllowed()) {
      return apiErrorResponse(new Error('Demo reset is disabled in production'), 'Demo reset disabled', 403)
    }

    const result = resetDemoDataset()
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to reset demo data')
  }
}
