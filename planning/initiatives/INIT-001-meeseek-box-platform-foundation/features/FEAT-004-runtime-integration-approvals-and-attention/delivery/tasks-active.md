# Implementation Task Plan

## 1. Planning Context

- Feature / Initiative: `FEAT-004 Runtime Integration, Approvals, and Attention` / `INIT-001 Meeseek Box Platform Foundation`
- Source TDD: `../tdd/index.md`
- Planning Date: `2026-03-19`
- Assumptions:
  - The runtime may require a wrapper pattern for some approval/block-resume flows.
  - Slack remains fallback-only in v1 and should stay narrow.

## 2. Delivery Strategy

Start by locking the approval contract and security policy before any UI work. Then build persistence and classification, followed by runtime-adapter integration, Inbox derivation and resolution behavior, and finally Slack fallback plus manual runtime validation.

## 3. Dependency and Sequencing Notes

- `TASK-001` and `TASK-002` are hard prerequisites for the rest of the feature.
- `TASK-003` depends on those contracts because adapter integration must emit canonical envelopes and respect fail-closed policy.
- `TASK-004` depends on persistent approvals and attention items from `TASK-002` and adapter inputs from `TASK-003`.
- `TASK-005` can land after attention categories are stable so Slack payloads do not churn.
- `TASK-006` should be the final slice because it validates the real sensitive path and should consume stable backend behavior.

## 4. Task Inventory

