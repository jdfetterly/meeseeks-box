// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getRuntimeApprovalPolicySnapshot,
  resolveRuntimeApproval,
  sanitizeRuntimeApprovalPolicyPayload,
} from '@/lib/openclaw/runtime-approvals'

const execFileSyncMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
  execFileSync: execFileSyncMock,
}))

afterEach(() => {
  delete process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE
  delete process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST
  delete process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER
  delete process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH
  delete process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN
  delete process.env.OPENCLAW_BIN
  execFileSyncMock.mockReset()
})

describe('runtime approval policy snapshot', () => {
  it('redacts the socket token from approval policy payloads', () => {
    const snapshot = sanitizeRuntimeApprovalPolicyPayload(
      {
        path: '/Users/agent-playground/.openclaw/exec-approvals.json',
        hash: 'abc123',
        exists: true,
        file: {
          version: 1,
          socket: {
            path: '/Users/agent-playground/.openclaw/exec-approvals.sock',
            token: 'secret-token',
          },
          defaults: {},
          agents: {},
        },
      },
      'ssh',
    )

    expect(snapshot).toMatchObject({
      status: 'available',
      mode: 'ssh',
      path: '/Users/agent-playground/.openclaw/exec-approvals.json',
      exists: true,
      socket: {
        path: '/Users/agent-playground/.openclaw/exec-approvals.sock',
        tokenRedacted: true,
      },
    })
    expect(snapshot).not.toHaveProperty('socket.token')
  })

  it('returns unavailable when runtime approval reads are unconfigured', () => {
    const snapshot = getRuntimeApprovalPolicySnapshot()

    expect(snapshot).toMatchObject({
      status: 'unavailable',
      reason: 'runtime-approvals-unconfigured',
    })
    expect(execFileSyncMock).not.toHaveBeenCalled()
  })

  it('executes ssh openclaw approvals get --json and returns a sanitized snapshot', () => {
    process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE = 'ssh'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST = '100.105.238.17'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER = 'agent-playground'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH = '/Users/jdfetterly/.ssh/id_ed25519'
    process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN = '/opt/homebrew/bin/openclaw'
    execFileSyncMock.mockReturnValue(
      JSON.stringify({
        path: '/Users/agent-playground/.openclaw/exec-approvals.json',
        hash: 'policy-hash',
        exists: true,
        file: {
          version: 1,
          socket: {
            path: '/Users/agent-playground/.openclaw/exec-approvals.sock',
            token: '39Jp8_OTX0BYDQ0aOYeoS9vkMchUWAO-',
          },
          defaults: {},
          agents: {},
        },
      }),
    )

    const snapshot = getRuntimeApprovalPolicySnapshot()

    expect(execFileSyncMock).toHaveBeenCalledWith(
      'ssh',
      [
        '-i',
        '/Users/jdfetterly/.ssh/id_ed25519',
        'agent-playground@100.105.238.17',
        '/opt/homebrew/bin/openclaw',
        'approvals',
        'get',
        '--json',
      ],
      expect.objectContaining({ encoding: 'utf8', timeout: 15_000 }),
    )
    expect(snapshot).toMatchObject({
      status: 'available',
      mode: 'ssh',
      hash: 'policy-hash',
      socket: {
        path: '/Users/agent-playground/.openclaw/exec-approvals.sock',
        tokenRedacted: true,
      },
    })
    expect(snapshot).not.toHaveProperty('socket.token')
  })

  it('executes ssh openclaw gateway call exec.approval.resolve for runtime approval resolution', () => {
    process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE = 'ssh'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST = '100.105.238.17'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER = 'agent-playground'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH = '/Users/jdfetterly/.ssh/id_ed25519'
    process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN = '/opt/homebrew/bin/openclaw'
    execFileSyncMock.mockReturnValue(JSON.stringify({ ok: true }))

    const result = resolveRuntimeApproval({
      approvalId: 'approval-123',
      decision: 'allow-once',
    })

    expect(execFileSyncMock).toHaveBeenCalledWith(
      'ssh',
      [
        '-i',
        '/Users/jdfetterly/.ssh/id_ed25519',
        'agent-playground@100.105.238.17',
        '/opt/homebrew/bin/openclaw',
        'gateway',
        'call',
        'exec.approval.resolve',
        '--params',
        JSON.stringify({ id: 'approval-123', decision: 'allow-once' }),
        '--json',
      ],
      expect.objectContaining({ encoding: 'utf8', timeout: 15_000 }),
    )
    expect(result).toMatchObject({
      status: 'resolved',
      decision: 'allow-once',
      approvalId: 'approval-123',
    })
  })
})
