import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { createRun, listRuns } from '@/lib/product-state/repositories';
import { syncRunSummary, syncWorkItemSummary } from '@/lib/product-state/projections';
import type { DomainScope, RunStatus } from '@/lib/product-state/entities';

const RUN_STATUSES = new Set<RunStatus>([
  'queued',
  'running',
  'waiting_approval',
  'blocked',
  'failed',
  'completed',
]);

function isDomainScope(value: unknown): value is DomainScope {
  return value === 'ops' || value === 'personal';
}

function isRunStatus(value: unknown): value is RunStatus {
  return typeof value === 'string' && RUN_STATUSES.has(value as RunStatus);
}

export async function GET() {
  try {
    return NextResponse.json({ runs: listRuns() });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load runs');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      scope?: unknown;
      triggerKind?: unknown;
      workItemId?: unknown;
      conversationId?: unknown;
      agentId?: unknown;
      externalRunId?: unknown;
      externalSessionId?: unknown;
      externalSessionKey?: unknown;
      status?: unknown;
      model?: unknown;
      startedAt?: unknown;
      completedAt?: unknown;
    };

    if (!isDomainScope(body.scope)) {
      return apiErrorResponse(new Error('Run scope must be "ops" or "personal"'), 'Invalid run payload', 400);
    }

    if (typeof body.triggerKind !== 'string' || !body.triggerKind.trim()) {
      return apiErrorResponse(new Error('Run triggerKind is required'), 'Invalid run payload', 400);
    }

    const run = createRun({
      scope: body.scope,
      triggerKind: body.triggerKind.trim(),
      workItemId: typeof body.workItemId === 'string' ? body.workItemId : null,
      conversationId: typeof body.conversationId === 'string' ? body.conversationId : null,
      agentId: typeof body.agentId === 'string' ? body.agentId : null,
      externalRunId: typeof body.externalRunId === 'string' ? body.externalRunId : null,
      externalSessionId:
        typeof body.externalSessionId === 'string' ? body.externalSessionId : null,
      externalSessionKey:
        typeof body.externalSessionKey === 'string' ? body.externalSessionKey : null,
      status: isRunStatus(body.status) ? body.status : undefined,
      model: typeof body.model === 'string' ? body.model : null,
      startedAt: typeof body.startedAt === 'string' ? body.startedAt : null,
      completedAt: typeof body.completedAt === 'string' ? body.completedAt : null,
    });
    const summary = syncRunSummary(run.id);
    const workItemSummary = run.workItemId ? syncWorkItemSummary(run.workItemId) : null;

    return NextResponse.json({ run, summary, workItemSummary }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create run');
  }
}
