import 'server-only';

import { createFollowUpCardProposal } from '@/lib/specs/service';
import {
  createSpecCardLink,
  createWorkItem,
  getConversationById,
  getReviewItemById,
  getSpecById,
  getSpecCardLinkByWorkItemId,
  getWorkItemById,
  resolveReviewItemById,
  updateConversation,
  updateWorkItem,
} from '@/lib/product-state/repositories';
import { syncWorkItemSummary } from '@/lib/product-state/projections';

function defaultReviewFeedback(summary: string, reviewReason: string) {
  return `Address the review feedback for "${summary}". ${reviewReason}`.trim();
}

function mergeLinkedObjects(
  existing: Array<{ kind: 'project' | 'spec' | 'work_item' | 'review_item' | 'schedule' | 'open_loop'; id: string; label: string | null }>,
  next: Array<{ kind: 'project' | 'spec' | 'work_item' | 'review_item' | 'schedule' | 'open_loop'; id: string; label: string | null }>,
) {
  const merged = [...existing];

  for (const candidate of next) {
    if (!merged.some((item) => item.kind === candidate.kind && item.id === candidate.id)) {
      merged.push(candidate);
    }
  }

  return merged;
}

export function acceptReviewItem(reviewItemId: string, rootDir = process.cwd()) {
  const reviewItem = getReviewItemById(reviewItemId, rootDir);

  if (!reviewItem) {
    throw new Error('Review item not found');
  }

  const resolved = resolveReviewItemById(reviewItemId, undefined, rootDir);

  if (!resolved) {
    throw new Error('Failed to resolve review item');
  }

  updateWorkItem(reviewItem.workItemId, { reviewState: 'reviewed' }, rootDir);
  const workSummary = syncWorkItemSummary(reviewItem.workItemId, rootDir);
  const workItem = getWorkItemById(reviewItem.workItemId, rootDir);

  if (workItem?.sourceConversationId) {
    updateConversation(
      workItem.sourceConversationId,
      {
        status: 'resolved',
        latestProposalKind: 'review_follow_up',
        recommendedNextAction: 'Review accepted. Continue from the project or start the next task.',
      },
      rootDir,
    );
  }

  return { reviewItem: resolved, workSummary };
}

export function requestReviewChanges(
  reviewItemId: string,
  input: { feedback?: string | null },
  rootDir = process.cwd(),
) {
  const reviewItem = getReviewItemById(reviewItemId, rootDir);

  if (!reviewItem) {
    throw new Error('Review item not found');
  }

  const workItem = getWorkItemById(reviewItem.workItemId, rootDir);

  if (!workItem) {
    throw new Error('Source work item not found');
  }

  const specLink = getSpecCardLinkByWorkItemId(workItem.id, rootDir);
  const spec = specLink ? getSpecById(specLink.specId, rootDir) : null;
  const feedback = input.feedback?.trim() || defaultReviewFeedback(reviewItem.summary, reviewItem.reviewReason);

  const proposal =
    spec && specLink
      ? createFollowUpCardProposal(
          spec.id,
          {
            feedback,
            workItemTitle: workItem.title,
          },
          rootDir,
        )
      : null;

  const followUpWorkItem = createWorkItem(
    {
      title: proposal?.title ?? `${workItem.title}: follow-up`,
      scope: workItem.scope,
      status: 'queued',
      priority: workItem.priority,
      projectId: workItem.projectId,
      delegatedAgentId: proposal?.delegatedAgentId ?? workItem.delegatedAgentId,
      linkedRepos: proposal?.linkedRepos ?? workItem.linkedRepos,
      reviewState: 'not_ready',
      sourceConversationId: workItem.sourceConversationId,
    },
    rootDir,
  );

  if (spec && specLink) {
    createSpecCardLink(
      {
        specId: spec.id,
        workItemId: followUpWorkItem.id,
        decompositionReason: proposal?.decompositionReason ?? 'Created from review feedback.',
        acceptanceCriteria: proposal?.acceptanceCriteria ?? specLink.acceptanceCriteria,
        expectedOutput: proposal?.expectedOutput ?? specLink.expectedOutput,
      },
      rootDir,
    );
  }

  const resolved = resolveReviewItemById(reviewItemId, undefined, rootDir);
  updateWorkItem(workItem.id, { reviewState: 'reviewed' }, rootDir);
  const followUpSummary = syncWorkItemSummary(followUpWorkItem.id, rootDir);

  if (workItem.sourceConversationId) {
    const existingConversation = getConversationById(workItem.sourceConversationId, rootDir);
    updateConversation(
      workItem.sourceConversationId,
      {
        kind: 'review',
        status: 'needs_follow_up',
        latestProposalKind: 'review_follow_up',
        recommendedNextAction: `Follow-up work created: ${followUpWorkItem.title}`,
        linkedObjects: mergeLinkedObjects(existingConversation?.linkedObjects ?? [], [
          {
            kind: 'review_item',
            id: reviewItem.id,
            label: reviewItem.summary,
          },
          {
            kind: 'work_item',
            id: followUpWorkItem.id,
            label: followUpWorkItem.title,
          },
        ]),
      },
      rootDir,
    );
  }

  return {
    reviewItem: resolved,
    followUpWorkItem,
    followUpSummary,
    feedback,
  };
}
