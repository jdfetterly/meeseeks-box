import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  getProjectById,
  getProjectPlaybookByProjectId,
  upsertProjectPlaybook,
} from '@/lib/product-state/repositories';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const project = getProjectById(id);

    if (!project) {
      return apiErrorResponse(new Error('Project not found'), 'Project not found', 404);
    }

    return NextResponse.json({
      project,
      playbook: getProjectPlaybookByProjectId(project.id),
    });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load project playbook');
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const project = getProjectById(id);

    if (!project) {
      return apiErrorResponse(new Error('Project not found'), 'Project not found', 404);
    }

    const body = (await request.json()) as {
      goals?: unknown;
      preferredAgents?: unknown;
      workingStyle?: unknown;
      reviewPreferences?: unknown;
      schedulePatterns?: unknown;
      repoContext?: unknown;
      recentDecisions?: unknown;
    };

    const playbook = upsertProjectPlaybook({
      projectId: project.id,
      goals: Array.isArray(body.goals)
        ? body.goals.filter((value): value is string => typeof value === 'string')
        : [],
      preferredAgents: Array.isArray(body.preferredAgents)
        ? body.preferredAgents.filter((value): value is string => typeof value === 'string')
        : [],
      workingStyle: typeof body.workingStyle === 'string' ? body.workingStyle : null,
      reviewPreferences: typeof body.reviewPreferences === 'string' ? body.reviewPreferences : null,
      schedulePatterns: typeof body.schedulePatterns === 'string' ? body.schedulePatterns : null,
      repoContext: typeof body.repoContext === 'string' ? body.repoContext : null,
      recentDecisions: Array.isArray(body.recentDecisions)
        ? body.recentDecisions.filter((value): value is string => typeof value === 'string')
        : [],
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ project, playbook });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to save project playbook');
  }
}
