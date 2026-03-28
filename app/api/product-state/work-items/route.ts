import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { getAgentContextGroup } from '@/lib/agent-catalog';
import { normalizeAgentContextId } from '@/lib/agent-context';
import { createWorkItem, listWorkItems } from '@/lib/product-state/repositories';
import { syncWorkItemSummary } from '@/lib/product-state/projections';
import type { WorkItemReviewState, WorkItemStatus } from '@/lib/product-state/entities';

const WORK_ITEM_STATUSES = new Set<WorkItemStatus>([
  'queued',
  'running',
  'scheduled',
  'needs_input',
  'needs_approval',
  'blocked',
  'failed',
  'completed',
  'archived',
]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isWorkItemStatus(value: unknown): value is WorkItemStatus {
  return typeof value === 'string' && WORK_ITEM_STATUSES.has(value as WorkItemStatus);
}

function isWorkItemReviewState(value: unknown): value is WorkItemReviewState {
  return value === 'not_ready' || value === 'review_ready' || value === 'reviewed';
}

export async function GET() {
  try {
    return NextResponse.json({ workItems: listWorkItems() });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load work items');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: unknown;
      scope?: unknown;
      agentContext?: unknown;
      priority?: unknown;
      status?: unknown;
      projectId?: unknown;
      delegatedAgentId?: unknown;
      linkedRepos?: unknown;
      reviewState?: unknown;
      sourceConversationId?: unknown;
    };

    if (typeof body.title !== 'string' || !body.title.trim()) {
      return apiErrorResponse(new Error('Work item title is required'), 'Invalid work item payload', 400);
    }

    const agentContext = normalizeAgentContextId(isNonEmptyString(body.agentContext)
      ? body.agentContext.trim()
      : isNonEmptyString(body.scope)
        ? body.scope.trim()
        : null);

    if (!agentContext || !(await getAgentContextGroup(agentContext))) {
      return apiErrorResponse(new Error('Work item agent context is required'), 'Invalid work item payload', 400);
    }

    const workItem = createWorkItem({
      title: body.title.trim(),
      scope: agentContext,
      priority: typeof body.priority === 'string' ? body.priority : null,
      status: isWorkItemStatus(body.status) ? body.status : undefined,
      projectId: typeof body.projectId === 'string' ? body.projectId : null,
      delegatedAgentId: typeof body.delegatedAgentId === 'string' ? body.delegatedAgentId : null,
      linkedRepos: Array.isArray(body.linkedRepos)
        ? body.linkedRepos.filter((value): value is string => typeof value === 'string')
        : [],
      reviewState: isWorkItemReviewState(body.reviewState) ? body.reviewState : undefined,
      sourceConversationId:
        typeof body.sourceConversationId === 'string' ? body.sourceConversationId : null,
    });
    const summary = syncWorkItemSummary(workItem.id);

    return NextResponse.json({ workItem, summary }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create work item');
  }
}
