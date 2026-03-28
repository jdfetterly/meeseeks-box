// @vitest-environment node

import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ensureWorkspaceMemoryBootstrap,
  getWorkspaceMemoryStatus,
  normalizeWorkspaceMemoryRelativePath,
  writeWorkspaceMemoryFile,
} from '@/lib/memory/workspace'

const tempRoots: string[] = []

function makeWorkspace() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-memory-'))
  tempRoots.push(root)
  return root
}

afterEach(() => {
  delete process.env.MEESEEKS_BOX_MEMORY_BOOTSTRAP_ENABLED

  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('workspace memory helpers', () => {
  it('normalizes allowed workspace memory paths', () => {
    expect(normalizeWorkspaceMemoryRelativePath('MEMORY.md')).toBe('MEMORY.md')
    expect(normalizeWorkspaceMemoryRelativePath('2026-03-21.md')).toBe('memory/2026-03-21.md')
    expect(normalizeWorkspaceMemoryRelativePath('memory/context.json')).toBe('memory/context.json')
    expect(normalizeWorkspaceMemoryRelativePath('../escape.md')).toBeNull()
  })

  it('bootstraps the expected OpenClaw-compatible workspace memory layout when enabled', () => {
    const workspace = makeWorkspace()
    process.env.MEESEEKS_BOX_MEMORY_BOOTSTRAP_ENABLED = 'true'

    const result = ensureWorkspaceMemoryBootstrap(workspace)

    expect(result.status).toBe('bootstrapped')
    expect(getWorkspaceMemoryStatus(workspace)).toMatchObject({
      memoryDirExists: true,
      evergreenExists: true,
    })
    expect(readFileSync(path.join(workspace, 'MEMORY.md'), 'utf8')).toContain('Workspace Memory')
  })

  it('writes only inside the workspace memory allowlist', () => {
    const workspace = makeWorkspace()
    process.env.MEESEEKS_BOX_MEMORY_BOOTSTRAP_ENABLED = 'true'

    const success = writeWorkspaceMemoryFile(
      {
        scope: 'ops',
        relativePath: '2026-03-21.md',
        content: '# Memory\n',
        contentType: 'markdown',
      },
      workspace,
    )
    const rejected = writeWorkspaceMemoryFile(
      {
        scope: 'ops',
        relativePath: '../escape.md',
        content: 'bad',
        contentType: 'markdown',
      },
      workspace,
    )

    expect(success.status).toBe('written')
    expect(success.absolutePath).toBe(path.join(workspace, 'memory', '2026-03-21.md'))
    expect(readFileSync(success.absolutePath!, 'utf8')).toContain('# Memory')
    expect(rejected).toMatchObject({
      status: 'rejected',
      reason: 'path-outside-allowlist',
    })
  })
})
