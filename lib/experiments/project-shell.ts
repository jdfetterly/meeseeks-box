import 'server-only';

import type {
  ProjectDetailRecord,
} from '@/lib/projects/service';
import { getProjectDetail } from '@/lib/projects/service';
import type { ProjectSpecDetail } from '@/lib/specs/service';
import { listProjectSpecDetails } from '@/lib/specs/service';
import type { ReviewQueueEntry } from '@/lib/review-queue/service';
import { listReviewQueue } from '@/lib/review-queue/service';
import type { WorkBoardLane } from '@/lib/work-board/service';
import { listBoardLanes } from '@/lib/work-board/service';
import {
  getConversationById,
  getSpecById,
  getSpecCardLinkByWorkItemId,
  getWorkItemById,
} from '@/lib/product-state/repositories';
import type { SpecRecord, WorkItemRecord } from '@/lib/product-state/entities';
import type { ProjectShellView } from '@/lib/experiments/shell-variants';

export interface ActiveWorkPaneModel {
  workItem: WorkItemRecord;
  spec: SpecRecord | null;
  sourceConversationTitle: string | null;
  openReviewEntry: ReviewQueueEntry | null;
}

export interface ProjectShellModel {
  projectDetail: ProjectDetailRecord;
  currentPlan: ProjectSpecDetail | null;
  specs: ProjectSpecDetail[];
  lanes: WorkBoardLane[];
  reviewEntries: ReviewQueueEntry[];
  activeWork: ActiveWorkPaneModel | null;
  view: ProjectShellView;
}

export function getProjectShellModel(
  projectId: string,
  input: {
    view: ProjectShellView;
    cardId?: string | null;
  },
  rootDir = process.cwd(),
): ProjectShellModel | null {
  const projectDetail = getProjectDetail(projectId, rootDir);

  if (!projectDetail) {
    return null;
  }

  const specs = listProjectSpecDetails(projectId, rootDir);
  const reviewEntries = listReviewQueue(rootDir)
    .filter((entry) => entry.projectId === projectId && entry.status === 'open')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const lanes = listBoardLanes(
    { mode: input.view === 'status' ? 'status' : 'project', projectId },
    rootDir,
  );

  let activeWork: ActiveWorkPaneModel | null = null;
  if (input.cardId) {
    const workItem = getWorkItemById(input.cardId, rootDir);
    if (workItem?.projectId === projectId) {
      const specLink = getSpecCardLinkByWorkItemId(workItem.id, rootDir);
      const sourceConversation = workItem.sourceConversationId
        ? getConversationById(workItem.sourceConversationId, rootDir)
        : null;

      activeWork = {
        workItem,
        spec: specLink ? getSpecById(specLink.specId, rootDir) : null,
        sourceConversationTitle: sourceConversation?.title ?? null,
        openReviewEntry:
          reviewEntries.find((entry) => entry.workItemId === workItem.id) ?? null,
      };
    }
  }

  return {
    projectDetail,
    currentPlan: specs[0] ?? null,
    specs,
    lanes,
    reviewEntries,
    activeWork,
    view: input.view,
  };
}
