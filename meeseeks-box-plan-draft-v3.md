# Meeseek Box — Build Plan v3

## Document History

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2026-03-15 | Initial plan draft |
| v2 | 2026-03-18 | Expanded product model, approval system, memory governance, event ingestion, schedule health, artifact patterns |
| v3 | 2026-03-18 | Reconciled v2 with operator decisions and `iron-claw-mini` constraints. Restored in-app-first attention model, tightened approval tiers, clarified memory delete semantics, and corrected soft scoping language so it does not imply runtime enforcement that does not yet exist. |

---

## 1. What This Is

Meeseek Box is the planned operator-facing app layer for JD's Mac mini OpenClaw runtime.

It is not intended to replace OpenClaw as the execution engine. It is intended to sit above it as a cross-device control and visibility layer for a persistent, self-hosted, agentic environment running on a Mac mini and accessed primarily from iPhone and MacBook.

This document is the working v3 plan. It is designed to be:
- peer-readable enough for product and design discussion
- specific enough to guide implementation
- aligned with the security principles in `iron-claw-mini`

---

## 2. Current Environment

### Devices and roles

- Mac mini: protected runtime host
- MacBook Pro: full dashboard, deep run inspection, artifact review, memory review/editing, configuration
- iPhone: primary mobile access surface for quick capture, launch, triage, status glance, and approvals
- iPad: secondary review surface for artifacts, reports, and approval with context

### Runtime model

The Mac mini runs the OpenClaw environment under the `agent-playground` tenant.

OpenClaw already owns:
- agent execution
- schedules
- tool invocation
- workspace operations
- gateway/runtime management
- model invocation

The current runtime is not being replaced.

### Current UI starting points

#### ClawPort / Claw-Tower

The current Claw-Tower fork is the closest thing to the desired product shape because it already has:
- dashboard views
- chat
- Kanban-like work areas
- cron monitoring
- cost/activity views
- memory browser
- agent views

Its key limitations are now explicit:
- chat is browser-local
- Kanban/task data is browser-local
- some settings are browser-local
- cross-device continuity is under-modeled
- memory visibility exists, but memory governance does not
- durable operational objects are not yet the true center of the product

#### OpenClaw built-in surfaces

OpenClaw's built-in UI/control surfaces are stronger as runtime/control-plane views than as a full operator command center.

They are useful for:
- runtime truth
- session and approval semantics
- gateway/control-plane health

They are not sufficient as the product shell for:
- work organization
- cross-device shared state
- artifact-centric workflows
- memory lineage/governance
- a command-center style operator workspace

### Starting-point decision

The architecture remains hybrid:
- OpenClaw stays the execution substrate and runtime truth
- Claw-Tower remains the implementation base for the v1 shell
- Meeseek Box adds a new product-state layer above the runtime
- chat and Kanban migration from browser-local to server-backed is foundational work, not polish

---

## 3. Security and Operating Constraints

The `iron-claw-mini` security model is non-negotiable. Meeseek Box must stay inside it.

### Must remain true

- single trusted operator model in v1
- Tailnet-only remote access
- protected runtime host on the Mac mini
- `agent-playground` remains the runtime tenant
- no widened LAN/WAN exposure
- no direct access to `/Users/jdfetterly-mini` by default
- no secrets in repo files, shared exchange paths, or browser-local state
- no bypass of explicit approval gates for sensitive actions
- least privilege and reversible changes by default

### Implications for the product

- Meeseek Box is not a generic SaaS collaboration layer
- it is not a broad remote admin console
- product scopes like `ops` and `personal` are organizational in v1, not security boundaries
- any write into runtime-owned state must go through controlled adapters and whitelisted paths
- approvals must remain conservative until runtime capabilities are proven

---

## 4. Product Thesis

The target is not "a UI for OpenClaw."

The target is a personal operator command center.

The center of gravity is:
- what exists
- what is happening
- what failed
- what needs attention
- what was produced
- what context is being preserved
- what work needs to be organized and moved forward

The product is organized around durable operational objects, not around screens and not around chat threads.

### Core object model

- `Agent`
- `AgentModelDefault`
- `Conversation`
- `Message`
- `Attachment`
- `Run`
- `RunEvent`
- `WorkItem`
- `Approval`
- `Schedule`
- `Artifact`
- `MemoryEntry`
- `MemorySource`
- `SavedLaunchPreset`
- `AttentionItem`
- `DomainScope`

