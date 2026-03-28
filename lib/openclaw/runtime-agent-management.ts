import 'server-only'

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { discoverAgents } from '@/lib/agents-registry'
import { requireEnv } from '@/lib/env'
import { getCrons } from '@/lib/crons'
import type { CronJob } from '@/lib/types'
import type { AgentEntry } from '@/lib/agents-registry'

export type RuntimeAgentMode = 'local' | 'ssh'
export type RuntimeContextScanStatus = 'scanned' | 'fallback' | 'unavailable'
export type RuntimeAgentSource = 'root' | 'discovered' | 'fallback'
export type RuntimeDefinitionFileScope = 'agent' | 'context'
export type RuntimeDefinitionFileSource = 'filesystem' | 'gateway'

export interface RuntimeAgentIdentity {
  name?: string
  theme?: string
  emoji?: string
  avatar?: string
  avatarUrl?: string
}

interface RuntimeCliAgentListEntry {
  id?: unknown
  name?: unknown
  identityName?: unknown
  identityEmoji?: unknown
  identityTheme?: unknown
  identityAvatar?: unknown
  identityAvatarUrl?: unknown
  workspace?: unknown
  agentDir?: unknown
  model?: unknown
  bindings?: unknown
  isDefault?: unknown
  routes?: unknown
}

interface RuntimeGatewayFileEntry {
  name?: unknown
  path?: unknown
  missing?: unknown
  size?: unknown
  updatedAtMs?: unknown
  content?: unknown
}

export interface RuntimeBindingRecord {
  agentId: string
  description: string
  match: Record<string, unknown> | null
}

export interface RuntimeDefinitionFile {
  id: string
  name: string
  label: string
  path: string | null
  relativePath: string | null
  missing: boolean
  content: string | null
  size: number | null
  updatedAtMs: number | null
  scope: RuntimeDefinitionFileScope
  source: RuntimeDefinitionFileSource
  editable: boolean
}

export interface RuntimeAgentSummary {
  id: string
  name: string
  title: string
  reportsTo: string | null
  directReports: string[]
  description: string
  tools: string[]
  contextId: string
  workspace: string | null
  source: RuntimeAgentSource
  emoji: string
  color: string
  voiceId: string | null
  soulPath: string | null
}

export interface RuntimeContext {
  id: string
  label: string
  workspace: string | null
  agentDir: string | null
  isDefault: boolean
  model: string | null
  bindingsCount: number
  routes: string[]
  identity: RuntimeAgentIdentity | null
  scanStatus: RuntimeContextScanStatus
  agents: RuntimeAgentSummary[]
  rootAgentId: string | null
}

export interface RuntimeAgentsCatalog {
  mode: RuntimeAgentMode | null
  contexts: RuntimeContext[]
  defaultContextId: string | null
}

export interface RuntimeAgentDefinition {
  mode: RuntimeAgentMode | null
  context: RuntimeContext
  agent: RuntimeAgentSummary
  model: string | null
  identity: RuntimeAgentIdentity | null
  bindings: RuntimeBindingRecord[]
  files: RuntimeDefinitionFile[]
  crons: CronJob[]
  scanStatus: RuntimeContextScanStatus
}

export interface RuntimeModelChoice {
  id: string
  name: string
  provider: string
  contextWindow: number | null
  reasoning: boolean
}

interface RuntimeCreateAgentInput {
  name: string
  workspace: string
  model?: string | null
  emoji?: string | null
  avatar?: string | null
  bindings?: string[]
}

interface RuntimeUpdateAgentInput {
  contextId: string
  name?: string | null
  workspace?: string | null
  model?: string | null
  emoji?: string | null
  avatar?: string | null
}

interface RuntimeCloneAgentInput {
  sourceContextId: string
  name: string
  workspace: string
  model?: string | null
  emoji?: string | null
  avatar?: string | null
  copyBindings?: boolean
}

const CONTEXT_FILE_NAMES = [
  'AGENTS.md',
  'SOUL.md',
  'TOOLS.md',
  'IDENTITY.md',
  'USER.md',
  'HEARTBEAT.md',
  'MEMORY.md',
] as const

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

