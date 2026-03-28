# Meeseek Box — Build Plan v2

## Document History

| Version | Date | Changes |
|---------|------|---------|
| v1 | 2026-03-15 | Initial plan: background brief + build spec |
| v2 | 2026-03-18 | Strengthened spec based on gap analysis against all supporting docs. Added typed approvals, run replay, soft scoping, memory governance model, OpenClaw integration contract, device affordances, escalation UX, schedule health, artifact patterns. Resolved contradictions around chat/Kanban local storage. See `plan-v2-change-summary.md` for full rationale. |

---

# Part 1: Background Brief

## What This Is

Meeseek Box is the planned operator-facing app layer for JD's Mac mini OpenClaw runtime.

It is not intended to replace OpenClaw as the execution engine. It is intended to sit above it as a cross-device control and visibility layer for the actual system JD is building: a persistent, self-hosted, agentic environment running on a Mac mini and accessed primarily from iPhone and MacBook.

This document is meant to give a technical product/design peer enough context to understand:

- the current runtime and security posture
- why the existing UI options are insufficient on their own
- what product shape is actually being targeted
- what constraints are fixed versus flexible
- what the next build phase is meant to accomplish

---

## Current Environment

### Devices and roles

The working environment is anchored around four Apple devices:

- Mac mini: the protected runtime host
- MacBook Pro: main desktop/laptop control surface — deep work, full dashboard, run inspection, memory editing, configuration
- iPhone: primary mobile access surface — quick capture, triage, approve/deny, status glance (one-handed, 30-second interactions)
- iPad: secondary review/access device — review artifacts, approve with context, read reports, light editing

### Current runtime model

The Mac mini runs the OpenClaw agent environment under the `agent-playground` tenant.

OpenClaw is already the execution substrate for:

- agents
- schedules
- tools
- workspace operations
- gateway/runtime management
- model invocation

The current runtime is not being replaced.

### Security model source of truth

The security and governance model lives in `iron-claw-mini`.

Key principles from that repo that must remain true:

- single trusted operator model in v1
- Tailnet-only remote access
- protected runtime host on the Mac mini
- `agent-playground` as the runtime tenant
- no widened LAN/WAN exposure
- no direct access to `/Users/jdfetterly-mini` by default
- no secrets in repo files, shared exchange paths, or browser-local state
- no bypass of explicit approval gates for sensitive actions
- least privilege and reversible changes by default

This is not a generic SaaS design problem. It is a design problem inside a very specific operating and trust model.

---

## The Current UI Starting Points

### 1. ClawPort / Claw-Tower

ClawPort, and the current Claw-Tower fork derived from it, is the closest thing to the target product shape.

It already has command-center-like surfaces such as:

- dashboard views
- chat
- Kanban-like work areas
- cron monitoring
- cost/activity views
- memory browser
- agent views

Why it looked like a strong base:

- it already thinks in terms of a broader AI operations surface, not just chat
- it is much closer to a command center than the built-in OpenClaw UI
- it gives a useful shell for the eventual product

Why it is not enough as-is:

- chat persistence is currently browser-local (confirmed: conversations do not sync across devices)
- Kanban/task data is currently browser-local (confirmed: cards do not sync across devices)
- some settings/personalization are browser-local
- the chat UI has a known payload-growth bug when replaying attachment-heavy history (patched locally but indicates immaturity)
- shared cross-device state is under-modeled
- memory is visible, but not yet governed through a strong canonical lineage model
- operational objects are not yet cleanly modeled as durable first-class system objects

### 2. OpenClaw built-in control/dashboard surfaces

OpenClaw's built-in UI and control surfaces are stronger as runtime/control-plane views than as a full operator command center.

Strengths:

- closer to gateway/runtime truth
- better aligned with session and approval semantics
- grounded in actual runtime behavior
- better fit for control-plane health and execution status

Weaknesses:

- too thin for the target product
- not rich enough as a persistent operator workspace
- lacks the command-center object model needed for work, artifacts, boards, memory governance, and shared conversation continuity

### Decision

The recommended architecture is hybrid:

- keep OpenClaw as the execution substrate and runtime truth
- use the Claw-Tower codebase as the initial shell
- build a new product-state layer above the runtime
- selectively surface OpenClaw-native control features where trust requires them
- migrate chat and Kanban from browser-local to server-backed as foundational work (not deferred)

---

## What Product Is Actually Being Built

