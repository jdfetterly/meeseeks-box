import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import {
  createMessage,
  getConversationById,
  listMessages,
} from '@/lib/product-state/repositories'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const conversation = getConversationById(id)

    if (!conversation) {
      return apiErrorResponse(new Error('Conversation not found'), 'Not found', 404)
    }

    return NextResponse.json({ messages: listMessages(id) })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to load messages')
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const conversation = getConversationById(id)

    if (!conversation) {
      return apiErrorResponse(new Error('Conversation not found'), 'Not found', 404)
    }

    const body = (await request.json()) as {
      role?: unknown
      contentText?: unknown
      contentJson?: unknown
    }

    if (
      body.role !== 'user' &&
      body.role !== 'assistant' &&
      body.role !== 'system'
    ) {
      return apiErrorResponse(new Error('Message role is invalid'), 'Invalid message payload', 400)
    }

    if (
      typeof body.contentText !== 'string' &&
      (typeof body.contentJson !== 'object' || body.contentJson === null)
    ) {
      return apiErrorResponse(
        new Error('Message contentText or contentJson is required'),
        'Invalid message payload',
        400,
      )
    }

    const message = createMessage({
      conversationId: id,
      role: body.role,
      contentText: typeof body.contentText === 'string' ? body.contentText : null,
      contentJson:
        typeof body.contentJson === 'object' && body.contentJson !== null
          ? (body.contentJson as Record<string, unknown>)
          : null,
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    return apiErrorResponse(error, 'Failed to create message')
  }
}
