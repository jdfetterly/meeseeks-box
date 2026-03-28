import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import type { OpenClawEventEnvelope, OpenClawEventSurface } from '@/lib/openclaw/contracts'
import { normalizeOpenClawEvent } from '@/lib/product-state/events'

const OPENCLAW_SURFACES = new Set<OpenClawEventSurface>([
  'agent-result',
  'cron-run',
  'runtime-log',
  'gateway-event',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isOpenClawEventEnvelope(value: unknown): value is OpenClawEventEnvelope {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.source === 'openclaw' &&
    typeof value.eventType === 'string' &&
    typeof value.sequenceKey === 'string' &&
    (typeof value.occurredAt === 'string' || value.occurredAt === null) &&
    typeof value.surface === 'string' &&
    OPENCLAW_SURFACES.has(value.surface as OpenClawEventSurface) &&
    isRecord(value.correlation) &&
    ('raw' in value) &&
    typeof value.retryable === 'boolean'
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      envelope?: unknown
    }

    if (!isOpenClawEventEnvelope(body.envelope)) {
      return apiErrorResponse(new Error('Event envelope is invalid'), 'Invalid event payload', 400)
    }

    const result = normalizeOpenClawEvent(body.envelope)

    return NextResponse.json(
      result.kind === 'run_event'
        ? {
            kind: result.kind,
            event: result.event,
            duplicate: result.duplicate,
            canonicalRunId: result.canonicalRunId,
          }
        : {
            kind: result.kind,
            approval: result.approval,
            duplicate: result.duplicate,
            canonicalRunId: result.canonicalRunId,
          },
      { status: result.duplicate ? 200 : 201 },
    )
  } catch (error) {
    console.error('product-state event ingest rejected', error)
    return apiErrorResponse(error, 'Failed to ingest event', 422)
  }
}
