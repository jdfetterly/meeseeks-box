# Implementation Task Plan

## 1. Planning Context

- Feature / Initiative: `FEAT-001 Product State Spine` / `INIT-001 Meeseek Box Platform Foundation`
- Source TDD: `../tdd/index.md`
- Planning Date: `2026-03-19`
- Assumptions:
  - This feature is the first backend implementation dependency for the rest of the initiative.
  - SQLite remains the v1 canonical store.
  - Browser-local state cutover is handled by `FEAT-000` as a fresh start with no import path.

## 2. Delivery Strategy

Implement this feature in dependency order: discovery-backed adapter truth and schema first, then the shared test harness in parallel, then repositories and APIs, then event ingest and projections, then observability. The work is intentionally split so downstream features can start consuming stable contracts before every projection and optimization detail is complete.

## 3. Dependency and Sequencing Notes

- `TASK-001` captures the real discovery outputs and shared adapter contract; event normalization must not bypass it.
- `TASK-002` must land before repository or API work because it defines canonical storage and rollout controls.
- `TASK-003` should land in parallel with schema work because every downstream feature's tests depend on it.
- `TASK-004` and `TASK-005` establish the create/read path that downstream launch, board, and chat flows depend on.
- `TASK-006` must use the real discovery fixtures from `TASK-001`.
- `TASK-007` depends on `TASK-006` because projections consume normalized events.

## 4. Task Inventory

