import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { getCanonicalMemoryState, writeCanonicalMemoryEntry } from '@/lib/memory/service'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export async function GET() {
  try {
    return NextResponse.json(getCanonicalMemoryState())
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load canonical memory state')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>

    if (body.scope !== 'ops' && body.scope !== 'personal') {
      return apiErrorResponse(new Error('Memory scope is required'), 'Invalid memory payload', 400)
    }

    if (typeof body.relativePath !== 'string' || !body.relativePath.trim()) {
      return apiErrorResponse(new Error('Memory relativePath is required'), 'Invalid memory payload', 400)
    }

    if (typeof body.content !== 'string') {
      return apiErrorResponse(new Error('Memory content is required'), 'Invalid memory payload', 400)
    }

    if (body.contentType !== 'markdown' && body.contentType !== 'json') {
      return apiErrorResponse(new Error('Memory contentType is required'), 'Invalid memory payload', 400)
    }

    const result = writeCanonicalMemoryEntry({
      scope: body.scope,
      relativePath: body.relativePath.trim(),
      content: body.content,
      contentType: body.contentType,
      title: typeof body.title === 'string' ? body.title : null,
      summary: typeof body.summary === 'string' ? body.summary : null,
      sourceKind: typeof body.sourceKind === 'string' ? body.sourceKind : 'manual_operator_edit',
      sourceRef: typeof body.sourceRef === 'string' ? body.sourceRef : null,
      notes: typeof body.notes === 'string' ? body.notes : null,
    })

    if (result.writeResult.status !== 'written') {
      return NextResponse.json(result, { status: 409 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to write canonical memory entry')
  }
}