function executeRuntimeCommand(args: string[]) {
  const mode = resolveRuntimeAgentMode()

  if (!mode) {
    throw new Error('Runtime agent management is not configured')
  }

  if (mode === 'local') {
    return {
      mode,
      stdout: execFileSync(requireEnv('OPENCLAW_BIN'), args, {
        encoding: 'utf8',
        timeout: 15_000,
      }),
    } as const
  }

  const host = process.env.MEESEEKS_BOX_OPENCLAW_SSH_HOST?.trim()
  const user = process.env.MEESEEKS_BOX_OPENCLAW_SSH_USER?.trim()
  const keyPath = process.env.MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH?.trim()
  const remoteBin = process.env.MEESEEKS_BOX_OPENCLAW_REMOTE_BIN?.trim() || 'openclaw'

  if (!host || !user || !keyPath) {
    throw new Error(
      'SSH runtime agent management requires MEESEEKS_BOX_OPENCLAW_SSH_HOST, MEESEEKS_BOX_OPENCLAW_SSH_USER, and MEESEEKS_BOX_OPENCLAW_SSH_KEY_PATH',
    )
  }

  return {
    mode,
    stdout: execFileSync('ssh', ['-i', keyPath, `${user}@${host}`, remoteBin, ...args], {
      encoding: 'utf8',
      timeout: 15_000,
    }),
  } as const
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((entry) => asString(entry)).filter((entry): entry is string => entry !== null)
    : []
}

function normalizeCliContext(entry: RuntimeCliAgentListEntry): RuntimeContext | null {
  const id = asString(entry.id)

  if (!id) {
    return null
  }

  const identityName = asString(entry.identityName)
  const identityEmoji = asString(entry.identityEmoji)
  const identityTheme = asString(entry.identityTheme)
  const identityAvatar = asString(entry.identityAvatar)
  const identityAvatarUrl = asString(entry.identityAvatarUrl)
  const label = identityName ?? asString(entry.name) ?? id

  return {
    id,
    label,
    workspace: asString(entry.workspace),
    agentDir: asString(entry.agentDir),
    isDefault: entry.isDefault === true,
    model: asString(entry.model),
    bindingsCount: asNumber(entry.bindings) ?? 0,
    routes: asStringArray(entry.routes),
    identity:
      identityName || identityEmoji || identityTheme || identityAvatar || identityAvatarUrl
        ? {
            ...(identityName ? { name: identityName } : {}),
            ...(identityEmoji ? { emoji: identityEmoji } : {}),
            ...(identityTheme ? { theme: identityTheme } : {}),
            ...(identityAvatar ? { avatar: identityAvatar } : {}),
            ...(identityAvatarUrl ? { avatarUrl: identityAvatarUrl } : {}),
          }
        : null,
    scanStatus: 'fallback',
    agents: [],
    rootAgentId: null,
  }
}

function executeGatewayJson<T>(method: string, params?: Record<string, unknown>): T {
  const args = ['gateway', 'call', method]

  if (params && Object.keys(params).length > 0) {
    args.push('--params', JSON.stringify(params))
  }

  args.push('--json')

  const { stdout } = executeRuntimeCommand(args)
  return parseJson<T>(stdout)
}

function listRuntimeCliContexts(): RuntimeAgentsCatalog {
  const mode = resolveRuntimeAgentMode()

  if (!mode) {
    return {
      mode: null,
      contexts: [],
      defaultContextId: null,
    }
  }

  try {
    const { stdout } = executeRuntimeCommand(['agents', 'list', '--json', '--bindings'])
    const parsed = parseJson<unknown>(stdout)
    const rows = Array.isArray(parsed) ? parsed : []
    const contexts = rows
      .map((entry) => normalizeCliContext(entry as RuntimeCliAgentListEntry))
      .filter((entry): entry is RuntimeContext => entry !== null)
      .sort((left, right) => {
        if (left.isDefault && !right.isDefault) {
          return -1
        }
        if (!left.isDefault && right.isDefault) {
          return 1
        }
        return left.label.localeCompare(right.label)
      })

    return {
      mode,
      defaultContextId:
        contexts.find((context) => context.isDefault)?.id ?? contexts[0]?.id ?? null,
      contexts,
    }
  } catch {
    return {
      mode,
      contexts: [],
      defaultContextId: null,
    }
  }
}

