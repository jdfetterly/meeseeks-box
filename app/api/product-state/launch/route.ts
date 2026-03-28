import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { getAgentContextGroup, isAgentAllowedForContext } from '@/lib/agent-catalog'
import { normalizeAgentContextId } from '@/lib/agent-context'
import { createLaunch } from '@/lib/launch/service'
import { getLaunchDraftById, getSavedLaunchPresetById } from '@/lib/product-state/repositories'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      prompt?: unknown
      title?: unknown
      scope?: unknown
      agentContext?: unknown
      agentId?: unknown
      model?: unknown
      priority?: unknown
      outputType?: unknown
      timing?: unknown
      scheduledAt?: unknown
      presetId?: unknown
      draftId?: unknown
      conversationId?: unknown
    }

    if (
      (typeof body.prompt !== 'string' || !body.prompt.trim()) &&
      (typeof body.draftId !== 'string' || !body.draftId.trim())
    ) {
      return apiErrorResponse(new Error('Launch prompt is required'), 'Invalid launch payload', 400)
    }

    const presetId = typeof body.presetId === 'string' ? body.presetId : null
    const draftId = typeof body.draftId === 'string' ? body.draftId : null
    const preset = presetId ? getSavedLaunchPresetById(presetId.trim()) : null
    const draft = draftId ? getLaunchDraftById(draftId.trim()) : null
    const agentContext = normalizeAgentContextId(isNonEmptyString(body.agentContext)
      ? body.agentContext.trim()
      : isNonEmptyString(body.scope)
        ? body.scope.trim()
        : preset?.scope ?? draft?.scope ?? null)

    if (!agentContext || !(await getAgentContextGroup(agentContext))) {
      return apiErrorResponse(new Error('Launch agent context is required'), 'Invalid launch payload', 400)
    }

    const agentId = isNonEmptyString(body.agentId)
      ? body.agentId.trim()
      : preset?.agentId ?? draft?.agentId ?? null

    if (agentId && !(await isAgentAllowedForContext(agentContext, agentId))) {
      return apiErrorResponse(
        new Error(`Agent ${agentId} is not valid for context ${agentContext}`),
        'Invalid launch payload',
        400,
      )
    }

    const result = createLaunch({
      prompt: typeof body.prompt === 'string' ? body.prompt : '',
      title: typeof body.title === 'string' ? body.title : null,
      scope: agentContext,
      agentId,
      model: typeof body.model === 'string' ? body.model : null,
      priority: typeof body.priority === 'string' ? body.priority : null,
      outputType: typeof body.outputType === 'string' ? body.outputType : null,
      timing:
        body.timing === 'now' || body.timing === 'schedule_once' || body.timing === 'draft'
          ? body.timing
          : null,
      scheduledAt: typeof body.scheduledAt === 'string' ? body.scheduledAt : null,
      presetId,
      draftId,
      conversationId: typeof body.conversationId === 'string' ? body.conversationId : null,
    })

    return NextResponse.json({ launch: result }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create launch', 422)
  }
}
