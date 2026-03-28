'use client'

import type { CSSProperties } from 'react'
import { useEffect, useMemo, useState } from 'react'

interface AgentCatalogEntry {
  id: string
  name: string
  title: string
  reportsTo: string | null
  directReports: string[]
  description: string
}

interface AgentContextGroup {
  id: string
  label: string
  workspace: string | null
  isDefault: boolean
  agents: AgentCatalogEntry[]
  rootAgentId: string | null
}

interface AgentCatalogResponse {
  contexts: AgentContextGroup[]
  defaultContextId: string | null
}

function buildOrderedAgents(context: AgentContextGroup) {
  const byId = new Map(context.agents.map((agent) => [agent.id, agent]))
  const ordered: Array<AgentCatalogEntry & { depth: number }> = []
  const visited = new Set<string>()

  function walk(agentId: string, depth: number) {
    if (visited.has(agentId)) {
      return
    }
    const agent = byId.get(agentId)
    if (!agent) {
      return
    }
    visited.add(agentId)
    ordered.push({ ...agent, depth })
    for (const childId of agent.directReports) {
      walk(childId, depth + 1)
    }
  }

  if (context.rootAgentId) {
    walk(context.rootAgentId, 0)
  }

  for (const agent of context.agents) {
    if (!visited.has(agent.id) && agent.reportsTo === null) {
      walk(agent.id, 0)
    }
  }

  for (const agent of context.agents) {
    if (!visited.has(agent.id)) {
      ordered.push({ ...agent, depth: 0 })
    }
  }

  return ordered
}

export function AgentContextPicker({
  value,
  agentId,
  onContextChange,
  onAgentChange,
  idPrefix,
}: {
  value: string
  agentId: string
  onContextChange: (value: string) => void
  onAgentChange: (value: string) => void
  idPrefix: string
}) {
  const [catalog, setCatalog] = useState<AgentCatalogResponse | null>(null)

  useEffect(() => {
    fetch('/api/agent-catalog')
      .then((response) => (response.ok ? response.json() : { contexts: [], defaultContextId: null }))
      .then((data: AgentCatalogResponse) => {
        setCatalog(data)
      })
      .catch(() => {
        setCatalog({ contexts: [], defaultContextId: null })
      })
  }, [])

  const activeContext = useMemo(
    () => catalog?.contexts.find((context) => context.id === value) ?? null,
    [catalog, value],
  )
  const orderedAgents = useMemo(
    () => (activeContext ? buildOrderedAgents(activeContext) : []),
    [activeContext],
  )

  useEffect(() => {
    if (!catalog || catalog.contexts.length === 0) {
      return
    }

    const nextContext =
      catalog.contexts.find((context) => context.id === value) ??
      (catalog.defaultContextId
        ? catalog.contexts.find((context) => context.id === catalog.defaultContextId)
        : catalog.contexts[0])

    if (nextContext && nextContext.id !== value) {
      onContextChange(nextContext.id)
      if (nextContext.agents.length > 0) {
        onAgentChange(nextContext.rootAgentId ?? nextContext.agents[0].id)
      }
    }
  }, [catalog, onAgentChange, onContextChange, value])

  useEffect(() => {
    if (!activeContext || activeContext.agents.length === 0) {
      return
    }

    if (!activeContext.agents.some((entry) => entry.id === agentId)) {
      onAgentChange(activeContext.rootAgentId ?? activeContext.agents[0].id)
    }
  }, [activeContext, agentId, onAgentChange])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <label htmlFor={`${idPrefix}-context`} style={{ fontWeight: 600 }}>
          Context
        </label>
        <select
          id={`${idPrefix}-context`}
          value={value}
          onChange={(event) => onContextChange(event.target.value)}
          style={fieldStyle}
        >
          {(catalog?.contexts ?? []).map((context) => (
            <option key={context.id} value={context.id}>
              {context.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        <label htmlFor={`${idPrefix}-agent`} style={{ fontWeight: 600 }}>
          Agent
        </label>
        <select
          id={`${idPrefix}-agent`}
          value={agentId}
          onChange={(event) => onAgentChange(event.target.value)}
          style={fieldStyle}
        >
          {orderedAgents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {`${'— '.repeat(agent.depth)}${agent.name} — ${agent.title}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

const fieldStyle: CSSProperties = {
  width: '100%',
  minHeight: 42,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
}
