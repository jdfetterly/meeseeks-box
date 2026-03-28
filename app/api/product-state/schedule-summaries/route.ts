import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { listScheduleSummaries } from '@/lib/product-state/repositories'

export async function GET() {
  try {
    return NextResponse.json({ scheduleSummaries: listScheduleSummaries() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load schedule summaries')
  }
}
