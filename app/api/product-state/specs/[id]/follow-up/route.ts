import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { createFollowUpCardProposal } from '@/lib/specs/service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      feedback?: unknown;
      workItemTitle?: unknown;
    };

    if (typeof body.feedback !== 'string' || !body.feedback.trim()) {
      return apiErrorResponse(new Error('feedback is required'), 'Invalid follow-up payload', 400);
    }

    const proposal = createFollowUpCardProposal(id, {
      feedback: body.feedback,
      workItemTitle: typeof body.workItemTitle === 'string' ? body.workItemTitle : null,
    });

    return NextResponse.json({ proposal });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create follow-up proposal');
  }
}