This object model is the real product foundation. The UI is a projection of it.

---

## 5. Primary UX Model

### Command-center framing

The system should answer:
1. What exists?
2. What is running now?
3. What happened and why?
4. What needs me?

### Primary organizing surface

The work board is the main organizational layer.

Chat remains important, but its role is to:
- start work
- continue work
- attach context
- escalate conversations into operational objects

Once a conversation becomes a run, work item, artifact, or memory action, that object lives in product state and no longer depends on the chat thread for its existence.

### iPhone-first priority

The must-win workflows on iPhone are:
- launch work fast
- organize work through board cards
- inspect attention items
- review failures
- approve/deny sensitive actions
- glance at system state

### Device-specific affordances

- iPhone: one-handed, short-session interactions; launch, triage, approve, status
- iPad: review artifacts, reports, and approvals with more context
- MacBook: deep inspection, memory review, artifact review, debugging, configuration

### Cross-device continuity

V1 achieves continuity through shared canonical state in the product-state layer. It does not depend on Apple Handoff.

The same conversation, work item, run, artifact, and memory metadata should be visible from any device that accesses the app.

---

## 6. Architecture

### Fixed layer model

#### Layer 1: OpenClaw runtime

OpenClaw remains authoritative for:
- agent execution
- schedules
- tool invocation
- gateway/runtime status
- runtime approval blocking/resume if supported

#### Layer 2: Meeseek Box product-state layer

Meeseek Box becomes authoritative for:
- shared conversations
- work board state
- run and event registry
- artifact registry
- memory metadata and provenance
- attention/inbox derivation
- saved launch presets

#### Layer 3: Clients

V1 client surface:
- responsive web app
- iPhone-first ergonomics
- MacBook full-featured

### Storage model

V1 storage model:
- SQLite for relational product state
- JSON for flexible event payloads
- file-backed storage for artifacts, attachments, and canonical runtime memory files
- SQLite FTS5 for full-text search

Design constraint:
- the data access layer must use a clean abstraction so later Postgres migration remains possible if concurrency or workload changes justify it

### Required backend components

- product-state API
- OpenClaw adapter
- event ingestion and normalization layer
- memory sync/write-through adapter
- artifact/attachment store

---

## 7. OpenClaw Integration Contract

These are required integration points, not soft wishes.

### Event emission

Meeseek Box requires a normalized event stream.

If OpenClaw does not emit structured events natively, the adapter must produce canonical events by combining:
- runtime output
- API responses
- designated file changes
- schedule observations

### Approval blocking/resume

If OpenClaw supports external blocking/resume for approval-needed states, the product will use that.

If it does not, the adapter must provide a wrapper or gating pattern.

This is a primary technical validation item before approval-heavy features are treated as complete.

### Schedule state

The adapter must read schedule definitions and history.

For one-shot and recurring scheduling:
- if OpenClaw supports creation natively, use it
- if not, the product must explicitly document that one-shot scheduling is product-managed and not a native OpenClaw schedule until executed

### Artifact discovery

The adapter must detect artifacts via:
- native runtime events where available
- designated output-path watching
- explicit artifact registration when needed

### Memory access tracking

If OpenClaw does not emit memory read/write signals, the adapter must use file monitoring or post-run diffing for whitelisted memory paths.

### Concurrency

The adapter must document actual OpenClaw run concurrency behavior before board-level concurrency assumptions are treated as settled.

---

## 8. Memory Governance Model

### v1 split of truth

The underlying CLI/runtime memory remains file-backed.

Supported runtime-compatible locations:
- `$WORKSPACE_PATH/MEMORY.md`
- `$WORKSPACE_PATH/memory/*`

Meeseek Box adds metadata, lineage, freshness, scope, and review state on top of those files.

### Three-tier conceptual model

#### Tier 1: Ephemeral

Current task/conversation context.

- lives in conversation and run context
- discarded after task completion
- not written to long-term memory files by default

#### Tier 2: Situational

Active multi-step work context.

- lives in `WorkItem` metadata and run context
- retained for active work
- can be promoted to long-term by explicit action

#### Tier 3: Long-term

Persistent facts, preferences, and reusable knowledge.

- represented as `MemoryEntry`
- backed by compatible runtime memory files
- linked to origin through `MemorySource`
- freshness and review rules apply