function makeFallbackAgent(context: RuntimeContext): RuntimeAgentSummary {
  return {
    id: context.id,
    name: context.identity?.name ?? context.label,
    title: context.model ? 'Runtime agent' : 'Agent',
    reportsTo: null,
    directReports: [],
    description:
      context.workspace && context.model
        ? `${context.workspace} • ${context.model}`
        : context.workspace
          ? `Runtime workspace: ${context.workspace}`
          : 'Runtime agent context',
    tools: ['read', 'write'],
    contextId: context.id,
    workspace: context.workspace,
    source: 'fallback',
    emoji: context.identity?.emoji ?? 'A',
    color: '#3b82f6',
    voiceId: null,
    soulPath: null,
  }
}

function mapDiscoveredAgent(
  contextId: string,
  workspace: string | null,
  agent: AgentEntry,
): RuntimeAgentSummary {
  return {
    id: agent.id,
    name: agent.name,
    title: agent.title,
    reportsTo: agent.reportsTo,
    directReports: agent.directReports,
    description: agent.description,
    tools: agent.tools,
    contextId,
    workspace,
    source: agent.reportsTo === null ? 'root' : 'discovered',
    emoji: agent.emoji,
    color: agent.color,
    voiceId: agent.voiceId,
    soulPath: agent.soulPath,
  }
}

function hydrateContextWithWorkspace(context: RuntimeContext): RuntimeContext {
  if (!context.workspace) {
    const fallbackAgent = makeFallbackAgent(context)
    return {
      ...context,
      agents: [fallbackAgent],
      rootAgentId: fallbackAgent.id,
      scanStatus: 'fallback',
    }
  }

  if (resolveRuntimeAgentMode() !== 'local') {
    const fallbackAgent = makeFallbackAgent(context)
    return {
      ...context,
      agents: [fallbackAgent],
      rootAgentId: fallbackAgent.id,
      scanStatus: 'fallback',
    }
  }

  const discovered = discoverAgents(context.workspace)

  if (!discovered || discovered.length === 0) {
    const fallbackAgent = makeFallbackAgent(context)
    return {
      ...context,
      agents: [fallbackAgent],
      rootAgentId: fallbackAgent.id,
      scanStatus: 'fallback',
    }
  }

  const agents = discovered.map((agent) => mapDiscoveredAgent(context.id, context.workspace, agent))
  const rootAgent = agents.find((agent) => agent.reportsTo === null) ?? agents[0] ?? null

  return {
    ...context,
    agents,
    rootAgentId: rootAgent?.id ?? null,
    scanStatus: 'scanned',
  }
}

function resolveContextOrThrow(contextId: string, catalog: RuntimeAgentsCatalog) {
  const context = catalog.contexts.find((entry) => entry.id === contextId)

  if (!context) {
    throw new Error(`Unknown runtime context: ${contextId}`)
  }

  return context
}

function resolveAgentOrThrow(context: RuntimeContext, agentId?: string | null) {
  if (agentId) {
    const match = context.agents.find((agent) => agent.id === agentId)
    if (match) {
      return match
    }
  }

  const fallback =
    (context.rootAgentId ? context.agents.find((agent) => agent.id === context.rootAgentId) : null) ??
    context.agents[0] ??
    null

  if (!fallback) {
    throw new Error(`No agents discovered for runtime context: ${context.id}`)
  }

  return fallback
}

function normalizeBindingRecord(value: unknown): RuntimeBindingRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const agentId = asString(record.agentId)
  const description = asString(record.description)

  if (!agentId || !description) {
    return null
  }

  const match =
    record.match && typeof record.match === 'object'
      ? (record.match as Record<string, unknown>)
      : null

  return {
    agentId,
    description,
    match,
  }
}

