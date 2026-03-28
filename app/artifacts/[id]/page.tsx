import Link from 'next/link'
import { notFound } from 'next/navigation'
import path from 'node:path'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getArtifactRegistryEntryByFamilyId } from '@/lib/artifacts/service'
import { getRunById, getScheduleById, getScheduleSummaryById, getWorkItemById } from '@/lib/product-state/repositories'
import {
  describeScheduleCadence,
  describeScheduleStatus,
  formatScheduleTime,
} from '@/lib/schedules/presentation'

export const dynamic = 'force-dynamic'

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Unknown time'
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function describeProducerKind(value: string) {
  switch (value) {
    case 'schedule':
      return 'Scheduled output'
    case 'work_item':
      return 'Work output'
    case 'manual':
      return 'Manual output'
    default:
      return value
  }
}

function describeRegistrationSource(value: unknown) {
  if (value === 'schedule_reported_output') {
    return 'Reported by the producing job'
  }

  if (value === 'schedule_manual_registration') {
    return 'Registered manually after the run'
  }

  return null
}

function toWorkspaceRelativePath(storagePath: string | null) {
  if (!storagePath) {
    return null
  }

  const workspacePath = process.env.WORKSPACE_PATH?.trim() || path.join(process.cwd(), 'workspace')
  const relativePath = path.relative(workspacePath, storagePath)

  if (!relativePath || relativePath.startsWith('..')) {
    return storagePath
  }

  return `/workspace/${relativePath}`
}

export default async function ArtifactFamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const entry = getArtifactRegistryEntryByFamilyId(id)

  if (!entry) {
    notFound()
  }

  const { family, versions } = entry
  const latestVersion = versions.at(-1) ?? null
  const producingSchedule = family.producerKind === 'schedule' ? getScheduleById(family.producerId) : null
  const producingScheduleSummary = family.producerKind === 'schedule' ? getScheduleSummaryById(family.producerId) : null
  const producingWorkItem =
    family.producerKind === 'work_item'
      ? getWorkItemById(family.producerId)
      : latestVersion?.workItemId
        ? getWorkItemById(latestVersion.workItemId)
        : null
  const latestRun = latestVersion?.runId ? getRunById(latestVersion.runId) : null
  const latestRegistrationSource = describeRegistrationSource(latestVersion?.metadata?.registrationSource)

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg)' }}>
      <div
        style={{
          maxWidth: 980,
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
              Artifact Family
            </p>
            <h1
              style={{
                margin: 'var(--space-2) 0 0',
                fontSize: 'clamp(2rem, 4vw, 3.1rem)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              {family.title}
            </h1>
            <p
              style={{
                margin: 'var(--space-3) 0 0',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-body)',
              }}
            >
              {describeProducerKind(family.producerKind)} • {versions.length} version{versions.length === 1 ? '' : 's'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: 'var(--space-4)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>What this is</CardTitle>
                <CardDescription>
                  The stable output record for this repeated deliverable.
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {family.title} is tracked as a {describeProducerKind(family.producerKind).toLowerCase()} in the{' '}
                  <strong>{family.scope}</strong> context.
                </p>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  The latest version is <strong>{latestVersion?.versionLabel ?? 'unavailable'}</strong>
                  {latestVersion ? ` from ${formatTimestamp(latestVersion.createdAt)}.` : '.'}
                </p>
                {latestRegistrationSource ? (
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{latestRegistrationSource}.</p>
                ) : null}
                <p style={{ margin: 0 }}>
                  <Link href="/artifacts">Back to artifact registry</Link>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produced by</CardTitle>
                <CardDescription>
                  The operational object you should open next if you need context.
                </CardDescription>
              </CardHeader>
              <CardContent style={{ display: 'grid', gap: 'var(--space-2)' }}>
                {producingSchedule ? (
                  <>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      <strong>{producingSchedule.label}</strong> •{' '}
                      {producingScheduleSummary
                        ? describeScheduleStatus(producingScheduleSummary.status)
                        : producingSchedule.status}
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      {describeScheduleCadence(producingSchedule.scheduleKind, producingSchedule.metadata)}
                      {producingScheduleSummary?.nextRunAt
                        ? ` • next run ${formatScheduleTime(producingScheduleSummary.nextRunAt)}`
                        : ''}
                    </p>
                    <p style={{ margin: 0 }}>
                      <Link href={`/schedules/${producingSchedule.id}`}>Open producing schedule</Link>
                    </p>
                  </>
                ) : producingWorkItem ? (
                  <>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      <strong>{producingWorkItem.title}</strong> • {producingWorkItem.status.replaceAll('_', ' ')}
                    </p>
                    <p style={{ margin: 0 }}>
                      <Link href={`/work/${producingWorkItem.id}`}>Open producing work</Link>
                    </p>
                  </>
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                    No linked producer detail is available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Latest version</CardTitle>
              <CardDescription>
                The most recent output you would likely open or inspect first.
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {latestVersion ? (
                <>
                  <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                    <strong style={{ fontSize: '1.05rem' }}>{latestVersion.versionLabel}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {latestVersion.name} • {formatTimestamp(latestVersion.createdAt)}
                    </span>
                  </div>
                  {latestVersion.storagePath ? (
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        File path
                      </span>
                      <code
                        style={{
                          background: 'var(--material-thin)',
                          border: '1px solid var(--separator)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                          color: 'var(--text-secondary)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {toWorkspaceRelativePath(latestVersion.storagePath)}
                      </code>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    {latestVersion.workItemId ? (
                      <Link href={`/work/${latestVersion.workItemId}`}>Open related work</Link>
                    ) : null}
                    {latestVersion.runId ? (
                      <Link href={`/runs/${latestVersion.runId}`}>Open related run</Link>
                    ) : null}
                  </div>
                  {latestRun ? (
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      Run status: {latestRun.status.replaceAll('_', ' ')}
                      {latestRun.agentId ? ` • agent ${latestRun.agentId}` : ''}
                    </p>
                  ) : null}
                </>
              ) : (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No version data is available yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version history</CardTitle>
              <CardDescription>
                Older outputs in plain language so you can see what changed over time.
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {[...versions].reverse().map((version, index) => {
                const run = version.runId ? getRunById(version.runId) : null
                const workItem = version.workItemId ? getWorkItemById(version.workItemId) : null
                const registrationSource = describeRegistrationSource(version.metadata?.registrationSource)

                return (
                  <div
                    key={version.id}
                    style={{
                      border: '1px solid var(--separator)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      background: index === 0 ? 'var(--material-thick)' : 'var(--material-thin)',
                      display: 'grid',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 'var(--space-3)',
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                      }}
                    >
                      <strong>{version.versionLabel}</strong>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                        {formatTimestamp(version.createdAt)}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                      {version.name}
                      {registrationSource ? ` • ${registrationSource}` : ''}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                      {workItem ? <Link href={`/work/${workItem.id}`}>Work: {workItem.title}</Link> : null}
                      {run ? <Link href={`/runs/${run.id}`}>Run: {run.status.replaceAll('_', ' ')}</Link> : null}
                    </div>
                    {version.storagePath ? (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                        {toWorkspaceRelativePath(version.storagePath)}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <details
            style={{
              border: '1px solid var(--separator)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              background: 'var(--material-thin)',
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Technical details</summary>
            <div style={{ display: 'grid', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Producer kind: {family.producerKind}</p>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Output slot: {family.outputSlot}</p>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
                Family key: {family.familyKey}
              </p>
              <p style={{ margin: 0, color: 'var(--text-tertiary)', wordBreak: 'break-all' }}>
                Producer id: {family.producerId}
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
