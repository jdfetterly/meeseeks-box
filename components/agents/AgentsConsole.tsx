'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  CopyPlus,
  FileCode2,
  GitBranchPlus,
  LoaderCircle,
  PencilLine,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import { OrgMap } from '@/components/OrgMap'
import { AgentAvatar } from '@/components/AgentAvatar'
import { ErrorState } from '@/components/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type {
  RuntimeAgentDefinition,
  RuntimeAgentSummary,
  RuntimeAgentsCatalog,
  RuntimeBindingRecord,
  RuntimeContext,
  RuntimeDefinitionFile,
  RuntimeModelChoice,
} from '@/lib/openclaw/runtime-agent-management'
import type { Agent, CronJob } from '@/lib/types'

type MutationState = 'idle' | 'saving'

type CreateDialogState = {
  open: boolean
  name: string
  workspace: string
  model: string
  emoji: string
  avatar: string
  bindings: string
}

type CloneDialogState = {
  open: boolean
  name: string
  workspace: string
  model: string
  emoji: string
  avatar: string
  copyBindings: boolean
}

type DeleteDialogState = {
  open: boolean
  deleteFiles: boolean
}

const EMPTY_CREATE_DIALOG: CreateDialogState = {
  open: false,
  name: '',
  workspace: '',
  model: '',
  emoji: '',
  avatar: '',
  bindings: '',
}

const EMPTY_CLONE_DIALOG: CloneDialogState = {
  open: false,
  name: '',
  workspace: '',
  model: '',
  emoji: '',
  avatar: '',
  copyBindings: false,
}

function mapRuntimeAgentToAgent(agent: RuntimeAgentSummary): Agent {
  return {
    id: agent.id,
    name: agent.name,
    title: agent.title,
    reportsTo: agent.reportsTo,
    directReports: agent.directReports,
    soulPath: agent.soulPath,
    soul: null,
    voiceId: agent.voiceId,
    color: agent.color,
    emoji: agent.emoji,
    tools: agent.tools,
    crons: [],
    memoryPath: null,
    description: agent.description,
  }
}

function buildTree(context: RuntimeContext, parentId: string | null, depth = 0): Array<RuntimeAgentSummary & { depth: number }> {
  const children = context.agents.filter((agent) => agent.reportsTo === parentId)
  const ordered: Array<RuntimeAgentSummary & { depth: number }> = []

  for (const child of children) {
    ordered.push({ ...child, depth })
    ordered.push(...buildTree(context, child.id, depth + 1))
  }

  return ordered
}

function formatTimestamp(value: number | null) {
  if (!value) {
    return 'No timestamp'
  }

  return new Date(value).toLocaleString()
}