function resolveLocalWorkspacePath(workspacePath: string, relativePath: string) {
  const root = path.resolve(workspacePath)
  const candidate = path.resolve(root, relativePath)

  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Path escapes workspace root: ${relativePath}`)
  }

  return candidate
}

function readLocalTextFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {
      missing: true,
      content: null,
      size: null,
      updatedAtMs: null,
    }
  }

  const content = readFileSync(filePath, 'utf8')
  const stats = statSync(filePath)

  return {
    missing: false,
    content,
    size: stats.size,
    updatedAtMs: Math.floor(stats.mtimeMs),
  }
}

function writeLocalTextFile(filePath: string, content: string) {
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, content, 'utf8')
  const stats = statSync(filePath)
  return {
    size: stats.size,
    updatedAtMs: Math.floor(stats.mtimeMs),
  }
}

function resolveAgentSoulFile(context: RuntimeContext, agent: RuntimeAgentSummary): RuntimeDefinitionFile | null {
  if (!agent.soulPath || !context.workspace) {
    return null
  }

  if (resolveRuntimeAgentMode() !== 'local') {
    return {
      id: 'agent-soul',
      name: 'SOUL.md',
      label: `${agent.name} instructions`,
      path: agent.soulPath,
      relativePath: agent.soulPath,
      missing: true,
      content: null,
      size: null,
      updatedAtMs: null,
      scope: 'agent',
      source: 'filesystem',
      editable: false,
    }
  }

  const filePath = resolveLocalWorkspacePath(context.workspace, agent.soulPath)
  const snapshot = readLocalTextFile(filePath)

  return {
    id: 'agent-soul',
    name: 'SOUL.md',
    label: `${agent.name} instructions`,
    path: filePath,
    relativePath: agent.soulPath,
    missing: snapshot.missing,
    content: snapshot.content,
    size: snapshot.size,
    updatedAtMs: snapshot.updatedAtMs,
    scope: 'agent',
    source: 'filesystem',
    editable: true,
  }
}

function normalizeGatewayFile(value: RuntimeGatewayFileEntry, name: string): RuntimeDefinitionFile {
  return {
    id: name,
    name,
    label: name,
    path: asString(value.path),
    relativePath: asString(value.path),
    missing: value.missing === true,
    content: typeof value.content === 'string' ? value.content : null,
    size: asNumber(value.size),
    updatedAtMs: asNumber(value.updatedAtMs),
    scope: 'context',
    source: 'gateway',
    editable: true,
  }
}

async function loadContextFiles(contextId: string) {
  const listResult = executeGatewayJson<{
    files?: RuntimeGatewayFileEntry[]
  }>('agents.files.list', { agentId: contextId })
  const listed = Array.isArray(listResult.files) ? listResult.files : []
  const byName = new Map<string, RuntimeGatewayFileEntry>()

  for (const entry of listed) {
    const name = asString(entry.name)
    if (name) {
      byName.set(name, entry)
    }
  }

  const files: RuntimeDefinitionFile[] = []

  for (const name of CONTEXT_FILE_NAMES) {
    const listEntry = byName.get(name)

    if (listEntry?.missing === true) {
      files.push(normalizeGatewayFile(listEntry, name))
      continue
    }

    try {
      const result = executeGatewayJson<{
        file?: RuntimeGatewayFileEntry
      }>('agents.files.get', { agentId: contextId, name })
      files.push(normalizeGatewayFile(result.file ?? { name, missing: true }, name))
    } catch {
      files.push(
        normalizeGatewayFile(
          {
            name,
            path: listEntry?.path,
            missing: true,
          },
          name,
        ),
      )
    }
  }

  return files
}

function extractSimpleBindingSpec(binding: RuntimeBindingRecord) {
  const channel = asString(binding.match?.channel)
  if (!channel) {
    return null
  }

  const accountId = asString(binding.match?.accountId)
  return accountId ? `${channel}:${accountId}` : channel
}

export async function listRuntimeAgentCatalog(): Promise<RuntimeAgentsCatalog> {
  const catalog = listRuntimeCliContexts()
  return {
    ...catalog,
    contexts: catalog.contexts.map((context) => hydrateContextWithWorkspace(context)),
  }
}

export async function getRuntimeAgentDefinition(
  contextId: string,
  agentId?: string | null,
): Promise<RuntimeAgentDefinition> {
  const catalog = await listRuntimeAgentCatalog()
  const context = resolveContextOrThrow(contextId, catalog)
  const agent = resolveAgentOrThrow(context, agentId)
  const bindings = await listRuntimeBindings(context.id)
  const contextFiles = await loadContextFiles(context.id)
  const agentSoulFile = resolveAgentSoulFile(context, agent)
  const allCrons = await getCrons().catch(() => [])
  const relevantAgentIds = new Set<string>([agent.id, ...(agent.directReports ?? [])])
  const crons = allCrons.filter((cron) => cron.agentId && relevantAgentIds.has(cron.agentId))

  return {
    mode: catalog.mode,
    context,
    agent,
    model: context.model,
    identity: context.identity,
    bindings,
    files: agentSoulFile ? [agentSoulFile, ...contextFiles] : contextFiles,
    crons,
    scanStatus: context.scanStatus,
  }
}

export async function listRuntimeBindings(contextId: string): Promise<RuntimeBindingRecord[]> {
  try {
    const { stdout } = executeRuntimeCommand(['agents', 'bindings', '--agent', contextId, '--json'])
    const parsed = parseJson<unknown>(stdout)
    return Array.isArray(parsed)
      ? parsed
          .map((entry) => normalizeBindingRecord(entry))
          .filter((entry): entry is RuntimeBindingRecord => entry !== null)
      : []
  } catch {
    return []
  }
}

export async function listRuntimeModels(): Promise<RuntimeModelChoice[]> {
  try {
    const result = executeGatewayJson<{ models?: Array<Record<string, unknown>> }>('models.list')
    const models = Array.isArray(result.models) ? result.models : []

    return models
      .map((model) => {
        const id = asString(model.id)
        const name = asString(model.name)
        const provider = asString(model.provider)

        if (!id || !name || !provider) {
          return null
        }

        return {
          id,
          name,
          provider,
          contextWindow: asNumber(model.contextWindow),
          reasoning: model.reasoning === true,
        } satisfies RuntimeModelChoice
      })
      .filter((entry): entry is RuntimeModelChoice => entry !== null)
  } catch {
    return []
  }
}

async function setRuntimeIdentity(contextId: string, input: { name?: string | null; emoji?: string | null; avatar?: string | null }) {
  const args = ['agents', 'set-identity', '--agent', contextId, '--json']
  let hasValues = false

  if (input.name?.trim()) {
    args.push('--name', input.name.trim())
    hasValues = true
  }
  if (input.emoji?.trim()) {
    args.push('--emoji', input.emoji.trim())
    hasValues = true
  }
  if (input.avatar?.trim()) {
    args.push('--avatar', input.avatar.trim())
    hasValues = true
  }

  if (hasValues) {
    executeRuntimeCommand(args)
  }
}

export async function createRuntimeAgent(input: RuntimeCreateAgentInput) {
  const created = executeGatewayJson<{
    agentId: string
    name: string
    workspace: string
  }>('agents.create', {
    name: input.name,
    workspace: input.workspace,
    ...(input.emoji?.trim() ? { emoji: input.emoji.trim() } : {}),
    ...(input.avatar?.trim() ? { avatar: input.avatar.trim() } : {}),
  })

  if (input.model?.trim()) {
    executeGatewayJson('agents.update', {
      agentId: created.agentId,
      model: input.model.trim(),
    })
  }

  if (input.bindings?.length) {
    for (const binding of input.bindings.map((entry) => entry.trim()).filter(Boolean)) {
      executeRuntimeCommand(['agents', 'bind', '--agent', created.agentId, '--bind', binding, '--json'])
    }
  }

  return created
}

export async function updateRuntimeAgent(input: RuntimeUpdateAgentInput) {
  const trimmedName = input.name?.trim()
  const trimmedWorkspace = input.workspace?.trim()
  const trimmedModel = input.model?.trim()
  const trimmedAvatar = input.avatar?.trim()

  if (trimmedName || trimmedWorkspace || trimmedModel || trimmedAvatar) {
    executeGatewayJson('agents.update', {
      agentId: input.contextId,
      ...(trimmedName ? { name: trimmedName } : {}),
      ...(trimmedWorkspace ? { workspace: trimmedWorkspace } : {}),
      ...(trimmedModel ? { model: trimmedModel } : {}),
      ...(trimmedAvatar ? { avatar: trimmedAvatar } : {}),
    })
  }

  if (trimmedName || input.emoji?.trim() || trimmedAvatar) {
    await setRuntimeIdentity(input.contextId, {
      name: trimmedName,
      emoji: input.emoji,
      avatar: trimmedAvatar,
    })
  }

  return { ok: true, contextId: input.contextId }
}

export async function deleteRuntimeAgent(contextId: string, deleteFiles = false) {
  return executeGatewayJson('agents.delete', {
    agentId: contextId,
    deleteFiles,
  })
}

export async function addRuntimeBinding(contextId: string, spec: string) {
  executeRuntimeCommand(['agents', 'bind', '--agent', contextId, '--bind', spec, '--json'])
  return { ok: true }
}

export async function removeRuntimeBinding(contextId: string, spec: string) {
  executeRuntimeCommand(['agents', 'unbind', '--agent', contextId, '--bind', spec, '--json'])
  return { ok: true }
}

export async function getRuntimeFile(
  contextId: string,
  fileId: string,
  agentId?: string | null,
): Promise<RuntimeDefinitionFile> {
  const definition = await getRuntimeAgentDefinition(contextId, agentId)
  const file = definition.files.find((entry) => entry.id === fileId || entry.name === fileId)

  if (!file) {
    throw new Error(`Unknown runtime file: ${fileId}`)
  }

  return file
}

export async function setRuntimeFile(
  contextId: string,
  fileId: string,
  content: string,
  agentId?: string | null,
): Promise<RuntimeDefinitionFile> {
  if (fileId === 'agent-soul') {
    const definition = await getRuntimeAgentDefinition(contextId, agentId)
    const file = definition.files.find((entry) => entry.id === 'agent-soul')

    if (!file || !file.relativePath || !definition.context.workspace) {
      throw new Error('Agent instructions are not editable for this context')
    }

    if (resolveRuntimeAgentMode() !== 'local') {
      throw new Error('Agent instructions are only editable when the workspace is locally accessible')
    }

    const filePath = resolveLocalWorkspacePath(definition.context.workspace, file.relativePath)
    const result = writeLocalTextFile(filePath, content)

    return {
      ...file,
      path: filePath,
      missing: false,
      content,
      size: result.size,
      updatedAtMs: result.updatedAtMs,
    }
  }

  const result = executeGatewayJson<{
    file?: RuntimeGatewayFileEntry
  }>('agents.files.set', {
    agentId: contextId,
    name: fileId,
    content,
  })

  return normalizeGatewayFile(result.file ?? { name: fileId, content }, fileId)
}

export async function cloneRuntimeAgent(input: RuntimeCloneAgentInput) {
  const catalog = await listRuntimeAgentCatalog()
  const sourceContext = resolveContextOrThrow(input.sourceContextId, catalog)
  const sourceBindings = input.copyBindings ? await listRuntimeBindings(input.sourceContextId) : []
  const sourceFiles = await loadContextFiles(input.sourceContextId)
  const created = await createRuntimeAgent({
    name: input.name,
    workspace: input.workspace,
    model: input.model ?? sourceContext.model,
    emoji: input.emoji ?? sourceContext.identity?.emoji ?? null,
    avatar: input.avatar ?? sourceContext.identity?.avatar ?? null,
  })

  for (const file of sourceFiles) {
    if (file.name === 'BOOTSTRAP.md' || file.name === 'IDENTITY.md') {
      continue
    }
    if (file.content === null) {
      continue
    }
    await setRuntimeFile(created.agentId, file.name, file.content)
  }

  if (input.copyBindings) {
    for (const binding of sourceBindings) {
      const spec = extractSimpleBindingSpec(binding)
      if (spec) {
        await addRuntimeBinding(created.agentId, spec)
      }
    }
  }

  return created
}

export async function getRuntimeContextDeletePreview(contextId: string) {
  const catalog = await listRuntimeAgentCatalog()
  const context = resolveContextOrThrow(contextId, catalog)

  return {
    contextId: context.id,
    workspace: context.workspace,
    agentDir: context.agentDir,
  }
}
