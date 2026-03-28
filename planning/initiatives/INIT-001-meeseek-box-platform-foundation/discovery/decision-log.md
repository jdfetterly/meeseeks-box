# Discovery Decision Log

- Artifact: Discovery Decision Log
- Initiative ID: `INIT-001`
- Last Updated: `2026-03-20`
- Status: `draft`

## Purpose

Record the current selected path for each discovery area once evidence is strong enough to stop downstream planning from drifting.

## Decision Entries

### D-001 Claw-Tower Cutover Path

- status: `chosen`
- source artifact: `claw-tower-audit.md`
- chosen path: preserve the existing Next.js shell primitives, but cut over chat and Kanban truth from browser-local stores to the new canonical product-state layer with no import path
- rationale: the `claw-tower/` implementation repo confirms reusable shell/navigation primitives already exist, while chat and board truth are explicitly stored in `localStorage`
- downstream docs to update:
  - `FEAT-000/TASK-003`
  - `FEAT-001/TASK-001`
  - `FEAT-002/TASK-001`

### D-002 Event Normalization Fixture Basis

- status: `chosen`
- source artifact: `openclaw-event-fixtures.md`
- chosen path: use live CLI result payloads, cron run-history payloads, and runtime-log evidence as the initial normalization basis; defer raw gateway-frame capture to later hardening work
- rationale: the live mini produced reliable real-world captures for run completion, tool-failure context, and one-shot schedule completion, while preserved gateway logs did not expose retrievable raw frame payloads
- downstream docs to update:
  - `FEAT-001/TASK-001`
  - `FEAT-001/TASK-006`
  - `FEAT-003/TASK-001`
  - `FEAT-004/TASK-003`

### D-003 Approval Integration Path

- status: `chosen`
- source artifact: `approval-capability-check.md`
- chosen path: native OpenClaw approvals integration over gateway `exec.approval.*` methods and events
- rationale: mini CLI, docs, protocol schema, and server-method implementation all confirm approvals as a first-class native contract
- downstream docs to update:
  - `shared-contracts.md`
  - `FEAT-004/TASK-001`
  - `FEAT-004/TASK-003`

### D-004 One-Shot Scheduling Path

- status: `chosen`
- source artifact: `one-shot-scheduling-check.md`
- chosen path: treat one-shot scheduling as `runtime-native`
- rationale: OpenClaw explicitly models one-shot jobs via `schedule.kind = "at"` and CLI `--at`
- downstream docs to update:
  - `shared-contracts.md`
  - `FEAT-002/TASK-001`
  - `FEAT-002/TASK-004`

### D-005 Runtime Workspace Allowlist Basis

- status: `chosen`
- source artifact: `runtime-workspace-inspection.md`
- chosen path: initial write-through allowlist should target the OpenClaw-compatible workspace memory layout under `mini-ops`:
  - `WORKSPACE_PATH/MEMORY.md`
  - `WORKSPACE_PATH/memory/*.md`
  - `WORKSPACE_PATH/memory/*.json`
  bootstrap automation remains disabled by default and must be explicitly enabled before Meeseek Box creates missing memory paths
- rationale: `openclaw memory status --json` explicitly expects workspace memory under the `mini-ops` workspace, runtime logs already show ENOENT lookups for missing daily memory files and `MEMORY.md`, and current global `.openclaw` files remain runtime-owned
- downstream docs to update:
  - `shared-contracts.md`
  - `FEAT-003/TASK-001`
  - `FEAT-003/TASK-002`
  - `FEAT-003/TASK-006`
