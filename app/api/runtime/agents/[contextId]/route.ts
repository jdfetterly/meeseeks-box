import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import {
  deleteRuntimeAgent,
  getRuntimeAgentDefinition,
  updateRuntimeAgent,
} from '@/lib/openclaw/runtime-agent-management'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> },
) {
  try {
    const { contextId } = await params
    const url = new URL(request.url)
    const agentId = url.searchParams.get('agentId')

    return NextResponse.json(await getRuntimeAgentDefinition(contextId, agentId))
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load runtime agent definition')
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> },
) {
  try {
    const { contextId } = await params
    const body = (await request.json()) as {
      name?: string | null
      workspace?: string | null
      model?: string | null
      emoji?: string | null
      avatar?: string | null
    }

    return NextResponse.json(
      await updateRuntimeAgent({
        contextId,
        name: body.name ?? null,
        workspace: body.workspace ?? null,
        model: body.model ?? null,
        emoji: body.emoji ?? null,
        avatar: body.avatar ?? null,
      }),
    )
  } catch (error) {
    return apiErrorResponse(error, 'Failed to update runtime agent')
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ contextId: string }> },
) {
  try {
    const { contextId } = await params
    const url = new URL(request.url)
    const deleteFiles = url.searchParams.get('deleteFiles') === 'true'

    return NextResponse.json(await deleteRuntimeAgent(contextId, deleteFiles))
  } catch (error) {
    return apiErrorResponse(error, 'Failed to delete runtime agent')
  }
}
