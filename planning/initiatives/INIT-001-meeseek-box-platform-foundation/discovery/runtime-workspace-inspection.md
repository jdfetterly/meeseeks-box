# Runtime Workspace Inspection

- Artifact: Discovery Output
- Initiative ID: `INIT-001`
- Last Updated: `2026-03-20`
- Status: `partial`

## Questions To Answer

- What is the actual runtime memory file layout?
- Which paths are runtime-owned and safe candidates for write-through?
- Which paths are read-only or unsafe?

## Evidence Sources

- runtime root or workspace path:
  - `/Users/agent-playground/code/workspaces/mini-ops`
  - `/Users/agent-playground/.openclaw`
- files or directories inspected:
  - workspace root listing
  - workspace `.openclaw/`
  - `openclaw memory status --json`
  - `openclaw approvals get --json`
- commands run:
  - `ls -la /Users/agent-playground/code/workspaces/mini-ops`
  - `find /Users/agent-playground/code/workspaces/mini-ops/.openclaw -maxdepth 4 -print`
  - `openclaw memory status --json`

## Path Classification Table

| Path or Pattern | Purpose | Candidate Classification | Reason | Notes |
| --- | --- | --- | --- | --- |
| `/Users/agent-playground/code/workspaces/mini-ops` | active runtime workspace for `mini-ops` | inspectable runtime-owned workspace | confirmed by mini workspace listing and memory status | canonical workspace root for Meeseek Box context |
| `/Users/agent-playground/code/workspaces/mini-ops/memory/` | expected memory directory | likely allowlist candidate | `openclaw memory status --json` explicitly looks for this path and reports it missing | currently absent, but it is the clearest initial write-through target |
| `/Users/agent-playground/code/workspaces/mini-ops/.openclaw/workspace-state.json` | runtime workspace metadata | read-only runtime metadata | internal runtime state file, not app-owned content | do not mutate from Meeseek Box |
| `/Users/agent-playground/.openclaw/openclaw.json` | global runtime config | unsafe for app write-through | runtime config and likely sensitive | inspect only, no product writes |
| `/Users/agent-playground/.openclaw/exec-approvals.json` | approvals backing file | unsafe for direct app write-through | approvals should be mediated via CLI/runtime contract, not direct file edits | snapshot visible, but not a write target |
| `/Users/agent-playground/.openclaw/logs/*` | runtime logs | read-only evidence source | diagnostic only | useful for discovery and troubleshooting, not product writes |

## Findings

- The active runtime workspace for `mini-ops` is `/Users/agent-playground/code/workspaces/mini-ops`.
- The workspace currently contains no `memory/` directory and no `MEMORY.md`; `openclaw memory status --json` reports the memory source as missing.
- The live runtime is already attempting memory reads against missing workspace-local paths and logging ENOENT failures for:
  - `/Users/agent-playground/code/workspaces/mini-ops/memory/2026-03-20.md`
  - `/Users/agent-playground/code/workspaces/mini-ops/memory/2026-03-19.md`
  - `/Users/agent-playground/code/workspaces/mini-ops/MEMORY.md`
- The most plausible initial write-through target for Meeseek Box remains a workspace-local `memory/` directory under the `mini-ops` workspace, because the runtime already expects that location.
- Workspace-local `.openclaw/workspace-state.json` exists and should be treated as runtime-owned metadata, not app-managed storage.
- Global runtime files under `/Users/agent-playground/.openclaw/` are present, but they should remain outside Meeseek Box write-through scope under the current security frame.
- This broadens the downstream impact of memory bootstrap work:
  - missing memory paths already generate runtime noise
  - Meeseek Box should not expose memory write-through or memory-derived UX until the workspace memory path is explicitly bootstrapped or the app can fail closed with setup guidance

## Initial Write-Through Allowlist Recommendation

- allowlist candidates:
  - `/Users/agent-playground/code/workspaces/mini-ops/memory/`
- unsafe paths:
  - `/Users/agent-playground/.openclaw/openclaw.json`
  - `/Users/agent-playground/.openclaw/exec-approvals.json`
  - `/Users/agent-playground/.openclaw/logs/`
  - `/Users/agent-playground/code/workspaces/mini-ops/.openclaw/`
- unknown or needs-confirmation paths:
  - whether the workspace should use `MEMORY.md`, `memory/*.md`, or both as the canonical content pattern
  - whether any runtime-managed artifact directories under the workspace should be visible but read-only in Meeseek Box

## Downstream Updates Required

- `shared-contracts.md`
- `FEAT-003/TASK-001`
- `FEAT-003/TASK-002`
- `discovery/decision-log.md`

## Open Questions

- What canonical memory file pattern should Meeseek Box prefer when bootstrapping an empty workspace memory directory?
- Should Meeseek Box create the missing `memory/` directory during setup, or require an operator/bootstrap step first?
- Should bootstrap create both `memory/` and an initial `MEMORY.md`, or standardize on one canonical pattern while tolerating the other as read-only legacy input?

## Impacted Features

- `FEAT-003`