function formatBindings(bindings: string) {
  return bindings
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function buildSearchIndex(context: RuntimeContext, agent: RuntimeAgentSummary) {
  return [context.label, context.workspace, agent.name, agent.title, agent.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function RuntimeAgentsSkeleton() {
  return (
    <div className="h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px minmax(0, 1fr) 420px',
          gap: 'var(--space-4)',
          height: '100%',
          padding: 'var(--space-4)',
        }}
      >
        {[1, 2, 3].map((column) => (
          <Card key={column} className="h-full">
            <CardContent style={{ paddingTop: 'var(--space-5)', display: 'grid', gap: 'var(--space-3)' }}>
              <Skeleton height={26} style={{ width: column === 2 ? '45%' : '55%' }} />
              {[1, 2, 3, 4].map((row) => (
                <Skeleton key={row} height={72} style={{ width: '100%' }} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function AgentsConsole() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [catalog, setCatalog] = useState<RuntimeAgentsCatalog | null>(null)
  const [definition, setDefinition] = useState<RuntimeAgentDefinition | null>(null)
  const [models, setModels] = useState<RuntimeModelChoice[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [loadingDefinition, setLoadingDefinition] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [fileDrafts, setFileDrafts] = useState<Record<string, string>>({})
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [newBindingSpec, setNewBindingSpec] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [mutationState, setMutationState] = useState<MutationState>('idle')
  const [createDialog, setCreateDialog] = useState<CreateDialogState>(EMPTY_CREATE_DIALOG)
  const [cloneDialog, setCloneDialog] = useState<CloneDialogState>(EMPTY_CLONE_DIALOG)
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    deleteFiles: false,
  })
  const [contextForm, setContextForm] = useState({
    name: '',
    workspace: '',
    model: '',
    emoji: '',
    avatar: '',
  })

  const selectedContextId = searchParams.get('context')
  const selectedAgentId = searchParams.get('agent')

  async function loadCatalog() {
    setLoadingCatalog(true)
    setError(null)

    try {
      const response = await fetch('/api/runtime/agents')
      if (!response.ok) {
        throw new Error('Failed to load runtime agents')
      }
      const payload = (await response.json()) as RuntimeAgentsCatalog
      setCatalog(payload)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load runtime agents')
    } finally {
      setLoadingCatalog(false)
    }
  }

  async function loadModels() {
    try {
      const response = await fetch('/api/runtime/models')
      if (!response.ok) {
        return
      }
      const payload = (await response.json()) as { models?: RuntimeModelChoice[] }
      setModels(Array.isArray(payload.models) ? payload.models : [])
    } catch {
      setModels([])
    }
  }

  function updateSelection(contextId: string, agentId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('context', contextId)
    params.set('agent', agentId)
    router.replace(`${pathname}?${params.toString()}`)
  }

  async function loadDefinition(contextId: string, agentId: string) {
    setLoadingDefinition(true)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/runtime/agents/${encodeURIComponent(contextId)}?agentId=${encodeURIComponent(agentId)}`,
      )

      if (!response.ok) {
        throw new Error('Failed to load runtime agent definition')
      }

      const payload = (await response.json()) as RuntimeAgentDefinition
      setDefinition(payload)
      setContextForm({
        name: payload.context.label,
        workspace: payload.context.workspace ?? '',
        model: payload.context.model ?? '',
        emoji: payload.context.identity?.emoji ?? '',
        avatar: payload.context.identity?.avatar ?? '',
      })
      setSelectedFileId((current) => current ?? payload.files[0]?.id ?? null)
      setFileDrafts({})
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load runtime agent definition',
      )
    } finally {
      setLoadingDefinition(false)
    }
  }

  async function refreshActiveDefinition(nextCatalog?: RuntimeAgentsCatalog | null) {
    const sourceCatalog = nextCatalog ?? catalog
    const activeContext =
      sourceCatalog?.contexts.find((context) => context.id === selectedContextId) ??
      sourceCatalog?.contexts[0] ??
      null
    const nextAgentId =
      selectedAgentId && activeContext?.agents.some((agent) => agent.id === selectedAgentId)
        ? selectedAgentId
        : activeContext?.rootAgentId ?? activeContext?.agents[0]?.id ?? null

    if (activeContext && nextAgentId) {
      updateSelection(activeContext.id, nextAgentId)
      await loadDefinition(activeContext.id, nextAgentId)
    }
  }

  useEffect(() => {
    void loadCatalog()
    void loadModels()
  }, [])

  useEffect(() => {
    if (!catalog || catalog.contexts.length === 0) {
      return
    }

    const activeContext =
      (selectedContextId
        ? catalog.contexts.find((context) => context.id === selectedContextId)
        : null) ??
      (catalog.defaultContextId
        ? catalog.contexts.find((context) => context.id === catalog.defaultContextId)
        : null) ??
      catalog.contexts[0]

    const activeAgent =
      (selectedAgentId
        ? activeContext.agents.find((agent) => agent.id === selectedAgentId)
        : null) ??
      (activeContext.rootAgentId
        ? activeContext.agents.find((agent) => agent.id === activeContext.rootAgentId)
        : null) ??
      activeContext.agents[0]

    if (!selectedContextId || !selectedAgentId || activeContext.id !== selectedContextId || activeAgent?.id !== selectedAgentId) {
      if (activeAgent) {
        updateSelection(activeContext.id, activeAgent.id)
      }
      return
    }

    void loadDefinition(activeContext.id, activeAgent.id)
  }, [catalog, selectedContextId, selectedAgentId])

  const activeContext = useMemo(() => {
    if (!catalog) {
      return null
    }

    return (
      catalog.contexts.find((context) => context.id === selectedContextId) ??
      catalog.contexts[0] ??
      null
    )
  }, [catalog, selectedContextId])

  const filteredRows = useMemo(() => {
    if (!catalog) {
      return []
    }

    const query = search.trim().toLowerCase()

    return catalog.contexts.flatMap((context) =>
      context.agents
        .filter((agent) => !query || buildSearchIndex(context, agent).includes(query))
        .map((agent) => ({
          context,
          agent,
        })),
    )
  }, [catalog, search])

  const outline = useMemo(() => {
    if (!activeContext) {
      return []
    }

    const rootAgentId =
      activeContext.rootAgentId ??
      activeContext.agents.find((agent) => agent.reportsTo === null)?.id ??
      null

    const ordered = buildTree(activeContext, rootAgentId ? null : null)

    if (ordered.length > 0) {
      return ordered
    }

    return activeContext.agents.map((agent) => ({ ...agent, depth: 0 }))
  }, [activeContext])

  const mappedAgents = useMemo(
    () => (activeContext?.agents ?? []).map((agent) => mapRuntimeAgentToAgent(agent)),
    [activeContext],
  )

  const selectedFile = useMemo(() => {
    return definition?.files.find((file) => file.id === selectedFileId) ?? definition?.files[0] ?? null
  }, [definition, selectedFileId])

  const selectedFileContent = selectedFile
    ? fileDrafts[selectedFile.id] ?? selectedFile.content ?? ''
    : ''

  async function mutate<T>(callback: () => Promise<T>, successMessage: string) {
    setMutationState('saving')
    setMessage(null)

    try {
      const result = await callback()
      await loadCatalog()
      setMessage(successMessage)
      return result
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : 'Runtime agent mutation failed',
      )
      return null
    } finally {
      setMutationState('idle')
    }
  }

  async function handleSaveContext() {
    if (!activeContext) {
      return
    }

    await mutate(async () => {
      const response = await fetch(`/api/runtime/agents/${encodeURIComponent(activeContext.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contextForm),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to save runtime agent settings')
      }

      await refreshActiveDefinition()
      return response.json()
    }, 'Runtime agent settings saved.')
  }

  async function handleSaveFile() {
    if (!activeContext || !selectedFile) {
      return
    }

    await mutate(async () => {
      const response = await fetch(
        `/api/runtime/agents/${encodeURIComponent(activeContext.id)}/files/${encodeURIComponent(selectedFile.id)}?agentId=${encodeURIComponent(definition?.agent.id ?? '')}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: selectedFileContent }),
        },
      )

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to save runtime file')
      }

      const payload = (await response.json()) as { file: RuntimeDefinitionFile }
      setDefinition((current) =>
        current
          ? {
              ...current,
              files: current.files.map((file) =>
                file.id === payload.file.id ? payload.file : file,
              ),
            }
          : current,
      )
      setFileDrafts((current) => {
        const next = { ...current }
        delete next[selectedFile.id]
        return next
      })
      return payload
    }, `Saved ${selectedFile.label}.`)
  }

  async function handleAddBinding() {
    if (!activeContext || !newBindingSpec.trim()) {
      return
    }

    await mutate(async () => {
      const response = await fetch(
        `/api/runtime/agents/${encodeURIComponent(activeContext.id)}/bindings`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spec: newBindingSpec.trim() }),
        },
      )

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to add binding')
      }

      setNewBindingSpec('')
      await refreshActiveDefinition()
      return response.json()
    }, 'Binding added.')
  }

  async function handleRemoveBinding(binding: RuntimeBindingRecord) {
    if (!activeContext) {
      return
    }

    const spec =
      (binding.match?.channel as string | undefined) && (binding.match?.accountId as string | undefined)
        ? `${binding.match?.channel as string}:${binding.match?.accountId as string}`
        : (binding.match?.channel as string | undefined) ?? binding.description

    await mutate(async () => {
      const response = await fetch(
        `/api/runtime/agents/${encodeURIComponent(activeContext.id)}/bindings?spec=${encodeURIComponent(spec)}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to remove binding')
      }

      await refreshActiveDefinition()
      return response.json()
    }, 'Binding removed.')
  }

  async function handleCreateAgent() {
    await mutate(async () => {
      const response = await fetch('/api/runtime/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createDialog.name,
          workspace: createDialog.workspace,
          model: createDialog.model || null,
          emoji: createDialog.emoji || null,
          avatar: createDialog.avatar || null,
          bindings: formatBindings(createDialog.bindings),
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to create runtime agent')
      }

      const payload = (await response.json()) as { agentId: string }
      setCreateDialog(EMPTY_CREATE_DIALOG)
      const nextCatalogResponse = await fetch('/api/runtime/agents')
      const nextCatalog = (await nextCatalogResponse.json()) as RuntimeAgentsCatalog
      setCatalog(nextCatalog)
      await refreshActiveDefinition(nextCatalog)
      const nextContext = nextCatalog.contexts.find((context) => context.id === payload.agentId)
      if (nextContext) {
        updateSelection(nextContext.id, nextContext.rootAgentId ?? nextContext.agents[0]?.id ?? payload.agentId)
      }
      return payload
    }, 'Runtime agent created.')
  }

  async function handleCloneAgent() {
    if (!activeContext) {
      return
    }

    await mutate(async () => {
      const response = await fetch('/api/runtime/agents/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContextId: activeContext.id,
          name: cloneDialog.name,
          workspace: cloneDialog.workspace,
          model: cloneDialog.model || null,
          emoji: cloneDialog.emoji || null,
          avatar: cloneDialog.avatar || null,
          copyBindings: cloneDialog.copyBindings,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to clone runtime agent')
      }

      const payload = (await response.json()) as { agentId: string }
      setCloneDialog(EMPTY_CLONE_DIALOG)
      const nextCatalogResponse = await fetch('/api/runtime/agents')
      const nextCatalog = (await nextCatalogResponse.json()) as RuntimeAgentsCatalog
      setCatalog(nextCatalog)
      const nextContext = nextCatalog.contexts.find((context) => context.id === payload.agentId)
      if (nextContext) {
        updateSelection(nextContext.id, nextContext.rootAgentId ?? nextContext.agents[0]?.id ?? payload.agentId)
      }
      return payload
    }, 'Runtime agent cloned.')
  }

  async function handleDeleteAgent() {
    if (!activeContext) {
      return
    }

    await mutate(async () => {
      const response = await fetch(
        `/api/runtime/agents/${encodeURIComponent(activeContext.id)}?deleteFiles=${deleteDialog.deleteFiles ? 'true' : 'false'}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Failed to delete runtime agent')
      }

      setDeleteDialog({ open: false, deleteFiles: false })
      const nextCatalogResponse = await fetch('/api/runtime/agents')
      const nextCatalog = (await nextCatalogResponse.json()) as RuntimeAgentsCatalog
      setCatalog(nextCatalog)
      await refreshActiveDefinition(nextCatalog)
      return response.json()
    }, 'Runtime agent deleted.')
  }

  if (loadingCatalog) {
    return <RuntimeAgentsSkeleton />
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => void loadCatalog()} />
  }

  if (!catalog || catalog.contexts.length === 0 || !activeContext) {
    return (
      <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--space-8)' }}>
          <Card>
            <CardHeader>
              <CardTitle>No runtime agents available</CardTitle>
              <CardDescription>
                Configure OpenClaw local or ssh sync, then reload this page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => void loadCatalog()} variant="outline">
                <RefreshCw />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px minmax(0, 1fr) 420px',
          gap: 'var(--space-4)',
          height: '100%',
          padding: 'var(--space-4)',
        }}
      >
        <Card className="h-full overflow-hidden">
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
              <div>
                <CardTitle>Runtime Catalog</CardTitle>
                <CardDescription>
                  {catalog.mode ? `${catalog.mode} sync` : 'Runtime unavailable'}
                </CardDescription>
              </div>
              <Button variant="outline" size="icon-sm" onClick={() => void loadCatalog()}>
                <RefreshCw />
              </Button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                border: '1px solid var(--separator)',
                borderRadius: 'var(--radius-md)',
                padding: '0 var(--space-3)',
                background: 'var(--material-thin)',
              }}
            >
              <Search size={16} style={{ color: 'var(--text-tertiary)' }} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search runtime agents"
                aria-label="Search runtime agents"
                style={{
                  flex: 1,
                  minHeight: 40,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                size="sm"
                onClick={() =>
                  setCreateDialog({
                    ...EMPTY_CREATE_DIALOG,
                    open: true,
                    workspace:
                      activeContext.workspace
                        ? activeContext.workspace.replace(/[^/]+$/, `${activeContext.id}-copy`)
                        : '',
                  })
                }
              >
                <GitBranchPlus />
                Create
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setCloneDialog({
                    open: true,
                    name: `${activeContext.label} Copy`,
                    workspace:
                      activeContext.workspace
                        ? activeContext.workspace.replace(/[^/]+$/, `${activeContext.id}-clone`)
                        : '',
                    model: activeContext.model ?? '',
                    emoji: activeContext.identity?.emoji ?? '',
                    avatar: activeContext.identity?.avatar ?? '',
                    copyBindings: false,
                  })
                }
              >
                <CopyPlus />
                Clone
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-full overflow-y-auto" style={{ display: 'grid', gap: 'var(--space-3)', paddingBottom: 'var(--space-6)' }}>
            {catalog.contexts.map((context) => {
              const rows = filteredRows.filter((row) => row.context.id === context.id)
              if (rows.length === 0) {
                return null
              }

              return (
                <div key={context.id} style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <strong>{context.label}</strong>
                        {context.isDefault ? <Badge>Default</Badge> : null}
                        <Badge variant="outline">{context.scanStatus}</Badge>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                        {context.workspace ?? 'No workspace'}{context.model ? ` • ${context.model}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                      {context.bindingsCount} bindings
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                    {rows.map(({ agent }) => {
                      const isActive =
                        activeContext.id === context.id && definition?.agent.id === agent.id
                      return (
                        <button
                          key={`${context.id}:${agent.id}`}
                          onClick={() => updateSelection(context.id, agent.id)}
                          className="focus-ring"
                          style={{
                            display: 'grid',
                            gap: '6px',
                            textAlign: 'left',
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${isActive ? agent.color : 'var(--separator)'}`,
                            background: isActive ? 'var(--fill-secondary)' : 'var(--material-thin)',
                            boxShadow: isActive ? `0 0 0 1px ${agent.color}33` : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <AgentAvatar agent={mapRuntimeAgentToAgent(agent)} size={28} borderRadius={8} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{agent.name}</div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{agent.title}</div>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                            {agent.description}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
              <div>
                <CardTitle>{activeContext.label}</CardTitle>
                <CardDescription>
                  Hierarchy, family navigation, and runtime context structure.
                </CardDescription>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {activeContext.routes.slice(0, 2).map((route) => (
                  <Badge key={route} variant="outline">
                    {route}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ display: 'grid', gridTemplateRows: 'minmax(340px, 1fr) auto', gap: 'var(--space-4)', height: 'calc(100% - 88px)' }}>
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--separator)' }}>
              {mappedAgents.length > 0 ? (
                <OrgMap
                  agents={mappedAgents}
                  crons={definition?.crons ?? []}
                  selectedId={definition?.agent.id ?? null}
                  onNodeClick={(agent) => updateSelection(activeContext.id, agent.id)}
                />
              ) : (
                <div style={{ padding: 'var(--space-5)', color: 'var(--text-tertiary)' }}>
                  No hierarchy available for this context.
                </div>
              )}
            </div>

            <div
              style={{
                border: '1px solid var(--separator)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                background: 'var(--material-thin)',
                display: 'grid',
                gap: 'var(--space-2)',
                maxHeight: 260,
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong>Family Outline</strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                  {activeContext.agents.length} agents
                </span>
              </div>
              {outline.map((agent) => {
                const isActive = definition?.agent.id === agent.id
                return (
                  <button
                    key={agent.id}
                    onClick={() => updateSelection(activeContext.id, agent.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: '8px 10px',
                      paddingLeft: `calc(10px + ${agent.depth * 18}px)`,
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: isActive ? 'var(--fill-secondary)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{agent.emoji}</span>
                    <span>{agent.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{agent.title}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden">
          <CardHeader>
            {loadingDefinition || !definition ? (
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <Skeleton height={28} style={{ width: '45%' }} />
                <Skeleton height={16} style={{ width: '70%' }} />
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <AgentAvatar agent={mapRuntimeAgentToAgent(definition.agent)} size={44} borderRadius={12} />
                  <div>
                    <CardTitle>{definition.agent.name}</CardTitle>
                    <CardDescription>{definition.agent.title}</CardDescription>
                  </div>
                </div>
                {message ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--system-green)' }}>{message}</div>
                ) : null}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <Badge variant="outline">{definition.context.scanStatus}</Badge>
                  {definition.model ? <Badge>{definition.model}</Badge> : null}
                  <Badge variant="outline">{definition.bindings.length} bindings</Badge>
                  <Badge variant="outline">{definition.crons.length} crons</Badge>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="h-full overflow-y-auto" style={{ paddingBottom: 'var(--space-6)' }}>
            {loadingDefinition || !definition ? (
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} height={88} style={{ width: '100%' }} />
                ))}
              </div>
            ) : (
              <Tabs defaultValue="overview">
                <TabsList variant="line">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="definition">Definition</TabsTrigger>
                  <TabsTrigger value="bindings">Bindings</TabsTrigger>
                  <TabsTrigger value="manage">Manage</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" style={{ display: 'grid', gap: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Agent</CardTitle>
                      <CardDescription>
                        Family-level details for the currently selected agent.
                      </CardDescription>
                    </CardHeader>
                    <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      <InfoRow label="Context">{definition.context.label}</InfoRow>
                      <InfoRow label="Workspace">{definition.context.workspace ?? 'Unavailable'}</InfoRow>
                      <InfoRow label="Reports to">
                        {definition.agent.reportsTo ?? 'Top-level agent'}
                      </InfoRow>
                      <InfoRow label="Direct reports">
                        {definition.agent.directReports.length > 0
                          ? definition.agent.directReports.join(', ')
                          : 'None'}
                      </InfoRow>
                      <InfoRow label="Tools">
                        {definition.agent.tools.length > 0
                          ? definition.agent.tools.join(', ')
                          : 'No tool metadata'}
                      </InfoRow>
                      <InfoRow label="Description">{definition.agent.description}</InfoRow>
                      <InfoRow label="Chat">
                        <Link href={`/chat/${definition.agent.id}`} style={{ color: 'var(--system-blue)' }}>
                          Open chat
                        </Link>
                      </InfoRow>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Runtime Context Settings</CardTitle>
                      <CardDescription>
                        Structured runtime settings for the isolated OpenClaw agent.
                      </CardDescription>
                    </CardHeader>
                    <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      <LabeledField
                        label="Display Name"
                        value={contextForm.name}
                        onChange={(value) => setContextForm((current) => ({ ...current, name: value }))}
                      />
                      <LabeledField
                        label="Workspace"
                        value={contextForm.workspace}
                        onChange={(value) => setContextForm((current) => ({ ...current, workspace: value }))}
                      />
                      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                        <label style={fieldLabelStyle}>Model</label>
                        {models.length > 0 ? (
                          <select
                            value={contextForm.model}
                            onChange={(event) =>
                              setContextForm((current) => ({ ...current, model: event.target.value }))
                            }
                            style={fieldStyle}
                          >
                            <option value="">Select a model</option>
                            {models.map((model) => (
                              <option key={model.id} value={model.id}>
                                {model.name} ({model.provider})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            value={contextForm.model}
                            onChange={(event) =>
                              setContextForm((current) => ({ ...current, model: event.target.value }))
                            }
                            placeholder="anthropic/claude-sonnet-4-5"
                            style={fieldStyle}
                          />
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                        <LabeledField
                          label="Emoji"
                          value={contextForm.emoji}
                          onChange={(value) => setContextForm((current) => ({ ...current, emoji: value }))}
                        />
                        <LabeledField
                          label="Avatar"
                          value={contextForm.avatar}
                          onChange={(value) => setContextForm((current) => ({ ...current, avatar: value }))}
                          placeholder="avatars/context.png"
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={() => void handleSaveContext()} disabled={mutationState === 'saving'}>
                          {mutationState === 'saving' ? <LoaderCircle className="animate-spin" /> : <Save />}
                          Save Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="definition" style={{ display: 'grid', gap: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Definition Files</CardTitle>
                      <CardDescription>
                        Summary-first editing with agent instructions plus workspace root files.
                      </CardDescription>
                    </CardHeader>
                    <CardContent style={{ display: 'grid', gap: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {definition.files.map((file) => {
                          const dirty = fileDrafts[file.id] !== undefined
                          return (
                            <button
                              key={file.id}
                              onClick={() => setSelectedFileId(file.id)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 10px',
                                borderRadius: '999px',
                                border:
                                  selectedFile?.id === file.id
                                    ? '1px solid var(--accent)'
                                    : '1px solid var(--separator)',
                                background:
                                  selectedFile?.id === file.id
                                    ? 'var(--accent-fill)'
                                    : 'var(--material-thin)',
                                color:
                                  selectedFile?.id === file.id
                                    ? 'var(--accent)'
                                    : 'var(--text-secondary)',
                              }}
                            >
                              <FileCode2 size={14} />
                              {file.label}
                              {file.missing ? <Badge variant="outline">Missing</Badge> : null}
                              {dirty ? <Badge>Dirty</Badge> : null}
                            </button>
                          )
                        })}
                      </div>

                      {selectedFile ? (
                        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                            <div>
                              <strong>{selectedFile.label}</strong>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                                {selectedFile.path ?? selectedFile.relativePath ?? 'No path available'}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                              Updated {formatTimestamp(selectedFile.updatedAtMs)}
                            </div>
                          </div>
                          <textarea
                            value={selectedFileContent}
                            onChange={(event) =>
                              setFileDrafts((current) => ({
                                ...current,
                                [selectedFile.id]: event.target.value,
                              }))
                            }
                            style={{
                              width: '100%',
                              minHeight: 320,
                              borderRadius: 'var(--radius-lg)',
                              border: '1px solid var(--separator)',
                              background: 'var(--material-thin)',
                              color: 'var(--text-primary)',
                              padding: 'var(--space-4)',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.9rem',
                              lineHeight: 1.55,
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                              {selectedFile.scope === 'agent'
                                ? 'Edits the selected family agent definition.'
                                : 'Edits the isolated runtime workspace file.'}
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              <Button
                                variant="outline"
                                onClick={() =>
                                  setFileDrafts((current) => {
                                    const next = { ...current }
                                    delete next[selectedFile.id]
                                    return next
                                  })
                                }
                              >
                                <X />
                                Revert
                              </Button>
                              <Button onClick={() => void handleSaveFile()} disabled={mutationState === 'saving' || !selectedFile.editable}>
                                {mutationState === 'saving' ? <LoaderCircle className="animate-spin" /> : <Save />}
                                Save File
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-tertiary)' }}>No editable files available.</div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bindings" style={{ display: 'grid', gap: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Routing Bindings</CardTitle>
                      <CardDescription>
                        OpenClaw runtime routing rules for the isolated context.
                      </CardDescription>
                    </CardHeader>
                    <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input
                          value={newBindingSpec}
                          onChange={(event) => setNewBindingSpec(event.target.value)}
                          placeholder="telegram:ops"
                          style={fieldStyle}
                        />
                        <Button onClick={() => void handleAddBinding()} disabled={mutationState === 'saving'}>
                          <GitBranchPlus />
                          Add
                        </Button>
                      </div>
                      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                        {definition.bindings.length === 0 ? (
                          <div style={{ color: 'var(--text-tertiary)' }}>No routing bindings configured.</div>
                        ) : (
                          definition.bindings.map((binding) => (
                            <div
                              key={`${binding.agentId}:${binding.description}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 'var(--space-3)',
                                border: '1px solid var(--separator)',
                                borderRadius: 'var(--radius-md)',
                                padding: 'var(--space-3)',
                                background: 'var(--material-thin)',
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600 }}>{binding.description}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
                                  {binding.agentId}
                                </div>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => void handleRemoveBinding(binding)}>
                                <Trash2 />
                                Remove
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="manage" style={{ display: 'grid', gap: 'var(--space-4)', paddingTop: 'var(--space-4)' }}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Clone and Delete</CardTitle>
                      <CardDescription>
                        Runtime lifecycle actions for the isolated OpenClaw context.
                      </CardDescription>
                    </CardHeader>
                    <CardContent style={{ display: 'grid', gap: 'var(--space-4)' }}>
                      <div
                        style={{
                          display: 'grid',
                          gap: 'var(--space-2)',
                          border: '1px solid var(--separator)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-3)',
                          background: 'var(--material-thin)',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>Clone this runtime context</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          Copies runtime model/config and editable definition files. Bindings stay opt-in.
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            onClick={() =>
                              setCloneDialog({
                                open: true,
                                name: `${activeContext.label} Copy`,
                                workspace:
                                  activeContext.workspace
                                    ? activeContext.workspace.replace(/[^/]+$/, `${activeContext.id}-clone`)
                                    : '',
                                model: activeContext.model ?? '',
                                emoji: activeContext.identity?.emoji ?? '',
                                avatar: activeContext.identity?.avatar ?? '',
                                copyBindings: false,
                              })
                            }
                          >
                            <CopyPlus />
                            Open Clone Flow
                          </Button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gap: 'var(--space-2)',
                          border: '1px solid rgba(255, 69, 58, 0.3)',
                          borderRadius: 'var(--radius-md)',
                          padding: 'var(--space-3)',
                          background: 'rgba(255, 69, 58, 0.06)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--system-red)' }}>
                          <ShieldAlert size={16} />
                          <strong>Delete runtime context</strong>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          Workspace: {activeContext.workspace ?? 'Unavailable'}
                          <br />
                          Agent dir: {activeContext.agentDir ?? 'Unavailable'}
                        </div>
                        <div>
                          <Button
                            variant="destructive"
                            onClick={() => setDeleteDialog({ open: true, deleteFiles: false })}
                          >
                            <Trash2 />
                            Delete Context
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createDialog.open} onOpenChange={(open) => setCreateDialog((current) => ({ ...current, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Runtime Agent</DialogTitle>
            <DialogDescription>
              Creates a new isolated OpenClaw agent and opens it in the console.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <LabeledField
              label="Name"
              value={createDialog.name}
              onChange={(value) => setCreateDialog((current) => ({ ...current, name: value }))}
            />
            <LabeledField
              label="Workspace"
              value={createDialog.workspace}
              onChange={(value) => setCreateDialog((current) => ({ ...current, workspace: value }))}
            />
            <LabeledField
              label="Model"
              value={createDialog.model}
              onChange={(value) => setCreateDialog((current) => ({ ...current, model: value }))}
              placeholder="anthropic/claude-sonnet-4-5"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <LabeledField
                label="Emoji"
                value={createDialog.emoji}
                onChange={(value) => setCreateDialog((current) => ({ ...current, emoji: value }))}
              />
              <LabeledField
                label="Avatar"
                value={createDialog.avatar}
                onChange={(value) => setCreateDialog((current) => ({ ...current, avatar: value }))}
              />
            </div>
            <LabeledField
              label="Bindings"
              value={createDialog.bindings}
              onChange={(value) => setCreateDialog((current) => ({ ...current, bindings: value }))}
              placeholder="telegram:ops, discord:guild-a"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(EMPTY_CREATE_DIALOG)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreateAgent()} disabled={mutationState === 'saving'}>
              {mutationState === 'saving' ? <LoaderCircle className="animate-spin" /> : <GitBranchPlus />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cloneDialog.open} onOpenChange={(open) => setCloneDialog((current) => ({ ...current, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Runtime Agent</DialogTitle>
            <DialogDescription>
              Copies definition/config as a baseline. Bindings are optional.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <LabeledField
              label="Name"
              value={cloneDialog.name}
              onChange={(value) => setCloneDialog((current) => ({ ...current, name: value }))}
            />
            <LabeledField
              label="Workspace"
              value={cloneDialog.workspace}
              onChange={(value) => setCloneDialog((current) => ({ ...current, workspace: value }))}
            />
            <LabeledField
              label="Model"
              value={cloneDialog.model}
              onChange={(value) => setCloneDialog((current) => ({ ...current, model: value }))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <LabeledField
                label="Emoji"
                value={cloneDialog.emoji}
                onChange={(value) => setCloneDialog((current) => ({ ...current, emoji: value }))}
              />
              <LabeledField
                label="Avatar"
                value={cloneDialog.avatar}
                onChange={(value) => setCloneDialog((current) => ({ ...current, avatar: value }))}
              />
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--text-secondary)',
              }}
            >
              <input
                type="checkbox"
                checked={cloneDialog.copyBindings}
                onChange={(event) =>
                  setCloneDialog((current) => ({ ...current, copyBindings: event.target.checked }))
                }
              />
              Copy simple bindings when possible
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialog(EMPTY_CLONE_DIALOG)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCloneAgent()} disabled={mutationState === 'saving'}>
              {mutationState === 'saving' ? <LoaderCircle className="animate-spin" /> : <CopyPlus />}
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((current) => ({ ...current, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Runtime Context</DialogTitle>
            <DialogDescription>
              This removes the isolated OpenClaw context. File deletion stays off by default.
            </DialogDescription>
          </DialogHeader>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Workspace: {activeContext.workspace ?? 'Unavailable'}
              <br />
              Agent dir: {activeContext.agentDir ?? 'Unavailable'}
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--text-secondary)',
              }}
            >
              <input
                type="checkbox"
                checked={deleteDialog.deleteFiles}
                onChange={(event) =>
                  setDeleteDialog((current) => ({ ...current, deleteFiles: event.target.checked }))
                }
              />
              Delete workspace and agent files too
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, deleteFiles: false })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDeleteAgent()} disabled={mutationState === 'saving'}>
              {mutationState === 'saving' ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: '4px',
        paddingBottom: 'var(--space-3)',
        borderBottom: '1px solid var(--separator)',
      }}
    >
      <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text-primary)' }}>{children}</span>
    </div>
  )
}

function LabeledField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
      <label style={fieldLabelStyle}>{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={fieldStyle}
      />
    </div>
  )
}

const fieldLabelStyle = {
  fontSize: '0.82rem',
  color: 'var(--text-tertiary)',
  fontWeight: 600,
} satisfies CSSProperties

const fieldStyle = {
  width: '100%',
  minHeight: 40,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--separator)',
  background: 'var(--material-thin)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
} satisfies CSSProperties
