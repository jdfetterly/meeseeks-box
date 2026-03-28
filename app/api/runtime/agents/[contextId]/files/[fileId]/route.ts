import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import {
  getRuntimeFile,
  setRuntimeFile,
} from '@/lib/openclaw/runtime-agent-management'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contextId: string; fileId: string }> },
) {
  try {
    const { contextId, fileId } = await params
    const url = new URL(request.url)
    const agentId = url.searchParams.get('agentId')

    return NextResponse.json({
      file: await getRuntimeFile(contextId, decodeURIComponent(fileId), agentId),
    })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load runtime file')
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ contextId: string; fileId: string }> },
) {
  try {
    const { contextId, fileId } = await params
    const url = new URL(request.url)
    const agentId = url.searchParams.get('agentId')
    const body = (await request.json()) as { content?: string }

    if (typeof body.content !== 'string') {
      return apiErrorResponse(new Error('content must be a string'), 'Invalid file save request', 400)
    }

    return NextResponse.json({
      file: await setRuntimeFile(contextId, decodeURIComponent(fileId), body.content, agentId),
    })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to save runtime file')
  }
}
