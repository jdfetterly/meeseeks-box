import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { createSavedLaunchPreset, listSavedLaunchPresets } from '@/lib/product-state/repositories'
import type { DomainScope } from '@/lib/product-state/entities'

function isDomainScope(value: unknown): value is DomainScope {
  return value === 'ops' || value === 'personal'
}

export async function GET() {
  try {
    return NextResponse.json({ presets: listSavedLaunchPresets() })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load launch presets')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: unknown
      scope?: unknown
      agentId?: unknown
      modelOverride?: unknown
      priority?: unknown
      outputType?: unknown
      timingPreference?: unknown
      promptTemplate?: unknown
    }

    if (typeof body.title !== 'string' || !body.title.trim()) {
      return apiErrorResponse(new Error('Preset title is required'), 'Invalid preset payload', 400)
    }

    if (!isDomainScope(body.scope)) {
      return apiErrorResponse(new Error('Preset scope must be "ops" or "personal"'), 'Invalid preset payload', 400)
    }

    const preset = createSavedLaunchPreset({
      title: body.title.trim(),
      scope: body.scope,
      agentId: typeof body.agentId === 'string' ? body.agentId : null,
      modelOverride: typeof body.modelOverride === 'string' ? body.modelOverride : null,
      priority: typeof body.priority === 'string' ? body.priority : null,
      outputType: typeof body.outputType === 'string' ? body.outputType : null,
      timingPreference: typeof body.timingPreference === 'string' ? body.timingPreference : null,
      promptTemplate: typeof body.promptTemplate === 'string' ? body.promptTemplate : null,
    })

    return NextResponse.json({ preset }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create launch preset')
  }
}
