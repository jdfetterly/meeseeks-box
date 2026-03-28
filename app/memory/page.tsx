import { ArchiveMemoryEntryButton } from '@/components/memory/ArchiveMemoryEntryButton'
import { BootstrapMemoryButton } from '@/components/memory/BootstrapMemoryButton'
import { SupersedeMemoryEntryForm } from '@/components/memory/SupersedeMemoryEntryForm'
import { WriteMemoryEntryForm } from '@/components/memory/WriteMemoryEntryForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getWorkspaceMemoryStatus } from '@/lib/memory/workspace'
import { listMemoryEntries, listMemorySources } from '@/lib/product-state/repositories'

export const dynamic = 'force-dynamic'

export default function MemoryPage() {
  const entries = listMemoryEntries()
  const sources = listMemorySources()
  const workspaceStatus = getWorkspaceMemoryStatus()
  const activeEntries = entries.filter((entry) => !entry.archivedAt)
  const archivedEntries = entries.filter((entry) => Boolean(entry.archivedAt))

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'var(--space-8) var(--space-5) var(--space-12)',
        }}
      >
        <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <div>
            <p
              style={{
                margin: 0,
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-caption1)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 'var(--weight-semibold)',
              }}
            >
              Memory
            </p>
            <h1
              style={{
                margin: 'var(--space-2) 0 0',
                fontSize: 'clamp(2rem, 4vw, 3.1rem)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              Memory is now a governed registry, not just a file browser.
            </h1>
            <p
              style={{
                margin: 'var(--space-3) 0 0',
                maxWidth: 760,
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-body)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              These entries reflect the canonical metadata layer over the OpenClaw-compatible
              workspace memory files. Archive is metadata-only and does not delete the underlying
              file.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Active entries</CardTitle>
                <CardDescription>Default working set</CardDescription>
              </CardHeader>
              <CardContent>
                <strong style={{ fontSize: '2rem' }}>{activeEntries.length}</strong>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Archived entries</CardTitle>
                <CardDescription>Metadata-only retirement</CardDescription>
              </CardHeader>
              <CardContent>
                <strong style={{ fontSize: '2rem' }}>{archivedEntries.length}</strong>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sources</CardTitle>
                <CardDescription>Recorded provenance rows</CardDescription>
              </CardHeader>
              <CardContent>
                <strong style={{ fontSize: '2rem' }}>{sources.length}</strong>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Workspace memory bootstrap</CardTitle>
              <CardDescription>
                Prepare the allowed workspace memory paths before the first write-through.
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Workspace: {workspaceStatus.workspacePath ?? 'unconfigured'}
              </p>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
                Memory directory: {workspaceStatus.memoryDirExists ? 'ready' : 'missing'} •
                Evergreen file: {workspaceStatus.evergreenExists ? 'ready' : 'missing'} •
                Bootstrap {workspaceStatus.bootstrapEnabled ? 'enabled' : 'disabled'}
              </p>
              <BootstrapMemoryButton
                disabled={
                  !workspaceStatus.bootstrapEnabled ||
                  (workspaceStatus.memoryDirExists && workspaceStatus.evergreenExists)
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Write memory entry</CardTitle>
              <CardDescription>
                Controlled write-through into the OpenClaw-compatible workspace memory area.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WriteMemoryEntryForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active memory entries</CardTitle>
              <CardDescription>
                {activeEntries.length} active entr{activeEntries.length === 1 ? 'y' : 'ies'}
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {activeEntries.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No canonical memory entries exist yet.
                </p>
              ) : (
                activeEntries.map((entry) => {
                  const sourceCount = sources.filter(
                    (source) => source.memoryEntryId === entry.id,
                  ).length
                  const supersedeOptions = activeEntries
                    .filter((candidate) => candidate.id !== entry.id)
                    .map((candidate) => ({
                      id: candidate.id,
                      title: candidate.title,
                    }))

                  return (
                    <div
                      key={entry.id}
                      style={{
                        border: '1px solid var(--separator)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-4)',
                        background: 'var(--material-thin)',
                        display: 'grid',
                        gap: 'var(--space-3)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 'var(--space-3)',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <strong>{entry.title}</strong>
                          <p
                            style={{
                              margin: 'var(--space-1) 0 0',
                              color: 'var(--text-secondary)',
                              fontSize: '0.95rem',
                            }}
                          >
                            {entry.entryType} • {entry.scope} • {sourceCount} source
                            {sourceCount === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gap: 'var(--space-2)',
                            justifyItems: 'end',
                            minWidth: 240,
                          }}
                        >
                          <ArchiveMemoryEntryButton memoryEntryId={entry.id} />
                          <SupersedeMemoryEntryForm
                            memoryEntryId={entry.id}
                            options={supersedeOptions}
                          />
                        </div>
                      </div>
                      {entry.summary ? (
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{entry.summary}</p>
                      ) : null}
                      <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                          Status: {entry.status}
                        </span>
                        <span
                          style={{
                            color: 'var(--text-tertiary)',
                            fontSize: '0.85rem',
                            wordBreak: 'break-all',
                          }}
                        >
                          {entry.canonicalPath ?? 'No canonical path'}
                        </span>
                        {entry.supersededById ? (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                            Superseded by: {entry.supersededById}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Archived memory entries</CardTitle>
              <CardDescription>Source files remain untouched.</CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {archivedEntries.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No archived entries yet.
                </p>
              ) : (
                archivedEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: '1px solid var(--separator)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      background: 'var(--material-thin)',
                    }}
                  >
                    <strong>{entry.title}</strong>
                    <p
                      style={{
                        margin: 'var(--space-2) 0 0',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                      }}
                    >
                      Archived at {entry.archivedAt ? new Date(entry.archivedAt).toLocaleString() : 'unknown'}
                    </p>
                    {entry.supersededById ? (
                      <p
                        style={{
                          margin: 'var(--space-1) 0 0',
                          color: 'var(--text-tertiary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        Superseded by{' '}
                        {entries.find((candidate) => candidate.id === entry.supersededById)?.title ??
                          entry.supersededById}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
