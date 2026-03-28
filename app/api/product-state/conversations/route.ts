import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { getAgentContextGroup, isAgentAllowedForContext } from '@/lib/agent-catalog';
import { normalizeAgentContextId } from '@/lib/agent-context';
import type { ConversationKind, ConversationStatus, ProposalKind } from '@/lib/product-state/entities';
import { createConversation, listConversations } from '@/lib/product-state/repositories';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function GET() {
  try {
    return NextResponse.json({ conversations: listConversations() });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load conversations');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      scope?: unknown;
      agentContext?: unknown;
      agentId?: unknown;
      projectId?: unknown;
      kind?: unknown;
      title?: unknown;
      status?: unknown;
      currentObjective?: unknown;
      summary?: unknown;
      latestProposalKind?: unknown;
      recommendedNextAction?: unknown;
      linkedObjects?: unknown;
      parentConversationId?: unknown;
      branchFromMessageId?: unknown;
    };

    const agentContext = normalizeAgentContextId(isNonEmptyString(body.agentContext)
      ? body.agentContext.trim()
      : isNonEmptyString(body.scope)
        ? body.scope.trim()
        : null);

    if (!agentContext) {
      return apiErrorResponse(
        new Error('Conversation agent context is required'),
        'Invalid conversation payload',
        400,
      );
    }

    if (!(await getAgentContextGroup(agentContext))) {
      return apiErrorResponse(
        new Error(`Unknown conversation context: ${agentContext}`),
        'Invalid conversation payload',
        400,
      );
    }

    const agentId = isNonEmptyString(body.agentId) ? body.agentId.trim() : null;

    if (agentId && !(await isAgentAllowedForContext(agentContext, agentId))) {
      return apiErrorResponse(
        new Error(`Agent ${agentId} is not valid for context ${agentContext}`),
        'Invalid conversation payload',
        400,
      );
    }

    const kind: ConversationKind =
      body.kind === 'planning' ||
      body.kind === 'delegation' ||
      body.kind === 'review' ||
      body.kind === 'schedule'
        ? body.kind
        : 'general';

    const status: ConversationStatus =
      body.status === 'waiting_on_user' ||
      body.status === 'waiting_on_agent' ||
      body.status === 'needs_follow_up' ||
      body.status === 'resolved' ||
      body.status === 'superseded' ||
      body.status === 'archived'
        ? body.status
        : 'active';

    const latestProposalKind: ProposalKind | null =
      body.latestProposalKind === 'project' ||
      body.latestProposalKind === 'plan' ||
      body.latestProposalKind === 'plan_breakdown' ||
      body.latestProposalKind === 'card' ||
      body.latestProposalKind === 'delegation' ||
      body.latestProposalKind === 'schedule' ||
      body.latestProposalKind === 'review_follow_up' ||
      body.latestProposalKind === 'open_loop_resolution'
        ? body.latestProposalKind
        : null;

    const conversation = createConversation({
      scope: agentContext,
      agentId,
      projectId: isNonEmptyString(body.projectId) ? body.projectId.trim() : null,
      kind,
      title: typeof body.title === 'string' ? body.title : null,
      status,
      currentObjective: typeof body.currentObjective === 'string' ? body.currentObjective : null,
      summary: typeof body.summary === 'string' ? body.summary : null,
      latestProposalKind,
      recommendedNextAction:
        typeof body.recommendedNextAction === 'string' ? body.recommendedNextAction : null,
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
      parentConversationId:
        typeof body.parentConversationId === 'string' ? body.parentConversationId : null,
      branchFromMessageId:
        typeof body.branchFromMessageId === 'string' ? body.branchFromMessageId : null,
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create conversation');
  }
}
