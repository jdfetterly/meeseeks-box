import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { createLaunch } from '@/lib/launch/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json()) as {
      timing?: unknown
      scheduledAt?: unknown
    }

    const timing =
      body.timing === 'now' || body.timing === 'schedule_once' ? body.timing : 'now'

    const launch = createLaunch({
      prompt: '',
      draftId: id,
      timing,
      scheduledAt: typeof body.scheduledAt === 'string' ? body.scheduledAt : null,
    })

    return NextResponse.json({ launch }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to promote draft', 422)
  }
}
