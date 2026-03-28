import 'server-only';

import {
  getProjectById,
  listConversations,
  listMessages,
  listOpenLoops,
} from '@/lib/product-state/repositories';
import type {
  ConversationKind,
  ConversationRecord,
  ConversationStatus,
  OpenLoopRecord,
} from '@/lib/product-state/entities';

export interface ConversationOverview {
  conversation: ConversationRecord;
  projectTitle: string | null;
  lastMessagePreview: string;
  openLoopCount: number;
  branchCount: number;
}

export interface ConversationGroup {
  projectId: string | null;
  projectTitle: string;
  items: ConversationOverview[];
}

function formatLastMessagePreview(conversationId: string, rootDir: string) {
  const latestMessage = listMessages(conversationId, rootDir).at(-1) ?? null;

  if (!latestMessage) {
    return 'No messages yet.';
  }

  const text = latestMessage.contentText ?? JSON.stringify(latestMessage.contentJson);
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function conversationSortOrder(status: ConversationStatus) {
  switch (status) {
    case 'waiting_on_user':
      return 0;
    case 'needs_follow_up':
      return 1;
    case 'active':
      return 2;
    case 'waiting_on_agent':
      return 3;
    case 'resolved':
      return 4;
    case 'superseded':
      return 5;
    case 'archived':
    default:
      return 6;
  }
}

export function formatConversationKind(kind: ConversationKind) {
  switch (kind) {
    case 'planning':
      return 'Planning';
    case 'delegation':
      return 'Execution Follow-up';
    case 'review':
      return 'Review Follow-up';
    case 'schedule':
      return 'Recurring Work';
    case 'general':
    default:
      return 'General Context';
  }
}

export function formatConversationStatus(status: ConversationStatus) {
  switch (status) {
    case 'waiting_on_user':
      return 'Waiting on you';
    case 'waiting_on_agent':
      return 'Waiting on agent';
    case 'needs_follow_up':
      return 'Needs follow-up';
    case 'resolved':
      return 'Resolved';
    case 'superseded':
      return 'Superseded';
    case 'archived':
      return 'Archived';
    case 'active':
    default:
      return 'Active';
  }
}

export function listConversationOverviews(rootDir = process.cwd()) {
  const conversations = listConversations(rootDir);
  const openLoopsByConversationId = new Map<string, OpenLoopRecord[]>();

  for (const loop of listOpenLoops({ status: 'open' }, rootDir)) {
    if (!loop.conversationId) {
      continue;
    }
    const current = openLoopsByConversationId.get(loop.conversationId) ?? [];
    current.push(loop);
    openLoopsByConversationId.set(loop.conversationId, current);
  }

  const branchCounts = new Map<string, number>();
  for (const conversation of conversations) {
    if (!conversation.parentConversationId) {
      continue;
    }
    branchCounts.set(
      conversation.parentConversationId,
      (branchCounts.get(conversation.parentConversationId) ?? 0) + 1,
    );
  }

  return conversations
    .map((conversation) => ({
      conversation,
      projectTitle: conversation.projectId
        ? getProjectById(conversation.projectId, rootDir)?.title ?? null
        : null,
      lastMessagePreview: formatLastMessagePreview(conversation.id, rootDir),
      openLoopCount: (openLoopsByConversationId.get(conversation.id) ?? []).length,
      branchCount: branchCounts.get(conversation.id) ?? 0,
    }))
    .sort((left, right) => {
      const order = conversationSortOrder(left.conversation.status) - conversationSortOrder(right.conversation.status);
      if (order !== 0) {
        return order;
      }
      return right.conversation.updatedAt.localeCompare(left.conversation.updatedAt);
    });
}

export function groupConversationOverviews(rootDir = process.cwd()): ConversationGroup[] {
  const grouped = new Map<string, ConversationGroup>();

  for (const overview of listConversationOverviews(rootDir)) {
    const key = overview.conversation.projectId ?? 'general';
    const existing = grouped.get(key);
    if (existing) {
      existing.items.push(overview);
      continue;
    }

    grouped.set(key, {
      projectId: overview.conversation.projectId,
      projectTitle: overview.projectTitle ?? 'General',
      items: [overview],
    });
  }

  return Array.from(grouped.values());
}
