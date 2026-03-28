import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api-error';
import { branchConversation, getConversationById } from '@/lib/product-state/repositories';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const parent = getConversationById(id);

    if (!parent) {
      return apiErrorResponse(new Error('Conversation not found'), 'Not found', 404);
    }

    const body = (await request.json().catch(() => ({}))) as {
      branchFromMessageId?: unknown;
      title?: unknown;
    };

    const conversation = branchConversation({
      parentConversationId: id,
      branchFromMessageId:
        typeof body.branchFromMessageId === 'string' ? body.branchFromMessageId : null,
      title: typeof body.title === 'string' ? body.title : null,
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, 'Failed to branch conversation');
  }
}
