import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { listProjectContextSummaries } from '@/lib/projects/service';
import {
  createProject,
  getProjectPlaybookByProjectId,
  listProjects,
  upsertProjectPlaybook,
} from '@/lib/product-state/repositories';

export async function GET() {
  try {
    return NextResponse.json({
      projects: listProjects(),
      summaries: listProjectContextSummaries(),
    });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load projects');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title?: unknown;
      summary?: unknown;
      status?: unknown;
      priority?: unknown;
      linkedRepos?: unknown;
      activeGoal?: unknown;
      currentFocus?: unknown;
      playbook?: unknown;
    };

    if (typeof body.title !== 'string' || !body.title.trim()) {
      return apiErrorResponse(new Error('Project title is required'), 'Invalid project payload', 400);
    }

    const project = createProject({
      title: body.title.trim(),
      summary: typeof body.summary === 'string' ? body.summary : null,
      status:
        body.status === 'active' || body.status === 'paused' || body.status === 'archived'
          ? body.status
          : 'active',
      priority: body.priority === 'high' || body.priority === 'low' ? body.priority : 'normal',
      linkedRepos: Array.isArray(body.linkedRepos)
        ? body.linkedRepos.filter((value): value is string => typeof value === 'string')
        : [],
      activeGoal: typeof body.activeGoal === 'string' ? body.activeGoal : null,
      currentFocus: typeof body.currentFocus === 'string' ? body.currentFocus : null,
    });

    const playbookBody =
      typeof body.playbook === 'object' && body.playbook !== null
        ? (body.playbook as Record<string, unknown>)
        : null;
    const playbook =
      playbookBody
        ? upsertProjectPlaybook(
            {
              projectId: project.id,
              goals: Array.isArray(playbookBody.goals)
                ? playbookBody.goals.filter((value): value is string => typeof value === 'string')
                : [],
              preferredAgents: Array.isArray(playbookBody.preferredAgents)
                ? playbookBody.preferredAgents.filter((value): value is string => typeof value === 'string')
                : [],
              workingStyle:
                typeof playbookBody.workingStyle === 'string' ? playbookBody.workingStyle : null,
              reviewPreferences:
                typeof playbookBody.reviewPreferences === 'string'
                  ? playbookBody.reviewPreferences
                  : null,
              schedulePatterns:
                typeof playbookBody.schedulePatterns === 'string' ? playbookBody.schedulePatterns : null,
              repoContext:
                typeof playbookBody.repoContext === 'string' ? playbookBody.repoContext : null,
              recentDecisions: Array.isArray(playbookBody.recentDecisions)
                ? playbookBody.recentDecisions.filter((value): value is string => typeof value === 'string')
                : [],
              updatedAt: new Date().toISOString(),
            },
            process.cwd(),
          )
        : getProjectPlaybookByProjectId(project.id);

    return NextResponse.json({ project, playbook }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create project');
  }
}
