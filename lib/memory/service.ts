import 'server-only'

import path from 'node:path'
import { generateId } from '@/lib/id'
import { normalizeWorkspaceMemoryRelativePath, writeWorkspaceMemoryFile } from '@/lib/memory/workspace'
import type { WorkspaceMemoryWriteRequest } from '@/lib/openclaw/contracts'
import type {
  MemoryEntryRecord,
  MemorySourceRecord,
} from '@/lib/product-state/entities'
import {
  archiveMemoryEntry,
  createMemorySource,
  getMemoryEntryById,
  getMemoryEntryByCanonicalPath,
  listMemoryEntries,
  listMemorySources,
  supersedeMemoryEntry,
  upsertMemoryEntry,
} from '@/lib/product-state/repositories'

function inferMemoryEntryType(relativePath: string) {
  if (relativePath === 'MEMORY.md') {
    return 'evergreen'
  }

  return relativePath.endsWith('.json') ? 'json' : 'note'
}

function inferMemoryTitle(relativePath: string) {
  if (relativePath === 'MEMORY.md') {
    return 'Workspace Memory'
  }

  return path.basename(relativePath)
}

export function writeCanonicalMemoryEntry(
  input: WorkspaceMemoryWriteRequest & {
    title?: string | null
    summary?: string | null
    sourceKind?: string
    sourceRef?: string | null
    notes?: string | null
  },
  rootDir = process.cwd(),
) {
  const normalizedRelativePath = normalizeWorkspaceMemoryRelativePath(input.relativePath)

  if (!normalizedRelativePath) {
    return {
      writeResult: {
        status: 'rejected',
        absolutePath: null,
        reason: 'path-outside-allowlist',
      } as const,
      memoryEntry: null,
      memorySource: null,
    }
  }

  const writeResult = writeWorkspaceMemoryFile(input)

  if (writeResult.status !== 'written' || !writeResult.absolutePath) {
    return {
      writeResult,
      memoryEntry: null,
      memorySource: null,
    }
  }

  const now = new Date().toISOString()
  const existing = getMemoryEntryByCanonicalPath(writeResult.absolutePath, rootDir)
  const memoryEntry: MemoryEntryRecord = upsertMemoryEntry(
    {
      id: existing?.id ?? generateId(),
      scope: input.scope,
      entryType: inferMemoryEntryType(normalizedRelativePath),
      title: input.title?.trim() || inferMemoryTitle(normalizedRelativePath),
      summary: input.summary ?? null,
      canonicalPath: writeResult.absolutePath,
      status: 'active',
      tags: existing?.tags ?? [],
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastUsedAt: now,
      reviewedAt: existing?.reviewedAt ?? null,
      archivedAt: existing?.archivedAt ?? null,
      supersededById: existing?.supersededById ?? null,
    },
    rootDir,
  )
  const memorySource: MemorySourceRecord = createMemorySource(
    {
      memoryEntryId: memoryEntry.id,
      sourceKind: input.sourceKind ?? 'manual_operator_edit',
      sourceRef: input.sourceRef ?? null,
      sourcePath: normalizedRelativePath,
      notes: input.notes ?? null,
      payload: {
        contentType: input.contentType,
        bytes: Buffer.byteLength(input.content, 'utf8'),
      },
      observedAt: now,
    },
    rootDir,
  )

  return {
    writeResult,
    memoryEntry,
    memorySource,
  }
}

export function getCanonicalMemoryState(rootDir = process.cwd()) {
  return {
    memoryEntries: listMemoryEntries(rootDir),
    memorySources: listMemorySources(rootDir),
  }
}

export function archiveCanonicalMemoryEntry(memoryEntryId: string, rootDir = process.cwd()) {
  return archiveMemoryEntry(memoryEntryId, rootDir)
}

export function supersedeCanonicalMemoryEntry(
  memoryEntryId: string,
  supersededById: string,
  rootDir = process.cwd(),
) {
  return supersedeMemoryEntry(memoryEntryId, supersededById, rootDir)
}

export function getCanonicalMemoryEntry(memoryEntryId: string, rootDir = process.cwd()) {
  return getMemoryEntryById(memoryEntryId, rootDir)
}
