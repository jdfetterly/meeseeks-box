import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { supersedeCanonicalMemoryEntry } from '@/lib/memory/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json()) as {
      supersededById?: unknown
    }

    if (typeof body.supersededById !== 'string' || !body.supersededById.trim()) {
      return apiErrorResponse(
        new Error('supersededById is required'),
        'Invalid supersede payload',
        400,
      )
    }

    const memoryEntry = supersedeCanonicalMemoryEntry(id, body.supersededById.trim())
    return NextResponse.json({ memoryEntry })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to supersede memory entry', 422)
  }
}