| Task ID | Title | Objective | Depends On | TDD References | Planned Touchpoints | Acceptance Criteria | Verification | Suggested PR Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TASK-001` | Discovery gate and shared adapter contract | Capture Claw-Tower audit outputs, real OpenClaw fixtures, and one shared adapter contract before downstream implementation hardens. | `FEAT-000/TASK-003` | sections 2, 5, 9, 13; `REQ-004` | discovery outputs, fixture library, adapter contract docs | Real run-complete, tool-failure, and schedule-trigger payloads are captured; browser-local cutover dependencies are known; one shared adapter contract is defined. | discovery artifact review, fixture validation checks | `PR-001 Discovery + adapter contract` |
| `TASK-002` | Canonical schema and feature-flag foundation | Define and migrate the core SQLite schema plus rollout flags for canonical product state. | `TASK-001` | sections 5, 8, 13; `REQ-001`, `REQ-002`, `REQ-004` | DB migrations, schema definitions, app config, feature flag wiring | Core tables for conversations, messages, work items, runs, run events, and object links exist; feature flags gate canonical writes and reads cleanly. | migration tests, schema smoke test | `PR-002 Schema + flags` |
| `TASK-003` | Shared integration-test harness | Build temp DB, temp filesystem, fake adapter, deterministic clock, and fixture helpers for downstream tests. | `TASK-001`, `TASK-002` | sections 5, 7, 14; `REQ-003`, `REQ-004` | test harness package, fixture builders, fake shared adapter, clock helpers | Other features can write integration and contract tests without the real runtime, Tailnet, or host filesystem. | harness self-tests, one representative integration test per helper | `PR-003 Test harness` |
| `TASK-004` | Repositories and shared entities | Implement repository layer and canonical entity types for conversations, work items, runs, and links. | `TASK-002` | sections 5, 7, 8; `REQ-001` | shared entity module, repository modules, ID generation utilities | Services can create and fetch canonical objects with stable IDs and linked references; repository contracts are explicit enough for downstream services. | unit tests for entity helpers, integration tests against temp SQLite | `PR-004 Repositories + entities` |
| `TASK-005` | Product State API create/read contract | Expose canonical create/read APIs for conversations, work items, and runs. | `TASK-004` | sections 6, 9, 10; `REQ-001` | API routes/handlers, request validation, service layer, read serializers | Clients can create and refetch conversations, work items, and runs through the API without relying on browser-local truth. | contract tests for request/response shape, integration tests for multi-client reads | `PR-005 Canonical API` |
| `TASK-006` | Event normalization and ingest pipeline | Implement raw event ingest, normalization rules, idempotency, and rejection handling against real captured fixtures. | `TASK-001`, `TASK-002`, `TASK-003`, `TASK-004` | sections 5, 7, 9, 10; `REQ-002`, `REQ-004` | event normalizer, ingest endpoint, run event store, ingest error logging | Raw runtime/product events are normalized into canonical events; duplicates are deduped; malformed payloads are rejected with audit visibility; golden fixtures come from discovery output. | fixture-driven contract tests, integration tests for duplicate and malformed events | `PR-006 Event ingest` |
| `TASK-007` | Projection updaters and canonical read models | Build run/work/inbox/schedule summary projections from normalized events. | `TASK-006` | sections 5, 7, 10, 12; `REQ-002` | projector modules, summary tables/views, read-model queries | Derived state for runs and work items is rebuilt from normalized events and remains internally consistent across duplicate or delayed event scenarios. | reducer unit tests, integration tests for event-driven state convergence | `PR-007 Projections` |
| `TASK-008` | Observability and rollout controls | Add logs, metrics, traces, and rollout toggles for canonical state and event ingest. | `TASK-005`, `TASK-006`, `TASK-007` | sections 11, 12, 13; `REQ-001`, `REQ-002`, `REQ-004` | logging hooks, metrics emitters, trace spans, alert config, rollout docs | Ingest failures, projector latency, duplicate event rates, and canonical create/update paths are observable enough to support staged rollout and rollback. | instrumentation checks, manual verification in dev environment | `PR-008 Observability + rollout` |

## 5. Verification Matrix

| TDD Area / Requirement | Implementing Tasks | Verification Coverage |
| --- | --- | --- |
| Canonical shared state (`REQ-001`) | `TASK-002`, `TASK-004`, `TASK-005` | schema tests, repository integration tests, multi-client API integration tests |
| Normalized event ingestion (`REQ-002`) | `TASK-002`, `TASK-006`, `TASK-007`, `TASK-008` | fixture contract tests, duplicate-event integration tests, projection convergence tests, instrumentation checks |
| Shared test harness (`REQ-003`) | `TASK-003` | harness self-tests, deterministic clock tests, temp storage isolation tests |
| Discovery-backed cutover readiness (`REQ-004`) | `TASK-001`, `TASK-002`, `TASK-003`, `TASK-006`, `TASK-008` | discovery artifact review, fixture capture checks, feature-flag smoke tests |

## 6. Open Questions and Blockers

- Stable `sequence_key` inputs from OpenClaw still need confirmation after discovery.
- Projection storage choice remains open: dedicated tables versus query-time views for some summaries.
- If browser-local import becomes required later, it should be added as a separate scoped task rather than folded into the fresh-start cutover.

## 7. Current Execution Notes

- `2026-03-20`: `TASK-002` is partially implemented.
  Completed:
  - repo-local canonical state directory resolution
  - SQLite schema bootstrap and migration tracking
  - product-state health endpoint
  - rollout flags for legacy-local-state and canonical API exposure
  - external runtime correlation fields for runs and schedules:
    - `external_run_id`
    - `external_session_id`
    - `external_session_key`
    - `external_job_id`
- `2026-03-20`: `TASK-004` is partially implemented.
  Completed:
  - typed entity records for conversations, work items, and runs
  - repository create/list flows backed by canonical SQLite state
  - canonical run lookup by external runtime identifiers
- `2026-03-20`: `TASK-005` is partially implemented.
  Completed:
  - create/read API routes for conversations, work items, and runs
  - focused API contract tests
- `2026-03-20`: `TASK-001` is now partially implemented.
  Current status:
  - local OpenClaw source and live mini discovery resolved approvals, one-shot scheduling, workspace-path questions, and live event-fixture capture
  - real captures now exist for:
    - direct run completion via `openclaw agent --json`
    - tool-failure context via runtime log evidence plus parent-run result
    - one-shot schedule trigger via `openclaw cron add --at ... --json` and `openclaw cron runs --json`
  Completed:
  - promoted live discovery captures into `discovery/openclaw-event-fixtures.md`
  - added starter shared adapter contract types in `lib/openclaw/contracts.ts`
  - added sanitized live fixture helpers in `lib/testing/openclaw-fixtures.ts`
  Remaining:
  - extend the current adapter contract from starter interfaces into the full runtime facade as `FEAT-004` begins consuming it
- `2026-03-20`: broader impact discovered while closing `DG-002`.
  - event normalization cannot assume one canonical runtime surface; initial ingest must handle final-result CLI payloads, cron-run payloads, and runtime-log-linked failure evidence
  - memory bootstrap moved from a product concern to a runtime-readiness concern because the live mini already logs ENOENT lookups for missing workspace memory files
  - external OpenClaw identifiers are now part of the canonical state model, which means downstream schedule, approval, and artifact work should attach them at object-creation time rather than retrofitting correlation later
- `2026-03-20`: `TASK-003` is now partially implemented.
  Completed:
  - added `lib/testing/harness.ts` with temp state, temp workspace, artifact roots, deterministic clock, and fake shared adapter
  - added harness and contract tests that validate the starter test seam without the real runtime
  Remaining:
  - extend the harness with event-ingest and projection helpers once `TASK-006` and `TASK-007` begin
- `2026-03-20`: `TASK-006` is now partially implemented.
  Completed:
  - added starter OpenClaw event normalization in code for:
    - direct agent-result completion/failure
    - runtime-log-linked tool failure
    - cron-run schedule trigger
  - added canonical event-ingest route at `/api/product-state/events/ingest`
  - added dedupe handling based on `(source, sequence_key)`
  - added initial lifecycle projection behavior so `run_completed` and `run_failed` events update canonical run status and completion time
  - added tests covering correlation, dedupe, and rejection for uncorrelated runtime events
  Remaining:
  - expand canonical event coverage beyond the initial discovery-backed surfaces
  - extend event-driven projections to approvals, blocked work, and missed schedules as those event types come online
- `2026-03-21`: `TASK-007` is now partially implemented.
  Completed:
  - added projection tables for:
    - `run_summaries`
    - `work_item_summaries`
    - `inbox_items`
    - `schedule_summaries`
  - added projector logic for run summaries, work summaries, failure-derived Inbox items, and schedule summary upserts
  - wired event ingest to update run/work summaries and resolve failure Inbox items on successful completion
  - exposed read APIs for run summaries, work summaries, Inbox items, and schedule summaries
  - replaced the empty Work, Inbox, and Schedules placeholders with simple server-backed summary views
  Remaining:
  - extend Inbox derivation beyond failure/tool-failure categories
  - add richer schedule projection behavior once launch scheduling and runtime cron sync are wired
  - build the final board/read-model queries on top of these projection tables
- `2026-03-21`: downstream impact from `FEAT-002` runtime-native schedule sync.
  - `schedule_summaries` now need to treat `external_job_id` as a first-class read-model field, not optional decoration
  - canonical schedule state now includes meaningful sync lifecycle values:
    - `pending_sync`
    - `scheduled`
    - `sync_failed`
  - projection consumers should preserve partial-success launches where canonical state exists even if runtime sync failed, because retry/reconciliation will depend on those persisted records
  - schedule projections now also need terminal or degraded reconciliation states sourced from runtime cron evidence:
    - `completed`
    - `failed`
    - `missed`
  - downstream run materialization should remain a separate concern; reconciliation intentionally updates schedule health without fabricating canonical runs from cron evidence alone

## 8. Notes for Execution

- Keep API contracts small and explicit before downstream features consume them.
- Do not defer harness work; it is a dependency for the testing strategy, not cleanup.
- Projection logic should stay rebuildable from event history to avoid hidden state corruption.
- Keep normalization rules anchored to the live discovery fixtures until richer runtime surfaces are captured later.
