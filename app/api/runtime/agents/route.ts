import { NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import {
  createRuntimeAgent,
  listRuntimeAgentCatalog,
} from '@/lib/openclaw/runtime-agent-management'

export async function GET() {
  try {
    return NextResponse.json(await listRuntimeAgentCatalog())
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load runtime agents')
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string
      workspace?: string
      model?: string | null
      emoji?: string | null
      avatar?: string | null
      bindings?: string[]
    }

    if (!body.name?.trim() || !body.workspace?.trim()) {
      return apiErrorResponse(
        new Error('name and workspace are required'),
        'Invalid runtime agent create request',
        400,
      )
    }

    return NextResponse.json(
      await createRuntimeAgent({
        name: body.name.trim(),
        workspace: body.workspace.trim(),
        model: body.model ?? null,
        emoji: body.emoji ?? null,
        avatar: body.avatar ?? null,
        bindings: Array.isArray(body.bindings) ? body.bindings : [],
      }),
    )
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create runtime agent')
  }
}
