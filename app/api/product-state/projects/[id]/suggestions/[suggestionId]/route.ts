import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { updateProjectLearningSuggestionStatus } from '@/lib/product-state/repositories';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; suggestionId: string }> },
) {
  try {
    const { suggestionId } = await context.params;
    const body = (await request.json()) as { status?: unknown };

    if (body.status !== 'accepted' && body.status !== 'rejected' && body.status !== 'open') {
      return apiErrorResponse(new Error('Suggestion status is invalid'), 'Invalid suggestion payload', 400);
    }

    const suggestion = updateProjectLearningSuggestionStatus(suggestionId, body.status);

    if (!suggestion) {
      return apiErrorResponse(new Error('Suggestion not found'), 'Suggestion not found', 404);
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to update learning suggestion');
  }
}
