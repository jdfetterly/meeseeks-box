import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { getAgentCatalog } from '@/lib/agent-catalog'

export async function GET() {
  try {
    return NextResponse.json(await getAgentCatalog())
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load agent catalog')
  }
}