| Task ID | Title | Objective | Depends On | TDD References | Planned Touchpoints | Acceptance Criteria | Verification | Suggested PR Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TASK-001` | Canonical approval envelope and policy contract | Define the typed approval envelope, supported approval types, and initial policy boundaries for approval-required actions. | `FEAT-001/TASK-001` | sections 5, 8, 9, 11; `REQ-001`, `REQ-002` | shared types, policy config, adapter contract docs, validation schema | Typed approval envelope supports `confirm`, `data_input`, `task_completion`, and `path_selection`; policy defaults unknown actions to approval-required. | contract-schema tests, policy unit tests | `PR-001 Approval contract` |
| `TASK-002` | Approval persistence, classifier, and audit model | Implement approvals, attention items, audit storage, and the conservative classifier/allowlist config. | `TASK-001`, `FEAT-001/TASK-002` | sections 5, 7, 8, 9, 10; `REQ-001`, `REQ-002` | migrations, approval service, classifier, repositories, audit log | Approval records, attention items, and audit trails persist consistently; explicit allowlist is narrow and configurable. | unit tests for classification and timeout rules, integration tests for persistence | `PR-002 Classifier + persistence` |
| `TASK-003` | Runtime adapter facade and wrapper integration | Convert runtime or wrapper signals into canonical approval and high-signal attention events. | `TASK-001`, `TASK-002` | sections 5, 6, 7, 9, 10; `REQ-001`, `REQ-002` | runtime adapter facade, wrapper integration points, ingest endpoints | Runtime approval-needed states and high-signal failures are converted into canonical envelopes; missing native pause/resume can be handled through wrapper behavior. | fixture contract tests, integration tests with fake runtime adapter | `PR-003 Adapter facade` |
| `TASK-004` | Inbox derivation and approval resolution flow | Implement Inbox query/render contracts for approvals, failures, blocked work, missed schedules, and explicit memory review prompts. | `TASK-002`, `TASK-003`, `FEAT-001/TASK-007` | sections 5, 7, 9, 10, 14; `REQ-001` | inbox service, resolve API, serializers, UI wiring points, event emission | Supported Inbox item sources are visible with linked context; typed approval resolutions update approval status, run/work state, and audit history together. | integration tests for derivation + resolve flow, Playwright Inbox resolution flow | `PR-004 Inbox + resolution` |
| `TASK-005` | Slack fallback notifier and delivery controls | Implement narrow high-signal Slack fallback with delivery logging and retry-safe behavior. | `TASK-002`, `TASK-004` | sections 5, 8, 9, 12, 13; `REQ-003` | Slack notifier, delivery log, category routing config | Approval-required, no-retry failure, and high-signal missed-schedule conditions can send minimal Slack alerts without changing the app as the primary resolution surface. | unit tests for routing, integration tests for dedupe/delivery log, manual Slack smoke | `PR-005 Slack fallback` |
| `TASK-006` | Security validation and real-runtime smoke | Validate the full approval path against the real or wrapped runtime and confirm the allowlist/policy behaves as intended. | `TASK-003`, `TASK-004`, `TASK-005` | sections 10, 11, 14, 15; `REQ-001`, `REQ-002`, `REQ-003` | manual smoke checklist, runtime test environment, ops docs | Approval-required actions block and resume correctly, unknown actions fail closed, and Slack fallback behaves as degraded-mode attention only. | manual runtime block/resume validation, manual Slack delivery check | `PR-006 Security + smoke` |

## 5. Verification Matrix

| TDD Area / Requirement | Implementing Tasks | Verification Coverage |
| --- | --- | --- |
| Inbox derivation and typed approvals (`REQ-001`) | `TASK-001`, `TASK-002`, `TASK-003`, `TASK-004` | schema tests, fixture contracts, integration tests, Playwright Inbox resolution |
| Conservative approval gating (`REQ-002`) | `TASK-001`, `TASK-002`, `TASK-003`, `TASK-006` | classifier unit tests, ambiguous-action integration tests, manual runtime smoke |
| Slack fallback (`REQ-003`) | `TASK-005`, `TASK-006` | routing tests, delivery-log integration tests, manual Slack validation |

## 6. Open Questions and Blockers

- The initial allowlist decision is now closed: v1 starts with an empty allowlist so unknown, write-capable, and runtime-affecting actions all remain approval-required by default.
- Real runtime capabilities for pause/resume versus wrapper mediation may affect the final adapter slice.
- Slack category defaults for v1 should stay intentionally narrow until real operator usage is observed.

## 7. Notes for Execution

- Treat the allowlist as policy code, not a convenience shortcut.
- Do not expose approval UI flows before the classifier and audit model are in place.
- Keep Slack payloads minimal and avoid leaking sensitive runtime context outside the app.
- Inbox v1 includes approvals, failures, blocked work, missed schedules, and explicit memory-review prompts only.
- Broader impact from `FEAT-001` discovery and implementation:
  - approval-linked runs should persist `external_run_id` and `external_session_key` at creation time so approval events can correlate cleanly
  - adapter and Inbox work should consume the canonical multi-surface event model rather than assuming every runtime signal arrives as the same gateway-frame shape
  - the starter Inbox projection already handles failure-derived items, so approval and missed-schedule work should extend the same `inbox_items` read model rather than creating a parallel attention store
- `2026-03-21`: `TASK-001` is partially implemented.
  Completed:
  - confirmed the conservative policy default: empty allowlist in v1
  - added read-only runtime approval-policy snapshot support with token redaction for the local approvals socket secret
  - added tests proving the socket token is never surfaced through the Meeseek Box runtime-policy path
  Remaining:
  - persist explicit allowlist policy config only after real operator evidence justifies narrow exceptions
- `2026-03-21`: `TASK-002` and `TASK-003` are partially implemented.
  Completed:
  - added canonical approval entity/repository support on top of the existing `approvals` table
  - extended the OpenClaw event-ingest path to normalize `exec.approval.requested` and `exec.approval.resolved` gateway events
  - correlated approval events to canonical runs using external OpenClaw identifiers and request/session fallback fields
  - implemented approval-driven run/work projection updates:
    - pending approval -> `waiting_approval` / `needs_approval`
    - denied approval -> `blocked`
    - approved approval -> `running`
  - added a live runtime bridge for approval resolution through the narrow OpenClaw gateway path:
    - `openclaw gateway call exec.approval.resolve`
  Remaining:
  - continue expanding the adapter facade beyond approval resolution into the rest of the runtime action surface
- `2026-03-21`: `TASK-004` is partially implemented.
  Completed:
  - projected approval-required Inbox items into the shared `inbox_items` read model
  - resolved approval Inbox items automatically when the corresponding approval is resolved
  - added approval listing and runtime policy API routes for the server-backed Inbox/admin surfaces
  - added a typed approval-resolution API at `/api/product-state/approvals/[id]/resolve`
  - wired approve-once / deny controls into the Inbox UI for pending approvals
  - added notification delivery logging plus a narrow Slack fallback notifier driven from canonical Inbox items
  - exposed notification delivery state in the server-backed Inbox surface and API
  - added direct schedule links for `missed_schedule` Inbox items
  - browser-validated missed-schedule attention linking into the dedicated schedule detail page using isolated canonical local state
  - added API-level integration coverage proving explicit schedule-output reporting resolves the prior `missed_schedule` Inbox item instead of leaving stale open attention behind
  - split the Inbox UI into:
    - `Open attention`
    - `Resolved recently`
    so resolved items remain inspectable without polluting the active operator queue
  - tightened Inbox operator ergonomics:
    - corrected the top-level Inbox copy so schedule attention is described as present behavior, not future scope
    - preserved source drilldowns for resolved Inbox items so operators can still open the underlying schedule/run/work object after the item leaves the active queue
  - browser-validated at narrow viewport:
    - resolved missed-schedule item still links into schedule detail
    - Inbox copy matches the currently shipped attention model
  Remaining:
  - add richer Inbox linking/render behavior beyond the current action surface for approval and run-failure categories
- `2026-03-21`: `TASK-005` is partially implemented.
  Completed:
  - added canonical `notification_deliveries` storage with dedupe protection
  - implemented narrow Slack fallback routing for:
    - `approval_required`
    - no-retry `run_failure`
    - no-retry `tool_failure`
    - high-signal `missed_schedule`
  - kept Slack disabled by default and documented explicit env gating
  Remaining:
  - add manual Slack smoke on the real webhook path
  - expose richer delivery diagnostics if fallback volume grows
- `2026-03-21`: broader impact from the approval slice.
  - runtime approval policy and pending approval requests are separate data sources and should remain separate in the product model
  - approval-policy snapshots can carry sensitive local socket material, so sanitization is a hard requirement rather than presentation cleanup
  - approval events now influence run/work display state without going through `run_events`, which means future summary logic must account for both canonical run events and approval records
  - missed schedule attention now assumes a first-class schedule detail page exists, so future attention categories should prefer dedicated operator drilldowns over list-only surfaces when the source object has runtime state worth inspecting
  - operator-facing Inbox surfaces must distinguish `open` from `resolved` state explicitly; keeping resolved items visible is useful history, but mixing them into the active queue makes the command center feel less trustworthy
  - once the Inbox becomes the canonical attention rail, resolved history still needs source-object drilldowns; otherwise the app preserves state but loses operator context at the exact moment someone wants to verify what was cleared
  - fallback notifications now depend on canonical Inbox items and delivery-log dedupe keys, so future notification channels should extend the same delivery ledger rather than sending ad hoc webhooks
  - the narrow mutate-runtime contract is now proven for approvals, so future runtime write actions should follow the same explicit bridge pattern instead of introducing a broader long-lived gateway client inside Meeseek Box