The target is not "a UI for OpenClaw."

The target is a personal operator command center.

That means the center of gravity is:

- what exists
- what is happening
- what failed
- what needs attention
- what was produced
- what context is being preserved
- what work needs to be organized and moved forward

The product is organized around durable operational objects, not screens and not chat threads.

### Core object model

- agents
- conversations
- runs
- run events
- work items
- schedules
- approvals (typed, risk-tiered)
- artifacts (versioned, with provenance)
- memory entries (governed, scoped)
- memory sources
- scopes/domains
- saved launch presets
- attention items (derived)

This object model is the real product foundation. The UI is a projection of it.

---

## Why This Needs To Exist

The existing runtime can execute work, but the current access model is not good enough for the actual operating style JD is building toward.

Key unmet needs include:

- a scalable memory system with governance, lineage, and domain scoping
- project tracking and multiple Kanban views with server-backed persistence
- job and failure management with run replay and time-travel debugging
- different models based on job context
- chat continuity across devices (currently broken — browser-local only)
- reliable remote access from iPhone without needing to "log into the mini"
- a unified view of what is running, blocked, scheduled, failed, or waiting for approval
- typed approval workflows that distinguish approve/deny from data input, task completion, and path selection

The current state is hybrid in an unhelpful way:

- some data is genuinely shared via server-backed APIs (dashboard, activity, crons, memory browser, cost views)
- some of the most important product surfaces are still local to a browser session (chat, Kanban, settings)

That means the current product is not actually one shared operator console across devices.

---

## Product Direction

### Command-center framing

The right framing is a browser-based operating layer that makes the system legible and steerable across iPhone and MacBook.

It should answer:

1. What exists?
2. What is running now?
3. What happened and why?
4. What needs me?

### Primary organizing surface

The work board becomes the primary organizational layer.

Chat remains important, but its role is:

- start work
- continue work
- attach context
- escalate conversations into tracked operational objects ("save this," "run in background," "schedule weekly," "remember this")

It is not the canonical representation of work. Once a conversation is escalated to a run, work item, artifact, or memory entry, that object lives in the product state layer and is visible in the dashboard — it no longer depends on the chat thread for its existence.

### Mobile priority

The product is iPhone-first in terms of operational ergonomics.

That does not mean feature parity with desktop in every detail. It means the must-win workflows work well on iPhone:

- launch work (one-tap from saved presets)
- inspect attention items
- review failures
- approve/deny sensitive actions (including typed approval steps)
- glance at overall system state

### Device-specific affordances

- iPhone: quick capture (text, photo, screenshot), triage (approve/deny), status glance. Optimized for one-handed, 30-second interactions
- iPad: review artifacts, approve with context, read reports, light editing
- MacBook: full dashboard, deep run inspection, memory editing, artifact review, complex configuration, debugging

### Cross-device continuity

The system must support:

- shared conversations (migrated from browser-local to server-backed)
- shared cards/work items (migrated from browser-local to server-backed)
- shared runs
- shared artifacts
- shared schedule state
- shared memory metadata

The user should be able to start something on iPhone and continue on MacBook without losing state or context.

V1 achieves this through shared canonical state in the product-state layer, not through Apple Handoff (which is deferred). All clients read from the same API. A lightweight "current activity" pointer per device enables "continue where you left off" across devices.

---

## Core Architectural Direction

### Fixed layer model

**Layer 1: OpenClaw runtime**

- agents
- schedules
- tools
- gateway
- execution
- model invocation
- runtime approval authority (pause/resume on external signal)

**Layer 2: Meeseek Box product-state layer**

- canonical objects and metadata
- cross-device persistence
- event ingestion and normalization
- board state
- conversation persistence
- artifact registry with versioning
- memory metadata, lineage, and governance
- approval state machine (typed steps, risk tiers)
- attention/inbox derivation rules
- saved launch presets

**Layer 3: Clients**

- responsive web app in v1
- iPhone and MacBook first
- iPad second-order, not ignored

### Storage model

The v1 storage model is:

- SQLite for relational product state (single-operator, no concurrent-write pressure, simpler to operate)
- JSON for flexible event payloads and run event data
- file-backed storage for artifacts, attachments, and canonical memory files
- SQLite FTS5 for full-text search across conversations, memory, and artifacts

Design constraint: the data access layer must use a clean repository abstraction so migration to Postgres is possible post-v1 if concurrency or query complexity demands it.

