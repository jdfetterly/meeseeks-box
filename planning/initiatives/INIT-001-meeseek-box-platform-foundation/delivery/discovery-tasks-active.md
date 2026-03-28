# Discovery Tasks

- Artifact: Initiative Discovery Tasks
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Status: `draft`
- Last Updated: `2026-03-20`
- Source: `../discovery-gate.md`

## Active Tasks

- [x] `DG-001` Claw-Tower browser-local audit
  Objective: identify browser-local chat/Kanban state, routing entrypoints, and existing shell/navigation assumptions.
  Output: `../discovery/claw-tower-audit.md`
  Blocks: `FEAT-000/TASK-003`, `FEAT-001/TASK-001`
  Evidence to collect:
  - file/module paths for browser-local chat state
  - file/module paths for board or Kanban local state
  - current app shell route definitions and navigation primitives
  Verification:
  - at least one direct file reference for each finding
  - cutover candidates listed as disable, bypass, or replace
  Stop condition:
  - `FEAT-000` can cite the exact modules to cut over

- [x] `DG-002` OpenClaw event fixture capture
  Objective: capture real OpenClaw outputs for simple run completion, tool failure, and schedule trigger.
  Output: `../discovery/openclaw-event-fixtures.md`
  Blocks: `FEAT-001/TASK-001`, `FEAT-001/TASK-006`
  Evidence to collect:
  - raw payload or log excerpt for a successful run
  - raw payload or log excerpt for a tool failure
  - raw payload or log excerpt for a schedule trigger
  Verification:
  - each capture records source command or observation path
  - each capture notes missing IDs, timestamps, or sequencing fields
  Stop condition:
  - `FEAT-001` can define normalization rules from observed payloads

- [x] `DG-003` Approval capability check
  Objective: determine whether OpenClaw can block/resume externally or whether a wrapper is required.
  Output: `../discovery/approval-capability-check.md`
  Blocks: `FEAT-004/TASK-001`, `FEAT-004/TASK-003`
  Evidence to collect:
  - docs, code path, or runtime observation showing approval pause/resume behavior
  - callback or polling behavior if present
  - failure mode when approval is unavailable
  Verification:
  - the output ends with one recommended path: native or wrapper-mediated
  Stop condition:
  - `FEAT-004` can choose one implementation path without fallback ambiguity

- [x] `DG-004` One-shot scheduling capability check
  Objective: determine whether OpenClaw supports native one-shot scheduling.
  Output: `../discovery/one-shot-scheduling-check.md`
  Blocks: `FEAT-002/TASK-001`, `FEAT-002/TASK-004`
  Evidence to collect:
  - docs, code path, or runtime observation for schedule creation/update/status
  - representation of future-dated single-run schedules, if any
  Verification:
  - the output ends with one chosen source label default: `runtime-native` or `product-managed`
  Stop condition:
  - `FEAT-002` can define the schedule creation and status path concretely

- [ ] `DG-005` Runtime workspace inspection
  Objective: identify actual memory file layout and candidate writable runtime-owned paths.
  Output: `../discovery/runtime-workspace-inspection.md`
  Blocks: `FEAT-003/TASK-001`, `FEAT-003/TASK-002`
  Evidence to collect:
  - workspace path structure
  - observed memory files and naming/layout patterns
  - candidate writable paths versus unsafe paths
  Verification:
  - output separates allowlist candidates from unsafe or unknown paths
  Stop condition:
  - `FEAT-003` can define the initial write-through allowlist

## Exit Condition

The discovery gate is complete only when all five outputs exist and each downstream blocked task can reference a concrete answer rather than an assumption.

## Recommended Execution Order

1. `DG-001` because cutover and shell work should not guess at the current Claw-Tower structure.
2. `DG-002` because event normalization and test harness design depend on real payloads.
3. `DG-003` because approval integration risk is high and affects adapter shape.
4. `DG-004` because one-shot scheduling can reuse the same runtime and adapter context.
5. `DG-005` because memory/workspace write-through rules should be based on observed paths.

## Completion Notes

- Once a task is complete, update the corresponding discovery file with findings and add the chosen default to `../discovery/decision-log.md`.
- If discovery invalidates an existing feature assumption, update the affected feature docs in the same change instead of deferring it.
- `2026-03-20`: `DG-002` completed using live mini captures from three runtime surfaces:
  - direct `openclaw agent --json` final-result output for successful run completion
  - runtime log evidence plus direct parent-run result for tool failure context
  - `openclaw cron add --at ... --json` plus `openclaw cron runs --json` for one-shot schedule trigger
- `2026-03-20`: discovery broadened the memory bootstrap impact:
  - the runtime already attempts to read workspace-local daily memory files and `MEMORY.md`
  - missing workspace memory paths are now a concrete runtime readiness concern, not just a product preference
