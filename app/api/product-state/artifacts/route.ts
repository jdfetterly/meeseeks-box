import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { listArtifactRegistry, registerArtifactVersion } from '@/lib/artifacts/service'

export async function GET() {
  try {
    return NextResponse.json({ artifacts: listArtifactRegistry() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load artifact registry')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      scope?: unknown
      producerKind?: unknown
      producerId?: unknown
      outputSlot?: unknown
      title?: unknown
      runId?: unknown
      workItemId?: unknown
      name?: unknown
      mimeType?: unknown
      storagePath?: unknown
      metadata?: unknown
    }

    if (
      (body.scope !== 'ops' && body.scope !== 'personal') ||
      (body.producerKind !== 'schedule' &&
        body.producerKind !== 'work_item' &&
        body.producerKind !== 'manual') ||
      typeof body.producerId !== 'string' ||
      typeof body.title !== 'string' ||
      typeof body.name !== 'string'
    ) {
      return apiErrorResponse(
        new Error('Artifact registration requires scope, producerKind, producerId, title, and name'),
        'Invalid artifact registration payload',
        400,
      )
    }

    const registration = registerArtifactVersion({
      scope: body.scope,
      producerKind: body.producerKind,
      producerId: body.producerId,
      outputSlot: typeof body.outputSlot === 'string' ? body.outputSlot : null,
      title: body.title,
      runId: typeof body.runId === 'string' ? body.runId : null,
      workItemId: typeof body.workItemId === 'string' ? body.workItemId : null,
      name: body.name,
      mimeType: typeof body.mimeType === 'string' ? body.mimeType : null,
      storagePath: typeof body.storagePath === 'string' ? body.storagePath : null,
      metadata:
        body.metadata && typeof body.metadata === 'object'
          ? (body.metadata as Record<string, unknown>)
          : null,
    })

    return NextResponse.json({ registration }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to register artifact', 422)
  }
}