### Memory governance model

The underlying CLI/runtime memory remains file-backed in v1.

Meeseek Box adds a three-tier conceptual model mapped to the file-backed reality:

**Tier 1 — Ephemeral:** current conversation/task context. Lives in conversation state. Discarded after task completion. Not persisted to memory files.

**Tier 2 — Situational:** active multi-step work context. Lives in `WorkItem` metadata and run context. Garbage-collected after workflow completes. May be promoted to long-term by operator action.

**Tier 3 — Long-term:** persistent facts, preferences, knowledge. Backed by `MemoryEntry` objects with provenance. Mapped to compatible runtime memory files (`$WORKSPACE_PATH/MEMORY.md`, `$WORKSPACE_PATH/memory/*`). Has explicit retention review triggers, freshness tracking, and domain scoping.

Key entities:

- `MemoryEntry` — canonical inspectable metadata object for long-term memory
- `MemorySource` — provenance record linking memory to its origin (run, conversation, artifact, manual edit, schedule output)

Memory sync behavior:

1. Runtime writes a compatible file or emits a memory event
2. Memory adapter ingests change
3. Upsert `MemoryEntry` with metadata
4. Append `MemorySource` provenance record
5. UI shows lineage, scope, freshness, and review state
6. Operator edits go through controlled write-through only

Memory write rules:

- no arbitrary file browser editing
- only controlled write-through into whitelisted runtime-owned memory paths
- every write generates provenance and audit events
- memory is scoped by domain (ops, personal) — agents in one scope see only their scoped memory by default
- operator can view all scopes; soft filtering controls default view

Memory governance UI:

- user can view, search, filter, edit, and delete what the system "knows"
- provenance chain visible for every entry (what created it, what modified it, what used it)
- freshness indicators and review prompts for stale entries
- domain-scoped views (ops vs personal)

### OpenClaw integration contract

This section documents what must be true about the OpenClaw adapter for the product to function. These are integration requirements, not assumptions.

**Event emission:** Meeseek Box requires a normalized event stream from OpenClaw. If OpenClaw does not emit structured events natively, the adapter must poll or wrap OpenClaw's runtime output (logs, API responses, file changes) to produce canonical events.

**Pause/resume for approvals:** The approval system requires OpenClaw to block execution when an approval-needed condition is met and resume when the product layer signals resolution. If OpenClaw does not support external pause/resume, the adapter must implement a wrapper pattern (e.g., a gating agent that holds execution until approval is resolved).

**Schedule state:** The adapter must be able to read OpenClaw's schedule definitions and execution history (`openclaw cron list --json`), and must be able to create one-shot and recurring schedules through the OpenClaw API or CLI.

**Concurrent runs:** The adapter must handle multiple active runs. If OpenClaw serializes execution, the product state layer must queue and manage concurrency at the Meeseek level.

**Artifact discovery:** The adapter must detect when OpenClaw produces output artifacts. This may be via event emission, file-system watching on designated output paths, or explicit API registration.

**Memory access tracking:** The adapter must track which runs read or wrote memory files. If OpenClaw does not emit memory access events, the adapter must use file-system monitoring or post-run diffing on memory paths.

These integration points represent the primary technical risk for the build. Each must be validated or designed around before dependent features can ship.

---

## Primary V1 UX Model

### Home

Fast system pulse:

- health strip (system status, active agent count, error rate)
- pinned launch presets (one-tap run)
- needs attention (approval count, failure count, stale items)
- active work (running cards, in-progress items)
- recent artifacts
- upcoming scheduled items

### Work

Primary organizational surface:

- Kanban board with lanes: queued, running, scheduled, needs_input, needs_approval, blocked, failed, completed
- filters by scope (ops/personal), agent, priority, date
- saved views for recurring operational perspectives ("what failed recently," "what's waiting on me," "what changed in memory this week")
- card drill-down opens a drawer with full context

Card contents:

- title, scope, assigned agent, state
- schedule time if future-scheduled
- linked run count, latest activity time
- approval/failure badges, latest artifact chip

Card drawer:

- linked conversation
- current/latest run with event timeline
- artifacts (with version list if schedule-produced)
- approvals (typed: approve/deny, data input, task, path selection)
- memory touched
- retry / reschedule / archive controls

### Chat

Front door for initiating and continuing work:

