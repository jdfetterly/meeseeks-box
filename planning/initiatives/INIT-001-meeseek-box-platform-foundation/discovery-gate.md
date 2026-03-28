# Discovery Gate

- Artifact: Initiative Discovery Gate
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Status: `draft`
- Last Updated: `2026-03-20`

## Purpose

Capture the implementation truth that blocks reliable planning and coding for the adapter, scheduling, approval, workspace, and browser-local cutover work.

## Required Outputs

### 1. Claw-Tower Audit

- identify where chat state is browser-local
- identify where Kanban/work board state is browser-local
- identify current routing/app shell entrypoints
- identify current responsive layout primitives, if any

### 2. OpenClaw Runtime Fixtures

Capture real outputs for:
- simple run completion
- tool failure
- schedule trigger

These outputs become golden fixtures for normalized event contracts.

### 3. Approval Capability Check

- determine whether OpenClaw can block/resume externally
- if not, document required wrapper path and boundary

### 4. One-Shot Scheduling Capability Check

- determine whether native one-shot scheduling exists
- if unsupported, confirm product-managed delayed execution as the default path

### 5. Runtime Workspace Inspection

- identify actual memory file layout
- identify candidate writable runtime-owned paths
- identify any read-only or unsafe-to-touch locations

## Exit Criteria

- Golden fixture files or documented payload captures exist for the required OpenClaw scenarios.
- The browser-local audit clearly names the code paths that must be disabled or bypassed.
- The adapter boundary and scheduling path can be chosen without guesswork.
- The initial memory allowlist can be defined from observed runtime workspace layout.

## Completion Checklist

- [x] `claw-tower-audit.md` names browser-local state modules, route entrypoints, and shell/navigation primitives.
- [x] `openclaw-event-fixtures.md` contains evidence-backed captures for run completion, tool failure, and schedule trigger.
- [x] `approval-capability-check.md` states whether native external block/resume exists and what wrapper path is required if it does not.
- [x] `one-shot-scheduling-check.md` states whether one-shot scheduling is runtime-native or product-managed.
- [x] `runtime-workspace-inspection.md` identifies candidate writable memory paths and unsafe paths.
- [x] `decision-log.md` records the currently selected defaults and unresolved blockers.
- [x] Blocked feature tasks cite the relevant discovery artifact directly.

## Promotion Tasks After Discovery

Once the checklist is complete:
- update `shared-contracts.md` with confirmed contract shapes and defaults
- update `FEAT-000` cutover tasks with the actual Claw-Tower code paths
- update `FEAT-001` event-ingest and harness tasks with the real fixture sources
- update `FEAT-002` one-shot scheduling tasks with the confirmed runtime-native or product-managed path
- update `FEAT-003` write-through tasks with the observed allowlist candidates
- update `FEAT-004` approval tasks with the confirmed native or wrapper approval path

## Notes

- This is a prerequisite milestone, not backlog research.
- Discovery outputs must be promoted into fixture libraries, contract docs, or feature tasks once captured.
- As of `2026-03-20`, the discovery gate is functionally complete for shell, approvals, one-shot scheduling, runtime fixtures, and workspace allowlist planning.
- Remaining runtime uncertainty is now narrow and implementation-level:
  - how Meeseek Box should bootstrap the missing workspace memory path before memory-facing UX goes live
