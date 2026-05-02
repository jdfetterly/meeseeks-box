// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as mobileChatRoute from './route'
import { closeProductStateDb } from '@/lib/product-state/db'
import {
  createConversation,
  listMessages,
} from '@/lib/product-state/repositories'
import { sendViaOpenClaw } from '@/lib/anthropic'

vi.mock('@/lib/anthropic', () => ({
  sendViaOpenClaw: vi.fn(),
}))

const tempDirs: string[] = []
const sendViaOpenClawMock = vi.mocked(sendViaOpenClaw)

function useTempStateDir() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-mobile-chat-'))
  tempDirs.push(dir)
  process.env.MEESEEKS_BOX_STATE_DIR = dir
}

afterEach(() => {
  closeProductStateDb()
  delete process.env.MEESEEKS_BOX_STATE_DIR
  delete process.env.OPENCLAW_GATEWAY_TOKEN
  vi.clearAllMocks()

  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('mobile chat api', () => {
  it('persists the user message, sends to mini-ops OpenClaw, and persists the assistant reply', async () => {
    useTempStateDir()
    process.env.OPENCLAW_GATEWAY_TOKEN = 'test-token'
    sendViaOpenClawMock.mockResolvedValue('Mobile direct chat works.')

    const conversation = createConversation({
      scope: 'mini-ops',
      agentId: 'mini-ops',
      title: 'Mobile chat',
    })

    const response = await mobileChatRoute.POST(
      new Request('http://localhost/api/mobile/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          agentContext: 'mini-ops',
          message: 'Can you hear me?',
        }),
      }) as never,
    )
    const payload = await response.json()

    expect(response.status).toBe(201)
    expect(sendViaOpenClawMock).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayToken: 'test-token',
        message: 'Can you hear me?',
        attachments: [],
        sessionKey: `agent:mini-ops:mobile:${conversation.id}`,
      }),
    )
    expect(payload.assistantMessage.contentText).toBe('Mobile direct chat works.')
    expect(listMessages(conversation.id).map((message) => message.role)).toEqual(['user', 'assistant'])
  })

  it('rejects requests when the gateway token is not configured', async () => {
    useTempStateDir()
    const conversation = createConversation({
      scope: 'mini-ops',
      agentId: 'mini-ops',
      title: 'Mobile chat',
    })

    const response = await mobileChatRoute.POST(
      new Request('http://localhost/api/mobile/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          message: 'Hello',
        }),
      }) as never,
    )

    expect(response.status).toBe(503)
    expect(sendViaOpenClawMock).not.toHaveBeenCalled()
    expect(listMessages(conversation.id)).toEqual([])
  })
})
