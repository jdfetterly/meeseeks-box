import 'server-only'

import { execFileSync } from 'node:child_process'

type RuntimeApprovalMode = 'local' | 'ssh'

export interface RuntimeApprovalPolicySnapshot {
  status: 'available' | 'unavailable'
  mode: RuntimeApprovalMode | null
  path: string | null
  hash: string | null
  exists: boolean
  socket: {
    path: string | null
    tokenRedacted: boolean
  } | null
  defaults: Record<string, unknown>
  agents: Record<string, unknown>
  reason: string | null
}

export interface RuntimeApprovalResolutionResult {
  status: 'resolved' | 'unavailable' | 'failed'
  mode: RuntimeApprovalMode | null
  approvalId: string
  decision: 'allow-once' | 'deny'
  reason: string | null
  raw: Record<string, unknown> | null
}

function resolveRuntimeApprovalMode(): RuntimeApprovalMode | null {
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

function executeRuntimeApprovalsGetJson() {
  const mode = resolveRuntimeApprovalMode()

  if (!mode) {
    return {
      mode,
      stdout: null,
      reason: 'runtime-approvals-unconfigured',
    } as const
  }

  if (mode === 'local') {
    return {
      mode,
      stdout: execFileSync(process.env.OPENCLAW_BIN!.trim(), ['approvals', 'get', '--json'], {
        encoding: 'utf8',
        timeout: 15_000,
      }),
      reason: null,
    } as const
  }

  const host = process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST?.trim()
  const user = process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER?.trim()
  const keyPath = process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH?.trim()
  const remoteBin = process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN?.trim() || 'openclaw'

  if (!host || !user || !keyPath) {
    return {
      mode,
      stdout: null,
      reason: 'runtime-approvals-ssh-unconfigured',
    } as const
  }

  return {
    mode,
    stdout: execFileSync('ssh', ['-i', keyPath, `${user}@${host}`, remoteBin, 'approvals', 'get', '--json'], {
      encoding: 'utf8',
      timeout: 15_000,
    }),
    reason: null,
  } as const
}

function executeRuntimeApprovalResolveJson(input: {
  approvalId: string
  decision: 'allow-once' | 'deny'
}) {
  const mode = resolveRuntimeApprovalMode()

  if (!mode) {
    return {
      mode,
      stdout: null,
      reason: 'runtime-approvals-unconfigured',
    } as const
  }

  const params = JSON.stringify({
    id: input.approvalId,
    decision: input.decision,
  })

  if (mode === 'local') {
    return {
      mode,
      stdout: execFileSync(process.env.OPENCLAW_BIN!.trim(), [
        'gateway',
        'call',
        'exec.approval.resolve',
        '--params',
        params,
        '--json',
      ], {
        encoding: 'utf8',
        timeout: 15_000,
      }),
      reason: null,
    } as const
  }

  const host = process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST?.trim()
  const user = process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER?.trim()
  const keyPath = process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH?.trim()
  const remoteBin = process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN?.trim() || 'openclaw'

  if (!host || !user || !keyPath) {
    return {
      mode,
      stdout: null,
      reason: 'runtime-approvals-ssh-unconfigured',
    } as const
  }

  return {
    mode,
    stdout: execFileSync('ssh', [
      '-i',
      keyPath,
      `${user}@${host}`,
      remoteBin,
      'gateway',
      'call',
      'exec.approval.resolve',
      '--params',
      params,
      '--json',
    ], {
      encoding: 'utf8',
      timeout: 15_000,
    }),
    reason: null,
  } as const
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

export function sanitizeRuntimeApprovalPolicyPayload(
  payload: unknown,
  mode: RuntimeApprovalMode | null,
): RuntimeApprovalPolicySnapshot {
  const root = asRecord(payload)
  const file = asRecord(root?.file)
  const socket = asRecord(file?.socket)
  const defaults = asRecord(file?.defaults) ?? {}
  const agents = asRecord(file?.agents) ?? {}

  return {
    status: 'available',
    mode,
    path: typeof root?.path === 'string' ? root.path : null,
    hash: typeof root?.hash === 'string' ? root.hash : null,
    exists: root?.exists === true,
    socket:
      socket || file?.socket
        ? {
            path: typeof socket?.path === 'string' ? socket.path : null,
            tokenRedacted: 'token' in (socket ?? {}),
          }
        : null,
    defaults,
    agents,
    reason: null,
  }
}

export function getRuntimeApprovalPolicySnapshot(): RuntimeApprovalPolicySnapshot {
  const execution = executeRuntimeApprovalsGetJson()

  if (!execution.stdout) {
    return {
      status: 'unavailable',
      mode: execution.mode,
      path: null,
      hash: null,
      exists: false,
      socket: null,
      defaults: {},
      agents: {},
      reason: execution.reason,
    }
  }

  try {
    return sanitizeRuntimeApprovalPolicyPayload(JSON.parse(execution.stdout), execution.mode)
  } catch (error) {
    return {
      status: 'unavailable',
      mode: execution.mode,
      path: null,
      hash: null,
      exists: false,
      socket: null,
      defaults: {},
      agents: {},
      reason: error instanceof Error ? error.message : String(error),
    }
  }
}

export function resolveRuntimeApproval(input: {
  approvalId: string
  decision: 'allow-once' | 'deny'
}): RuntimeApprovalResolutionResult {
  const execution = executeRuntimeApprovalResolveJson(input)

  if (!execution.stdout) {
    return {
      status: 'unavailable',
      mode: execution.mode,
      approvalId: input.approvalId,
      decision: input.decision,
      reason: execution.reason,
      raw: null,
    }
  }

  try {
    const payload = JSON.parse(execution.stdout) as Record<string, unknown>
    const ok = payload.ok === true

    return {
      status: ok ? 'resolved' : 'failed',
      mode: execution.mode,
      approvalId: input.approvalId,
      decision: input.decision,
      reason: ok ? null : 'runtime-approval-resolve-not-ok',
      raw: payload,
    }
  } catch (error) {
    return {
      status: 'failed',
      mode: execution.mode,
      approvalId: input.approvalId,
      decision: input.decision,
      reason: error instanceof Error ? error.message : String(error),
      raw: null,
    }
  }
}
