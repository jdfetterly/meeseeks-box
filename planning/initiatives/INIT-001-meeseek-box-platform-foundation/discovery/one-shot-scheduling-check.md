# One-Shot Scheduling Check

- Artifact: Discovery Output
- Initiative ID: `INIT-001`
- Last Updated: `2026-03-20`
- Status: `complete`

## Questions To Answer

- Does OpenClaw support native one-shot scheduling?
- If yes, what does the creation/status contract look like?
- If not, what does the product-managed fallback need to own?

## Evidence Sources

- docs or references:
  - `claw-tower/CLAUDE.md`
  - `claw-tower/docs/API.md`
  - mini CLI help: `openclaw cron --help`
  - mini CLI output: `openclaw cron list --json`
  - `openclaw/docs/automation/cron-jobs.md`
  - `openclaw/docs/cli/cron.md`
- code paths inspected:
  - `claw-tower/app/api/crons/route.ts`
  - `claw-tower/lib/crons.ts`
  - `claw-tower/lib/cron-runs.ts`
  - `openclaw/src/gateway/protocol/schema/cron.ts`
  - `openclaw/src/config/types.cron.ts`
  - `openclaw/src/gateway/server-methods-list.ts`
- runtime observations:
  - OpenClaw version `2026.3.2`
  - cron commands include `add`, `edit`, `enable`, `disable`, `rm`, `run`, `runs`, `status`
  - current cron list on mini is empty

## Capability Matrix

| Capability | Evidence | Supported | Notes |
| --- | --- | --- | --- |
| Create one-shot schedule | docs + protocol schema + CLI | supported | one-shot jobs are native via `schedule.kind = "at"` / CLI `--at` |
| Update one-shot schedule | docs + CLI + gateway methods | supported | cron jobs are editable via `cron.update` / `openclaw cron edit` |
| Cancel one-shot schedule | docs + CLI + gateway methods | supported | jobs can be removed or disabled via `cron.remove` / CLI `rm` and `disable` |
| Status and health visibility | recurring cron status and run history are available | supported | `lib/crons.ts` and `lib/cron-runs.ts` already surface key health fields |
| Trigger or dispatch semantics | docs + CLI + gateway methods | supported | one-shot jobs can be created, listed, manually run, and auto-delete after success by default |

## Findings

- Current Claw-Tower integration only exposes recurring cron visibility:
  - `openclaw cron list --json` via `lib/crons.ts`
  - filesystem-backed cron run history via `lib/cron-runs.ts`
- The live mini confirms the runtime itself supports cron mutation commands:
  - `add`, `edit`, `enable`, `disable`, `rm`, `run`, `runs`, `status`
- OpenClaw docs and schema confirm that one-shot scheduling is native, not an app-managed workaround:
  - one-shot jobs use `schedule.kind = "at"`
  - CLI surface uses `openclaw cron add --at ...`
  - one-shot jobs delete after success by default unless `deleteAfterRun: false` / `--keep-after-run`
  - config includes retry policy specifically for one-shot jobs
- Claw-Tower already proves that schedule-health fields like last run, next run, last error, consecutive errors, and delivery status can be surfaced for recurring schedules.
- Meeseek Box should treat one-shot scheduling as `runtime-native` in v1.

## Recommended Path

- chosen source label default: `runtime-native`
- rationale: OpenClaw explicitly models one-shot jobs as cron records with `schedule.kind = "at"`
- implications for `OneShotScheduleSource`:
  - default to `runtime-native` for one-shot jobs
  - retain `product-managed` only as contingency if a future product feature schedules outside OpenClaw
- implications for schedule-health fields:
  - recurring schedule health can reuse existing observable fields from `lib/crons.ts`
  - one-shot schedule health should derive from the same cron state/run history model

## Downstream Updates Required

- `shared-contracts.md`
- `FEAT-002/TASK-001`
- `FEAT-002/TASK-004`
- `discovery/decision-log.md`

## Open Questions

- Which exact edit/update fields should Meeseek Box surface initially for one-shot jobs versus defer?

## Impacted Features

- `FEAT-002`
