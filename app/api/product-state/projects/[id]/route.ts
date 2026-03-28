import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { getProjectDetail } from '@/lib/projects/service';
import { updateProject } from '@/lib/product-state/repositories';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const workspace = getProjectDetail(id);

    if (!workspace) {
      return apiErrorResponse(new Error('Project not found'), 'Project not found', 404);
    }

    return NextResponse.json(workspace);
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load project');
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: unknown;
      summary?: unknown;
      status?: unknown;
      priority?: unknown;
      linkedRepos?: unknown;
      activeGoal?: unknown;
      currentFocus?: unknown;
    };

    const project = updateProject(id, {
      title: typeof body.title === 'string' ? body.title : undefined,
      summary: typeof body.summary === 'string' ? body.summary : undefined,
      status:
        body.status === 'active' || body.status === 'paused' || body.status === 'archived'
          ? body.status
          : undefined,
      priority: body.priority === 'high' || body.priority === 'normal' || body.priority === 'low'
        ? body.priority
        : undefined,
      linkedRepos: Array.isArray(body.linkedRepos)
        ? body.linkedRepos.filter((value): value is string => typeof value === 'string')
        : undefined,
      activeGoal: typeof body.activeGoal === 'string' ? body.activeGoal : undefined,
      currentFocus: typeof body.currentFocus === 'string' ? body.currentFocus : undefined,
    });

    return NextResponse.json({ project });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to update project');
  }
}
