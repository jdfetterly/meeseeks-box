import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { archiveCanonicalMemoryEntry } from '@/lib/memory/service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const memoryEntry = archiveCanonicalMemoryEntry(id)
    return NextResponse.json({ memoryEntry })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to archive memory entry', 422)
  }
}