### `MemoryEntry`

Represents a governed, inspectable memory object.

Stores:
- type
- scope
- summary
- canonical source reference
- freshness state
- review state
- last-used metadata

### `MemorySource`

Represents provenance for a memory entry.

Possible source kinds:
- `workspace_file`
- `conversation`
- `message`
- `run`
- `run_event`
- `artifact`
- `schedule_output`
- `manual_operator_edit`
- `system_archive_action`

### Memory sync behavior

1. Runtime writes a compatible file or emits a memory event
2. Memory adapter ingests the change
3. Product layer upserts `MemoryEntry`
4. Product layer appends `MemorySource`
5. UI shows lineage, scope, freshness, and review state
6. Operator edits go through controlled write-through only

### Memory write rules

- no arbitrary file browser editing
- only controlled write-through into whitelisted runtime-owned memory paths
- every write generates provenance and audit events
- scope tagging is recorded in metadata and should influence default routing and views

### Delete and archive semantics

This is clarified in v3 because it was ambiguous in v2.

V1 should not offer a generic destructive "delete memory" action unless the source is a dedicated, adapter-owned file that can be safely removed.

Default actions should be:
- `archive` — hide from default views, preserve provenance
- `supersede` — link a newer entry as replacement
- `mark stale` — send to review queue
- `edit` — controlled write-through for supported sources

For shared source documents like `MEMORY.md`:
- there is no generic delete in v1
- removal requires an explicit curated edit flow
- the app must not pretend metadata deletion removed underlying file content

### Memory governance UI

The operator can:
- view
- search
- filter
- review
- archive
- edit supported entries

The operator cannot assume every entry can be hard-deleted from source in v1.

---

## 9. Work Board and Run Model

### Work board

The Kanban board is the primary organizational surface.

Lanes:
- `queued`
- `running`
- `scheduled`
- `needs_input`
- `needs_approval`
- `blocked`
- `failed`
- `completed`

Card contents:
- title
- scope
- assigned agent
- state
- schedule time if future-scheduled
- linked run count
- latest activity time
- approval/failure badges
- latest artifact chip

Card drawer:
- linked conversation
- current/latest run
- event timeline
- artifacts
- approvals
- memory touched
- retry / reschedule / archive controls

### Runs

Runs are first-class execution objects.

Each run detail view should support:
- run summary and metadata
- trigger source
- status and duration
- model/tool usage summary
- event timeline
- approvals encountered and their resolution
- artifacts produced
- memory reads/writes with provenance links

V1 also includes replay/time-travel for completed runs, but timeline-first. Full graph visualization stays out of scope.

---

## 10. Approval System Design

### Typed approval steps

V1 supports four approval step types:
1. `Approval`
2. `Data Input`
3. `Task`
4. `Path Selection`

### Risk tiers

V3 tightens the risk model to align better with `iron-claw-mini`.

- `read-only`: auto-approved, logged
- `low-risk product-state write`: may auto-approve if it only mutates Meeseek Box metadata and has no runtime, file, schedule, or external side effect
- `runtime or filesystem write`: approval required in v1
- `irreversible write`: approval required
- `external communication`: approval required

Examples of `low-risk product-state write`:
- pinning a preset
- marking a board view favorite
- changing local display preferences

Examples of `runtime or filesystem write`:
- editing long-term memory files
- rescheduling or creating runtime jobs
- writing artifacts into runtime-owned output paths
- repo-affecting operations

This is intentionally conservative. The product can later earn more auto-approved behavior once actual runtime actions are categorized and observed safely.

### Approval mechanics

- runtime blocks or wrapper gates execution on approval-needed state
- product layer receives canonical `approval_requested`
- Inbox surfaces typed context
- operator resolves
- resolution is logged with full context
- runtime resumes or wrapper releases only after explicit resolution

### Approval time-boxing

- configurable timeout per tier
- timeout must escalate or cancel
- timeout must never auto-approve

---

## 11. Soft Scoping Model

v3 narrows the language here so it does not imply enforcement the runtime does not yet provide.

### What scopes are in v1

Scopes are product-level organizational tags with:
- default filtering
- default routing
- memory categorization
- cleaner work separation in the UI

Default scopes:
- `ops`
- `personal`

### What scopes do

