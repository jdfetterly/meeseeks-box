import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  listOpenLoops,
  resolveOpenLoopByDedupeKey,
  upsertOpenLoop,
} from '@/lib/product-state/repositories';

export async function GET() {
  try {
    return NextResponse.json({ openLoops: listOpenLoops({ status: 'all' }) });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load open loops');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      projectId?: unknown;
      conversationId?: unknown;
      sourceKind?: unknown;
      title?: unknown;
      detail?: unknown;
      owner?: unknown;
      waitingOn?: unknown;
      blocking?: unknown;
      priority?: unknown;
      status?: unknown;
      recommendedAction?: unknown;
      dedupeKey?: unknown;
      linkedObjects?: unknown;
    };

    if (typeof body.sourceKind !== 'string' || !body.sourceKind.trim()) {
      return apiErrorResponse(new Error('sourceKind is required'), 'Invalid open loop payload', 400);
    }

    if (typeof body.title !== 'string' || !body.title.trim()) {
      return apiErrorResponse(new Error('title is required'), 'Invalid open loop payload', 400);
    }

    if (typeof body.dedupeKey !== 'string' || !body.dedupeKey.trim()) {
      return apiErrorResponse(new Error('dedupeKey is required'), 'Invalid open loop payload', 400);
    }

    const openLoop = upsertOpenLoop({
      projectId: typeof body.projectId === 'string' ? body.projectId : null,
      conversationId: typeof body.conversationId === 'string' ? body.conversationId : null,
      sourceKind:
        body.sourceKind === 'conversation_proposal' ||
        body.sourceKind === 'conversation_follow_up' ||
        body.sourceKind === 'review_follow_up'
          ? body.sourceKind
          : 'manual',
      title: body.title.trim(),
      detail: typeof body.detail === 'string' ? body.detail : null,
      owner: body.owner === 'agent' || body.owner === 'system' ? body.owner : 'user',
      waitingOn:
        body.waitingOn === 'agent' ||
        body.waitingOn === 'system' ||
        body.waitingOn === 'external'
          ? body.waitingOn
          : 'user',
      blocking: body.blocking === true,
      priority:
        body.priority === 'low' || body.priority === 'medium' || body.priority === 'high'
          ? body.priority
          : 'medium',
      status: body.status === 'resolved' || body.status === 'snoozed' ? body.status : 'open',
      recommendedAction:
        typeof body.recommendedAction === 'string' ? body.recommendedAction : null,
      dedupeKey: body.dedupeKey.trim(),
      linkedObjects: Array.isArray(body.linkedObjects)
        ? body.linkedObjects
            .filter(
              (
                value,
              ): value is {
                kind: 'project' | 'spec' | 'work_item' | 'review_item' | 'schedule' | 'open_loop';
                id: string;
                label: string | null;
              } =>
                typeof value === 'object' &&
                value !== null &&
                typeof (value as { kind?: unknown }).kind === 'string' &&
                typeof (value as { id?: unknown }).id === 'string',
            )
            .map((value) => ({
              kind: value.kind,
              id: value.id,
              label: typeof value.label === 'string' ? value.label : null,
            }))
        : [],
    });

    return NextResponse.json({ openLoop }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to save open loop');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      dedupeKey?: unknown;
      resolve?: unknown;
    };

    if (typeof body.dedupeKey !== 'string' || !body.dedupeKey.trim()) {
      return apiErrorResponse(new Error('dedupeKey is required'), 'Invalid open loop payload', 400);
    }

    if (body.resolve !== true) {
      return apiErrorResponse(new Error('resolve=true is required'), 'Invalid open loop payload', 400);
    }

    const openLoop = resolveOpenLoopByDedupeKey(body.dedupeKey.trim());

    if (!openLoop) {
      return apiErrorResponse(new Error('Open loop not found'), 'Open loop not found', 404);
    }

    return NextResponse.json({ openLoop });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to resolve open loop');
  }
}
