import 'server-only';

import { listConversationOverviews } from '@/lib/conversations/service';
import { listProjectContextSummaries } from '@/lib/projects/service';
import { listReviewQueue } from '@/lib/review-queue/service';
import {
  getProjectById,
  listInboxItems,
  listOpenLoops,
} from '@/lib/product-state/repositories';

export type BriefingHero =
  | {
      type: 'inbox';
      title: string;
      detail: string;
      href: string;
      actionLabel: string;
    }
  | {
      type: 'review';
      title: string;
      detail: string;
      href: string;
      actionLabel: string;
    }
  | {
      type: 'open_loop';
      title: string;
      detail: string;
      href: string;
      actionLabel: string;
    }
  | {
      type: 'recommended_next_move';
      title: string;
      detail: string;
      href: string;
      actionLabel: string;
    };

export function getBriefingModel(rootDir = process.cwd()) {
  const inboxItems = listInboxItems(rootDir).filter((item) => item.status === 'open');
  const reviewItems = listReviewQueue(rootDir).filter((item) => item.status === 'open');
  const openLoops = listOpenLoops({ status: 'open' }, rootDir).filter(
    (loop) => loop.blocking && loop.owner === 'user',
  );
  const activeProjects = listProjectContextSummaries(rootDir).filter(
    (project) => project.status === 'active',
  );
  const actionableConversations = listConversationOverviews(rootDir).filter((overview) =>
    ['waiting_on_user', 'needs_follow_up', 'active'].includes(overview.conversation.status),
  );

  const hero = buildHero({ inboxItems, reviewItems, openLoops, activeProjects, actionableConversations });

  return {
    hero,
    inboxPreview: inboxItems.slice(0, 3),
    reviewPreview: reviewItems.slice(0, 3),
    openLoopPreview: openLoops.slice(0, 3),
    actionableConversations: actionableConversations.slice(0, 3),
  };
}

function buildHero(input: {
  inboxItems: ReturnType<typeof listInboxItems>;
  reviewItems: ReturnType<typeof listReviewQueue>;
  openLoops: ReturnType<typeof listOpenLoops>;
  activeProjects: ReturnType<typeof listProjectContextSummaries>;
  actionableConversations: ReturnType<typeof listConversationOverviews>;
}): BriefingHero | null {
  const inboxItem = input.inboxItems[0];
  if (inboxItem) {
    return {
      type: 'inbox',
      title: inboxItem.title,
      detail: 'Operational blocker requiring intervention now.',
      href: '/inbox',
      actionLabel: 'Open Inbox',
    };
  }

  const reviewItem = input.reviewItems[0];
  if (reviewItem) {
    return {
      type: 'review',
      title: reviewItem.summary,
      detail: `${reviewItem.projectTitle ?? 'No project'} is ready for judgment.`,
      href: '/review',
      actionLabel: 'Open Review Queue',
    };
  }

  const openLoop = input.openLoops[0];
  if (openLoop) {
    const projectTitle = openLoop.projectId
      ? getProjectById(openLoop.projectId)?.title ?? 'Project'
      : 'General';
    return {
      type: 'open_loop',
      title: openLoop.title,
      detail: `${projectTitle} is waiting on you to resolve this unfinished work.`,
      href: openLoop.projectId ? `/projects/${openLoop.projectId}` : '/chat',
      actionLabel: 'Resolve it',
    };
  }

  const conversation = input.actionableConversations[0];
  if (conversation) {
    return {
      type: 'recommended_next_move',
      title: conversation.conversation.recommendedNextAction ?? conversation.conversation.title ?? 'Continue work',
      detail:
        conversation.conversation.summary ??
        conversation.lastMessagePreview,
      href: conversation.conversation.projectId
        ? `/projects/${conversation.conversation.projectId}`
        : `/chat/${conversation.conversation.id}`,
      actionLabel: 'Continue',
    };
  }

  const project = input.activeProjects[0];
  if (project) {
    return {
      type: 'recommended_next_move',
      title: project.currentFocus ?? project.activeGoal ?? project.title,
      detail: 'No blockers right now. Continue the project that matters most.',
      href: `/projects/${project.projectId}`,
      actionLabel: 'Open project',
    };
  }

  return null;
}
