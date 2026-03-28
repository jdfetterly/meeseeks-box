import 'server-only'

import { existsSync, statSync } from 'node:fs'
import { basename, extname, resolve, relative } from 'node:path'
import path from 'node:path'
import { resolveWorkspacePath } from '@/lib/memory/workspace'
import { generateId } from '@/lib/id'
import {
  projectInboxFromScheduleSummary,
  syncScheduleSummary,
  syncWorkItemSummary,
} from '@/lib/product-state/projections'
import type { DomainScope } from '@/lib/product-state/entities'
import {
  resolveReviewItemById,
  getScheduleById,
  getWorkItemById,
  getArtifactFamilyById,
  createArtifactVersion,
  getArtifactFamilyByFamilyKey,
  listArtifactFamilies,
  listArtifactVersionsByFamilyId,
  listReviewItems,
  updateWorkItem,
  updateSchedule,
  upsertReviewItem,
  upsertArtifactFamily,
} from '@/lib/product-state/repositories'

export type ArtifactProducerKind = 'schedule' | 'work_item' | 'manual'

export interface ArtifactRegistrationResult {
  family: ReturnType<typeof upsertArtifactFamily>
  version: ReturnType<typeof createArtifactVersion>
}

export interface ScheduleArtifactRegistrationInput {
  scheduleId: string
  filePath: string
  outputSlot?: string | null
  title?: string | null
  registrationSource?: 'schedule_manual_registration' | 'schedule_reported_output' | null
}

export interface ScheduleOutputReportInput extends ScheduleArtifactRegistrationInput {
  reportedAt?: string | null
}

export function deriveArtifactFamilyKey(input: {
  producerKind: ArtifactProducerKind
  producerId: string
  outputSlot?: string | null
  name?: string | null
}) {
  const fallbackSlot = input.name ? path.basename(input.name) : 'default'
  const outputSlot = (input.outputSlot?.trim() || fallbackSlot).replaceAll(/\s+/g, '-')
  return `${input.producerKind}:${input.producerId}:${outputSlot}`
}

function inferMimeType(filePath: string) {
  const extension = extname(filePath).toLowerCase()

  switch (extension) {
    case '.md':
      return 'text/markdown'
    case '.json':
      return 'application/json'
    case '.csv':
      return 'text/csv'
    case '.pdf':
      return 'application/pdf'
    case '.txt':
      return 'text/plain'
    default:
      return null
  }
}

function ensureWorkspaceFilePath(filePath: string, explicitWorkspacePath?: string | null) {
  const workspacePath = resolveWorkspacePath(explicitWorkspacePath)

  if (!workspacePath) {
    throw new Error('Workspace path is not configured')
  }

  const absoluteFilePath = resolve(filePath)
  const absoluteWorkspacePath = resolve(workspacePath)
  const relativeToWorkspace = relative(absoluteWorkspacePath, absoluteFilePath)

  if (
    relativeToWorkspace.startsWith('..') ||
    relativeToWorkspace === '..' ||
    (!relativeToWorkspace && absoluteFilePath !== absoluteWorkspacePath)
  ) {
    throw new Error('Artifacts must reference files inside the configured workspace')
  }

  if (!existsSync(absoluteFilePath)) {
    throw new Error(`Artifact file does not exist: ${absoluteFilePath}`)
  }

  const stats = statSync(absoluteFilePath)

  if (!stats.isFile()) {
    throw new Error('Artifacts must reference real files on disk')
  }

  return {
    workspacePath: absoluteWorkspacePath,
    absoluteFilePath,
    relativeToWorkspace,
  }
}

export function registerArtifactVersion(
  input: {
    scope: DomainScope
    producerKind: ArtifactProducerKind
    producerId: string
    outputSlot?: string | null
    title: string
    runId?: string | null
    workItemId?: string | null
    name: string
    mimeType?: string | null
    storagePath?: string | null
    metadata?: Record<string, unknown> | null
    createdAt?: string
  },
  rootDir = process.cwd(),
): ArtifactRegistrationResult {
  const familyKey = deriveArtifactFamilyKey({
    producerKind: input.producerKind,
    producerId: input.producerId,
    outputSlot: input.outputSlot,
    name: input.name,
  })
  const family =
    getArtifactFamilyByFamilyKey(familyKey, rootDir) ??
    upsertArtifactFamily(
      {
        id: generateId(),
        familyKey,
        title: input.title,
        scope: input.scope,
        producerKind: input.producerKind,
        producerId: input.producerId,
        outputSlot: input.outputSlot?.trim() || path.basename(input.name),
      },
      rootDir,
    )

  const version = createArtifactVersion(
    {
      artifactFamilyId: family.id,
      runId: input.runId ?? null,
      workItemId: input.workItemId ?? null,
      name: input.name,
      mimeType: input.mimeType ?? null,
      storagePath: input.storagePath ?? null,
      metadata: input.metadata ?? null,
      createdAt: input.createdAt,
    },
    rootDir,
  )

  return { family, version }
}

