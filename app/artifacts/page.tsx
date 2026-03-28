import Link from 'next/link'
import { ArtifactFamilyPanel } from '@/components/artifacts/ArtifactFamilyPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listArtifactRegistry } from '@/lib/artifacts/service'

export const dynamic = 'force-dynamic'

export default function ArtifactsPage() {
  const registry = listArtifactRegistry()
  const versionCount = registry.reduce((count, item) => count + item.versions.length, 0)

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
              Artifacts
            </p>
            <h1
              style={{
                margin: 'var(--space-2) 0 0',
                fontSize: 'clamp(2rem, 4vw, 3.1rem)',
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              Output families now have immutable versions.
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
              This registry groups repeated outputs under stable family keys using the planned
              `producer_kind + producer_id + output_slot` contract. Producers are still being wired,
              but the canonical output model is now live.
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
                <CardTitle>Families</CardTitle>
                <CardDescription>Stable output groupings</CardDescription>
              </CardHeader>
              <CardContent>
                <strong style={{ fontSize: '2rem' }}>{registry.length}</strong>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Versions</CardTitle>
                <CardDescription>Immutable output revisions</CardDescription>
              </CardHeader>
              <CardContent>
                <strong style={{ fontSize: '2rem' }}>{versionCount}</strong>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Artifact families</CardTitle>
              <CardDescription>
                {registry.length} family{registry.length === 1 ? '' : 'ies'} tracked
              </CardDescription>
            </CardHeader>
            <CardContent style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {registry.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-tertiary)' }}>
                  No artifact families have been registered yet.
                </p>
              ) : (
                registry.map(({ family, versions }) => (
                  <ArtifactFamilyPanel key={family.id} family={family} versions={versions} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
