import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArtifactFamilyPanel } from '@/components/artifacts/ArtifactFamilyPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listArtifactRegistryForRun } from '@/lib/artifacts/service'
import {
  getRunById,
  listApprovals,
  listRunEvents,
} from '@/lib/product-state/repositories'

export const dynamic = 'force-dynamic'

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const run = getRunById(id)

  if (!run) {
    notFound()
  }

  const events = listRunEvents(run.id)
  const approvals = listApprovals().filter((approval) => approval.runId === run.id)
  const artifactRegistry = listArtifactRegistryForRun(run.id)

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
              Run
            </p>
            <h1
              style={{
                margin: 'var(--space-2) 0 0',
                fontSize: 'clamp(2rem, 4vw, 3.1rem)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              {run.agentId ?? 'Unknown agent'}
            </h1>
            <p
              style={{
                margin: 'var(--space-3) 0 0',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-body)',
              }}
            >
              Status: {run.status} • Trigger: {run.triggerKind}
              {run.model ? ` • Model: ${run.model}` : ''}
              {run.workItemId ? ` • ` : ''}
              {run.workItemId ? <Link href={`/work/${run.workItemId}`}>Open work item</Link> : null}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Event timeline</CardTitle>
              <CardDescription>
                {events.length} event{events.length === 1 ? '' : 's'} recorded
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {events.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>No run events yet.</p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      border: '1px solid var(--separator)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      background: 'var(--material-thin)',
                    }}
                  >
                    <strong>{event.eventType}</strong>
                    <p
                      style={{
                        margin: 'var(--space-2) 0 0',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                      }}
                    >
                      {new Date(event.createdAt).toLocaleString()} • {event.source}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approvals</CardTitle>
              <CardDescription>
                {approvals.length} approval{approvals.length === 1 ? '' : 's'} linked to this run
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {approvals.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No approvals linked to this run.
                </p>
              ) : (
                approvals.map((approval) => (
                  <div
                    key={approval.id}
                    style={{
                      border: '1px solid var(--separator)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      background: 'var(--material-thin)',
                    }}
                  >
                    <strong>{approval.requestedActionType}</strong>
                    <p
                      style={{
                        margin: 'var(--space-2) 0 0',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                      }}
                    >
                      {approval.status} • {approval.approvalType}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Artifacts</CardTitle>
              <CardDescription>
                {artifactRegistry.length} artifact famil{artifactRegistry.length === 1 ? 'y' : 'ies'} linked
                to this run
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {artifactRegistry.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No artifact families are linked to this run yet.
                </p>
              ) : (
                artifactRegistry.map(({ family, versions }) => (
                  <ArtifactFamilyPanel
                    key={family.id}
                    family={family}
                    versions={versions}
                    showFamilyKey={false}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
