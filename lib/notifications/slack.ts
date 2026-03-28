import 'server-only'

import { generateId } from '@/lib/id'
import type { InboxItemRecord } from '@/lib/product-state/entities'
import {
  getNotificationDeliveryByDedupeKey,
  upsertNotificationDelivery,
} from '@/lib/product-state/repositories'

export interface SlackFallbackResult {
  status: 'sent' | 'failed' | 'skipped'
  reason: string | null
}

function slackEnabled() {
  return process.env.MEESEEKS_BOX_SLACK_FALLBACK_ENABLED === 'true'
}

function slackWebhookUrl() {
  return process.env.MEESEEKS_BOX_SLACK_WEBHOOK_URL?.trim() ?? null
}

function isHighSignalInboxItem(item: InboxItemRecord) {
  if (item.category === 'approval_required') {
    return true
  }

  if (item.category === 'run_failure' || item.category === 'tool_failure') {
    return item.detail.retryable !== true
  }

  if (item.category === 'missed_schedule') {
    return item.detail.highSignal === true
  }

  return false
}

function buildSlackPayload(item: InboxItemRecord) {
  return {
    text: `[Meeseek Box] ${item.title}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${item.title}*\nCategory: \`${item.category}\`\nSource: \`${item.sourceKind}:${item.sourceRef}\``,
        },
      },
    ],
  }
}

export async function maybeSendSlackFallbackForInboxItem(
  item: InboxItemRecord | null,
  rootDir = process.cwd(),
) {
  if (!item || item.status !== 'open') {
    return {
      status: 'skipped',
      reason: 'inbox-item-not-open',
    } satisfies SlackFallbackResult
  }

  if (!slackEnabled()) {
    return {
      status: 'skipped',
      reason: 'slack-fallback-disabled',
    } satisfies SlackFallbackResult
  }

  if (!isHighSignalInboxItem(item)) {
    return {
      status: 'skipped',
      reason: 'category-not-eligible',
    } satisfies SlackFallbackResult
  }

  const webhookUrl = slackWebhookUrl()

  if (!webhookUrl) {
    return {
      status: 'skipped',
      reason: 'slack-webhook-unconfigured',
    } satisfies SlackFallbackResult
  }

  const dedupeKey = `slack:${item.dedupeKey}`
  const existing = getNotificationDeliveryByDedupeKey(dedupeKey, rootDir)

  if (existing?.status === 'sent' || existing?.status === 'skipped') {
    return {
      status: 'skipped',
      reason: 'already-delivered',
    } satisfies SlackFallbackResult
  }

  const payload = buildSlackPayload(item)
  const timestamp = new Date().toISOString()

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const responseText = await response.text()

    upsertNotificationDelivery(
      {
        id: generateId(),
        inboxItemId: item.id,
        channel: 'slack',
        category: item.category,
        status: response.ok ? 'sent' : 'failed',
        dedupeKey,
        payload,
        response: {
          ok: response.ok,
          status: response.status,
          body: responseText,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      rootDir,
    )

    return {
      status: response.ok ? 'sent' : 'failed',
      reason: response.ok ? null : `slack-http-${response.status}`,
    } satisfies SlackFallbackResult
  } catch (error) {
    upsertNotificationDelivery(
      {
        id: generateId(),
        inboxItemId: item.id,
        channel: 'slack',
        category: item.category,
        status: 'failed',
        dedupeKey,
        payload,
        response: {
          error: error instanceof Error ? error.message : String(error),
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      rootDir,
    )

    return {
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error),
    } satisfies SlackFallbackResult
  }
}
