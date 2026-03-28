import 'server-only'

import { execFileSync } from 'node:child_process'
import { requireEnv } from '@/lib/env'
import type { CronJob, CronRun } from '@/lib/types'

type RuntimeScheduleSyncMode = 'local' | 'ssh'

export interface RuntimeOneShotScheduleSyncRequest {
  scheduleId: string
  workItemId: string
  title: string
  prompt: string
  agentId: string
  scheduledAt: string
  model?: string | null
}

export interface RuntimeRecurringScheduleSyncRequest {
  scheduleId: string
  workItemId: string
  title: string
  prompt: string
  agentId: string
  cronExpr: string
  timezone: string
  model?: string | null
}

export interface RuntimeOneShotScheduleSyncResult {
  status: 'synced' | 'pending' | 'failed'
  mode: RuntimeScheduleSyncMode | null
  externalJobId: string | null
  nextRunAt: string | null
  syncReason: string | null
  syncError: string | null
  raw: Record<string, unknown> | null
}

export interface RuntimeScheduleMutationResult {
  status: 'resolved' | 'pending' | 'failed'
  mode: RuntimeScheduleSyncMode | null
  syncReason: string | null
  syncError: string | null
  raw: Record<string, unknown> | null
}

interface RuntimeScheduleExecutor {
  cmd: string
  args: string[]
  mode: RuntimeScheduleSyncMode
}

