import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  execFileSync: vi.fn(),
  discoverAgents: vi.fn(),
  getCrons: vi.fn(async () => []),
}))

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process')
  return {
    ...actual,
    execFileSync: mocks.execFileSync,
    default: {
      ...actual,
      execFileSync: mocks.execFileSync,
    },
  }
})

vi.mock('@/lib/agents-registry', async () => {
  const actual = await vi.importActual<typeof import('@/lib/agents-registry')>('@/lib/agents-registry')
  return {
    ...actual,
    discoverAgents: mocks.discoverAgents,
  }
})

vi.mock('@/lib/crons', () => ({
  getCrons: mocks.getCrons,
}))

describe('runtime agent management', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    delete process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE
    delete process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST
    delete process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER
    delete process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH
    delete process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN
    delete process.env.OPENCLAW_BIN
  })

  it('hydrates a local runtime context with discovered family agents', async () => {
    process.env.OPENCLAW_BIN = '/usr/local/bin/openclaw'
    mocks.execFileSync.mockReturnValueOnce(
      JSON.stringify([
        {
          id: 'main',
          identityName: 'Jarvis',
          identityEmoji: '🤖',
          workspace: '/tmp/workspace',
          agentDir: '/tmp/.openclaw/agents/main',
          model: 'anthropic/claude-sonnet-4-5',
          bindings: 2,
          isDefault: true,
          routes: ['default (no explicit rules)'],
        },
      ]),
    )
    mocks.discoverAgents.mockReturnValue([
      {
        id: 'jarvis',
        name: 'Jarvis',
        title: 'Orchestrator',
        reportsTo: null,
        directReports: ['vera'],
        soulPath: 'SOUL.md',
        voiceId: null,
        color: '#f5c518',
        emoji: '🤖',
        tools: ['read', 'write'],
        memoryPath: null,
        description: 'Top-level orchestrator.',
      },
      {
        id: 'vera',
        name: 'VERA',
        title: 'Chief Strategy Officer',
        reportsTo: 'jarvis',
        directReports: [],
        soulPath: 'agents/vera/SOUL.md',
        voiceId: null,
        color: '#a855f7',
        emoji: '♟️',
        tools: ['web_search'],
        memoryPath: null,
        description: 'Strategy lead.',
      },
    ])

    const { listRuntimeAgentCatalog } = await import('@/lib/openclaw/runtime-agent-management')
    const catalog = await listRuntimeAgentCatalog()

    expect(catalog.mode).toBe('local')
    expect(catalog.defaultContextId).toBe('main')
    expect(catalog.contexts[0]).toMatchObject({
      id: 'main',
      label: 'Jarvis',
      scanStatus: 'scanned',
      rootAgentId: 'jarvis',
    })
    expect(catalog.contexts[0]?.agents.map((agent) => agent.id)).toEqual(['jarvis', 'vera'])
  })

  it('falls back to a single runtime agent in ssh mode when workspace scanning is unavailable', async () => {
    process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE = 'ssh'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST = '100.105.238.17'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER = 'agent-playground'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH = '/Users/test/.ssh/id_ed25519'
    mocks.execFileSync.mockReturnValueOnce(
      JSON.stringify([
        {
          id: 'ops',
          identityName: 'Ops',
          identityEmoji: '🛠️',
          workspace: '/srv/ops',
          bindings: 1,
          isDefault: false,
        },
      ]),
    )

    const { listRuntimeAgentCatalog } = await import('@/lib/openclaw/runtime-agent-management')
    const catalog = await listRuntimeAgentCatalog()

    expect(mocks.discoverAgents).not.toHaveBeenCalled()
    expect(catalog.mode).toBe('ssh')
    expect(catalog.contexts[0]).toMatchObject({
      id: 'ops',
      scanStatus: 'fallback',
      rootAgentId: 'ops',
    })
    expect(catalog.contexts[0]?.agents[0]).toMatchObject({
      id: 'ops',
      name: 'Ops',
      source: 'fallback',
    })
  })

  it('clones context files but does not rewrite IDENTITY.md', async () => {
    process.env.OPENCLAW_BIN = '/usr/local/bin/openclaw'
    mocks.execFileSync
      .mockReturnValueOnce(
        JSON.stringify([
          {
            id: 'main',
            identityName: 'Jarvis',
            identityEmoji: '🤖',
            workspace: '/tmp/workspace',
            agentDir: '/tmp/.openclaw/agents/main',
            model: 'anthropic/claude-sonnet-4-5',
            bindings: 1,
            isDefault: true,
          },
        ]),
      )
      .mockReturnValueOnce(
        JSON.stringify({
          agentId: 'copy',
          workspace: '/tmp/workspace-copy',
          files: [
            { name: 'AGENTS.md', missing: false, path: '/tmp/workspace/AGENTS.md' },
            { name: 'SOUL.md', missing: false, path: '/tmp/workspace/SOUL.md' },
            { name: 'TOOLS.md', missing: false, path: '/tmp/workspace/TOOLS.md' },
            { name: 'IDENTITY.md', missing: false, path: '/tmp/workspace/IDENTITY.md' },
            { name: 'USER.md', missing: true, path: '/tmp/workspace/USER.md' },
            { name: 'HEARTBEAT.md', missing: true, path: '/tmp/workspace/HEARTBEAT.md' },
            { name: 'MEMORY.md', missing: true, path: '/tmp/workspace/MEMORY.md' },
          ],
        }),
      )
      .mockReturnValueOnce(
        JSON.stringify({
          file: { name: 'AGENTS.md', path: '/tmp/workspace/AGENTS.md', missing: false, content: '# Agents' },
        }),
      )
      .mockReturnValueOnce(
        JSON.stringify({
          file: { name: 'SOUL.md', path: '/tmp/workspace/SOUL.md', missing: false, content: '# Soul' },
        }),
      )
      .mockReturnValueOnce(
        JSON.stringify({
          file: { name: 'TOOLS.md', path: '/tmp/workspace/TOOLS.md', missing: false, content: '# Tools' },
        }),
      )
      .mockReturnValueOnce(
        JSON.stringify({
          file: { name: 'IDENTITY.md', path: '/tmp/workspace/IDENTITY.md', missing: false, content: '# Identity' },
        }),
      )
      .mockReturnValueOnce(
        JSON.stringify({
          agentId: 'copy',
          name: 'Copy',
          workspace: '/tmp/workspace-copy',
        }),
      )
      .mockReturnValueOnce(JSON.stringify({ ok: true, agentId: 'copy' }))
      .mockReturnValueOnce(JSON.stringify({ ok: true, file: { name: 'AGENTS.md' } }))
      .mockReturnValueOnce(JSON.stringify({ ok: true, file: { name: 'SOUL.md' } }))
      .mockReturnValueOnce(JSON.stringify({ ok: true, file: { name: 'TOOLS.md' } }))

    mocks.discoverAgents.mockReturnValue([
      {
        id: 'jarvis',
        name: 'Jarvis',
        title: 'Orchestrator',
        reportsTo: null,
        directReports: [],
        soulPath: 'SOUL.md',
        voiceId: null,
        color: '#f5c518',
        emoji: '🤖',
        tools: ['read'],
        memoryPath: null,
        description: 'Top-level orchestrator.',
      },
    ])

    const { cloneRuntimeAgent } = await import('@/lib/openclaw/runtime-agent-management')
    await cloneRuntimeAgent({
      sourceContextId: 'main',
      name: 'Copy',
      workspace: '/tmp/workspace-copy',
      copyBindings: false,
    })

    const flattened = mocks.execFileSync.mock.calls.map((call) => call[1]).flat()
    expect(flattened).not.toContain('IDENTITY.md')
    expect(mocks.execFileSync).toHaveBeenCalledWith(
      '/usr/local/bin/openclaw',
      expect.arrayContaining(['gateway', 'call', 'agents.files.set', '--params', expect.stringContaining('"name":"AGENTS.md"')]),
      expect.any(Object),
    )
  })
})
