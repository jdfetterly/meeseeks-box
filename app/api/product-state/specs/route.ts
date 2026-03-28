import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { listSpecs } from '@/lib/product-state/repositories';
import { createProjectSpec, parseSpecPayload } from '@/lib/specs/service';

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get('projectId');
    const status = request.nextUrl.searchParams.get('status');

    return NextResponse.json({
      specs: listSpecs(
        {
          projectId,
          status:
            status === 'draft' || status === 'approved' || status === 'superseded' || status === 'archived'
              ? status
              : null,
        },
      ),
    });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load specs');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const projectId = typeof body.projectId === 'string' ? body.projectId : null;

    if (!projectId) {
      return apiErrorResponse(new Error('projectId is required'), 'Invalid spec payload', 400);
    }

    const payload = parseSpecPayload(body);

    const spec = createProjectSpec({
      projectId,
      ...payload,
      status:
        body.status === 'approved' || body.status === 'superseded' || body.status === 'archived'
          ? body.status
          : 'draft',
      executionMode:
        body.executionMode === 'planning_only' ||
        body.executionMode === 'non_code' ||
        body.executionMode === 'workspace_required'
          ? body.executionMode
          : null,
      workspaceRequired: typeof body.workspaceRequired === 'boolean' ? body.workspaceRequired : null,
    });

    return NextResponse.json({ spec }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create spec');
  }
}
