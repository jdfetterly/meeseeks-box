// @vitest-environment node

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { closeProductStateDb } from '@/lib/product-state/db'
import { createRun, createSchedule, createWorkItem } from '@/lib/product-state/repositories'
import {
  getArtifactRegistryEntryByFamilyId,
  listArtifactRegistry,
  listArtifactRegistryForRun,
  listArtifactRegistryForSchedule,
  listArtifactRegistryForWorkItem,
  registerScheduleArtifactFile,
  registerArtifactVersion,
} from '@/lib/artifacts/service'

const tempRoots: string[] = []

function makeTempRoot() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-artifacts-'))
  tempRoots.push(root)
  return root
}

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    closeProductStateDb(root)
    rmSync(root, { recursive: true, force: true })
  }
})

describe('artifact registry service', () => {
  it('registers repeated outputs under a stable family key with immutable versions', () => {
    const root = makeTempRoot()

    const first = registerArtifactVersion(
      {
        scope: 'ops',
        producerKind: 'schedule',
        producerId: 'job-123',
        outputSlot: 'weekly-brief',
        title: 'Weekly Brief',
        name: 'brief.md',
        storagePath: '/tmp/brief-v1.md',
      },
      root,
    )
    const second = registerArtifactVersion(
      {
        scope: 'ops',
        producerKind: 'schedule',
        producerId: 'job-123',
        outputSlot: 'weekly-brief',
        title: 'Weekly Brief',
        name: 'brief.md',
        storagePath: '/tmp/brief-v2.md',
      },
      root,
    )

    expect(first.family.familyKey).toBe('schedule:job-123:weekly-brief')
    expect(second.family.id).toBe(first.family.id)
    expect(first.version.versionLabel).toBe('v0001')
    expect(second.version.versionLabel).toBe('v0002')

    const registry = listArtifactRegistry(root)
    expect(registry).toHaveLength(1)
    expect(registry[0].versions.map((version) => version.versionLabel)).toEqual([
      'v0002',
      'v0001',
    ])
  })

  it('returns registry detail and producer-scoped artifact views', () => {
    const root = makeTempRoot()
    const workItem = createWorkItem(
      {
        title: 'Artifact-producing work',
        scope: 'ops',
      },
      root,
    )
    const run = createRun(
      {
        scope: 'ops',
        triggerKind: 'manual',
        workItemId: workItem.id,
        agentId: 'mini-ops',
        status: 'completed',
      },
      root,
    )

    const registration = registerArtifactVersion(
      {
        scope: 'ops',
        producerKind: 'work_item',
        producerId: workItem.id,
        outputSlot: 'summary-md',
        title: 'Work Summary',
        runId: run.id,
        workItemId: workItem.id,
        name: 'summary.md',
        storagePath: '/tmp/summary-v1.md',
      },
      root,
    )

    expect(getArtifactRegistryEntryByFamilyId(registration.family.id, root)).toMatchObject({
      family: {
        id: registration.family.id,
        producerId: workItem.id,
      },
    })
    expect(listArtifactRegistryForWorkItem(workItem.id, root)).toHaveLength(1)
    expect(listArtifactRegistryForRun(run.id, root)).toHaveLength(1)
    expect(listArtifactRegistryForWorkItem('work-missing', root)).toHaveLength(0)
    expect(listArtifactRegistryForRun('run-missing', root)).toHaveLength(0)
  })

  it('registers schedule artifact files by referencing existing workspace paths', () => {
    const root = makeTempRoot()
    const workspaceDir = path.join(root, 'workspace')
    const outputDir = path.join(workspaceDir, 'outputs')
    mkdirSync(outputDir, { recursive: true })
    const outputPath = path.join(outputDir, 'weekly-brief.md')
    writeFileSync(outputPath, '# Weekly Brief\n\nHello.\n', 'utf8')

    process.env.WORKSPACE_PATH = workspaceDir

    const workItem = createWorkItem(
      {
        title: 'Weekly brief',
        scope: 'ops',
      },
      root,
    )
    const schedule = createSchedule(
      {
        sourceKind: 'runtime-native',
        sourceRef: workItem.id,
        label: 'Weekly brief schedule',
        status: 'scheduled',
        scheduleKind: 'at',
      },
      root,
    )

    const registration = registerScheduleArtifactFile(
      {
        scheduleId: schedule.id,
        filePath: outputPath,
        outputSlot: 'weekly-brief',
      },
      root,
    )

    expect(registration.family.producerKind).toBe('schedule')
    expect(registration.family.producerId).toBe(schedule.id)
    expect(registration.version.storagePath).toBe(outputPath)
    expect(registration.version.workItemId).toBe(workItem.id)
    expect(registration.version.metadata?.registrationSource).toBe('schedule_manual_registration')
    expect(listArtifactRegistryForSchedule(schedule.id, root)).toHaveLength(1)

    delete process.env.WORKSPACE_PATH
  })
})
