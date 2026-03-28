import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { acceptReviewItem } from '@/lib/review-queue/decision-service';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    return NextResponse.json(acceptReviewItem(id));
  } catch (error) {
    return apiErrorResponse(error, 'Failed to resolve review item');
  }
}
