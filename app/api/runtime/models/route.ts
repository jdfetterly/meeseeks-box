import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { listRuntimeModels } from '@/lib/openclaw/runtime-agent-management'

export async function GET() {
  try {
    return NextResponse.json({ models: await listRuntimeModels() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load runtime models')
  }
}
