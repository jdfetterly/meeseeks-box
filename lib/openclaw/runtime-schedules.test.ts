// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createRuntimeOneShotSchedule,
  createRuntimeRecurringSchedule,
  deleteRuntimeSchedule,
  pauseRuntimeSchedule,
  resumeRuntimeSchedule,
  updateRuntimeRecurringSchedule,
} from '@/lib/openclaw/runtime-schedules'

const execFileSyncMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
  execFileSync: execFileSyncMock,
}))

afterEach(() => {
  delete process.env.MEESEEKS_BOX_RUNTIME_SCHEDULE_SYNC_ENABLED
  delete process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE
  delete process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST
  delete process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER
  delete process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH
  delete process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN
  delete process.env.OPENCLAW_BIN
  execFileSyncMock.mockReset()
})

describe('runtime one-shot schedule sync', () => {
  const request = {
    scheduleId: 'sched-123',
    workItemId: 'work-123',
    title: 'Morning review',
    prompt: 'Review overnight failures',
    agentId: 'mini-ops',
    scheduledAt: '2026-03-21T16:00:00.000Z',
    model: 'openai/gpt-5.4',
  } as const

  it('returns pending when runtime sync is disabled', () => {
    const result = createRuntimeOneShotSchedule(request)

    expect(result).toMatchObject({
      status: 'pending',
      syncReason: 'runtime-sync-disabled',
    })
    expect(execFileSyncMock).not.toHaveBeenCalled()
  })

  it('executes local openclaw cron add with --cron and --tz for recurring schedules', () => {
    process.env.MEESEEKS_BOX_RUNTIME_SCHEDULE_SYNC_ENABLED = 'true'
    process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE = 'local'
    process.env.OPENCLAW_BIN = '/usr/local/bin/openclaw'
    execFileSyncMock.mockReturnValue(
      JSON.stringify({
        id: 'job-cron-123',
        schedule: { kind: 'cron' },
        state: { nextRunAtMs: Date.parse('2026-03-22T14:30:00.000Z') },
      }),
    )

    const result = createRuntimeRecurringSchedule({
      scheduleId: 'sched-cron-123',
      workItemId: 'work-123',
      title: 'Morning Ops Brief',
      prompt: 'Create the morning brief',
      agentId: 'mini-ops',
      cronExpr: '30 7 * * *',
      timezone: 'America/Los_Angeles',
    })

    expect(execFileSyncMock).toHaveBeenCalledWith(
      '/usr/local/bin/openclaw',
      expect.arrayContaining([
        'cron',
        'add',
        '--name',
        'meeseeks-box-sched-cron-123',
        '--agent',
        'mini-ops',
        '--message',
        'Create the morning brief',
        '--cron',
        '30 7 * * *',
        '--tz',
        'America/Los_Angeles',
        '--no-deliver',
        '--json',
      ]),
      expect.objectContaining({ encoding: 'utf8', timeout: 15_000 }),
    )
    expect(result).toMatchObject({
      status: 'synced',
      externalJobId: 'job-cron-123',
      nextRunAt: '2026-03-22T14:30:00.000Z',
    })
  })

  it('executes local openclaw cron add when local mode is configured', () => {
    process.env.MEESEEKS_BOX_RUNTIME_SCHEDULE_SYNC_ENABLED = 'true'
    process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE = 'local'
    process.env.OPENCLAW_BIN = '/usr/local/bin/openclaw'
    execFileSyncMock.mockReturnValue(
      JSON.stringify({
        id: 'job-123',
        schedule: { kind: 'at', at: request.scheduledAt },
        state: { nextRunAtMs: Date.parse(request.scheduledAt) },
      }),
    )

    const result = createRuntimeOneShotSchedule(request)

    expect(execFileSyncMock).toHaveBeenCalledWith(
      '/usr/local/bin/openclaw',
      expect.arrayContaining([
        'cron',
        'add',
        '--name',
        'meeseeks-box-sched-123',
        '--agent',
        'mini-ops',
        '--session',
        'isolated',
        '--message',
        'Review overnight failures',
        '--at',
        request.scheduledAt,
        '--delete-after-run',
        '--no-deliver',
        '--json',
        '--model',
        'openai/gpt-5.4',
      ]),
      expect.objectContaining({ encoding: 'utf8', timeout: 15_000 }),
    )
    expect(result).toMatchObject({
      status: 'synced',
      mode: 'local',
      externalJobId: 'job-123',
      nextRunAt: request.scheduledAt,
    })
  })

  it('executes ssh openclaw cron add when ssh mode is configured', () => {
    process.env.MEESEEKS_BOX_RUNTIME_SCHEDULE_SYNC_ENABLED = 'true'
    process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE = 'ssh'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST = '100.105.238.17'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER = 'agent-playground'
    process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH = '/Users/jdfetterly/.ssh/id_ed25519'
    process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN = '/opt/homebrew/bin/openclaw'
    execFileSyncMock.mockReturnValue(JSON.stringify({ id: 'job-ssh', schedule: { at: request.scheduledAt } }))

    const result = createRuntimeOneShotSchedule(request)

    expect(execFileSyncMock).toHaveBeenCalledWith(
      'ssh',
      expect.arrayContaining([
        '-i',
        '/Users/jdfetterly/.ssh/id_ed25519',
        'agent-playground@100.105.238.17',
        '/opt/homebrew/bin/openclaw',
        'cron',
        'add',
      ]),
      expect.objectContaining({ encoding: 'utf8', timeout: 15_000 }),
    )
    expect(result).toMatchObject({
      status: 'synced',
      mode: 'ssh',
      externalJobId: 'job-ssh',
    })
  })

  it('returns a failed status when the runtime command errors', () => {
    process.env.MEESEEKS_BOX_RUNTIME_SCHEDULE_SYNC_ENABLED = 'true'
    process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE = 'local'
    process.env.OPENCLAW_BIN = '/usr/local/bin/openclaw'
    execFileSyncMock.mockImplementation(() => {
      throw new Error('command failed')
    })

    const result = createRuntimeOneShotSchedule(request)

    expect(result).toMatchObject({
      status: 'failed',
      mode: 'local',
      syncReason: 'runtime-sync-error',
      syncError: 'command failed',
    })
  })

  it('executes local lifecycle commands for recurring schedules', () => {
    process.env.MEESEEKS_BOX_RUNTIME_SCHEDULE_SYNC_ENABLED = 'true'
    process.env.MEESEEKS_BOX_OPENCLAW_SYNC_MODE = 'local'
    process.env.OPENCLAW_BIN = '/usr/local/bin/openclaw'
    execFileSyncMock
      .mockReturnValueOnce('{}')
      .mockReturnValueOnce('{}')
      .mockReturnValueOnce(JSON.stringify({ state: { nextRunAtMs: Date.parse('2026-03-23T14:30:00.000Z') } }))
      .mockReturnValueOnce('{}')

    const paused = pauseRuntimeSchedule('job-123')
    const resumed = resumeRuntimeSchedule('job-123')
    const edited = updateRuntimeRecurringSchedule({
      externalJobId: 'job-123',
      cronExpr: '30 7 * * *',
      timezone: 'America/Los_Angeles',
      prompt: 'Updated prompt',
      agentId: 'mini-ops',
    })
    const deleted = deleteRuntimeSchedule('job-123')

    expect(execFileSyncMock).toHaveBeenNthCalledWith(
      1,
      '/usr/local/bin/openclaw',
      ['cron', 'disable', 'job-123', '--json'],
      expect.objectContaining({ encoding: 'utf8', timeout: 15_000 }),
    )
    expect(execFileSyncMock).toHaveBeenNthCalledWith(
      2,
      '/usr/local/bin/openclaw',
      ['cron', 'enable', 'job-123', '--json'],
      expect.objectContaining({ encoding: 'utf8', timeout: 15_000 }),
    )
    expect(execFileSyncMock).toHaveBeenNthCalledWith(
      3,
      '/usr/local/bin/openclaw',
      [
        'cron',
        'edit',
        'job-123',
        '--cron',
        '30 7 * * *',
        '--tz',
        'America/Los_Angeles',
        '--json',
        '--message',
        'Updated prompt',
        '--agent',
        'mini-ops',
      ],
      expect.objectContaining({ encoding: 'utf8', timeout: 15_000 }),
    )
    expect(execFileSyncMock).toHaveBeenNthCalledWith(
      4,
      '/usr/local/bin/openclaw',
      ['cron', 'rm', 'job-123', '--json'],
      expect.objectContaining({ encoding: 'utf8', timeout: 15_000 }),
    )

    expect(paused.status).toBe('resolved')
    expect(resumed.status).toBe('resolved')
    expect(edited).toMatchObject({
      status: 'synced',
      nextRunAt: '2026-03-23T14:30:00.000Z',
    })
    expect(deleted.status).toBe('resolved')
  })
})
