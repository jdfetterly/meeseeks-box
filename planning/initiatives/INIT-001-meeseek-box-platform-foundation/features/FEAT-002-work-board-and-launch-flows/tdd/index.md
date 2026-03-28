# Technical Design Document

## 1. Document Control

- Feature / Initiative: `FEAT-002 Work Board and Launch Flows` / `INIT-001 Meeseek Box Platform Foundation`
- Author: Codex
- Date: `2026-03-18`
- Status: `draft`
- Source FDD: `../fdd.md`

## 2. Context and Inputs

This design implements the iPhone-first launch and Kanban-first work organization behavior defined in the FDD. The driving requirements are:
- `REQ-001` launching from a saved preset creates tracked work with expected defaults
- `REQ-002` one-shot scheduled launches appear in both Work and Schedules
- `REQ-003` chat threads can be escalated into tracked work without losing canonical linkage

Dependencies from `FEAT-001`:
- canonical conversations, work items, runs, and links
- normalized events for run/work state updates

## 3. Technical Goals

- Make preset-driven work creation a thin, deterministic layer over canonical work item and run services.
- Model one-shot scheduled work explicitly so it is visible before execution and transitions cleanly when due.
- Preserve conversation -> work item -> run linkage no matter where work originates.

## 4. Non-Goals

- Native mobile application behavior
- Full recurring schedule management beyond consumption of the existing schedule layer
- Exhaustive visual implementation details for cards, sheets, or drawers

## 5. Architecture Overview

`FEAT-002` adds the user-facing orchestration layer on top of the product-state spine:
- a `launch service` that resolves presets, edits, timing, and output defaults into canonical create requests
- a `preset repository` for stored launch defaults and pinning metadata
- a `one-shot schedule service` that stores delayed work and turns it into due execution requests
- a `work board query service` that returns lane-grouped work item summaries for mobile and desktop views
- a `chat escalation service` that creates or links work items from conversation context without duplicating relationships

The key design choice is to treat the work item as the primary object. Immediate launch creates a work item and run; delayed launch creates a work item with `scheduled` state and a one-shot schedule record that later triggers run creation.

## 6. System Boundaries and Ownership

| Component / System | Responsibility | Owner / Boundary Notes |
| --- | --- | --- |
| Launch Service | Validate preset/defaults and create immediate or delayed work | In-scope backend |
| Preset Store | Persist saved launch presets and pinning metadata | In-scope backend |
| One-Shot Schedule Service | Persist delayed work and evaluate due execution | In-scope backend |
| Work Board Query Service | Return lane-grouped work summaries and filters | In-scope backend / API |
| Chat Surface | Initiates escalation actions with conversation context | In-scope client |
| Work Board UI | Renders work lanes and card drawers | In-scope client |
| OpenClaw Runtime Adapter | Starts immediate runs or runtime-backed scheduled execution | External integration boundary |

## 7. Component and Module Responsibilities

| Unit | Responsibility | Depends On |
| --- | --- | --- |
| `services/launch` | Build launch payload from preset + operator overrides | preset repo, work/run services |
| `services/presets` | CRUD for saved presets, recent use timestamps, pinning | repositories |
| `services/one-shot-schedules` | Create delayed execution records and transition them when due | work item repo, clock, runtime adapter |
| `services/chat-escalation` | Create/link work from conversation context | conversation repo, work item repo |
| `queries/work-board` | Fetch lane-grouped cards with schedule, artifact, and approval badges | work item projections |
| `api/launch` | Public entrypoint for home/launch sheet actions | launch service |
| `api/chat/escalate` | Public entrypoint for chat-to-work actions | chat escalation service |

## 8. Data Model and Storage Changes

| Change | Affected Store / Schema | Migration / Compatibility Notes |
| --- | --- | --- |
| Add `saved_launch_presets` table | SQLite | Stores scope, agent, timing, output defaults, prompt template |
| Add `one_shot_schedules` table | SQLite | Separate from recurring schedules so delayed launches remain explicit |
| Add `work_item_views` projection fields | SQLite | Lane, badge, scheduled time, latest artifact summary |
| Add `conversation_escalations` linkage or use `object_links` | SQLite | Maintains source conversation/message linkage |

Recommended preset fields:
- `id`, `title`, `scope`, `agent_id`, `model_override`, `priority`, `output_type`, `timing_mode`, `prompt_template`, `is_pinned`, `last_used_at`

Recommended one-shot schedule fields:
- `id`, `work_item_id`, `scheduled_for`, `status`, `dispatch_strategy`, `created_from_preset_id`, `created_at`, `executed_at`, `canceled_at`

Work board read model additions:
- `lane_status`
- `scheduled_for`
- `latest_run_status`
- `latest_artifact_label`
- `approval_badge`
- `failure_badge`

## 9. Interfaces, APIs, Events, and Contracts

| Interface | Direction | Contract Summary | Error Cases |
| --- | --- | --- | --- |
| `POST /api/launch` | client -> launch service | `{ preset_id?, prompt_override?, scope?, agent_id?, model?, priority?, output_type, timing }` creates work item and run or delayed work | invalid preset refs, invalid timing, missing agent/scope |
| `POST /api/presets` | client -> preset service | create/update saved preset | invalid defaults |
| `GET /api/work-board` | client <- query service | returns lane-grouped card summaries with filters | invalid filter combinations |
| `POST /api/chat/:conversationId/escalate` | client -> escalation service | create new work item or attach to existing one | missing conversation, invalid target item |
| `OneShotScheduleDue` event | internal | emitted when delayed work reaches due window | late/duplicate dispatch handling |
| `WorkItemCreatedFromPreset` event | internal | links preset usage to created work item/run | missing link should fail request |

