# Implementation Task Plan

## 1. Planning Context

- Feature / Initiative: `FEAT-002 Work Board and Launch Flows` / `INIT-001 Meeseek Box Platform Foundation`
- Source TDD: `../tdd/index.md`
- Planning Date: `2026-03-19`
- Assumptions:
  - `FEAT-001` canonical state and event ingest are available or landing in parallel with stable contracts.
  - One-shot scheduling is runtime-native in OpenClaw and should persist external cron identifiers when sync succeeds.

## 2. Delivery Strategy

Build launch and board behavior around the work item as the primary object. Resolve one-shot scheduling capability first, then land persistence and service contracts, then board queries and chat escalation, and finally the UI/browser validation slices that consume those stable backend contracts.

## 3. Dependency and Sequencing Notes

- `TASK-001` is the discovery checkpoint for native one-shot support and affects every later scheduling decision.
- `TASK-002` and `TASK-003` establish the preset and launch contract consumed by the UI.
- `TASK-004` depends on `TASK-003` because due evaluation requires one-shot schedule records and launch-created work items.
- `TASK-005` depends on canonical state plus event/projection support from `FEAT-001`.
- `TASK-006` depends on conversation/work item contracts from `FEAT-001` and should land before the chat UI consumes it.
- `TASK-007` should land after backend contracts are stable so the UI does not invent shapes that later drift.

## 4. Task Inventory

