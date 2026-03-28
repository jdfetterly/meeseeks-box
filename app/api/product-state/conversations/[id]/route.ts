import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import type {
  ConversationKind,
  ConversationStatus,
  ProposalKind,
} from '@/lib/product-state/entities';
import {
  getConversationById,
  listMessages,
  updateConversation,
} from '@/lib/product-state/repositories';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function parseConversationStatus(value: unknown): ConversationStatus | undefined {
  return value === 'active' ||
    value === 'waiting_on_user' ||
    value === 'waiting_on_agent' ||
    value === 'needs_follow_up' ||
    value === 'resolved' ||
    value === 'superseded' ||
    value === 'archived'
    ? value
    : undefined;
}

function parseConversationKind(value: unknown): ConversationKind | undefined {
  return value === 'planning' ||
    value === 'delegation' ||
    value === 'review' ||
    value === 'schedule' ||
    value === 'general'
    ? value
    : undefined;
}

function parseProposalKind(value: unknown): ProposalKind | null | undefined {
  if (value === null) {
    return null;
  }

  return value === 'project' ||
    value === 'plan' ||
    value === 'plan_breakdown' ||
    value === 'card' ||
    value === 'delegation' ||
    value === 'schedule' ||
    value === 'review_follow_up' ||
    value === 'open_loop_resolution'
    ? value
    : undefined;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const conversation = getConversationById(id);

    if (!conversation) {
      return apiErrorResponse(new Error('Conversation not found'), 'Not found', 404);
    }

    return NextResponse.json({ conversation, messages: listMessages(id) });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load conversation');
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      projectId?: unknown;
      kind?: unknown;
      status?: unknown;
      title?: unknown;
      currentObjective?: unknown;
      summary?: unknown;
      latestProposalKind?: unknown;
      recommendedNextAction?: unknown;
      linkedObjects?: unknown;
    };

    const updated = updateConversation(id, {
      projectId: isString(body.projectId) ? body.projectId : undefined,
      kind: parseConversationKind(body.kind),
      status: parseConversationStatus(body.status),
      title: isString(body.title) ? body.title : undefined,
      currentObjective: isString(body.currentObjective) ? body.currentObjective : undefined,
      summary: isString(body.summary) ? body.summary : undefined,
      latestProposalKind: parseProposalKind(body.latestProposalKind),
      recommendedNextAction: isString(body.recommendedNextAction)
        ? body.recommendedNextAction
        : undefined,
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
        : undefined,
    });

    if (!updated) {
      return apiErrorResponse(new Error('Conversation not found'), 'Not found', 404);
    }

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to update conversation');
  }
}
