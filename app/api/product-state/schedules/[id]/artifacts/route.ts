import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { registerScheduleArtifactFile } from '@/lib/artifacts/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json()) as {
      filePath?: unknown
      outputSlot?: unknown
      title?: unknown
    }

    if (typeof body.filePath !== 'string' || !body.filePath.trim()) {
      return apiErrorResponse(
        new Error('filePath is required'),
        'Invalid schedule artifact payload',
        400,
      )
    }

    const registration = registerScheduleArtifactFile({
      scheduleId: id,
      filePath: body.filePath.trim(),
      outputSlot: typeof body.outputSlot === 'string' ? body.outputSlot : null,
      title: typeof body.title === 'string' ? body.title : null,
    })

    return NextResponse.json({ registration }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to register schedule artifact', 422)
  }
}
