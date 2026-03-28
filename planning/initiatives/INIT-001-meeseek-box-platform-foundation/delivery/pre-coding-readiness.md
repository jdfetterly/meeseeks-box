# Pre-Coding Readiness

- Artifact: Initiative Pre-Coding Readiness
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Status: `in_progress`
- Last Updated: `2026-03-20`

## Purpose

List the minimum prerequisites that must be satisfied before product coding can begin without guessing at the runtime, adapter, shell, or workspace contracts.

## Current State

- Planning tree exists and is structured through requirements, FDDs, TDDs, and delivery tasks.
- Discovery packet exists and is executable.
- The current workspace now contains the cloned `claw-tower/` implementation repo for shell and UI discovery.
- The target implementation location is confirmed: Meeseek Box will be built as a new repo in this workspace, with `claw-tower/` used as the starting shell/reference.
- The Meeseek Box root repo has now been bootstrapped from the Claw-Tower shell and validated with `npx next build --webpack`.

## Hard Blockers

- [x] OpenClaw runtime behavior is now discoverable from local source, docs, and live captured runtime evidence.

- [x] Runtime workspace path and memory layout are now inspectable.
  Needed for:
  - `DG-005` runtime workspace inspection
  - `FEAT-003` write-through allowlist definition

## Strongly Recommended Before Coding

- [x] Confirm where Meeseek Box code will live:
  - this repo as a new implementation repo
  - `claw-tower/` used as starting shell/reference

- [x] Confirm the starting shell:
  - current Claw-Tower codebase as the primary UI baseline

- [x] Confirm whether OpenClaw can be inspected locally in this environment or whether discovery must be performed against docs plus the live mini runtime.
  - local `openclaw/` checkout exists and live mini discovery has already been used for approvals, cron, and memory-path checks

## Discovery Deliverables Required Before Coding

- [x] `discovery/claw-tower-audit.md` with real module/file findings
- [x] `discovery/openclaw-event-fixtures.md` with captured payloads
- [x] `discovery/approval-capability-check.md` with native vs wrapper decision
- [x] `discovery/one-shot-scheduling-check.md` with runtime-native vs product-managed decision
- [x] `discovery/runtime-workspace-inspection.md` with initial allowlist candidates
- [x] `discovery/decision-log.md` updated with chosen defaults

## Minimum Coding Start Line

Full integration-heavy coding can start safely once:
1. `DG-001` is complete
2. at least one real OpenClaw event capture exists
3. the initial runtime workspace allowlist candidate set is known
4. the first Meeseek Box repo bootstrap path is defined: copy/adapt shell from `claw-tower/` into the new repo structure without treating `claw-tower/` itself as the shipping repo

## What Can Start Before All Discovery Is Closed

The following work can begin now without waiting on `DG-002`:
- `FEAT-000/TASK-001` route and navigation skeleton
- `FEAT-000/TASK-002` responsive viewport and drawer system
- Meeseek Box repo bootstrap from the Claw-Tower shell
- browser-local chat/Kanban cutover scaffolding that does not finalize event-ingest contracts

## Progress Since Coding Began

- `FEAT-000/TASK-001`: started and partially complete
- `FEAT-000/TASK-002`: started and partially complete
- `FEAT-000/TASK-003`: scaffolding started with explicit legacy-local-state gating
- `FEAT-001/TASK-001`: discovery-backed adapter contract is now implemented in code at a starter level
- `FEAT-001/TASK-003`: shared harness scaffolding is now implemented in code at a starter level
- Remaining blocker before memory/runtime-heavy coding:
  - final bootstrap decision for missing workspace memory paths

## First Coding Slice After Readiness

Once the above are satisfied, begin with:
1. `FEAT-000/TASK-001` route and navigation skeleton
2. `FEAT-000/TASK-002` responsive viewport and drawer system
3. `FEAT-001/TASK-001` shared adapter contract finalized from discovery
4. `FEAT-001/TASK-002` canonical schema and feature-flag foundation
