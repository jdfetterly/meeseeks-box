// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import {
  archiveCanonicalMemoryEntry,
  getCanonicalMemoryState,
  supersedeCanonicalMemoryEntry,
  writeCanonicalMemoryEntry,
} from '@/lib/memory/service'
import { createProductStateHarness } from '@/lib/testing/harness'

const harnesses: ReturnType<typeof createProductStateHarness>[] = []

function makeHarness() {
  const harness = createProductStateHarness()
  harnesses.push(harness)
  harness.useAsProcessStateDir()
  return harness
}

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.cleanup()
  }
})

describe('canonical memory service', () => {
  it('writes an allowlisted memory file and records entry plus provenance', () => {
    const harness = makeHarness()

    const result = writeCanonicalMemoryEntry(
      {
        scope: 'ops',
        relativePath: '2026-03-21.md',
        content: '# Daily Memory\n',
        contentType: 'markdown',
        summary: 'Daily operations memory',
        sourceRef: 'work-123',
      },
      harness.rootDir,
    )

    expect(result.writeResult.status).toBe('written')
    expect(result.memoryEntry).toMatchObject({
      scope: 'ops',
      entryType: 'note',
      summary: 'Daily operations memory',
    })
    expect(result.memorySource).toMatchObject({
      sourceKind: 'manual_operator_edit',
      sourceRef: 'work-123',
      sourcePath: 'memory/2026-03-21.md',
    })

    const state = getCanonicalMemoryState(harness.rootDir)
    expect(state.memoryEntries).toHaveLength(1)
    expect(state.memorySources).toHaveLength(1)
  })

  it('rejects out-of-allowlist writes without creating partial metadata', () => {
    const harness = makeHarness()

    const result = writeCanonicalMemoryEntry(
      {
        scope: 'ops',
        relativePath: '../escape.md',
        content: 'bad',
        contentType: 'markdown',
      },
      harness.rootDir,
    )

    expect(result.writeResult).toMatchObject({
      status: 'rejected',
      reason: 'path-outside-allowlist',
    })
    const state = getCanonicalMemoryState(harness.rootDir)
    expect(state.memoryEntries).toHaveLength(0)
    expect(state.memorySources).toHaveLength(0)
  })

  it('archives entries in metadata without removing the underlying file', () => {
    const harness = makeHarness()
    const written = writeCanonicalMemoryEntry(
      {
        scope: 'ops',
        relativePath: 'context.md',
        content: '# Context\n',
        contentType: 'markdown',
      },
      harness.rootDir,
    )

    const archived = archiveCanonicalMemoryEntry(written.memoryEntry!.id, harness.rootDir)

    expect(archived.status).toBe('archived')
    expect(archived.archivedAt).toBeTruthy()
    expect(getCanonicalMemoryState(harness.rootDir).memoryEntries[0].status).toBe('archived')
  })

  it('marks older entries as superseded without deleting source content', () => {
    const harness = makeHarness()
    const older = writeCanonicalMemoryEntry(
      {
        scope: 'ops',
        relativePath: 'old.md',
        content: '# Old\n',
        contentType: 'markdown',
      },
      harness.rootDir,
    )
    const replacement = writeCanonicalMemoryEntry(
      {
        scope: 'ops',
        relativePath: 'new.md',
        content: '# New\n',
        contentType: 'markdown',
      },
      harness.rootDir,
    )

    const superseded = supersedeCanonicalMemoryEntry(
      older.memoryEntry!.id,
      replacement.memoryEntry!.id,
      harness.rootDir,
    )

    expect(superseded.status).toBe('superseded')
    expect(superseded.supersededById).toBe(replacement.memoryEntry!.id)
    expect(superseded.archivedAt).toBeTruthy()
  })
})
