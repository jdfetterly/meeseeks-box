import 'server-only';

import {
  getProjectById,
  getSpecById,
  getSpecCardLinkByWorkItemId,
  getWorkItemById,
  listReviewItems,
} from '@/lib/product-state/repositories';

export interface ReviewQueueEntry {
  id: string;
  projectId: string | null;
  projectTitle: string | null;
  workItemId: string;
  workItemTitle: string;
  specId: string | null;
  specTitle: string | null;
  acceptanceCriteria: string[];
  expectedOutput: string | null;
  producedByAgentId: string | null;
  summary: string;
  reviewReason: string;
  artifactIds: string[];
  status: 'open' | 'reviewed';
  updatedAt: string;
}

export function listReviewQueue(rootDir = process.cwd()) {
  return listReviewItems({}, rootDir).map((item) => {
    const workItem = getWorkItemById(item.workItemId, rootDir);
    const project = item.projectId ? getProjectById(item.projectId, rootDir) : null;
    const specLink = getSpecCardLinkByWorkItemId(item.workItemId, rootDir);
    const spec = specLink ? getSpecById(specLink.specId, rootDir) : null;

    return {
      id: item.id,
      projectId: item.projectId,
      projectTitle: project?.title ?? null,
      workItemId: item.workItemId,
      workItemTitle: workItem?.title ?? 'Unknown work item',
      specId: spec?.id ?? null,
      specTitle: spec?.title ?? null,
      acceptanceCriteria: specLink?.acceptanceCriteria ?? [],
      expectedOutput: specLink?.expectedOutput ?? null,
      producedByAgentId: item.producedByAgentId,
      summary: item.summary,
      reviewReason: item.reviewReason,
      artifactIds: item.artifactIds,
      status: item.status,
      updatedAt: item.updatedAt,
    } satisfies ReviewQueueEntry;
  });
}
