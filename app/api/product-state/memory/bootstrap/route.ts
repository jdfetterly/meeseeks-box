import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import {
  ensureWorkspaceMemoryBootstrap,
  getWorkspaceMemoryStatus,
} from '@/lib/memory/workspace'

export async function GET() {
  try {
    return NextResponse.json({ memoryBootstrap: getWorkspaceMemoryStatus() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load memory bootstrap status')
  }
}

export async function POST(_request: NextRequest) {
  try {
    const result = ensureWorkspaceMemoryBootstrap()
    return NextResponse.json(
      { memoryBootstrap: result },
      { status: result.status === 'bootstrapped' ? 201 : 409 },
    )
  } catch (error) {
    return apiErrorResponse(error, 'Failed to bootstrap workspace memory')
  }
}
