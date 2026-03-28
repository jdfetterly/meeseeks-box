// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { maybeSendSlackFallbackForInboxItem } from '@/lib/notifications/slack'
import { listNotificationDeliveries, upsertInboxItem } from '@/lib/product-state/repositories'
import { createProductStateHarness } from '@/lib/testing/harness'

const harnesses: ReturnType<typeof createProductStateHarness>[] = []

function makeHarness() {
  const harness = createProductStateHarness()
  harnesses.push(harness)
  return harness
}

afterEach(() => {
  delete process.env.MEESEEKS_BOX_SLACK_FALLBACK_ENABLED
  delete process.env.MEESEEKS_BOX_SLACK_WEBHOOK_URL
  vi.unstubAllGlobals()

  for (const harness of harnesses.splice(0)) {
    harness.cleanup()
  }
})

describe('slack fallback notifier', () => {
  it('skips when Slack fallback is disabled', async () => {
    const harness = makeHarness()

    const result = await maybeSendSlackFallbackForInboxItem(
      {
        id: 'inbox-1',
        sourceKind: 'approval',
        sourceRef: 'approval-1',
        category: 'approval_required',
        status: 'open',
        title: 'Approval required',
        detail: {},
        dedupeKey: 'approval:approval-1:required',
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:00.000Z',
        resolvedAt: null,
      },
      harness.rootDir,
    )

    expect(result).toMatchObject({
      status: 'skipped',
      reason: 'slack-fallback-disabled',
    })
    expect(listNotificationDeliveries(harness.rootDir)).toHaveLength(0)
  })

  it('sends approval-required items to Slack and records a delivery log', async () => {
    const harness = makeHarness()
    process.env.MEESEEKS_BOX_SLACK_FALLBACK_ENABLED = 'true'
    process.env.MEESEEKS_BOX_SLACK_WEBHOOK_URL = 'https://hooks.slack.test/services/123'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'ok',
    })
    vi.stubGlobal('fetch', fetchMock)
    upsertInboxItem(
      {
        id: 'inbox-approval-1',
        sourceKind: 'approval',
        sourceRef: 'approval-1',
        category: 'approval_required',
        status: 'open',
        title: 'Approval required for work-1',
        detail: {
          workItemId: 'work-1',
        },
        dedupeKey: 'approval:approval-1:required',
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:00.000Z',
        resolvedAt: null,
      },
      harness.rootDir,
    )

    const result = await maybeSendSlackFallbackForInboxItem(
      {
        id: 'inbox-approval-1',
        sourceKind: 'approval',
        sourceRef: 'approval-1',
        category: 'approval_required',
        status: 'open',
        title: 'Approval required for work-1',
        detail: {
          workItemId: 'work-1',
        },
        dedupeKey: 'approval:approval-1:required',
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:00.000Z',
        resolvedAt: null,
      },
      harness.rootDir,
    )

    expect(result).toMatchObject({
      status: 'sent',
      reason: null,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(listNotificationDeliveries(harness.rootDir)[0]).toMatchObject({
      inboxItemId: 'inbox-approval-1',
      channel: 'slack',
      category: 'approval_required',
      status: 'sent',
    })
  })

  it('skips duplicate Slack deliveries for the same inbox dedupe key', async () => {
    const harness = makeHarness()
    process.env.MEESEEKS_BOX_SLACK_FALLBACK_ENABLED = 'true'
    process.env.MEESEEKS_BOX_SLACK_WEBHOOK_URL = 'https://hooks.slack.test/services/123'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'ok',
    })
    vi.stubGlobal('fetch', fetchMock)
    upsertInboxItem(
      {
        id: 'inbox-approval-2',
        sourceKind: 'approval',
        sourceRef: 'approval-2',
        category: 'approval_required',
        status: 'open',
        title: 'Approval required',
        detail: {},
        dedupeKey: 'approval:approval-2:required',
        createdAt: '2026-03-21T18:00:00.000Z',
        updatedAt: '2026-03-21T18:00:00.000Z',
        resolvedAt: null,
      },
      harness.rootDir,
    )
    const item = {
      id: 'inbox-approval-2',
      sourceKind: 'approval',
      sourceRef: 'approval-2',
      category: 'approval_required',
      status: 'open' as const,
      title: 'Approval required',
      detail: {},
      dedupeKey: 'approval:approval-2:required',
      createdAt: '2026-03-21T18:00:00.000Z',
      updatedAt: '2026-03-21T18:00:00.000Z',
      resolvedAt: null,
    }

    await maybeSendSlackFallbackForInboxItem(item, harness.rootDir)
    const second = await maybeSendSlackFallbackForInboxItem(item, harness.rootDir)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second).toMatchObject({
      status: 'skipped',
      reason: 'already-delivered',
    })
  })
})