- tag every work item, conversation, run, memory entry, agent, and preset
- drive default views and filters
- influence which memory targets and presets are suggested by default
- reduce context pollution across product views

### What scopes do not do

- they are not OS-level isolation
- they are not security boundaries
- they do not by themselves guarantee runtime memory access control

If the runtime later supports stronger path-level or workspace-level memory partitioning, the plan can be tightened. V1 should describe scoping honestly as UI/query/routing behavior.

---

## 12. Saved Launch Presets

Launch should become a signature interaction on iPhone.

The system supports:
- pinned presets on home
- recent presets
- one-tap rerun
- edit-before-run
- save from successful run
- scoped presets for `ops` or `personal`

Each preset stores:
- title
- scope
- default agent
- optional model override
- default priority
- output type
- timing preference (`run now` or `schedule once`)
- optional prompt template

Launch modes:
- run now
- schedule once for later
- save draft

---

## 13. Event Ingestion Layer

### Why it exists

All operator-facing state should derive from canonical events, not from UI-local assumptions.

Without this layer, the product will fragment into multiple partial truths about:
- runs
- inbox items
- work cards
- memory lineage
- artifacts
- schedule health

### Event sources

- OpenClaw runtime events
- approval events
- schedule events
- memory adapter events
- artifact creation/versioning events
- work item state changes
- conversation escalation/linkage actions

### Canonical event types

- `run_created`
- `run_started`
- `run_completed`
- `run_failed`
- `run_blocked`
- `tool_invoked`
- `tool_succeeded`
- `tool_failed`
- `model_invoked`
- `approval_requested`
- `approval_resolved`
- `artifact_created`
- `artifact_versioned`
- `memory_read`
- `memory_write`
- `memory_archived`
- `schedule_created`
- `schedule_triggered`
- `schedule_missed`
- `schedule_paused`
- `schedule_resumed`
- `conversation_linked`
- `conversation_escalated`
- `work_item_created`
- `work_item_state_changed`

### Derived consumers

- Inbox / attention items
- run timelines
- work-card freshness/status badges
- memory provenance linkage
- recent activity rail
- schedule health summaries
- artifact version history

---

## 14. Page and Surface Model

### Home

Fast system pulse:
- health strip
- pinned launch presets
- needs attention
- active work
- recent artifacts
- upcoming scheduled items

### Work

Primary organizational surface:
- Kanban board
- filters by scope, agent, priority, date
- saved views
- card drill-down

### Chat

Front door for initiating and continuing work:
- conversation list
- thread view
- attachments
- escalation actions:
  - save as artifact
  - run in background
  - schedule this
  - remember this
  - create work item

### Inbox

Derived from canonical events and state:
- approvals
- failures
- blocked items
- stale work
- memory review prompts

### Runs

Execution explorer:
- list
- structured detail
- replay

### Artifacts

First-class outputs:
- list with filters
- detail with provenance
- versioning for recurring outputs
- preview on mobile

### Memory

Context governance:
- browser
- search
- provenance
- relationship view
- freshness/review

### Schedules

Operations surface:
- schedule list
- health metrics
- one-shot and recurring status
- pause / resume / manual trigger where supported

### Agents

Structure and defaults:
- hierarchy
- roles
- tools
- schedules
- recent activity

### Settings

- in-app attention preferences
- Slack fallback preferences
- scope defaults
- model defaults per agent
- review cadences and thresholds

---

## 15. Cross-Cutting UI Patterns

- universal drawers for run, work item, artifact, and agent
- persistent desktop activity rail
- linked navigation across entities
- saved operational views

These patterns matter because the system is relational. The UI should let the operator move between objects without losing context.

---

## 16. Notification Model (V1)

This is corrected in v3 to match the operator decision.

### Primary attention surface

The primary operational attention surface is in-app:
- `Home` for pulse
- `Inbox` for action-needed items
- board badges and run/card drill-downs for context

### Out-of-app alerting

Slack is the only out-of-app alert channel in v1.

That means:
- Slack is fallback and degraded-mode alerting
- the app remains the main place to inspect and resolve work
- v1 does not rely on native push notifications

### What triggers Slack fallback alerts

- approval requests that require action
- failures with no retry remaining
- missed schedules
- approval timeout approaching

### What does not trigger Slack alerts

- successful runs
- read-only auto-approvals
- low-risk product-state metadata changes
- memory archive/review changes

### Future opportunities

