// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import * as conversationRoute from '@/app/api/product-state/conversations/route'
import { closeProductStateDb } from '@/lib/product-state/db'
import * as draftPromoteRoute from '@/app/api/product-state/drafts/[id]/promote/route'
import * as draftRoute from '@/app/api/product-state/drafts/route'
import * as launchRoute from '@/app/api/product-state/launch/route'
import * as presetRoute from '@/app/api/product-state/presets/route'
import {
  listLaunchDrafts,
  listRunSummaries,
  listRuns,
  listScheduleSummaries,
  listWorkItemSummaries,
  listWorkItems,
} from '@/lib/product-state/repositories'

const tempDirs: string[] = []

function useTempStateDir() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-launch-'))
  tempDirs.push(dir)
  process.env.MEESEEKS_BOX_STATE_DIR = dir
}

afterEach(() => {
  closeProductStateDb()
  delete process.env.MEESEEKS_BOX_STATE_DIR

  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('product-state launch api', () => {
  it('creates a run-now launch and seeds canonical summaries', async () => {
    useTempStateDir()

    const response = await launchRoute.POST(
      new Request('http://localhost/api/product-state/launch', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Review overnight failures',
          title: 'Overnight review',
          scope: 'ops',
          agentId: 'mini-ops',
          timing: 'now',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )

    expect(response.status).toBe(201)
    const payload = await response.json()

    expect(payload.launch.timing).toBe('now')
    expect(payload.launch.runId).toBeTruthy()
    expect(listRunSummaries()).toHaveLength(1)
    expect(listWorkItemSummaries()).toHaveLength(1)
  })

  it('creates a schedule-once launch from a preset and marks runtime sync pending', async () => {
    useTempStateDir()

    const presetResponse = await presetRoute.POST(
      new Request('http://localhost/api/product-state/presets', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Morning review',
          scope: 'ops',
          agentId: 'mini-ops',
          timingPreference: 'schedule_once',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )
    const preset = await presetResponse.json()

    const response = await launchRoute.POST(
      new Request('http://localhost/api/product-state/launch', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Review overnight failures',
          presetId: preset.preset.id,
          scheduledAt: '2026-03-21T16:00:00.000Z',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )

    expect(response.status).toBe(201)
    const payload = await response.json()

    expect(payload.launch.timing).toBe('schedule_once')
    expect(payload.launch.scheduleId).toBeTruthy()
    expect(payload.launch.runtimeSyncStatus).toBe('pending')
    expect(listScheduleSummaries()).toHaveLength(1)
    expect(listScheduleSummaries()[0].status).toBe('pending_sync')
    expect(listWorkItemSummaries()[0].displayStatus).toBe('scheduled')
  })

  it('creates drafts outside the main board path and lists them separately', async () => {
    useTempStateDir()

    const response = await launchRoute.POST(
      new Request('http://localhost/api/product-state/launch', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Research competitors',
          scope: 'ops',
          agentId: 'mini-ops',
          timing: 'draft',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )

    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload.launch.timing).toBe('draft')
    expect(payload.launch.draftId).toBeTruthy()
    expect(payload.launch.workItemId).toBeNull()
    expect(listLaunchDrafts()).toHaveLength(1)
    expect(listWorkItems()).toHaveLength(0)

    const listResponse = await draftRoute.GET()
    const listed = await listResponse.json()
    expect(listed.drafts).toHaveLength(1)
  })

  it('promotes a draft into real work and removes it from the draft registry', async () => {
    useTempStateDir()

    const createResponse = await launchRoute.POST(
      new Request('http://localhost/api/product-state/launch', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Research competitors',
          scope: 'ops',
          agentId: 'mini-ops',
          timing: 'draft',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )
    const created = await createResponse.json()

    const promoteResponse = await draftPromoteRoute.POST(
      new Request(`http://localhost/api/product-state/drafts/${created.launch.draftId}/promote`, {
        method: 'POST',
        body: JSON.stringify({ timing: 'now' }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
      { params: Promise.resolve({ id: created.launch.draftId }) },
    )

    expect(promoteResponse.status).toBe(201)
    expect(listLaunchDrafts()).toHaveLength(0)
    expect(listWorkItems()).toHaveLength(1)
    expect(listRuns()).toHaveLength(1)
  })

  it('promotes a draft into a one-shot schedule when scheduledAt is provided', async () => {
    useTempStateDir()

    const createResponse = await launchRoute.POST(
      new Request('http://localhost/api/product-state/launch', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Prepare weekly brief',
          scope: 'ops',
          agentId: 'mini-ops',
          timing: 'draft',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )
    const created = await createResponse.json()

    const promoteResponse = await draftPromoteRoute.POST(
      new Request(`http://localhost/api/product-state/drafts/${created.launch.draftId}/promote`, {
        method: 'POST',
        body: JSON.stringify({
          timing: 'schedule_once',
          scheduledAt: '2026-03-21T16:00:00.000Z',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
      { params: Promise.resolve({ id: created.launch.draftId }) },
    )

    expect(promoteResponse.status).toBe(201)
    expect(listLaunchDrafts()).toHaveLength(0)
    expect(listScheduleSummaries()).toHaveLength(1)
    expect(listWorkItemSummaries()[0].displayStatus).toBe('scheduled')
  })

  it('links launch-created work back to a canonical conversation', async () => {
    useTempStateDir()

    const conversationResponse = await conversationRoute.POST(
      new Request('http://localhost/api/product-state/conversations', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Conversation follow-up',
          scope: 'ops',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )
    const conversation = await conversationResponse.json()

    const response = await launchRoute.POST(
      new Request('http://localhost/api/product-state/launch', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Turn this thread into work',
          title: 'Conversation follow-up',
          scope: 'ops',
          agentId: 'mini-ops',
          timing: 'now',
          conversationId: conversation.conversation.id,
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )

    expect(response.status).toBe(201)
    expect(listWorkItems()[0].sourceConversationId).toBe(conversation.conversation.id)
    expect(listRuns()[0].conversationId).toBe(conversation.conversation.id)
  })
})
