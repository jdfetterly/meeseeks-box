import Link from 'next/link'
import type { ArtifactFamilyRecord, ArtifactVersionRecord } from '@/lib/product-state/entities'

function describeProducerLabel(family: ArtifactFamilyRecord) {
  switch (family.producerKind) {
    case 'work_item':
      return 'Work item'
    case 'schedule':
      return 'Schedule'
    case 'manual':
      return 'Manual'
    default:
      return family.producerKind
  }
}

function describeVersionMetadata(version: ArtifactVersionRecord) {
  const metadata = version.metadata ?? {}
  const parts: string[] = []

  if (metadata.registrationSource === 'schedule_reported_output') {
    parts.push('reported by producing job')
  } else if (metadata.registrationSource === 'schedule_manual_registration') {
    parts.push('registered manually')
  }

  if (typeof metadata.scheduleKind === 'string') {
    parts.push(`schedule kind: ${metadata.scheduleKind}`)
  }

  return parts.join(' • ')
}

export function ArtifactFamilyPanel({
  family,
  versions,
  showFamilyKey = true,
}: {
  family: ArtifactFamilyRecord
  versions: ArtifactVersionRecord[]
  showFamilyKey?: boolean
}) {
  return (
    <div
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
        <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
          <Link
            href={`/artifacts/${family.id}`}
            style={{ fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
          >
            {family.title}
          </Link>
          <p
            style={{
              margin: 0,
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
            }}
          >
            {describeProducerLabel(family)} • {family.producerId} • slot: {family.outputSlot}
          </p>
        </div>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>{family.scope}</span>
      </div>

      {showFamilyKey ? (
        <p
          style={{
            margin: 0,
            color: 'var(--text-tertiary)',
            fontSize: '0.85rem',
            wordBreak: 'break-all',
          }}
        >
          {family.familyKey}
        </p>
      ) : null}

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {versions.map((version) => (
          <div
            id={`artifact-version-${version.id}`}
            key={version.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              alignItems: 'center',
              flexWrap: 'wrap',
              borderTop: '1px solid var(--separator)',
              paddingTop: 'var(--space-2)',
            }}
          >
            <div>
              <strong>{version.versionLabel}</strong>
              <p
                style={{
                  margin: 'var(--space-1) 0 0',
                  color: 'var(--text-secondary)',
                  fontSize: '0.95rem',
                }}
              >
                {version.name}
                {version.runId ? ' • ' : ''}
                {version.runId ? <Link href={`/runs/${version.runId}`}>Run</Link> : null}
                {version.workItemId ? ' • ' : ''}
                {version.workItemId ? <Link href={`/work/${version.workItemId}`}>Work item</Link> : null}
              </p>
              {version.storagePath ? (
                <p
                  style={{
                    margin: 'var(--space-1) 0 0',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.85rem',
                    wordBreak: 'break-all',
                  }}
                >
                  {version.storagePath}
                </p>
              ) : null}
              {describeVersionMetadata(version) ? (
                <p
                  style={{
                    margin: 'var(--space-1) 0 0',
                    color: 'var(--text-tertiary)',
                    fontSize: '0.85rem',
                  }}
                >
                  {describeVersionMetadata(version)}
                </p>
              ) : null}
            </div>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
              {new Date(version.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
