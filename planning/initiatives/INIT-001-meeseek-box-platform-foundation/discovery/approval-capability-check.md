# Approval Capability Check

- Artifact: Discovery Output
- Initiative ID: `INIT-001`
- Last Updated: `2026-03-20`
- Status: `complete`

## Questions To Answer

- Can OpenClaw block/resume externally for approval-gated actions?
- What context is returned with approval-needed states?
- If native support is incomplete, what wrapper path is required?

## Evidence Sources

- docs or references:
  - `claw-tower/CLAUDE.md`
  - mini CLI help: `openclaw approvals --help`
  - mini CLI snapshot: `openclaw approvals get --json`
  - `openclaw/docs/gateway/protocol.md`
  - `openclaw/docs/tools/exec-approvals.md`
  - `openclaw/docs/cli/approvals.md`
- code paths inspected:
  - `claw-tower/app/api/chat/[id]/route.ts`
  - `claw-tower/lib/anthropic.ts`
  - `claw-tower/app/api/crons/route.ts`
  - `claw-tower/lib/crons.ts`
  - `openclaw/src/gateway/server-methods/exec-approval.ts`
  - `openclaw/src/gateway/protocol/schema/exec-approvals.ts`
  - `openclaw/src/gateway/server-methods-list.ts`
  - `openclaw/src/infra/exec-approvals.ts`
- runtime observations:
  - OpenClaw version `2026.3.2`
  - approvals CLI exists with `allowlist`, `get`, and `set`
  - approvals snapshot file exists at `/Users/agent-playground/.openclaw/exec-approvals.json`

## Capability Matrix

| Capability | Evidence | Supported | Notes |
| --- | --- | --- | --- |
| External pause or block | gateway protocol + server method code | supported | `exec.approval.request` creates a pending record, broadcasts `exec.approval.requested`, and waits on `exec.approval.waitDecision` |
| External resume after approval | gateway protocol + server method code | supported | operators resolve with `exec.approval.resolve`; gateway broadcasts `exec.approval.resolved` |
| Approval context payload | `exec-approval.ts`, `exec-approvals.ts`, schema docs | supported | request payload includes command, envKeys, systemRunPlan, cwd, agentId, sessionKey, source routing metadata, timeout |
| Timeout or expiry behavior | `exec-approval.ts`, `infra/exec-approvals.ts` | supported | approvals carry `createdAtMs`, `expiresAtMs`, default timeout is `120000ms`, and expired approvals return null/invalid |
| Failure mode when runtime is unavailable | docs + code + mini snapshot | supported | prompt-required requests fail closed via ask fallback; no approval route can expire immediately |

## Findings

- Current Claw-Tower integration does not include any approval-specific adapter, route, or envelope contract.
- Existing runtime integration is limited to:
  - chat send/history flows
  - cron list via CLI
  - filesystem-backed cron run and Kanban chat-history reads/writes
- The live mini confirms that OpenClaw has a real approvals subsystem:
  - command group: `openclaw approvals`
  - subcommands: `allowlist`, `get`, `set`
  - backing file: `/Users/agent-playground/.openclaw/exec-approvals.json`
- OpenClaw source and docs confirm the gateway approval flow:
  - method: `exec.approval.request`
  - event: `exec.approval.requested`
  - method: `exec.approval.waitDecision`
  - method: `exec.approval.resolve`
  - event: `exec.approval.resolved`
- The emitted `exec.approval.requested` payload contains `id`, `request`, `createdAtMs`, and `expiresAtMs`.
- The `request` payload can include command, envKeys, `systemRunPlan`, cwd, agentId, sessionKey, source routing metadata, and timeout-related fields.
- This is sufficient to define the `ApprovalBridge` and typed Inbox contract for v1 without blocking on a live pending approval sample.

## Recommended Path

- chosen implementation path: `native OpenClaw approvals integration`
- rationale: the mini CLI, gateway protocol docs, source schemas, and server-method implementation all confirm approvals as a first-class native contract
- implications for `ApprovalBridge`:
  - model the bridge around gateway `exec.approval.*` methods and approval events
  - default fail-closed remains correct
  - wrapper mediation is contingency only, not the default path

## Downstream Updates Required

- `shared-contracts.md`
- `FEAT-004/TASK-001`
- `FEAT-004/TASK-003`
- `discovery/decision-log.md`

## Open Questions

- Does OpenClaw expose approval-needed states over CLI, HTTP, or gateway APIs?
- Should Meeseek Box consume approvals via direct gateway subscription, CLI polling, or a server-side adapter that normalizes both?

## Impacted Features

- `FEAT-001`
- `FEAT-004`
