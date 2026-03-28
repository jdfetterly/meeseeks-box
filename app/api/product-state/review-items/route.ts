import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { listReviewQueue } from '@/lib/review-queue/service';

export async function GET() {
  try {
    return NextResponse.json({ reviewItems: listReviewQueue() });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load review items');
  }
}
