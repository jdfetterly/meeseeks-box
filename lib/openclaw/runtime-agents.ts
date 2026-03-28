import 'server-only'

import { execFileSync } from 'node:child_process'

type RuntimeAgentMode = 'local' | 'ssh'

export interface RuntimeAgentIdentity {
  id: string
  label: string
  workspace: string | null
  isDefault: boolean
}

interface RuntimeAgentListEntry {
  id?: unknown
  name?: unknown
  identityName?: unknown
  workspace?: unknown
  isDefault?: unknown
}

function resolveRuntimeAgentMode(): RuntimeAgentMode | null {
  const explicit = process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE?.trim()

  if (explicit === 'local' || explicit === 'ssh') {
    return explicit
  }

  if (process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST?.trim()) {
    return 'ssh'
  }

  if (process.env.OPENCLAW_BIN?.trim()) {
    return 'local'
  }

  return null
}

function executeAgentList() {
  const mode = resolveRuntimeAgentMode()

  if (!mode) {
    return { mode, stdout: null }
  }

  if (mode === 'local') {
    return {
      mode,
      stdout: execFileSync(process.env.OPENCLAW_BIN!.trim(), ['agents', 'list', '--json'], {
        encoding: 'utf8',
        timeout: 15_000,
      }),
    }
  }

  const host = process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST?.trim()
  const user = process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER?.trim()
  const keyPath = process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH?.trim()
  const remoteBin = process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN?.trim() || 'openclaw'

  if (!host || !user || !keyPath) {
    return { mode, stdout: null }
  }

  return {
    mode,
    stdout: execFileSync('ssh', ['-i', keyPath, `${user}@${host}`, remoteBin, 'agents', 'list', '--json'], {
      encoding: 'utf8',
      timeout: 15_000,
    }),
  }
}

function normalizeRuntimeAgentIdentity(entry: RuntimeAgentListEntry): RuntimeAgentIdentity | null {
  if (typeof entry.id !== 'string' || !entry.id.trim()) {
    return null
  }

  const labelSource =
    typeof entry.identityName === 'string' && entry.identityName.trim()
      ? entry.identityName
      : typeof entry.name === 'string' && entry.name.trim()
        ? entry.name
        : entry.id

  return {
    id: entry.id.trim(),
    label: labelSource.trim(),
    workspace: typeof entry.workspace === 'string' ? entry.workspace : null,
    isDefault: entry.isDefault === true,
  }
}

export function listRuntimeAgentIdentities(): RuntimeAgentIdentity[] {
  try {
    const execution = executeAgentList()

    if (!execution.stdout) {
      return []
    }

    const payload = JSON.parse(execution.stdout) as unknown

    if (!Array.isArray(payload)) {
      return []
    }

    return payload
      .map((entry) => normalizeRuntimeAgentIdentity(entry as RuntimeAgentListEntry))
      .filter((entry): entry is RuntimeAgentIdentity => entry !== null)
      .sort((left, right) => {
        if (left.isDefault && !right.isDefault) {
          return -1
        }
        if (!left.isDefault && right.isDefault) {
          return 1
        }
        return left.label.localeCompare(right.label)
      })
  } catch {
    return []
  }
}