- conversation list (server-backed, shared across devices)
- thread view with message history
- attachments (photos, screenshots, files, clipboard)
- escalation actions: "save as artifact," "run in background," "schedule this," "remember this," "create work item"
- agent selector
- create or link work item actions

### Inbox

Derived from canonical events and state — not manually curated:

- approvals (typed steps: approve/deny with context, data input, task completion, path selection)
- failures (with run detail link and retry option)
- blocked items (with dependency/reason)
- stale work (configurable staleness threshold per scope)
- memory review prompts (entries past freshness threshold)
- "inbox zero" pattern: easy to clear pending items

Derivation rules:

- approval_requested events → inbox item
- run_failed events where retry is available → inbox item
- work_item_state_changed to blocked → inbox item
- memory_entry freshness past threshold → inbox item
- work items with no activity past configurable duration → stale item

### Runs

First-class execution explorer:

- run list with status, duration, agent, trigger source
- run detail view with structured inspection (not raw logs):
  - run summary and metadata
  - trigger source (conversation, schedule, preset, manual)
  - start/end time, duration, status
  - model and tool usage summary
  - event timeline (sequential understanding)
  - execution graph (structural understanding — which tools called, which branches taken)
  - retries and retry-from-step capability
  - approvals encountered and their resolution
  - artifacts produced
  - memory reads and writes with provenance links
- replay/time-travel: for any completed run, step through exactly what happened, in order, with inputs and outputs

### Artifacts

First-class outputs with provenance:

- artifact list with filters (agent, scope, date, type)
- artifact detail with: stable ID, creation timestamp, producing run, provenance chain
- artifact versioning: if a schedule produces recurring outputs, all versions are browsable
- artifact preview on mobile (text, markdown, images, PDFs)
- artifact drawer pattern accessible from runs, chat, board items, and schedules (consistent cross-surface access)

### Memory

Context governance, not passive storage:

- memory browser with search, filter by scope/domain/type/freshness
- relationship view (what depends on what)
- timeline view (what changed when)
- provenance panel (where this entry came from, what modified it, what used it)
- edit and delete with controlled write-through and audit trail
- domain-scoped views (ops vs personal)
- review queue for stale or flagged entries

### Schedules

Operations surface, not settings screen:

- all schedules with status, cadence, next run, last run, assigned agent
- schedule health metrics: success rate, average duration, failure patterns, failure streaks
- freshness of outputs (did it produce something useful, not just "did it run")
- missed run detection
- pause/resume and manual trigger from any device
- link to producing artifacts and recent runs

### Agents

System structure map:

- agent list with hierarchy/team graph
- tools and capabilities per agent
- memory scopes per agent
- schedules owned per agent
- recent activity and last run
- SOUL.md display (identity, expertise, limits, relationships)

### Settings

- notification preferences (Slack channel, alert types)
- scope/domain management
- model defaults per agent
- staleness thresholds
- memory review cadences

---

## Approval System Design

### Typed approval steps

Not all approvals are yes/no. V1 supports four step types (modeled after Relay.app):

1. **Approval** — yes/no on a proposed action. Shows: what action, what data, consequences, denial outcome
2. **Data Input** — agent needs missing information. Shows: what's needed, context, input field
3. **Task** — operator must do something and report back. Shows: instructions, completion confirmation
4. **Path Selection** — agent presents options, operator picks direction. Shows: options with tradeoffs

### Risk tiering

Actions are classified by risk level:

- **read-only** — auto-approved, logged
- **reversible write** — auto-approved in v1, logged, operator notified
- **irreversible write** — requires approval before execution
- **external communication** — requires approval before execution

Risk tier determines: whether approval is required, notification urgency, and audit depth.

### Approval mechanics

- OpenClaw pauses execution when approval-needed condition is met
- Product state layer receives approval_requested event
- Inbox surfaces the approval with typed context
- Operator resolves (approve, deny, approve-with-edit, provide input, select path)
- Product state layer signals OpenClaw to resume
- Resolution is logged with full context

### Approval time-boxing

- Configurable timeout per risk level
- If not acted on within window: escalate (Slack alert) or cancel (with notification)
- Runs do not hang indefinitely

---

## Soft Scoping Model

### Domain scopes in v1

Domains are organizational tags with filtering behavior, not hard isolation.

Default scopes: `ops` and `personal`. Extensible by operator.

### How scoping works