function executeRuntimeCommand(args: string[]) {
  const mode = resolveRuntimeScheduleSyncMode()

  if (!mode) {
    throw new Error('Runtime schedule commands are not configured')
  }

  if (mode === 'local') {
    return {
      mode,
      stdout: execFileSync(requireEnv('OPENCLAW_BIN'), args, {
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
    throw new Error(
      'SSH runtime schedule sync requires MEESEEKS_BOX_OPENCLAW_SSH_HOST, MEESEEKS_BOX_OPENCLAW_SSH_USER, and MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH',
    )
  }

  return {
    mode,
    stdout: execFileSync('ssh', ['-i', keyPath, `${user}@${host}`, remoteBin, ...args], {
      encoding: 'utf8',
      timeout: 15_000,
    }),
  }
}

function isRuntimeScheduleSyncEnabled() {
  return process.env.MEESEEKS_BOX_RUNTIME_SCHEDULE_SYNC_ENABLED === 'true'
}

function resolveRuntimeScheduleSyncMode(): RuntimeScheduleSyncMode | null {
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

function makeScheduleJobName(scheduleId: string) {
  return `meeseeks-box-${scheduleId}`
}

function makeCronAddArgs(input: RuntimeOneShotScheduleSyncRequest) {
  const args = [
    'cron',
    'add',
    '--name',
    makeScheduleJobName(input.scheduleId),
    '--description',
    `Meeseek Box one-shot schedule for work item ${input.workItemId}`,
    '--agent',
    input.agentId,
    '--session',
    'isolated',
    '--message',
    input.prompt,
    '--at',
    input.scheduledAt,
    '--delete-after-run',
    '--no-deliver',
    '--json',
  ]

  if (typeof input.model === 'string' && input.model.trim()) {
    args.push('--model', input.model.trim())
  }

  return args
}

function makeRecurringCronAddArgs(input: RuntimeRecurringScheduleSyncRequest) {
  const args = [
    'cron',
    'add',
    '--name',
    makeScheduleJobName(input.scheduleId),
    '--description',
    `Meeseek Box recurring schedule for work item ${input.workItemId}`,
    '--agent',
    input.agentId,
    '--session',
    'isolated',
    '--message',
    input.prompt,
    '--cron',
    input.cronExpr,
    '--tz',
    input.timezone,
    '--no-deliver',
    '--json',
  ]

  if (typeof input.model === 'string' && input.model.trim()) {
    args.push('--model', input.model.trim())
  }

  return args
}

function resolveRuntimeScheduleExecutor(
  input: RuntimeOneShotScheduleSyncRequest,
): RuntimeScheduleExecutor | null {
  const mode = resolveRuntimeScheduleSyncMode()

  if (!mode) {
    return null
  }

  const cronArgs = makeCronAddArgs(input)

  if (mode === 'local') {
    return {
      mode,
      cmd: requireEnv('OPENCLAW_BIN'),
      args: cronArgs,
    }
  }

  const host = process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST?.trim()
  const user = process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER?.trim()
  const keyPath = process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH?.trim()
  const remoteBin = process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN?.trim() || 'openclaw'

  if (!host || !user || !keyPath) {
    throw new Error(
      'SSH runtime schedule sync requires MEESEEKS_BOX_OPENCLAW_SSH_HOST, MEESEEKS_BOX_OPENCLAW_SSH_USER, and MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH',
    )
  }

  return {
    mode,
    cmd: 'ssh',
    args: ['-i', keyPath, `${user}@${host}`, remoteBin, ...cronArgs],
  }
}

function resolveRuntimeRecurringScheduleExecutor(
  input: RuntimeRecurringScheduleSyncRequest,
): RuntimeScheduleExecutor | null {
  const mode = resolveRuntimeScheduleSyncMode()

  if (!mode) {
    return null
  }

  const cronArgs = makeRecurringCronAddArgs(input)

  if (mode === 'local') {
    return {
      mode,
      cmd: requireEnv('OPENCLAW_BIN'),
      args: cronArgs,
    }
  }

  const host = process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST?.trim()
  const user = process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER?.trim()
  const keyPath = process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH?.trim()
  const remoteBin = process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN?.trim() || 'openclaw'

  if (!host || !user || !keyPath) {
    throw new Error(
      'SSH runtime schedule sync requires MEESEEKS_BOX_OPENCLAW_SSH_HOST, MEESEEKS_BOX_OPENCLAW_SSH_USER, and MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH',
    )
  }

  return {
    mode,
    cmd: 'ssh',
    args: ['-i', keyPath, `${user}@${host}`, remoteBin, ...cronArgs],
  }
}

function parseNextRunAt(payload: Record<string, unknown>) {
  const state =
    payload.state && typeof payload.state === 'object'
      ? (payload.state as Record<string, unknown>)
      : null

  const nextRunAtMs =
    typeof state?.nextRunAtMs === 'number'
      ? state.nextRunAtMs
      : typeof payload.nextRunAtMs === 'number'
        ? payload.nextRunAtMs
        : null

  if (nextRunAtMs) {
    return new Date(nextRunAtMs).toISOString()
  }

  const schedule =
    payload.schedule && typeof payload.schedule === 'object'
      ? (payload.schedule as Record<string, unknown>)
      : null

  return typeof schedule?.at === 'string' ? schedule.at : null
}

function resolveMutationExecutor(args: string[]): RuntimeScheduleExecutor | null {
  const mode = resolveRuntimeScheduleSyncMode()

  if (!mode) {
    return null
  }

  if (mode === 'local') {
    return {
      mode,
      cmd: requireEnv('OPENCLAW_BIN'),
      args,
    }
  }

  const host = process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST?.trim()
  const user = process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER?.trim()
  const keyPath = process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH?.trim()
  const remoteBin = process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN?.trim() || 'openclaw'

  if (!host || !user || !keyPath) {
    throw new Error(
      'SSH runtime schedule sync requires MEESEEKS_BOX_OPENCLAW_SSH_HOST, MEESEEKS_BOX_OPENCLAW_SSH_USER, and MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH',
    )
  }

  return {
    mode,
    cmd: 'ssh',
    args: ['-i', keyPath, `${user}@${host}`, remoteBin, ...args],
  }
}

function runMutationCommand(args: string[]): RuntimeScheduleMutationResult {
  if (!isRuntimeScheduleSyncEnabled()) {
    return {
      status: 'pending',
      mode: null,
      syncReason: 'runtime-sync-disabled',
      syncError: null,
      raw: null,
    }
  }

  const executor = resolveMutationExecutor(args)

  if (!executor) {
    return {
      status: 'pending',
      mode: null,
      syncReason: 'runtime-sync-unconfigured',
      syncError: null,
      raw: null,
    }
  }

  try {
    const stdout = execFileSync(executor.cmd, executor.args, {
      encoding: 'utf8',
      timeout: 15_000,
    })
    const trimmed = stdout.trim()
    const payload = trimmed ? (JSON.parse(trimmed) as Record<string, unknown>) : {}

    return {
      status: 'resolved',
      mode: executor.mode,
      syncReason: null,
      syncError: null,
      raw: payload,
    }
  } catch (error) {
    return {
      status: 'failed',
      mode: executor?.mode ?? null,
      syncReason: 'runtime-sync-error',
      syncError: error instanceof Error ? error.message : String(error),
      raw: null,
    }
  }
}

export function createRuntimeOneShotSchedule(
  input: RuntimeOneShotScheduleSyncRequest,
): RuntimeOneShotScheduleSyncResult {
  if (!isRuntimeScheduleSyncEnabled()) {
    return {
      status: 'pending',
      mode: null,
      externalJobId: null,
      nextRunAt: null,
      syncReason: 'runtime-sync-disabled',
      syncError: null,
      raw: null,
    }
  }

  const executor = resolveRuntimeScheduleExecutor(input)

  if (!executor) {
    return {
      status: 'pending',
      mode: null,
      externalJobId: null,
      nextRunAt: null,
      syncReason: 'runtime-sync-unconfigured',
      syncError: null,
      raw: null,
    }
  }

  try {
    const stdout = execFileSync(executor.cmd, executor.args, {
      encoding: 'utf8',
      timeout: 15_000,
    })
    const payload = JSON.parse(stdout) as Record<string, unknown>
    const externalJobId = typeof payload.id === 'string' ? payload.id : null

    if (!externalJobId) {
      throw new Error('Runtime schedule sync completed without a cron job id')
    }

    return {
      status: 'synced',
      mode: executor.mode,
      externalJobId,
      nextRunAt: parseNextRunAt(payload),
      syncReason: null,
      syncError: null,
      raw: payload,
    }
  } catch (error) {
    return {
      status: 'failed',
      mode: executor.mode,
      externalJobId: null,
      nextRunAt: null,
      syncReason: 'runtime-sync-error',
      syncError: error instanceof Error ? error.message : String(error),
      raw: null,
    }
  }
}

export function createRuntimeRecurringSchedule(
  input: RuntimeRecurringScheduleSyncRequest,
): RuntimeOneShotScheduleSyncResult {
  if (!isRuntimeScheduleSyncEnabled()) {
    return {
      status: 'pending',
      mode: null,
      externalJobId: null,
      nextRunAt: null,
      syncReason: 'runtime-sync-disabled',
      syncError: null,
      raw: null,
    }
  }

  const executor = resolveRuntimeRecurringScheduleExecutor(input)

  if (!executor) {
    return {
      status: 'pending',
      mode: null,
      externalJobId: null,
      nextRunAt: null,
      syncReason: 'runtime-sync-unconfigured',
      syncError: null,
      raw: null,
    }
  }

  try {
    const stdout = execFileSync(executor.cmd, executor.args, {
      encoding: 'utf8',
      timeout: 15_000,
    })
    const payload = JSON.parse(stdout) as Record<string, unknown>
    const externalJobId = typeof payload.id === 'string' ? payload.id : null

    if (!externalJobId) {
      throw new Error('Runtime schedule sync completed without a cron job id')
    }

    return {
      status: 'synced',
      mode: executor.mode,
      externalJobId,
      nextRunAt: parseNextRunAt(payload),
      syncReason: null,
      syncError: null,
      raw: payload,
    }
  } catch (error) {
    return {
      status: 'failed',
      mode: executor.mode,
      externalJobId: null,
      nextRunAt: null,
      syncReason: 'runtime-sync-error',
      syncError: error instanceof Error ? error.message : String(error),
      raw: null,
    }
  }
}

export function pauseRuntimeSchedule(externalJobId: string): RuntimeScheduleMutationResult {
  return runMutationCommand(['cron', 'disable', externalJobId, '--json'])
}

export function resumeRuntimeSchedule(externalJobId: string): RuntimeScheduleMutationResult {
  return runMutationCommand(['cron', 'enable', externalJobId, '--json'])
}

export function deleteRuntimeSchedule(externalJobId: string): RuntimeScheduleMutationResult {
  return runMutationCommand(['cron', 'rm', externalJobId, '--json'])
}

export function updateRuntimeRecurringSchedule(input: {
  externalJobId: string
  cronExpr: string
  timezone: string
  prompt?: string | null
  agentId?: string | null
  model?: string | null
}): RuntimeOneShotScheduleSyncResult {
  if (!isRuntimeScheduleSyncEnabled()) {
    return {
      status: 'pending',
      mode: null,
      externalJobId: input.externalJobId,
      nextRunAt: null,
      syncReason: 'runtime-sync-disabled',
      syncError: null,
      raw: null,
    }
  }

  const args = ['cron', 'edit', input.externalJobId, '--cron', input.cronExpr, '--tz', input.timezone, '--json']

  if (typeof input.prompt === 'string' && input.prompt.trim()) {
    args.push('--message', input.prompt.trim())
  }

  if (typeof input.agentId === 'string' && input.agentId.trim()) {
    args.push('--agent', input.agentId.trim())
  }

  if (typeof input.model === 'string' && input.model.trim()) {
    args.push('--model', input.model.trim())
  }

  const executor = resolveMutationExecutor(args)

  if (!executor) {
    return {
      status: 'pending',
      mode: null,
      externalJobId: input.externalJobId,
      nextRunAt: null,
      syncReason: 'runtime-sync-unconfigured',
      syncError: null,
      raw: null,
    }
  }

  try {
    const stdout = execFileSync(executor.cmd, executor.args, {
      encoding: 'utf8',
      timeout: 15_000,
    })
    const payload = JSON.parse(stdout) as Record<string, unknown>

    return {
      status: 'synced',
      mode: executor.mode,
      externalJobId: input.externalJobId,
      nextRunAt: parseNextRunAt(payload),
      syncReason: null,
      syncError: null,
      raw: payload,
    }
  } catch (error) {
    return {
      status: 'failed',
      mode: executor.mode,
      externalJobId: input.externalJobId,
      nextRunAt: null,
      syncReason: 'runtime-sync-error',
      syncError: error instanceof Error ? error.message : String(error),
      raw: null,
    }
  }
}

function normalizeCronJobs(value: unknown): CronJob[] {
  const jobs = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? ((value as { jobs?: unknown[]; data?: unknown[] }).jobs ??
        (value as { jobs?: unknown[]; data?: unknown[] }).data ??
        [])
      : []

  return jobs
    .filter((job): job is Record<string, unknown> => Boolean(job) && typeof job === 'object')
    .map((job) => {
      const state =
        job.state && typeof job.state === 'object' ? (job.state as Record<string, unknown>) : {}
      const nextRunAtMs =
        typeof state.nextRunAtMs === 'number'
          ? state.nextRunAtMs
          : typeof job.nextRunAtMs === 'number'
            ? job.nextRunAtMs
            : null
      const lastRunAtMs =
        typeof state.lastRunAtMs === 'number'
          ? state.lastRunAtMs
          : typeof job.lastRunAtMs === 'number'
            ? job.lastRunAtMs
            : null
      const rawStatus = state.status ?? job.status ?? ''

      return {
        id: String(job.id ?? ''),
        name: String(job.name ?? ''),
        schedule: '',
        scheduleDescription: '',
        timezone: null,
        status:
          rawStatus === 'error' || rawStatus === 'failed'
            ? 'error'
            : rawStatus === 'ok' || rawStatus === 'success' || rawStatus === 'completed'
              ? 'ok'
              : 'idle',
        lastRun: lastRunAtMs ? new Date(lastRunAtMs).toISOString() : null,
        nextRun: nextRunAtMs ? new Date(nextRunAtMs).toISOString() : null,
        lastError: typeof state.lastError === 'string' ? state.lastError : null,
        agentId: typeof job.agentId === 'string' ? job.agentId : null,
        description: typeof job.description === 'string' ? job.description : null,
        enabled: job.enabled !== false,
        delivery: null,
        lastDurationMs: typeof state.lastDurationMs === 'number' ? state.lastDurationMs : null,
        consecutiveErrors:
          typeof state.consecutiveErrors === 'number' ? state.consecutiveErrors : 0,
        lastDeliveryStatus:
          typeof state.lastDeliveryStatus === 'string' ? state.lastDeliveryStatus : null,
      } satisfies CronJob
    })
}

function normalizeCronRuns(value: unknown): CronRun[] {
  const runs = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? ((value as { runs?: unknown[]; data?: unknown[] }).runs ??
        (value as { runs?: unknown[]; data?: unknown[] }).data ??
        [])
      : []

  return runs
    .filter((run): run is Record<string, unknown> => Boolean(run) && typeof run === 'object')
    .map((run) => ({
      ts: typeof run.runAtMs === 'number' ? run.runAtMs : typeof run.ts === 'number' ? run.ts : 0,
      jobId: String(run.jobId ?? ''),
      status: run.status === 'ok' ? 'ok' : 'error',
      summary: typeof run.summary === 'string' ? run.summary : null,
      error: typeof run.error === 'string' ? run.error : null,
      durationMs: typeof run.durationMs === 'number' ? run.durationMs : 0,
      deliveryStatus: typeof run.deliveryStatus === 'string' ? run.deliveryStatus : null,
      model: typeof run.model === 'string' ? run.model : null,
      provider: typeof run.provider === 'string' ? run.provider : null,
      usage:
        run.usage && typeof run.usage === 'object'
          ? ({
              input_tokens:
                typeof (run.usage as Record<string, unknown>).input_tokens === 'number'
                  ? ((run.usage as Record<string, unknown>).input_tokens as number)
                  : 0,
              output_tokens:
                typeof (run.usage as Record<string, unknown>).output_tokens === 'number'
                  ? ((run.usage as Record<string, unknown>).output_tokens as number)
                  : 0,
              total_tokens:
                typeof (run.usage as Record<string, unknown>).total_tokens === 'number'
                  ? ((run.usage as Record<string, unknown>).total_tokens as number)
                  : 0,
            } satisfies NonNullable<CronRun['usage']>)
          : null,
    }))
}

export function listRuntimeCronJobs() {
  const { stdout } = executeRuntimeCommand(['cron', 'list', '--json'])
  return normalizeCronJobs(JSON.parse(stdout) as unknown)
}

export function listRuntimeCronRuns(jobId: string, limit = 5) {
  const { stdout } = executeRuntimeCommand([
    'cron',
    'runs',
    '--id',
    jobId,
    '--limit',
    String(limit),
    '--json',
  ])
  return normalizeCronRuns(JSON.parse(stdout) as unknown)
}
