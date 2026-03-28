import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { listCanonicalLaunchDrafts } from '@/lib/launch/service'

export async function GET() {
  try {
    return NextResponse.json({ drafts: listCanonicalLaunchDrafts() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load launch drafts')
  }
}
