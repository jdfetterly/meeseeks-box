# Manual Smoke Checklists

- Artifact: Initiative Manual Smoke Checklists
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Status: `draft`
- Last Updated: `2026-05-02`

## Checklist Inventory

### `MSC-001` Runtime Approval Block/Resume

- Preconditions: approval-required runtime or wrapped action is available
- Action: trigger the action, resolve it through the app
- Expected result: runtime continues or cancels according to the resolution, with no bypass
- Pass/Fail: pass only if audit trail, run state, and runtime behavior all match

### `MSC-002` Slack Fallback Delivery

- Preconditions: Slack fallback is configured and a high-signal event can be triggered
- Action: trigger approval-required or no-retry failure path
- Expected result: Slack alert arrives while the app remains the resolution surface
- Pass/Fail: pass only if alert arrives once and links back to the app context

### `MSC-003` Memory Write-Through

- Preconditions: whitelisted runtime-owned memory path exists
- Action: perform a supported memory edit through the app
- Expected result: only the approved path changes and provenance is visible
- Pass/Fail: fail if any non-whitelisted path is touched or provenance is missing

### `MSC-004` iPhone Launch and Card Inspection

- Preconditions: app reachable over Tailnet on a real iPhone browser, Chrome or Safari
- Action: launch work, open resulting card, inspect key state
- Expected result: launch and card drilldown are usable without desktop fallback
- Pass/Fail: fail if launch or inspection requires desktop-only affordances

### `MSC-005` One-Shot Schedule Becoming Due

- Preconditions: one-shot scheduled work exists
- Action: let it reach due time or simulate due handling in a near-real environment
- Expected result: item dispatches or surfaces missed/stale state clearly
- Pass/Fail: fail if scheduled work disappears or loses source labeling

### `MSC-006` Mobile OpenClaw Direct Chat

- Preconditions: app reachable at `https://jds-mac-mini.tail13d577.ts.net/mobile` from a real iPhone browser, Chrome or Safari; mini production environment has `OPENCLAW_BIN`, `OPENCLAW_GATEWAY_TOKEN`, and local OpenClaw sync mode configured
- Action: send a short command from the mobile command bar or chat sheet
- Expected result: an assistant response appears inline, the message history persists after refresh, and the user is not left with only a queued work item
- Pass/Fail: fail if the flow shows `Launch agentId is required`, creates queued work without a chat response, or silently drops the message
