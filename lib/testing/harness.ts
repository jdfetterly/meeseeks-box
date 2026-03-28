import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { listWorkspaceMemorySources, writeWorkspaceMemoryFile } from '@/lib/memory/workspace'
import type {
  ApprovalEnvelope,
  ApprovalBridge,
  ApprovalResolution,
  EventSource,
  OpenClawEventEnvelope,
  OpenClawIntegrationAdapter,
  WorkspaceBridge,
  WorkspaceMemorySourceSnapshot,
  WorkspaceMemoryWriteRequest,
  WorkspaceMemoryWriteResult,
} from '@/lib/openclaw/contracts'
import { closeProductStateDb, getProductStateHealth } from '@/lib/product-state/db'
import type { DomainScope } from '@/lib/product-state/entities'

export class TestClock {
  private current: Date

  constructor(seed = '2026-03-20T12:00:00.000Z') {
    this.current = new Date(seed)
  }

  now() {
    return new Date(this.current)
  }

  nowIso() {
    return this.current.toISOString()
  }

  advanceMs(ms: number) {
    this.current = new Date(this.current.getTime() + ms)
    return this.now()
  }

  set(isoTimestamp: string) {
    this.current = new Date(isoTimestamp)
    return this.now()
  }
}

class FakeEventSource implements EventSource {
  private readonly envelopes: OpenClawEventEnvelope[] = []

  async push(envelope: OpenClawEventEnvelope) {
    this.envelopes.push(envelope)
  }

  async list() {
    return [...this.envelopes]
  }
}

class FakeApprovalBridge implements ApprovalBridge {
  private readonly pending = new Map<string, ApprovalEnvelope>()
  private readonly history: ApprovalResolution[] = []
  private readonly clock: TestClock

  constructor(clock: TestClock) {
    this.clock = clock
  }

  seed(approval: ApprovalEnvelope) {
    this.pending.set(approval.id, approval)
  }

  async listPending() {
    return [...this.pending.values()]
  }

  async resolve(input: {
    approvalId: string
    status: ApprovalResolution['status']
    inputText?: string | null
  }) {
    const existing = this.pending.get(input.approvalId)

    if (!existing) {
      throw new Error(`Unknown approval: ${input.approvalId}`)
    }

    this.pending.delete(input.approvalId)
    const resolution: ApprovalResolution = {
      approvalId: input.approvalId,
      status: input.status,
      resolvedAt: this.clock.nowIso(),
      inputText: input.inputText ?? null,
    }
    this.history.push(resolution)
    return resolution
  }

  listHistory() {
    return [...this.history]
  }
}

class FakeWorkspaceBridge implements WorkspaceBridge {
  private readonly workspaceRoot: string

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot
  }

  async listMemorySources(scope: DomainScope) {
    return listWorkspaceMemorySources(scope, this.workspaceRoot)
  }

  async writeMemoryFile(input: WorkspaceMemoryWriteRequest) {
    return writeWorkspaceMemoryFile(input, this.workspaceRoot) satisfies WorkspaceMemoryWriteResult
  }
}

export class FakeOpenClawAdapter implements OpenClawIntegrationAdapter {
  readonly events = new FakeEventSource()
  readonly approvals: FakeApprovalBridge
  readonly workspace: FakeWorkspaceBridge

  constructor(options: { clock: TestClock; memoryRoot: string }) {
    this.approvals = new FakeApprovalBridge(options.clock)
    this.workspace = new FakeWorkspaceBridge(options.memoryRoot)
  }
}

export interface ProductStateHarness {
  rootDir: string
  stateDir: string
  artifactDir: string
  workspaceDir: string
  memoryRoot: string
  clock: TestClock
  adapter: FakeOpenClawAdapter
  useAsProcessStateDir(): void
  cleanup(): void
}

export function createProductStateHarness(options?: {
  seedTime?: string
  createMemoryScopes?: DomainScope[]
  bootstrapMemory?: boolean
}) {
  const rootDir = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-harness-'))
  const stateDir = path.join(rootDir, 'state')
  const artifactDir = path.join(rootDir, 'artifacts')
  const workspaceDir = path.join(rootDir, 'workspaces', 'mini-ops')
  const memoryRoot = path.join(workspaceDir, 'memory')

  mkdirSync(stateDir, { recursive: true })
  mkdirSync(artifactDir, { recursive: true })
  mkdirSync(workspaceDir, { recursive: true })

  if (options?.bootstrapMemory !== false) {
    mkdirSync(memoryRoot, { recursive: true })
    writeFileSync(
      path.join(workspaceDir, 'MEMORY.md'),
      '# Workspace Memory\n\nHarness bootstrap.\n',
      'utf8',
    )
  }

  const clock = new TestClock(options?.seedTime)
  const adapter = new FakeOpenClawAdapter({ clock, memoryRoot: workspaceDir })

  return {
    rootDir,
    stateDir,
    artifactDir,
    workspaceDir,
    memoryRoot,
    clock,
    adapter,
    useAsProcessStateDir() {
      process.env.MEESEEKS_BOX_STATE_DIR = stateDir
      process.env.WORKSPACE_PATH = workspaceDir
      process.env.MEESEEKS_BOX_MEMORY_BOOTSTRAP_ENABLED = 'true'
    },
    cleanup() {
      closeProductStateDb(rootDir)
      if (process.env.MEESEEKS_BOX_STATE_DIR === stateDir) {
        delete process.env.MEESEEKS_BOX_STATE_DIR
      }
      if (process.env.WORKSPACE_PATH === workspaceDir) {
        delete process.env.WORKSPACE_PATH
      }
      if (process.env.MEESEEKS_BOX_MEMORY_BOOTSTRAP_ENABLED === 'true') {
        delete process.env.MEESEEKS_BOX_MEMORY_BOOTSTRAP_ENABLED
      }
      rmSync(rootDir, { recursive: true, force: true })
    },
  } satisfies ProductStateHarness
}

export function getHarnessHealth(harness: ProductStateHarness) {
  return getProductStateHealth(harness.rootDir)
}
