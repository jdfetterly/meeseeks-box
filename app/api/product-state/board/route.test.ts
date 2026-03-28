// @vitest-environment node

import { mkdtempSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { closeProductStateDb } from '@/lib/product-state/db'
import * as boardRoute from '@/app/api/product-state/board/route'
import * as launchRoute from '@/app/api/product-state/launch/route'

const tempDirs: string[] = []

function useTempStateDir() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'meeseeks-box-board-'))
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

describe('product-state board api', () => {
  it('returns grouped canonical board lanes', async () => {
    useTempStateDir()

    await launchRoute.POST(
      new Request('http://localhost/api/product-state/launch', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Review failures',
          title: 'Review failures',
          scope: 'ops',
          agentId: 'mini-ops',
          timing: 'now',
        }),
        headers: { 'Content-Type': 'application/json' },
      }) as never,
    )

    const response = await boardRoute.GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.lanes.find((lane: { lane: string }) => lane.lane === 'queued')).toBeDefined()
  })
})