export function registerScheduleArtifactFile(
  input: ScheduleArtifactRegistrationInput,
  rootDir = process.cwd(),
): ArtifactRegistrationResult {
  const schedule = getScheduleById(input.scheduleId, rootDir)

  if (!schedule) {
    throw new Error(`Unknown schedule: ${input.scheduleId}`)
  }

  const { absoluteFilePath } = ensureWorkspaceFilePath(input.filePath)
  const workItem = schedule.sourceRef ? getWorkItemById(schedule.sourceRef, rootDir) : null
  const artifactTitle =
    input.title?.trim() || `${schedule.label} output`

  return registerArtifactVersion(
    {
      scope: workItem?.scope ?? 'ops',
      producerKind: 'schedule',
      producerId: schedule.id,
      outputSlot: input.outputSlot?.trim() || basename(absoluteFilePath),
      title: artifactTitle,
      runId: null,
      workItemId: workItem?.id ?? null,
      name: basename(absoluteFilePath),
      mimeType: inferMimeType(absoluteFilePath),
      storagePath: absoluteFilePath,
      metadata: {
        registrationSource: input.registrationSource?.trim() || 'schedule_manual_registration',
        scheduleKind: schedule.scheduleKind,
        linkedWorkItemId: workItem?.id ?? null,
      },
    },
    rootDir,
  )
}

export function reportScheduleOutputFile(
  input: ScheduleOutputReportInput,
  rootDir = process.cwd(),
) {
  const schedule = getScheduleById(input.scheduleId, rootDir)

  if (!schedule) {
    throw new Error(`Unknown schedule: ${input.scheduleId}`)
  }

  const registration = registerScheduleArtifactFile(
    {
      ...input,
      registrationSource: 'schedule_reported_output',
    },
    rootDir,
  )
  const reportedAt = input.reportedAt?.trim() || new Date().toISOString()
  const updatedSchedule = updateSchedule(
    schedule.id,
    {
      status: schedule.scheduleKind === 'at' ? 'completed' : 'scheduled',
      nextRunAt: schedule.scheduleKind === 'at' ? null : schedule.nextRunAt,
      lastRunAt: reportedAt,
      lastSuccessAt: reportedAt,
      consecutiveFailures: 0,
      missedRunFlag: false,
      metadata: {
        ...(schedule.metadata ?? {}),
        lastRunOutcome: 'completed',
        lastReportedOutputPath: registration.version.storagePath,
        lastArtifactFamilyId: registration.family.id,
        lastArtifactVersionId: registration.version.id,
      },
    },
    rootDir,
  )
  const scheduleSummary = syncScheduleSummary(schedule.id, rootDir)
  projectInboxFromScheduleSummary(scheduleSummary, rootDir)
  const linkedWorkItem =
    typeof schedule.sourceRef === 'string' && schedule.sourceRef
      ? getWorkItemById(schedule.sourceRef, rootDir)
      : null

  if (linkedWorkItem) {
    updateWorkItem(
      linkedWorkItem.id,
      {
        reviewState: 'review_ready',
        status: linkedWorkItem.status === 'completed' ? linkedWorkItem.status : 'completed',
      },
      rootDir,
    )
    syncWorkItemSummary(linkedWorkItem.id, rootDir)

    const existingReviewItem = listReviewItems({ status: 'open' }, rootDir).find(
      (item) => item.workItemId === linkedWorkItem.id,
    )

    if (existingReviewItem) {
      resolveReviewItemById(existingReviewItem.id, reportedAt, rootDir)
    }

    upsertReviewItem(
      {
        id: generateId(),
        projectId: linkedWorkItem.projectId,
        workItemId: linkedWorkItem.id,
        artifactIds: [registration.version.id],
        producedByAgentId: linkedWorkItem.delegatedAgentId,
        summary: `${schedule.label} produced a new output ready for review.`,
        reviewReason: 'Fresh scheduled output is ready for human review.',
        status: 'open',
        createdAt: reportedAt,
        updatedAt: reportedAt,
        reviewedAt: null,
      },
      rootDir,
    )
  }

  return {
    registration,
    schedule: updatedSchedule,
    scheduleSummary,
  }
}

export function listArtifactRegistry(rootDir = process.cwd()) {
  return listArtifactFamilies(rootDir).map((family) => ({
    family,
    versions: listArtifactVersionsByFamilyId(family.id, rootDir),
  }))
}

export function getArtifactRegistryEntryByFamilyId(familyId: string, rootDir = process.cwd()) {
  const family = getArtifactFamilyById(familyId, rootDir)

  if (!family) {
    return null
  }

  return {
    family,
    versions: listArtifactVersionsByFamilyId(family.id, rootDir),
  }
}

export function listArtifactRegistryForWorkItem(workItemId: string, rootDir = process.cwd()) {
  return listArtifactRegistry(rootDir).filter(({ family, versions }) => {
    if (family.producerKind === 'work_item' && family.producerId === workItemId) {
      return true
    }

    return versions.some((version) => version.workItemId === workItemId)
  })
}

export function listArtifactRegistryForRun(runId: string, rootDir = process.cwd()) {
  return listArtifactRegistry(rootDir).filter(({ versions }) =>
    versions.some((version) => version.runId === runId),
  )
}

export function listArtifactRegistryForSchedule(scheduleId: string, rootDir = process.cwd()) {
  return listArtifactRegistry(rootDir).filter(
    ({ family }) => family.producerKind === 'schedule' && family.producerId === scheduleId,
  )
}
