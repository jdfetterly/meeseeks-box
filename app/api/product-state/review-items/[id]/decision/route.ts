import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { acceptReviewItem, requestReviewChanges } from '@/lib/review-queue/decision-service';

type ReviewDecision = 'accept' | 'request_changes';

function parseDecision(value: unknown): ReviewDecision | null {
  return value === 'accept' || value === 'request_changes' ? value : null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const decision = parseDecision(body.decision);

    if (!decision) {
      return apiErrorResponse(new Error('decision is required'), 'Invalid review decision payload', 400);
    }

    if (decision === 'accept') {
      const result = acceptReviewItem(id);
      return NextResponse.json(result);
    }

    const result = requestReviewChanges(id, {
      feedback: typeof body.feedback === 'string' ? body.feedback : null,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to resolve review decision');
  }
}
