import 'server-only'

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  WorkspaceMemorySourceSnapshot,
  WorkspaceMemoryWriteRequest,
  WorkspaceMemoryWriteResult,
} from '@/lib/openclaw/contracts'
import type { DomainScope } from '@/lib/product-state/entities'

export interface WorkspaceMemoryStatus {
  workspacePath: string | null
  memoryDirPath: string | null
  evergreenPath: string | null
  memoryDirExists: boolean
  evergreenExists: boolean
  bootstrapEnabled: boolean
}

function bootstrapEnabled() {
  return process.env.MEESEEKS_BOX_MEMORY_BOOTSTRAP_ENABLED === 'true'
}

export function resolveWorkspacePath(explicitWorkspacePath?: string | null) {
  const configured = explicitWorkspacePath?.trim() || process.env.WORKSPACE_PATH?.trim() || null
  return configured
}

export function normalizeWorkspaceMemoryRelativePath(relativePath: string) {
  const trimmed = relativePath.trim().replace(/^\/+/, '')

  if (!trimmed) {
    return null
  }

  const normalized =
    trimmed === 'MEMORY.md' || trimmed.startsWith('memory/') ? trimmed : `memory/${trimmed}`
  const parsed = path.posix.normalize(normalized)

  if (
    parsed.startsWith('../') ||
    parsed.includes('/../') ||
    parsed === '..' ||
    (!parsed.endsWith('.md') && !parsed.endsWith('.json'))
  ) {
    return null
  }

  if (parsed === 'MEMORY.md') {
    return parsed
  }

  return parsed.startsWith('memory/') ? parsed : null
}

export function getWorkspaceMemoryStatus(explicitWorkspacePath?: string | null): WorkspaceMemoryStatus {
  const workspacePath = resolveWorkspacePath(explicitWorkspacePath)
  const memoryDirPath = workspacePath ? path.join(workspacePath, 'memory') : null
  const evergreenPath = workspacePath ? path.join(workspacePath, 'MEMORY.md') : null

  return {
    workspacePath,
    memoryDirPath,
    evergreenPath,
    memoryDirExists: Boolean(memoryDirPath && existsSync(memoryDirPath)),
    evergreenExists: Boolean(evergreenPath && existsSync(evergreenPath)),
    bootstrapEnabled: bootstrapEnabled(),
  }
}

export function listWorkspaceMemorySources(
  scope: DomainScope,
  explicitWorkspacePath?: string | null,
) {
  const status = getWorkspaceMemoryStatus(explicitWorkspacePath)

  if (!status.workspacePath || !status.memoryDirPath || !status.evergreenPath) {
    return [] satisfies readonly WorkspaceMemorySourceSnapshot[]
  }

  return [
    {
      scope,
      absolutePath: status.evergreenPath,
      exists: status.evergreenExists,
    },
    {
      scope,
      absolutePath: status.memoryDirPath,
      exists: status.memoryDirExists,
    },
  ] satisfies readonly WorkspaceMemorySourceSnapshot[]
}

export function ensureWorkspaceMemoryBootstrap(explicitWorkspacePath?: string | null) {
  const status = getWorkspaceMemoryStatus(explicitWorkspacePath)

  if (!status.workspacePath || !status.memoryDirPath || !status.evergreenPath) {
    return {
      status: 'unavailable',
      reason: 'workspace-path-unconfigured',
      details: status,
    } as const
  }

  if (!status.bootstrapEnabled) {
    return {
      status: 'unavailable',
      reason: 'memory-bootstrap-disabled',
      details: status,
    } as const
  }

  mkdirSync(status.memoryDirPath, { recursive: true })

  if (!existsSync(status.evergreenPath)) {
    writeFileSync(
      status.evergreenPath,
      '# Workspace Memory\n\nThis file is managed through Meeseek Box and OpenClaw-compatible tooling.\n',
      'utf8',
    )
  }

  return {
    status: 'bootstrapped',
    reason: null,
    details: getWorkspaceMemoryStatus(explicitWorkspacePath),
  } as const
}

export function writeWorkspaceMemoryFile(
  input: WorkspaceMemoryWriteRequest,
  explicitWorkspacePath?: string | null,
): WorkspaceMemoryWriteResult {
  const workspacePath = resolveWorkspacePath(explicitWorkspacePath)

  if (!workspacePath) {
    return {
      status: 'unavailable',
      absolutePath: null,
      reason: 'workspace-path-unconfigured',
    }
  }

  const normalizedRelativePath = normalizeWorkspaceMemoryRelativePath(input.relativePath)

  if (!normalizedRelativePath) {
    return {
      status: 'rejected',
      absolutePath: null,
      reason: 'path-outside-allowlist',
    }
  }

  const status = getWorkspaceMemoryStatus(workspacePath)

  if (!status.memoryDirExists || !status.evergreenExists) {
    const bootstrap = ensureWorkspaceMemoryBootstrap(workspacePath)

    if (bootstrap.status !== 'bootstrapped') {
      return {
        status: 'unavailable',
        absolutePath: null,
        reason: bootstrap.reason,
      }
    }
  }

  const destination = path.join(workspacePath, normalizedRelativePath)
  mkdirSync(path.dirname(destination), { recursive: true })
  writeFileSync(destination, input.content, 'utf8')

  return {
    status: 'written',
    absolutePath: destination,
    reason: null,
  }
}
