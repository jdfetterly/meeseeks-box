import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse } from '@/lib/api-error'
import { sendViaOpenClaw } from '@/lib/anthropic'
import {
  createMessage,
  getConversationById,
  listMessages,
} from '@/lib/product-state/repositories'

export const runtime = 'nodejs'

const DEFAULT_AGENT_CONTEXT = 'mini-ops'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      conversationId?: unknown
      message?: unknown
      agentContext?: unknown
    }

    if (!isNonEmptyString(body.conversationId)) {
      return apiErrorResponse(new Error('conversationId is required'), 'Invalid mobile chat payload', 400)
    }

    if (!isNonEmptyString(body.message)) {
      return apiErrorResponse(new Error('message is required'), 'Invalid mobile chat payload', 400)
    }

    const conversationId = body.conversationId.trim()
    const conversation = getConversationById(conversationId)
    if (!conversation) {
      return apiErrorResponse(new Error('Conversation not found'), 'Not found', 404)
    }

    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN?.trim()
    if (!gatewayToken) {
      return apiErrorResponse(new Error('OpenClaw gateway token is not configured'), 'Mobile chat unavailable', 503)
    }

    const message = body.message.trim()
    const agentContext = isNonEmptyString(body.agentContext)
      ? body.agentContext.trim()
      : DEFAULT_AGENT_CONTEXT
    const sessionKey = `agent:${agentContext}:mobile:${conversationId}`

    const userMessage = createMessage({
      conversationId,
      role: 'user',
      contentText: message,
    })

    const assistantText = await sendViaOpenClaw({
      gatewayToken,
      message,
      attachments: [],
      sessionKey,
      timeoutMs: 90_000,
    })

    if (!assistantText?.trim()) {
      throw new Error('OpenClaw did not return a response')
    }

    const assistantMessage = createMessage({
      conversationId,
      role: 'assistant',
      contentText: assistantText.trim(),
    })

    return NextResponse.json(
      {
        userMessage,
        assistantMessage,
        messages: listMessages(conversationId),
      },
      { status: 201 },
    )
  } catch (error) {
    return apiErrorResponse(error, 'Failed to chat with OpenClaw', 502)
  }
}
