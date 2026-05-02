# Shared Contracts

- Artifact: Initiative Shared Contracts
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Status: `draft`
- Last Updated: `2026-05-02`

## `AppShellContract`

Defines the shared responsive web shell used by all feature surfaces.

Fields / behavior:
- primary routes for `Home`, `Work`, `Chat`, `Inbox`, and `More`
- desktop sidebar + activity rail behavior
- historical responsive-shell mobile bottom navigation behavior
- universal drawer/sheet entry contract for cross-entity drilldowns
- linked navigation behavior for conversation, work item, run, artifact, memory, schedule, and agent references

Current production exception:
- `/mobile` is a dedicated phone-first command shell with `command`, `jobs`, and `context` tabs.
- The `/mobile` shell is canonical for current iPhone QA and is implemented in `app/mobile/page.tsx` plus `components/mobile/*`.
- The older responsive-shell mobile behavior remains useful historical context for desktop-shell planning, but it is not the current mobile acceptance target.

## `ViewportProfile`

Shared test and layout profiles for v1.

- `desktop-default`: full desktop layout with sidebar and activity rail
- `iphone-primary`: narrow mobile layout used for Playwright viewport validation

Policy:
- Playwright must use these shared profiles rather than ad hoc dimensions
- real iPhone browser validation over Tailnet, Chrome or Safari, remains a required manual validation surface

## `OpenClawIntegrationAdapter`

One backend subsystem with internal workers/modules, not three separate feature adapters.

Contract surfaces:
- `EventSource`: runtime and schedule events into canonical envelopes
- `ApprovalBridge`: approval-needed states and resolution callbacks
- `WorkspaceBridge`: memory/workspace sync and controlled write-through helpers

Observed v1 event evidence surfaces:
- direct `openclaw agent --json` final-result payloads
- `openclaw cron runs --json` schedule-run history payloads
- runtime-log evidence for tool-level failure context

Canonical correlation identifiers:
- `external_run_id`
- `external_session_id`
- `external_session_key`
- `external_job_id` for schedules

Policy:
- product-state records should persist external runtime identifiers when known
- event ingest should correlate through external runtime identifiers before considering weaker heuristics
- future adapter work should not introduce a second ad hoc correlation layer outside these fields

Failure defaults:
- unreachable runtime marks source unavailable
- event ingest preserves retryable error metadata
- approval actions fail closed
- workspace sync performs no mutation while runtime/workspace state is unavailable

## `ApprovalEnvelope`

Canonical runtime-to-product approval shape.

Minimum fields:
- `approval_type`
- `requested_action_type`
- `run_id`
- `work_item_id`
- `context`
- `timeout_at`

Supported v1 approval types:
- `confirm`
- `data_input`
- `task_completion`
- `path_selection`

## `InboxDerivationRule`

Inbox item sources explicitly supported in v1:
- `approval_requested` -> immediate Inbox item
- failed run with no automatic retry -> immediate Inbox item
- blocked work item -> Inbox item
- missed one-shot or recurring schedule -> Inbox item
- memory review prompt only when `MemoryEntry.status = needs_review`

Out of scope:
- generic reminder engine
- low-value informational inbox noise

## `OneShotScheduleSource`

Schedules UI must label one-shot entries by source:
- `runtime-native`
- `product-managed`

Default if OpenClaw lacks native one-shot support:
- Meeseek Box stores delayed execution and triggers runtime dispatch when due

Minimum schedule-health fields:
- `last_run_outcome`
- `last_successful_output_at`
- `consecutive_failure_count`
- `missed_run`

## `ArtifactFamilyKey`

Default v1 grouping contract:
- `family_key = producer_kind + producer_id + output_slot`

Definitions:
- `producer_kind`: `schedule`, `work_item`, or `manual`
- `producer_id`: stable source object ID
- `output_slot`: declared output label from the producing workflow
- fallback: file basename only when no explicit output label exists

## `ManualSmokeChecklist`

Manual smoke artifacts must be short checklist documents with:
- preconditions
- action
- expected result
- pass/fail criteria

Minimum checklists required:
- runtime approval block/resume
- Slack fallback delivery
- memory write-through on whitelisted paths
- iPhone launch and card inspection
- one-shot scheduled work becoming due
