import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { listApprovals } from '@/lib/product-state/repositories'

export async function GET() {
  try {
    return NextResponse.json({ approvals: listApprovals() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load approvals')
  }
}