| Task ID | Title | Objective | Depends On | TDD References | Planned Touchpoints | Acceptance Criteria | Verification | Suggested PR Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TASK-001` | One-shot scheduling capability discovery | Determine whether OpenClaw supports one-shot scheduling natively and lock the source-labeling/default path. | `FEAT-001/TASK-001` | sections 2, 9, 13; `REQ-002` | discovery output, adapter notes, scheduling contract docs | The feature documents whether one-shot scheduling is `runtime-native` or `product-managed` and uses that as the implementation default. | discovery review | `PR-001 Scheduling discovery` |
| `TASK-002` | Preset and one-shot schedule schema | Add persistence models for saved presets and delayed work scheduling. | `TASK-001`, `FEAT-001/TASK-002` | sections 5, 8, 13; `REQ-001`, `REQ-002` | DB migrations, preset repository, one-shot schedule repository | Saved presets and one-shot schedule records can be stored and fetched with the fields required by launch and board views. | migration tests, repository integration tests | `PR-002 Preset + schedule schema` |
| `TASK-003` | Launch service and API contract | Implement `POST /api/launch` and preset-based launch payload resolution for `now`, `schedule_once`, and `draft`. | `TASK-002`, `FEAT-001/TASK-005` | sections 5, 7, 9, 10; `REQ-001`, `REQ-002` | launch service, launch API, request validation, preset usage tracking | Launch requests create a work item plus run, scheduled item, or draft using resolved defaults and overrides; invalid defaults are rejected clearly. | contract tests, integration tests for each timing mode | `PR-003 Launch service` |
| `TASK-004` | Due evaluator and schedule-health model | Dispatch scheduled work when due and surface missed or stale scheduled items with minimum health fields. | `TASK-001`, `TASK-003` | sections 5, 7, 10, 12; `REQ-002` | one-shot scheduler service, clock integration, dispatch hooks, stale/missed event emitters, schedule health projection | Due scheduled work transitions into active execution or visible actionable state; missed windows produce explicit state rather than silent loss; health fields are populated. | deterministic-clock integration tests, stale-window tests | `PR-004 Due evaluator + health` |
| `TASK-005` | Work board query and card summary model | Implement lane-grouped card queries and summary projections for Work and Schedules. | `TASK-003`, `TASK-004`, `FEAT-001/TASK-007` | sections 5, 7, 8, 9; `REQ-001`, `REQ-002` | board query service, serializers, projection consumers | Work cards show lane, schedule time, source label, minimum health fields, latest run state, and badges from canonical state; one-shot items appear in both Work and Schedules. | integration tests for lane and summary correctness | `PR-005 Board queries` |
| `TASK-006` | Chat escalation create and attach flow | Implement chat-to-work actions that create new work or attach to existing work without losing linkage. | `FEAT-001/TASK-005`, `TASK-005` | sections 5, 7, 9, 10; `REQ-003` | escalation service, API route, object-link writes, validation | Escalated work retains canonical conversation linkage and does not create duplicates when attaching to an existing work item. | integration tests for create vs attach, linkage assertions | `PR-006 Chat escalation` |
| `TASK-007` | UI wiring and golden-path validation | Wire launch, work board, schedules visibility, and chat escalation to the backend contracts. | `TASK-003`, `TASK-005`, `TASK-006`, `FEAT-000/TASK-002` | sections 10, 14; `REQ-001`, `REQ-002`, `REQ-003` | launch sheet/home UI, work board UI, chat UI actions, Playwright specs | The iPhone-first launch and work flows use canonical backend contracts and pass the limited golden-path browser suite with shared viewport profiles. | Playwright flows for preset launch, schedule once, and chat escalation; manual iPhone smoke | `PR-007 UI wiring + browser validation` |

## 5. Verification Matrix

| TDD Area / Requirement | Implementing Tasks | Verification Coverage |
| --- | --- | --- |
| Preset launch (`REQ-001`) | `TASK-002`, `TASK-003`, `TASK-007` | repository tests, launch contract tests, integration tests, Playwright preset launch |
| One-shot scheduling (`REQ-002`) | `TASK-001`, `TASK-002`, `TASK-003`, `TASK-004`, `TASK-005`, `TASK-007` | due-window integration tests, board/schedules visibility tests, source-label checks, Playwright schedule-once flow |
| Chat escalation (`REQ-003`) | `TASK-006`, `TASK-007` | integration tests for create/attach linkage, Playwright chat escalation flow |
| Mobile-first execution quality | `TASK-007` | manual iPhone Tailnet smoke |

## 6. Open Questions and Blockers

- Draft visibility is now closed: drafts live outside the main board in a separate registry and must be promoted before they become operational work.

## 7. Current Execution Notes

- `2026-03-21`: `TASK-002` is now partially implemented.
  Completed:
  - added canonical repositories and APIs for saved launch presets
  - added canonical repositories and APIs for schedules
  - wired schedule creation into `schedule_summaries`
- `2026-03-21`: `TASK-003` is now partially implemented.
  Completed:
  - added canonical launch service and `/api/product-state/launch`
  - implemented `timing = now` as work item + run creation with summary seeding
  - implemented `timing = schedule_once` as work item + canonical runtime-native schedule intent with summary seeding
  - implemented `timing = draft` as a separate canonical draft registry object rather than a hidden board status
  - added draft list, delete, and promote APIs under:
    - `/api/product-state/drafts`
    - `/api/product-state/drafts/[id]`
    - `/api/product-state/drafts/[id]/promote`
  - draft promotion now creates real work and removes the draft from the staging registry
  - draft promotion supports both:
    - `run now`
    - `schedule once`
  - added runtime-native one-shot cron sync bridge with:
    - local OpenClaw execution when Meeseek Box runs on the mini
    - narrow SSH fallback for development or remote control
  - persisted `external_job_id` and runtime sync metadata on successful sync
  - preserved canonical schedule visibility on sync failure using `sync_failed` schedule status instead of dropping the launch
  Remaining:
  - add retry/reconcile flows for `pending_sync` and `sync_failed` schedules
- `2026-03-21`: `TASK-005` is now partially implemented.
  Completed:
  - added canonical board-lane service and `/api/product-state/board`
  - grouped Work view from server-backed board lanes instead of page-local status logic
  - enriched board cards with canonical schedule timing and schedule sync status when present
  - added runtime reconciliation entrypoint at `/api/product-state/schedules/reconcile` and a starter Schedules refresh action so canonical schedule health can catch up with runtime-native one-shot jobs after they execute
  - added a dedicated schedule detail drilldown that exposes:
    - runtime sync state
    - canonical health summary
    - linked work item context
    - schedule-produced artifact families once producers are wired
  Remaining:
  - add richer card summaries and lane filters once projections cover more categories
  - align the final board UI with these server-backed lanes instead of the current interim summary layout
- `2026-03-21`: `TASK-007` is now partially implemented.
  Completed:
  - replaced the empty Work placeholder with a server-backed board summary view
  - added a starter launch composer to Work that drives the canonical launch API for `now` and `schedule_once`
  - updated launch feedback and schedule summaries to surface runtime sync state, external cron job IDs, and sync errors when present
  - added a separate Drafts surface inside Work so saved launch intent does not pollute the main operational board
  - restored Chat as a starter canonical route backed by shared conversations and messages, which narrows the remaining gap for later chat-to-work escalation
  - added canonical work-item and run detail pages so board cards, Inbox items, and artifact registry entries can drill into server-backed detail instead of ending in summary-only lists
  - draft actions now support:
    - run now
    - schedule once with explicit date/time
    - discard
  - completed a real browser validation pass for:
    - save draft from Work
    - promote draft to `run now`
    - create canonical conversation
    - send canonical message
    - attach conversation to existing work
  - fixed a shell-level regression discovered during browser validation by swapping shared nav/search schedule reads from legacy `/api/crons` to canonical `/api/product-state/schedules`
  - surfaced attached conversation context on both board cards and work detail so chat escalation is visible to operators after the API call succeeds
  - added schedule detail links from the Schedules list and browser-validated the drilldown against a real canonical one-shot schedule summary
  - added installable starter jobs on the Work surface:
    - `Morning Ops Brief`
    - `Weekly System Review`
  - made the starter jobs self-contained:
    - explicit content sections
    - explicit output file expectations
    - explicit `report-schedule-output` callback step
    - read-only childcare schedule instructions using the provided Google Sheet
  - added `/api/product-state/presets/recommended` for listing/installing starter jobs with dedupe protection
  - surfaced installed presets directly in the launch composer so operators can apply them into the form with one click
  - browser-validated:
    - starter jobs render on the Work page
    - installing the jobs marks them as installed
    - the `Morning Ops Brief` preset fills the launch form with the childcare-aware prompt template
  - added a narrow recurring scheduling path for installed starter jobs:
    - daily and weekly suggested cadence controls directly on the Work page
    - canonical recurring work-item + schedule creation
    - runtime-native cron sync using `openclaw cron add --cron ... --tz ...`
    - prompt hydration so the starter-job report-output command contains the real canonical schedule id
    - dedupe guard so each starter job maps to at most one recurring schedule in v1
  - browser-validated:
    - scheduling `Morning Ops Brief` directly from the Work page
    - opening the resulting recurring schedule detail and verifying the hydrated report-output command
    - scheduling `Weekly System Review` with a non-default Friday `15:30` cadence
    - verifying both recurring schedules appear on the canonical Schedules page with human-readable cadence labels
  - added recurring schedule lifecycle management for starter-job schedules:
    - pause recurring schedule
    - edit recurring cadence
    - resume recurring schedule
    - delete recurring schedule with automatic archival of the linked standing work item
  - tightened canonical schedule/read-model behavior around deleted schedules:
    - deleted schedules are excluded from the main Schedules list
    - deleted schedules are excluded from the shared Schedules nav badge count
    - archived standing work items no longer appear on the main Work board
    - runtime-sync labels normalize stale local lifecycle states into operator-facing copy instead of leaking raw sync markers
  - browser-validated:
    - pausing an existing recurring starter-job schedule from schedule detail
    - editing the weekly cadence from Friday `15:30` to Wednesday `14:45`
    - resuming the paused recurring schedule
    - deleting the recurring schedule and confirming the linked work item is archived
    - verifying the deleted schedule detail shows operator-facing runtime-sync copy instead of raw lifecycle markers
    - verifying the shared Schedules nav badge matches the visible canonical schedule list after deletion
  - surfaced linked schedule ownership directly on work detail:
    - work items now show linked one-shot or recurring schedules in-place
    - recurring schedules can be paused, edited, resumed, or deleted from the work item itself
    - work detail keeps the schedule-detail link for deeper inspection instead of forcing operators to choose between one surface or the other
  - browser-validated at iPhone width:
    - opening a schedule-owned work item from the Work surface
    - inspecting the linked recurring schedule summary from work detail
    - confirming recurring controls render correctly from the work-owned surface on narrow viewport
  Remaining:
  - wire launch/preset flows into the intended mobile-first final UI
  - add browser automation for launch and board validation once the surface stabilizes
- `2026-03-21`: `TASK-006` is now partially implemented.
  Completed:
  - added the first create-new conversation-to-work flow from canonical chat threads
  - launch-created work can now retain `conversationId` / `sourceConversationId` linkage end to end
  - added a safe attach-to-existing path that only allows attaching to work items that are unlinked or already linked to the same conversation
  - added `/api/product-state/work-items/[id]/attach-conversation` and surfaced it in the conversation detail UI
  Remaining:
  - expand attach-to-existing beyond the current conservative single-link model if broader many-to-many linkage is later needed
  - refine the final chat escalation UX now that both create-new and attach paths exist

## 8. Notes for Execution

- Keep the launch payload contract stable before wiring the UI.
- Work board queries should consume canonical projections instead of recomputing status in the client.
- Avoid shipping chat escalation until attach-to-existing behavior is supported; duplication risk is too high otherwise.
- Schedules UI must surface `runtime-native` versus `product-managed` source clearly.
- Broader impact from `FEAT-001` discovery and implementation:
  - one-shot schedule records should persist `external_job_id` when a runtime-native schedule is created
  - scheduled runs should attach `external_session_id` and `external_session_key` as early as possible so later cron-run events can correlate without heuristics
  - board and schedule UI should consume `work_item_summaries` and `schedule_summaries` as the starting read models rather than recomputing lane/status client-side
  - runtime schedule sync needs explicit status taxonomy in canonical state:
    - `pending_sync`
    - `scheduled`
    - `sync_failed`
    - `completed`
    - `failed`
    - `missed`
  - schedule launches are now partial-success operations by design: canonical work and schedule records are always created first, then runtime sync is recorded explicitly instead of failing the whole launch and encouraging duplicate retries
  - schedule reconciliation can now update canonical schedule health from runtime cron list/run history, but it still does not materialize canonical runs from one-shot execution; that remains a separate downstream task to avoid inventing run objects from incomplete evidence
  - schedules are now a first-class drilldown surface rather than a summary-only list, so future Inbox and board attention paths can link directly into schedule detail instead of forcing operators to infer runtime state from list rows
  - canonical summary surfaces are no longer dead ends: cross-links into work/run detail are now part of the product-state UX contract, so future summary pages should preserve drilldown paths instead of rendering isolated cards
  - drafts are now a separate product-state object, which keeps the board semantically trustworthy and gives later mobile flows a clean staging area for edit/promote/discard behavior
  - recommended jobs are now a concrete bridge between “feature exists” and “real operating loop exists”, so future recurring-schedule work should reuse these preset definitions instead of inventing separate hidden job configs
  - childcare context is now carried as explicit read-only prompt content rather than implicit operator knowledge, which makes the jobs safer to delegate and easier to audit
  - recurring starter jobs proved that Meeseek Box needs to hydrate producer-report commands with canonical schedule ids before handing prompts to the runtime; this is now a platform contract for any future scheduled prompt templates that contain output-report placeholders
  - recurring schedule creation now creates stable scheduled work items up front, which keeps the board trustworthy but also means future schedule deletion/edit flows must decide what happens to the standing work item instead of pretending the schedule is isolated
  - recurring schedule lifecycle is now part of the board contract, not just the Schedules contract: pause/edit preserve the standing work item as still-owned operational intent, while delete archives that work item so the Work board remains trustworthy instead of mixing removed loops with active work
  - work detail is now an operational control surface for schedule-owned work, which raises the bar for linked-object consistency: schedule state, work state, and recurring controls must stay coherent whether an operator enters through Work or Schedules
  - deleted schedules must be treated as audit-visible but operationally hidden objects across every shared read path, not just the primary Schedules page; browser validation exposed the nav badge as a second read model that needed the same filter
  - lifecycle state taxonomy now has operator-facing normalization requirements; once canonical state starts carrying finer-grained sync markers, shared presentation helpers become integration points that need validation alongside the backend mutations
  - deduping recurring starter jobs by `recommendedJobSlug` keeps v1 light and prevents accidental duplicate daily/weekly loops, but any future “multiple morning briefs” behavior will need an explicit naming/instance model rather than weakening this guard implicitly
  - conservative attach-to-existing keeps the current one-conversation-per-work-item data model intact, so any future many-to-many linkage should be introduced deliberately through a new link model rather than implicit field overloading
  - browser validation showed that legacy shell dependencies can still leak into canonical experiences even when backend state is correct, so shared-layout components should be treated as high-risk integration points during future UI changes