Timing contract:
- `timing.mode = now | schedule_once | draft`
- `schedule_once` requires exact local timestamp normalized to server timezone handling rules

## 10. Primary Flows and Sequence Logic

### 10.1 Main Flow

1. The operator taps a preset from Home or opens Launch and selects a preset.
2. The launch service loads preset defaults and merges operator overrides.
3. If `timing.mode = now`, the service creates a work item and immediate run, then dispatches to runtime.
4. If `timing.mode = schedule_once`, the service creates a work item in `scheduled` state plus a `one_shot_schedules` record.
5. The board query service exposes the resulting card in the proper lane and the schedules view exposes the same scheduled item.
6. When due, the one-shot schedule service dispatches the run and transitions the work item from `scheduled` to active execution state.

### 10.2 Failure / Alternate Flows

- Scenario: Preset refers to invalid agent/model
  Handling: launch service rejects the request with field-specific correction prompts; no work item is created.
- Scenario: Chat escalation attaches to existing work item
  Handling: create an `object_link` to the existing work item rather than duplicating the card.
- Scenario: Delayed execution misses due window
  Handling: emit a stale/missed schedule event and keep the work item visible in a recoverable state rather than silently dropping it.
- Scenario: Draft creation
  Handling: create work item with `draft` state and no run or due schedule.

## 11. Security, Privacy, and Authorization

- Launch and escalation actions operate on canonical application objects only; they do not grant direct runtime admin authority.
- One-shot scheduling must remain inside the same Tailnet-only product boundary and should not introduce a public scheduling surface.
- Chat escalation preserves linkage but does not change scope or allow cross-scope escalation implicitly.
- Preset storage must avoid embedding secrets or sensitive per-device tokens.

## 12. Observability and Operational Readiness

| Signal Type | What to Capture | Why It Matters |
| --- | --- | --- |
| Log | preset launch request outcome by preset ID | debug broken defaults or invalid configs |
| Metric | launch success/failure count by timing mode | monitor reliability of core mobile flow |
| Metric | one-shot schedule due vs dispatched latency | detect stale scheduled work |
| Metric | chat escalation create vs attach ratio | understand usage and duplication risk |
| Alert | repeated one-shot schedule misses | indicates scheduler/drift problems |
| Trace | preset launch -> work item create -> run dispatch | debug end-to-end launch failures |

## 13. Migration, Backfill, or Rollout Strategy

- Feature flags:
  - `saved_presets_enabled`
  - `one_shot_schedules_enabled`
  - `chat_escalation_enabled`
  - `board_canonical_queries_enabled`
- Migration steps:
  1. add preset and one-shot schedule schema
  2. implement launch service against canonical work/run services
  3. switch board reads to canonical query service
  4. enable chat escalation actions
- Rollback approach:
  - disable delayed launch or chat escalation flags independently
  - preserve created work items and schedules; do not delete data on rollback

## 14. Test Strategy

| Test Level | Coverage | Notes |
| --- | --- | --- |
| Unit | launch payload merge logic, lane mapping, due-window evaluation | pure functions only |
| Integration | preset launch -> work item/run creation | primary correctness layer |
| Integration | one-shot schedule persistence and due transition | uses deterministic clock |
| Integration | chat escalation create vs attach behavior | verifies canonical linkage |
| Contract | launch API payload validation | keep request shape stable |
| Playwright | preset launch, scheduled launch, chat escalation golden paths | small browser suite only |
| Manual | real iPhone launch ergonomics over Tailnet | validates mobile viability |

## 15. Risks and Tradeoffs

| Risk / Tradeoff | Impact | Mitigation / Decision |
| --- | --- | --- |
| One-shot schedule ownership is split between product and runtime | High | keep product-side record authoritative for visibility; dispatch adapter can be swapped later |
| Board cards drift from run state | High | derive lane and badges from canonical work/run projections, not UI-local state |
| Preset defaults become stale | Medium | validate agent/model refs at launch time and surface corrective UI |
| Chat escalation creates duplicates | Medium | support explicit attach-to-existing and enforce source linkage |

## 16. Traceability Matrix

| FDD Requirement ID | Technical Design Coverage | Planned Tests |
| --- | --- | --- |
| `REQ-001` | `saved_launch_presets`, launch service, `POST /api/launch`, immediate work/run creation flow | integration: preset launch; Playwright: Home preset launch |
| `REQ-002` | `one_shot_schedules`, due evaluator, work board/schedules query projections | integration: scheduled item visible in both surfaces; Playwright: schedule once |
| `REQ-003` | chat escalation service, `POST /api/chat/:conversationId/escalate`, object links | integration: create/attach linkage; Playwright: escalate chat to card |

## 17. Open Questions

- Should due execution be triggered by a product-managed scheduler loop, a runtime-native one-shot schedule mapping, or both with one as fallback?
- What is the minimum preset versioning strategy when agent or model defaults change?
- Does draft work need a separate lane in v1, or can it remain outside the main active board query until explicitly launched?
