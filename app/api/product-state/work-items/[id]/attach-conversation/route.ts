import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { attachConversationToWorkItem } from '@/lib/product-state/repositories'
import { syncWorkItemSummary } from '@/lib/product-state/projections'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = (await request.json()) as {
      conversationId?: unknown
    }

    if (typeof body.conversationId !== 'string' || !body.conversationId.trim()) {
      return apiErrorResponse(
        new Error('conversationId is required'),
        'Invalid attach payload',
        400,
      )
    }

    const workItem = attachConversationToWorkItem(id, body.conversationId.trim())
    syncWorkItemSummary(workItem.id)

    return NextResponse.json({ workItem })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to attach conversation to work item', 422)
  }
}
