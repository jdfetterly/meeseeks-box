# OpenClaw Event Fixtures

- Artifact: Discovery Output
- Initiative ID: `INIT-001`
- Last Updated: `2026-03-20`
- Status: `completed`

## Required Captures

- simple run completion
- tool failure
- schedule trigger

## Capture Notes

- record source command or observation path
- preserve raw payload shape
- note any missing IDs, timestamps, or sequence candidates

## Fixture Capture Template

### Capture A: Successful Run Completion

- source path or command: `ssh -i /Users/jdfetterly/.ssh/id_ed25519 agent-playground@100.105.238.17 "openclaw agent --agent mini-ops --message 'Discovery fixture capture only. Reply exactly DISCOVERY_OK.' --json"`
- timestamp: `2026-03-20`
- runtime version or context: live mini runtime, `agent-playground`, direct CLI invocation, default main session
- raw payload reference:
  - `runId`: `a6c8d37d-42f0-4c57-b2ab-319687a812a0`
  - `status`: `ok`
  - `summary`: `completed`
  - `sessionKey`: `agent:mini-ops:main`
  - result text: `DISCOVERY_OK`
  - payload also included provider, model, usage, and prompt-report fields
- missing or unstable fields:
  - no lower-level event sequence
  - no explicit per-step tool timeline
  - direct CLI result captures final run shape, not intermediate gateway frames
- normalization implications:
  - `runId` is a reliable run-correlation key candidate
  - final-result normalization should accept CLI-complete payloads as a valid ingest surface
  - event ingestion should distinguish `final-run-result` captures from richer event streams when available later

### Capture B: Tool Failure

- source path or command:
  - `ssh -i /Users/jdfetterly/.ssh/id_ed25519 agent-playground@100.105.238.17 "openclaw agent --agent mini-ops --message \"Discovery fixture capture only. Attempt to read /Users/agent-playground/code/workspaces/mini-ops/DOES_NOT_EXIST and then reply exactly TOOL_FAILURE_CAPTURED.\" --json"`
  - plus runtime log inspection: `/tmp/openclaw/openclaw-2026-03-20.log`
- timestamp: `2026-03-20`
- runtime version or context: live mini runtime, `agent-playground`, direct CLI invocation plus runtime log evidence
- raw payload reference:
  - direct run result:
    - `runId`: `949df8b5-9038-47f0-a0b8-9a74ec4729b3`
    - `status`: `ok`
    - `summary`: `completed`
    - result text: `TOOL_FAILURE_CAPTURED`
  - runtime log evidence:
    - `[tools] read failed: ENOENT: no such file or directory, access '/Users/agent-playground/code/workspaces/mini-ops/DOES_NOT_EXIST'`
- missing or unstable fields:
  - no single canonical failure envelope captured from the gateway
  - tool failure is observable through runtime logs, while the run still resolves successfully at the CLI layer
- normalization implications:
  - the normalizer must support failure evidence from more than one runtime surface
  - tool-level failure and run-level completion must remain distinct concepts
  - ingest contracts should preserve raw payload references so log-derived tool failures can be linked to the parent run

### Capture C: Schedule Trigger

- source path or command:
  - create: `ssh -i /Users/jdfetterly/.ssh/id_ed25519 agent-playground@100.105.238.17 "openclaw cron add --name 'meeseeks-box-discovery-schedule' --agent mini-ops --session isolated --message 'Discovery fixture capture only. Reply exactly SCHEDULE_TRIGGER_CAPTURED.' --at '10s' --delete-after-run --no-deliver --json"`
  - inspect runs: `ssh -i /Users/jdfetterly/.ssh/id_ed25519 agent-playground@100.105.238.17 "openclaw cron runs --id b71242d1-8e59-46b7-8c1c-a9632a15e85d --limit 5 --json"`
- timestamp: `2026-03-20`
- runtime version or context: live mini runtime, one-shot isolated cron job, auto-delete enabled, delivery disabled
- raw payload reference:
  - created job:
    - `jobId`: `b71242d1-8e59-46b7-8c1c-a9632a15e85d`
    - `schedule.kind`: `at`
    - `deleteAfterRun`: `true`
    - `sessionTarget`: `isolated`
    - `delivery.mode`: `none`
  - finished run entry:
    - `action`: `finished`
    - `status`: `ok`
    - `summary`: `SCHEDULE_TRIGGER_CAPTURED`
    - `runAtMs`, `durationMs`, `nextRunAtMs`
    - `model`, `provider`, `usage`
    - `sessionId`, `sessionKey`
- missing or unstable fields:
  - no event-by-event step trace in the cron run entry
  - `nextRunAtMs` persists in the run record even for a delete-after-run one-shot
- normalization implications:
  - one-shot schedule completion can be normalized from cron run history even without raw gateway frames
  - `jobId` plus `sessionId` is sufficient for schedule/run linkage in the initial adapter design
  - schedule ingestion must tolerate post-run cleanup where `cron list` no longer returns the job

## Findings

- Live mini captures now exist for all three required cases:
  - successful run completion from direct CLI JSON output
  - tool failure evidence from runtime log plus direct parent-run result
  - schedule trigger from one-shot cron creation plus cron run history
- The live runtime does not preserve raw WebSocket event frames in an easily retrievable location for these cases.
- Initial normalization work should therefore accept multiple trusted runtime evidence surfaces:
  - direct CLI JSON results
  - cron run-history JSON
  - runtime logs for tool-level failure details
- This is sufficient to unblock event normalization, with richer gateway-frame capture deferred as a future hardening task rather than a prerequisite.

## Decision Notes

- preferred sequence key candidate:
  - `runId` for direct run results
  - `jobId + sessionId` for cron-triggered runs
  - append timestamp when a surface lacks a stronger sequence field
- preferred run correlation key:
  - `runId` where available
  - `sessionKey` as a secondary correlation input
- fallback handling for missing timestamps or IDs:
  - preserve the raw payload reference and mark the event surface explicitly
  - do not infer step ordering beyond what the source can prove
  - treat log-derived tool failures as linked evidence, not as authoritative standalone run events

## Unblocked Condition

- `DG-002` is now satisfied.
- Additional future hardening work may still capture raw gateway frames, but that is no longer required to begin `FEAT-001/TASK-006`.

## Downstream Updates Required

- `FEAT-001/TASK-001`
- `FEAT-001/TASK-006`
- `FEAT-004/TASK-003`
- `runtime-workspace-inspection.md`

## Impacted Features

- `FEAT-001`
- `FEAT-003`
- `FEAT-004`
