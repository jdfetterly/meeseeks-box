import 'server-only'

import { existsSync } from 'node:fs'
import path from 'node:path'
import { normalizeAgentContextId } from '@/lib/agent-context'
import type { Agent } from '@/lib/types'
import { getAgents } from '@/lib/agents'
import { listRuntimeAgentIdentities } from '@/lib/openclaw/runtime-agents'

export interface AgentCatalogEntry {
  id: string
  name: string
  title: string
  reportsTo: string | null
  directReports: string[]
  description: string
}

export interface AgentContextGroup {
  id: string
  label: string
  workspace: string | null
  isDefault: boolean
  agents: AgentCatalogEntry[]
  rootAgentId: string | null
}

function mapAgentEntry(agent: Agent): AgentCatalogEntry {
  return {
    id: agent.id,
    name: agent.name,
    title: agent.title,
    reportsTo: agent.reportsTo,
    directReports: agent.directReports,
    description: agent.description,
  }
}

function getWorkspaceBasename(workspacePath: string | null | undefined) {
  if (!workspacePath) {
    return null
  }

  return path.basename(workspacePath)
}

export async function getAgentCatalog(): Promise<{
  contexts: AgentContextGroup[]
  defaultContextId: string | null
}> {
  const runtimeContexts = listRuntimeAgentIdentities()
  const workspaceAgents = await getAgents()
  const resolvedWorkspacePath =
    process.env.WORKSPACE_PATH?.trim() || path.join(process.cwd(), 'workspace')
  const hasWorkspace = existsSync(resolvedWorkspacePath)
  const workspaceBasename = hasWorkspace ? getWorkspaceBasename(resolvedWorkspacePath) : null
  const workspaceRoot = workspaceAgents.find((agent) => agent.reportsTo === null) ?? null
  const workspaceContextId =
    runtimeContexts.find(
      (context) =>
        workspaceBasename !== null && getWorkspaceBasename(context.workspace) === workspaceBasename,
    )?.id ??
    (hasWorkspace && runtimeContexts.some((context) => context.id === 'mini-ops') ? 'mini-ops' : null)

  const contexts = runtimeContexts.map((context) => {
    const isWorkspaceContext = workspaceContextId === context.id

    if (!isWorkspaceContext) {
      return {
        id: context.id,
        label: context.label,
        workspace: context.workspace,
        isDefault: context.isDefault,
        rootAgentId: context.id,
        agents: [
          {
            id: context.id,
            name: context.label,
            title: context.isDefault ? 'Primary context' : 'Runtime context',
            reportsTo: null,
            directReports: [],
            description: context.workspace
              ? `Runtime workspace: ${context.workspace}`
              : 'Runtime agent context',
          },
        ],
      } satisfies AgentContextGroup
    }

    return {
        id: context.id,
        label: context.label,
        workspace: hasWorkspace ? resolvedWorkspacePath : context.workspace,
        isDefault: context.isDefault,
        rootAgentId: workspaceRoot?.id ?? null,
        agents: workspaceAgents.map(mapAgentEntry),
    } satisfies AgentContextGroup
  })

  if (contexts.length > 0) {
    return {
      contexts,
      defaultContextId: workspaceContextId ?? contexts.find((context) => context.isDefault)?.id ?? contexts[0]?.id ?? null,
    }
  }

  const fallbackContextIds = [
    { id: 'main', label: 'JD Fetterly' },
    { id: 'jd-personal', label: 'jd-personal' },
    { id: 'mini-ops', label: 'mini-ops' },
  ]
  const fallbackWorkspaceContextId =
    hasWorkspace ? 'mini-ops' : normalizeAgentContextId(workspaceBasename)

  const fallbackContexts = fallbackContextIds.map((context) => {
    const isWorkspaceContext = fallbackWorkspaceContextId === context.id
    return {
      id: context.id,
      label: context.label,
      workspace: isWorkspaceContext ? resolvedWorkspacePath : null,
      isDefault: context.id === 'main',
      rootAgentId: isWorkspaceContext ? workspaceRoot?.id ?? null : context.id,
      agents: isWorkspaceContext
        ? workspaceAgents.map(mapAgentEntry)
        : [
            {
              id: context.id,
              name: context.label,
              title: context.id === 'main' ? 'Primary context' : 'Runtime context',
              reportsTo: null,
              directReports: [],
              description: 'Runtime agent context',
            },
          ],
    } satisfies AgentContextGroup
  })

  const fallbackAgents = workspaceAgents.map(mapAgentEntry)
  const fallbackLabel = workspaceRoot?.name ?? workspaceBasename ?? 'Workspace'

  return {
    contexts: fallbackContexts.length > 0 ? fallbackContexts : [
      {
        id: workspaceBasename ?? 'workspace',
        label: fallbackLabel,
        workspace: process.env.WORKSPACE_PATH ?? null,
        isDefault: true,
        rootAgentId: workspaceRoot?.id ?? null,
        agents: fallbackAgents,
      },
    ],
    defaultContextId: fallbackWorkspaceContextId ?? 'main',
  }
}

export async function getAgentContextGroup(contextId: string) {
  const catalog = await getAgentCatalog()
  const normalized = normalizeAgentContextId(contextId)
  return catalog.contexts.find((context) => context.id === normalized) ?? null
}

export async function isAgentAllowedForContext(contextId: string, agentId: string) {
  const context = await getAgentContextGroup(contextId)
  const normalizedContextId = normalizeAgentContextId(contextId)
  const normalizedAgentId = normalizeAgentContextId(agentId)

  if (!context) {
    return false
  }

  if (normalizedContextId && normalizedContextId === normalizedAgentId) {
    return true
  }

  return context.agents.some((agent) => agent.id === agentId)
}