- every work item, conversation, run, memory entry, agent, and preset has a scope tag
- default views filter by scope (board shows ops by default; personal view available)
- memory is scoped: agents see their scoped memory by default, can be granted cross-scope read
- operator can view all scopes and override filters
- scope is metadata, not access control — no hard isolation in v1

### What scoping prevents

- context pollution between ops and personal work
- memory bleed across domains
- cluttered views when operating in one context

---

## Saved Launch Presets

Launch should become a signature interaction, especially on iPhone.

The system supports:

- pinned presets on home (one-tap run)
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
- output type (artifact type, destination)
- timing preference (run now, schedule once)
- optional prompt template

Launch modes:

- run now
- schedule once for later
- save draft

---

## Event Ingestion Layer

### Why it exists

All operator-facing state should derive from canonical events, not direct UI-local assumptions. Without it, the system fragments into multiple partial truths about runs, inbox items, work cards, memory lineage, artifacts, and schedule health.

### Event sources

- OpenClaw runtime events (via adapter)
- approval events (product state layer)
- schedule events (via adapter)
- memory adapter events
- artifact creation events
- work-item state changes
- conversation-to-run linkage actions

### Canonical event types

- `run_created`, `run_started`, `run_completed`, `run_failed`, `run_blocked`
- `tool_invoked`, `tool_succeeded`, `tool_failed`
- `model_invoked`
- `approval_requested`, `approval_resolved` (with step type and resolution)
- `artifact_created`, `artifact_versioned`
- `memory_read`, `memory_write`, `memory_deleted`
- `schedule_created`, `schedule_triggered`, `schedule_missed`, `schedule_paused`, `schedule_resumed`
- `conversation_linked`, `conversation_escalated`
- `work_item_state_changed`, `work_item_created`

### Derived consumers

The following are derived from normalized events plus canonical state:

- inbox / attention items (via derivation rules)
- run timelines and execution graphs
- work-card freshness/status badges
- memory provenance linkage
- recent activity rails
- schedule health summaries and failure streak detection
- artifact version histories

---

## Cross-Cutting UI Patterns

These matter more than any one page.

### Universal drawers

From anywhere in the app, you should be able to open:

- run drawer
- agent drawer
- artifact drawer (consistent across runs, chat, board, schedules)
- work item drawer

This matters because the real system is relational. You should be able to jump between objects without losing context.

### Persistent activity rail

A global stream of meaningful system events. Not just on a dedicated Events page — accessible as a side rail from any page on desktop.

### Linked navigation across entities

From:

- chat → run
- run → artifact
- work item → dependency
- schedule → recent runs
- memory object → provenance
- artifact → producing run → conversation

This is how the app becomes a command center instead of a collection of pages.

### Saved views

The operator will develop recurring operational perspectives. These should be savable:

- "what failed recently"
- "what is waiting on me"
- "what changed in memory this week"
- "which agents are most active"
- "which recurring jobs are unstable"

---

## Notification Model (V1)

V1 uses Slack as the sole push channel.

### What triggers Slack notifications

- approval_requested (irreversible write, external communication)
- run_failed (with no automatic retry remaining)
- schedule_missed
- approval timeout approaching

### What does NOT trigger Slack notifications

- successful run completions (visible in dashboard)
- read-only auto-approvals (logged only)
- memory writes (visible in memory UI)

### Configuration

- Slack channel target (configurable)
- Alert types on/off per category

Post-v1 opportunities: in-app push, daily/weekly digest artifacts, per-agent notification rules, quiet hours.

---

## Included In V1

- responsive web app (iPhone-first, MacBook full-featured)
- server-backed shared conversations (migrated from browser-local)
- server-backed Kanban board as primary organizing layer (migrated from browser-local)
- one-shot delayed scheduling from launch flow
- recurring schedule visibility with health metrics
- run timelines with event-level detail
- run replay / time-travel debugging for completed runs
- artifact registry with versioning and provenance
- memory metadata, governance UI, and provenance (three-tier conceptual model)
- soft domain scoping (ops/personal) with filtered views and scoped memory
- saved launch presets with one-tap run
- typed approval system (4 step types) with risk tiering
- event ingestion and normalization layer
- inbox derived from canonical event/state with clear derivation rules
- per-agent default model plus per-job override
- OpenClaw health and approval integration (via adapter)
- Slack fallback alerts for approvals, failures, and missed schedules
- escalation from chat to operational objects
- universal drawer patterns and linked navigation
- device-appropriate affordances (iPhone one-handed, MacBook full dashboard)