Post-v1:
- native push
- daily/weekly digest artifacts
- per-agent notification rules
- quiet hours

---

## 17. Included In V1

- responsive web app
- server-backed shared conversations
- server-backed Kanban board as the primary organizer
- one-shot delayed scheduling from launch flow
- recurring schedule visibility with health metrics
- run timelines and replay for completed runs
- artifact registry with versioning and provenance
- memory metadata, provenance, freshness, and review UI
- soft product scoping for `ops` and `personal`
- saved launch presets
- typed approval system with conservative risk tiers
- event ingestion and normalization layer
- Inbox derived from canonical event/state
- per-agent default model plus per-job override
- OpenClaw health and approval integration
- in-app-first attention model with Slack fallback alerts
- universal drawers and linked navigation

---

## 18. Excluded From V1

- native iOS app
- Apple Handoff
- multi-user auth / shared team model
- public internet access
- full OpenClaw admin replacement
- full memory engine replacement
- semantic/vector memory as system of record
- realtime voice-first experience
- unrestricted filesystem editing
- multi-host federation
- full graph visualization for runs

---

## 19. Acceptance Criteria

### Core product

- launching work from iPhone creates a board card immediately
- one-shot scheduled work appears in both Work and Schedules
- the same conversation, card, and run state is visible on MacBook and iPhone
- no canonical conversation or work state depends on browser-local storage
- saved launch presets support one-tap run from iPhone home view

### Approvals and trust

- approvals surface as typed steps, not generic yes/no
- read-only actions are auto-approved and logged
- runtime or filesystem writes require approval unless explicitly allowlisted
- approvals not acted on within timeout escalate or cancel
- approval resolution is logged with full context

### Runs and debugging

- every run has a structured event timeline viewable from any device
- completed runs support replay/time-travel inspection
- failed runs show clear failure reason and offer retry

### Memory governance

- memory entries display provenance to file/run/conversation/artifact
- supported operator edits update compatible mini memory files through controlled adapters
- memory archive/review actions are explicit and do not falsely imply source deletion
- default views filter memory by scope
- stale memory entries surface in Inbox for review

### Schedules and artifacts

- schedules show health metrics and missed runs
- recurring schedule outputs support artifact versioning
- artifact drawers are accessible from runs, chat, board items, and schedules

### Security

- access remains Tailnet-only and aligned with `iron-claw-mini`
- no secrets in browser-local storage or repo files
- memory writes only happen through controlled adapters to whitelisted paths

---

## 20. Main Risks

### Product risks

- the product could collapse back into "chat plus dashboards" if the object model is weak
- the board could become superficial if card state drifts from real runtime state
- soft scoping may reduce clutter without being strong enough for some future use cases
- approval friction may be too high if tiers are not tuned carefully

### Technical risks

- browser-local assumptions in Claw-Tower are widespread; migration is foundational work
- OpenClaw runtime event surfaces may require significant adapter wrapping
- OpenClaw approval blocking/resume capability is unvalidated
- mobile web constraints on iPhone may make live-state UX harder than desktop
- attachment and artifact growth may create storage/indexing complexity
- SQLite single-writer behavior may create contention if event ingestion is noisy

### Security risks

- any temptation to widen remote authority beyond current approval boundaries
- accidental creation of a broader admin surface than the security model allows
- increased sensitivity of shared persisted conversations and artifacts
- misleading scope language could create false confidence if not documented carefully

---

## 21. What Success Looks Like

The system succeeds if:
- work can be launched from iPhone quickly, including via presets
- every important action becomes a visible tracked object with provenance
- the work board is the primary way to organize and inspect active work
- conversations persist across devices and can be escalated into operational objects
- approvals are typed, conservative, and resolvable remotely without unsafe automation
- runs are debuggable through structured replay rather than log-reading
- memory is inspectable through lineage, scope, freshness, archive state, and review state
- schedules are health-monitored, not just listed
- artifacts are versioned, browsable, and consistently accessible across surfaces
- all of this happens without breaking the security posture of the Mac mini environment

---

## 22. Future Work After V1

- native iPhone app
- richer notification model
- Apple Handoff
- stronger scope/project-space separation if needed
- semantic memory search
- workflow templates
- deeper artifact routing
- richer model analytics
- run graph visualization
- voice interaction
- broader admin controls if the security model and runtime support them safely
