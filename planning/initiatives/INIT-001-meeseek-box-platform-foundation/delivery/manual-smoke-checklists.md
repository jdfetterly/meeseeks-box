# Manual Smoke Checklists

- Artifact: Initiative Manual Smoke Checklists
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Status: `draft`
- Last Updated: `2026-03-19`

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

- Preconditions: app reachable over Tailnet on real iPhone Safari
- Action: launch work, open resulting card, inspect key state
- Expected result: launch and card drilldown are usable without desktop fallback
- Pass/Fail: fail if launch or inspection requires desktop-only affordances

### `MSC-005` One-Shot Schedule Becoming Due

- Preconditions: one-shot scheduled work exists
- Action: let it reach due time or simulate due handling in a near-real environment
- Expected result: item dispatches or surfaces missed/stale state clearly
- Pass/Fail: fail if scheduled work disappears or loses source labeling
