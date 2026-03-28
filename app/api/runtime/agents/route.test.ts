// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as route from '@/app/api/runtime/agents/route'

const mocks = vi.hoisted(() => ({
  listRuntimeAgentCatalog: vi.fn(),
  createRuntimeAgent: vi.fn(),
}))

vi.mock('@/lib/openclaw/runtime-agent-management', () => ({
  listRuntimeAgentCatalog: mocks.listRuntimeAgentCatalog,
  createRuntimeAgent: mocks.createRuntimeAgent,
}))

describe('runtime agents api', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns the runtime catalog', async () => {
    mocks.listRuntimeAgentCatalog.mockResolvedValue({
      mode: 'local',
      defaultContextId: 'main',
      contexts: [],
    })

    const response = await route.GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.defaultContextId).toBe('main')
  })

  it('creates a runtime agent from POST body', async () => {
    mocks.createRuntimeAgent.mockResolvedValue({
      agentId: 'ops',
      name: 'Ops',
      workspace: '/tmp/ops',
    })

    const response = await route.POST(
      new Request('http://localhost/api/runtime/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Ops',
          workspace: '/tmp/ops',
          model: 'anthropic/claude-sonnet-4-5',
          bindings: ['telegram:ops'],
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(mocks.createRuntimeAgent).toHaveBeenCalledWith({
      name: 'Ops',
      workspace: '/tmp/ops',
      model: 'anthropic/claude-sonnet-4-5',
      emoji: null,
      avatar: null,
      bindings: ['telegram:ops'],
    })
  })
})
