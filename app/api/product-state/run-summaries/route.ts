import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { listRunSummaries } from '@/lib/product-state/repositories'

export async function GET() {
  try {
    return NextResponse.json({ runSummaries: listRunSummaries() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load run summaries')
  }
}
