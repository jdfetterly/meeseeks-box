import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { listInboxItems } from '@/lib/product-state/repositories'

export async function GET() {
  try {
    return NextResponse.json({ inboxItems: listInboxItems() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load inbox items')
  }
}
