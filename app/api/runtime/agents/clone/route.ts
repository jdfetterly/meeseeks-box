import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { cloneRuntimeAgent } from '@/lib/openclaw/runtime-agent-management'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sourceContextId?: string
      name?: string
      workspace?: string
      model?: string | null
      emoji?: string | null
      avatar?: string | null
      copyBindings?: boolean
    }

    if (!body.sourceContextId?.trim() || !body.name?.trim() || !body.workspace?.trim()) {
      return apiErrorResponse(
        new Error('sourceContextId, name, and workspace are required'),
        'Invalid runtime agent clone request',
        400,
      )
    }

    return NextResponse.json(
      await cloneRuntimeAgent({
        sourceContextId: body.sourceContextId.trim(),
        name: body.name.trim(),
        workspace: body.workspace.trim(),
        model: body.model ?? null,
        emoji: body.emoji ?? null,
        avatar: body.avatar ?? null,
        copyBindings: body.copyBindings === true,
      }),
    )
  } catch (error) {
    return apiErrorResponse(error, 'Failed to clone runtime agent')
  }
}
