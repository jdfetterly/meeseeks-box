import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  bindExistingProjectWorkspace,
  bootstrapProjectWorkspace,
  deriveDefaultWorkspacePath,
} from '@/lib/projects/service';
import { getProjectById } from '@/lib/product-state/repositories';

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
      projectId: project.id,
      suggestedWorkspacePath: deriveDefaultWorkspacePath(project),
    });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to prepare workspace flow');
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      action?: unknown;
      workspacePath?: unknown;
      repoName?: unknown;
      repoUrl?: unknown;
      defaultBranch?: unknown;
    };

    if (body.action === 'bind_existing') {
      if (typeof body.workspacePath !== 'string' || !body.workspacePath.trim()) {
        return apiErrorResponse(
          new Error('Workspace path is required'),
          'Invalid workspace payload',
          400,
        );
      }

      const workspace = bindExistingProjectWorkspace(id, {
        workspacePath: body.workspacePath,
        repoName: typeof body.repoName === 'string' ? body.repoName : null,
        repoUrl: typeof body.repoUrl === 'string' ? body.repoUrl : null,
        defaultBranch: typeof body.defaultBranch === 'string' ? body.defaultBranch : null,
      });

      return NextResponse.json({ workspace }, { status: 201 });
    }

    if (body.action === 'bootstrap') {
      const workspace = bootstrapProjectWorkspace(id, {
        workspacePath: typeof body.workspacePath === 'string' ? body.workspacePath : null,
        repoName: typeof body.repoName === 'string' ? body.repoName : null,
        repoUrl: typeof body.repoUrl === 'string' ? body.repoUrl : null,
        defaultBranch: typeof body.defaultBranch === 'string' ? body.defaultBranch : null,
      });

      return NextResponse.json({ workspace }, { status: 201 });
    }

    return apiErrorResponse(new Error('Unknown workspace action'), 'Invalid workspace payload', 400);
  } catch (error) {
    return apiErrorResponse(error, 'Failed to update project workspace');
  }
}