---

## Excluded From V1

- native iOS app
- Apple Handoff
- multi-user auth / shared team model
- public internet access
- full OpenClaw admin replacement
- full memory engine replacement
- semantic/vector memory as the primary source of truth
- realtime voice-first experience
- unrestricted filesystem editing
- multi-host federation
- in-app push notifications (Slack only in v1)
- daily/weekly digest artifacts
- execution graph visualization (timeline only in v1; graph mode deferred)

---

## Acceptance Criteria

### Core product

- launching work from iPhone creates a board card immediately
- one-shot scheduled work appears in both Work and Schedules
- the same conversation, card, and run state is visible on MacBook and iPhone
- no canonical conversation or work state depends on browser-local storage
- saved launch presets support one-tap run from iPhone home view

### Approvals and trust

- approvals surface as typed steps (approve/deny, data input, task, path selection) — not generic yes/no
- approvals are classified by risk tier; read-only actions are auto-approved
- approvals not acted on within configured timeout escalate or cancel — runs do not hang
- approval resolution is logged with full context

### Runs and debugging

- every run has a structured event timeline viewable from any device
- for any completed run, the operator can step through what happened with inputs and outputs (replay)
- failed runs show clear failure reason and offer retry

### Memory governance

- memory entries display provenance to file/run/conversation/artifact
- operator memory edits update compatible mini memory files through controlled adapters
- memory is scoped by domain; default views filter by scope
- stale memory entries surface in inbox for review

### Artifacts

- artifacts are versioned when produced by recurring schedules
- artifact drawer is accessible from runs, chat, board items, and schedules

### Schedules

- schedule health shows success rate, failure patterns, and missed runs
- schedules can be paused and manually triggered from any device

### Security

- access remains Tailnet-only and aligned with `iron-claw-mini`
- no secrets in browser-local storage or repo files
- memory writes only through controlled adapters to whitelisted paths

---

## Main Risks

### Product risks

- the product could collapse back into "chat plus dashboards" if the object model is weak
- the board could become superficial if cards are not tightly coupled to real runtime state
- personal and ops contexts could blur if scoping is too soft to be useful in practice
- typed approvals could create friction if risk tiering is miscalibrated — start conservative, earn the right to relax

### Technical risks

- browser-local assumptions in Claw-Tower are confirmed to be widespread (chat, Kanban, settings) — migration is foundational work, not polish
- OpenClaw runtime event surfaces may not be clean enough for ideal normalization — the adapter may need significant wrapping
- OpenClaw's pause/resume capability for approvals is unvalidated — if it can't block externally, a wrapper pattern is needed
- mobile web constraints on iPhone may make live-state UX harder than desktop
- attachment and artifact growth may create storage/indexing complexity
- SQLite single-writer constraint may become a bottleneck if background event ingestion and user API calls contend

### Integration risks

- OpenClaw event emission format is unknown — must be validated before event layer design is finalized
- OpenClaw concurrent run behavior is unknown — must be validated before work board assumptions hold
- Memory access tracking depends on either OpenClaw event emission or file-system monitoring — neither is confirmed

### Security risks

- any temptation to widen remote authority beyond current approval boundaries
- accidental creation of a richer remote admin surface than the security model allows
- increased sensitivity of shared persisted conversations and artifacts
- approval time-boxing must not auto-approve — it should escalate or cancel

---

## What Success Looks Like

The system succeeds if:

- work can be launched from iPhone quickly, with one-tap presets
- every important action becomes a visible tracked object with provenance
- the work board is the primary way to organize and inspect active work
- conversations persist across devices and can be escalated to operational objects
- approvals are typed, risk-tiered, and resolvable remotely without friction
- runs are debuggable through structured replay, not log-reading
- memory is inspectable through lineage, scope, and freshness — not treated as hidden magic
- schedules are health-monitored, not just listed
- artifacts are versioned, browsable, and consistently accessible across all surfaces
- all of this happens without breaking the current security posture of the mini

---

## Future Work After V1

- native iPhone app
- richer notification model (in-app push, digests, per-agent rules, quiet hours)
- Apple Handoff
- stronger project-space scoping (hard isolation if needed)
- semantic memory search
- workflow templates
- deeper artifact routing
- richer model analytics
- execution graph visualization (structural view beyond timeline)
- voice interaction (chained ASR → LLM → TTS, iPhone/AirPods primary)
- broader admin controls if security posture allows
