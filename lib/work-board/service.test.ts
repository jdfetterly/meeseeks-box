// @vitest-environment node

import { afterEach, describe, expect, it } from 'vitest'
import { createLaunch } from '@/lib/launch/service'
import { syncWorkItemSummary } from '@/lib/product-state/projections'
import { listWorkItems, updateWorkItem } from '@/lib/product-state/repositories'
import { createProductStateHarness } from '@/lib/testing/harness'
import { listBoardLanes } from '@/lib/work-board/service'

const harnesses: ReturnType<typeof createProductStateHarness>[] = []

function makeHarness() {
  const harness = createProductStateHarness()
  harnesses.push(harness)
  return harness
}

afterEach(() => {
  for (const harness of harnesses.splice(0)) {
    harness.cleanup()
  }
})

describe('work board service', () => {
  it('groups run-now and scheduled work into project workflow lanes by default', () => {
    const harness = makeHarness()

    createLaunch(
      {
        prompt: 'Review failures',
        title: 'Review failures',
        scope: 'ops',
        agentId: 'mini-ops',
        timing: 'now',
      },
      harness.rootDir,
    )
    createLaunch(
      {
        prompt: 'Morning review',
        title: 'Morning review',
        scope: 'ops',
        agentId: 'mini-ops',
        timing: 'schedule_once',
        scheduledAt: '2026-03-21T16:00:00.000Z',
      },
      harness.rootDir,
    )

    const lanes = listBoardLanes(harness.rootDir)

    const todoCards = lanes.find((lane) => lane.lane === 'todo')?.cards ?? []
    expect(todoCards).toHaveLength(2)
    expect(todoCards.some((card) => card.scheduleStatus === 'pending_sync')).toBe(true)

    const statusLanes = listBoardLanes({ mode: 'status' }, harness.rootDir)
    expect(statusLanes.find((lane) => lane.lane === 'queued')?.cards).toHaveLength(1)
    expect(statusLanes.find((lane) => lane.lane === 'scheduled')?.cards).toHaveLength(1)
  })

  it('keeps archived standing work items off the main board', () => {
    const harness = makeHarness()

    createLaunch(
      {
        prompt: 'Archived recurring work',
        title: 'Archived recurring work',
        scope: 'ops',
        agentId: 'mini-ops',
        timing: 'schedule_once',
        scheduledAt: '2026-03-21T16:00:00.000Z',
      },
      harness.rootDir,
    )

    const workItem = listWorkItems(harness.rootDir)[0]
    updateWorkItem(workItem.id, { status: 'archived' }, harness.rootDir)
    syncWorkItemSummary(workItem.id, harness.rootDir)

    const lanesBefore = listBoardLanes(harness.rootDir)
    const totalVisibleCards = lanesBefore.reduce((sum, lane) => sum + lane.cards.length, 0)
    expect(totalVisibleCards).toBe(0)
  })
})
