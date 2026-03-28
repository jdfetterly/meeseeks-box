// @vitest-environment node

import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const tempDirs: string[] = []

vi.mock('@/lib/openclaw/runtime-agents', () => ({
  listRuntimeAgentIdentities: vi.fn(() => []),
}))

vi.mock('@/lib/agents', () => ({
  getAgents: vi.fn(async () => [
    {
      id: 'jarvis',
      name: 'Jarvis',
      title: 'Orchestrator',
      reportsTo: null,
      directReports: ['vera'],
      description: 'Top-level orchestrator.',
    },
    {
      id: 'vera',
      name: 'VERA',
      title: 'Chief Strategy Officer',
      reportsTo: 'jarvis',
      directReports: [],
      description: 'Strategy lead.',
    },
  ]),
}))

describe('agent catalog', () => {
  afterEach(() => {
    delete process.env.WORKSPACE_PATH

    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('attaches the local workspace hierarchy to the mini-ops fallback context', async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-agent-catalog-'))
    const workspacePath = path.join(root, 'workspace')
    tempDirs.push(root)
    mkdirSync(workspacePath, { recursive: true })
    process.env.WORKSPACE_PATH = workspacePath

    const { getAgentCatalog } = await import('@/lib/agent-catalog')
    const catalog = await getAgentCatalog()
    const miniOps = catalog.contexts.find((context) => context.id === 'mini-ops')

    expect(catalog.defaultContextId).toBe('mini-ops')
    expect(miniOps?.workspace).toBe(workspacePath)
    expect(miniOps?.rootAgentId).toBe('jarvis')
    expect(miniOps?.agents.map((agent) => agent.id)).toEqual(['jarvis', 'vera'])
  })

  it('allows the top-level context id as a valid runtime agent target', async () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-agent-catalog-'))
    const workspacePath = path.join(root, 'workspace')
    tempDirs.push(root)
    mkdirSync(workspacePath, { recursive: true })
    process.env.WORKSPACE_PATH = workspacePath

    const { isAgentAllowedForContext } = await import('@/lib/agent-catalog')

    await expect(isAgentAllowedForContext('ops', 'mini-ops')).resolves.toBe(true)
    await expect(isAgentAllowedForContext('mini-ops', 'vera')).resolves.toBe(true)
    await expect(isAgentAllowedForContext('jd-personal', 'vera')).resolves.toBe(false)
  })
})
