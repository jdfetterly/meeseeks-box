import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { getProjectSpecDetail, parseSpecPayload, updateProjectSpec } from '@/lib/specs/service';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const detail = getProjectSpecDetail(id);

    if (!detail) {
      return apiErrorResponse(new Error('Spec not found'), 'Spec not found', 404);
    }

    return NextResponse.json(detail);
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load spec');
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = parseSpecPayload(body);
    const spec = updateProjectSpec(
      id,
      {
        ...payload,
        status:
          body.status === 'draft' ||
          body.status === 'approved' ||
          body.status === 'superseded' ||
          body.status === 'archived'
            ? body.status
            : undefined,
        executionMode:
          body.executionMode === 'planning_only' ||
          body.executionMode === 'non_code' ||
          body.executionMode === 'workspace_required'
            ? body.executionMode
            : undefined,
        workspaceRequired: typeof body.workspaceRequired === 'boolean' ? body.workspaceRequired : undefined,
      },
    );

    return NextResponse.json({ spec });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to update spec');
  }
}
