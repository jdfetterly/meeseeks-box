# Documentation Package for Meeseek Box

## Summary
Prepare two Markdown deliverables for peer review and future repo inclusion:
1. A `Background Brief` for a technical product/design peer.
2. A `Build Spec` that translates the current plan into an implementation-oriented reference.

Because this session is still in Plan Mode, these are delivered as draft Markdown contents, not written files.

## Draft 1: Background Brief
```md
# Meeseek Box Background Brief

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
- MacBook Pro: main desktop/laptop control surface
- iPhone: primary mobile access surface
- iPad: secondary review/access device

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
- chat persistence is currently browser-local
- Kanban/task data is currently browser-local
- some settings/personalization are browser-local
- shared cross-device state is under-modeled
- memory is visible, but not yet governed through a strong canonical lineage model
- operational objects are not yet cleanly modeled as durable first-class system objects

### 2. OpenClaw built-in control/dashboard surfaces
OpenClaw’s built-in UI and control surfaces are stronger as runtime/control-plane views than as a full operator command center.

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

---

## What Product Is Actually Being Built

The target is not “a UI for OpenClaw.”

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

Core object model:
- agents
- conversations
- runs
- run events
- work items
- schedules
- approvals
- artifacts
- memory entries
- memory sources
- scopes/domains

This object model is the real product foundation. The UI is a projection of it.

---

## Why This Needs To Exist

The existing runtime can execute work, but the current access model is not good enough for the actual operating style JD is building toward.

Key unmet needs include:
- a scalable memory system
- project tracking and multiple Kanban views
- job and failure management
- different models based on job context
- chat continuity across devices
- reliable remote access from iPhone without needing to “log into the mini”
- a unified view of what is running, blocked, scheduled, failed, or waiting for approval

The current state is hybrid in an unhelpful way:
- some data is genuinely shared via server-backed APIs
- some of the most important product surfaces are still local to a browser session

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
- create or update tracked operational objects

It is not the canonical representation of work.

### Mobile priority
The product is iPhone-first in terms of operational ergonomics.

That does not mean feature parity with desktop in every detail. It means the must-win workflows work well on iPhone:
- launch work
- inspect attention items
- review failures
- approve/deny sensitive actions
- glance at overall system state

### Cross-device continuity
The system must support:
- shared conversations
- shared cards/work items
- shared runs
- shared artifacts
- shared schedule state
- shared memory metadata

The user should be able to start something on iPhone and continue on MacBook without losing state or context.

---

## Core Architectural Direction

### Fixed layer model
Layer 1: OpenClaw runtime
- agents
- schedules
- tools
- gateway
- execution

Layer 2: Meeseek Box product-state layer
- canonical objects and metadata
- cross-device persistence
- event ingestion
- board state
- conversation persistence
- artifact registry
- memory metadata and lineage

Layer 3: clients
- responsive web app in v1
- iPhone and MacBook first
- iPad second-order, not ignored

### Storage model
The recommended v1 storage model is hybrid:
- SQLite for relational product state
- JSON for flexible event payloads
- file-backed storage for artifacts, attachments, and canonical memory files
- full-text search for retrieval and inspection

### Memory model
The underlying CLI/runtime memory remains file-backed in v1.

Meeseek Box adds:
- `MemoryEntry` as the canonical metadata object
- `MemorySource` as the provenance object
- controlled write-through to whitelisted runtime-owned memory paths

This avoids a full memory migration while making memory inspectable and governable.

---

## Primary V1 UX Model

### Home
Fast system pulse:
- health
- active work
- needs attention
- recent artifacts
- upcoming scheduled items

### Work
Primary organizational surface:
- Kanban board
- queue, running, scheduled, blocked, failed, needs approval, completed

### Chat
Front door for initiating and continuing work.

### Inbox
Approvals, failures, blocked items, and stale work.

### Supporting views
- runs
- artifacts
- memory
- schedules
- agents
- settings

---

## Promoted Design/Architecture Opportunities

Two ideas that began as “opportunities” are now part of the recommended v1 scope.

### 1. Saved launch presets
Launch should become a signature interaction, especially on iPhone.

The system should support:
- pinned presets
- recent presets
- one-tap rerun
- edit-before-run
- save from successful run
- scoped presets for `ops` or `personal`

### 2. Event ingestion and normalization layer
This is now considered foundational.

Without it, the system will fragment into multiple partial truths about:
- runs
- inbox items
- work cards
- memory lineage
- artifacts
- schedule health

The event layer should normalize runtime and app signals into a canonical event model the rest of the product can trust.

---

## What Is Explicitly Out of Scope For V1

Not being built in the first version:
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

---

## Main Risks

### Product risks
- the product could collapse back into “chat plus dashboards” if the object model is weak
- the board could become superficial if cards are not tightly coupled to real runtime state
- personal and ops contexts could blur too much if scoping is weak

### Technical risks
- browser-local assumptions in Claw-Tower may be more widespread than expected
- OpenClaw runtime event surfaces may not be clean enough yet for ideal normalization
- mobile web constraints on iPhone may make live-state UX harder than desktop
- attachment and artifact growth may create storage/indexing complexity

### Security risks
- any temptation to widen remote authority beyond current approval boundaries
- accidental creation of a richer remote admin surface than the security model allows
- increased sensitivity of shared persisted conversations and artifacts

---

## What Success Looks Like

The system succeeds if:
- work can be launched from iPhone quickly
- every important action becomes a visible tracked object
- the work board is the primary way to organize and inspect active work
- conversations persist across devices
- approvals and failures can be handled remotely
- memory is inspectable through lineage and scope, not treated as hidden magic
- all of this happens without breaking the current security posture of the mini
```

## Draft 2: Build Spec
```md
# Meeseek Box Build Spec

## Purpose
This document translates the current Meeseek Box product direction into an implementation-oriented reference for design and engineering work.

It assumes:
- OpenClaw remains the runtime substrate
- the current `Claw-Tower` repo is the implementation base
- the product/UI is rebranded to `Meeseek Box`
- v1 remains inside the `iron-claw-mini` security model

---

## 1. Product Scope

### V1 goal
Ship a mobile-first, Tailnet-only operator app that lets JD:
- launch work from iPhone or MacBook
- organize work primarily via Kanban cards
- inspect runs, artifacts, and failures
- continue conversations across devices
- manage one-shot scheduled work and recurring schedules
- inspect and govern memory lineage
- handle approvals without logging into the mini directly

### Primary user model
- single trusted operator
- trusted personal devices only
- no multi-user/RBAC assumptions
- no public internet exposure

---

## 2. Security Constraints

### Must remain true
- Tailnet-only access
- runtime host remains Mac mini under `agent-playground`
- no new LAN/WAN exposure
- no writes outside whitelisted runtime-owned paths
- no access to `/Users/jdfetterly-mini` by default
- no secrets in browser-local storage or repo files
- no bypass of runtime approval gates
- reversible, least-privilege design by default

### Implication
Meeseek Box is not allowed to become an unrestricted remote admin console. It is an operator layer over a protected runtime.

---

## 3. Architecture

### Layer 1: OpenClaw runtime
Responsibilities:
- agent execution
- schedules
- tool calls
- model invocation
- gateway/runtime status
- runtime approval authority

### Layer 2: Meeseek Box product-state layer
Responsibilities:
- canonical shared conversations
- work board state
- run and event registry
- artifact registry
- memory metadata and provenance
- attention/inbox generation
- saved launch presets
- one-shot scheduling metadata

### Layer 3: Clients
v1 client:
- responsive web app
- optimized for iPhone and MacBook

---

## 4. Required Components

### UI
- responsive web frontend
- mobile-first launch flows
- work board
- inbox
- chat
- run detail
- artifact detail
- memory detail
- schedules
- agents
- settings

### Backend
- product-state API
- SQLite relational core
- JSON payload support
- file-backed artifact/attachment storage
- memory sync/write-through adapter
- OpenClaw adapter
- event ingestion/normalization layer

---

## 5. Canonical Object Model

### Core entities
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

### Key relationships
- a `Conversation` can create one or more `Runs`
- a `WorkItem` is the primary organizing object and can accumulate multiple `Runs`
- a `Run` can emit multiple `RunEvents`
- a `Run` can create `Artifacts`
- `Approvals` are linked to runs/events
- `MemoryEntry` points to memory content and receives one or more `MemorySource` provenance records
- `SavedLaunchPreset` stores reusable launch configuration tied to scope, agent, timing defaults, and output type

---

## 6. Memory Design

### Underlying memory compatibility
The mini/CLI-compatible memory layer remains file-backed in v1.

Supported locations:
- `$WORKSPACE_PATH/MEMORY.md`
- `$WORKSPACE_PATH/memory/*`
- `$WORKSPACE_PATH/memory/YYYY-MM-DD.md`

### `MemoryEntry`
Purpose:
- canonical inspectable metadata object for memory

Stores:
- id
- scope
- type
- title
- summary
- canonical path/reference
- status
- tags
- freshness
- last used
- review state

### `MemorySource`
Purpose:
- provenance record for a memory entry

Source kinds:
- workspace_file
- conversation
- message
- run
- run_event
- artifact
- schedule_output
- manual_operator_edit

### Memory sync behavior
1. runtime writes a compatible file or emits a memory event
2. memory adapter ingests change
3. upsert `MemoryEntry`
4. append `MemorySource`
5. UI shows lineage
6. operator edits go through controlled write-through only

### Memory write rules
- no arbitrary file browser editing
- only controlled write-through into whitelisted runtime-owned memory paths
- every write generates provenance and audit events

---

## 7. Event Ingestion Layer

### Why it exists
All operator-facing state should derive from canonical events, not direct UI-local assumptions.

### Event sources
- OpenClaw runtime events
- approval events
- schedule events
- memory adapter events
- artifact creation events
- work-item state changes
- conversation-to-run linkage actions

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
- `memory_read`
- `memory_write`
- `schedule_created`
- `schedule_triggered`
- `schedule_missed`
- `conversation_linked`
- `work_item_state_changed`

### Derived consumers
The following should be derived from normalized events plus canonical state:
- inbox / attention items
- run timelines
- work-card freshness/status badges
- memory provenance linkage
- recent activity rails
- schedule health summaries

---

## 8. Work Board

### Product role
The Kanban board is the primary work organization surface.

### Lanes
- queued
- running
- scheduled
- needs_input
- needs_approval
- blocked
- failed
- completed

### Card contents
- title
- scope
- assigned agent
- state
- schedule time if future-scheduled
- linked run count
- latest activity time
- approval/failure badges
- latest artifact chip

### Card drawer
- linked conversation
- current/latest run
- event timeline
- artifacts
- approvals
- memory touched
- retry/reschedule/archive controls

---

## 9. Launch UX

### Launch modes
- run now
- schedule once for later
- save draft

### Required fields
- prompt
- scope
- agent
- model behavior
- priority
- output type

### Saved launch presets
Required v1 feature.

Each preset stores:
- title
- scope
- default agent
- optional model override
- default priority
- output type
- timing preference
- optional prompt template

Presets support:
- run now
- schedule once
- edit before run
- duplicate
- pin to home
- create from successful run

---

## 10. Mobile Pages

### `Home`
Contains:
- health strip
- pinned presets
- needs attention
- active work
- recent artifacts
- upcoming scheduled items

### `Work`
Contains:
- Kanban board
- filters
- saved views
- card drilldowns

### `Chat`
Contains:
- conversation list
- thread view
- attachments
- create or link work item actions

### `Inbox`
Contains:
- approvals
- failures
- blocked items
- stale work
- memory review prompts

### `More`
Contains:
- Runs
- Artifacts
- Memory
- Schedules
- Agents
- Settings

---

## 11. Included In V1
- responsive web app
- shared conversations across devices
- Kanban as primary organizing layer
- one-shot delayed scheduling from launch flow
- recurring schedule visibility
- run timelines
- artifact registry
- memory metadata plus provenance
- saved launch presets
- event ingestion layer
- inbox derived from canonical event/state
- per-agent default model plus per-job override
- OpenClaw health and approval integration
- Slack fallback alerts

---

## 12. Excluded From V1
- native iOS app
- Apple Handoff
- multi-user auth/RBAC
- public internet access
- full OpenClaw admin replacement
- full memory engine replacement
- vector memory as source of truth
- realtime voice-first interface
- unrestricted filesystem editing
- multi-host federation

---

## 13. Acceptance Criteria
- launching work from iPhone creates a board card immediately
- one-shot scheduled work appears in both `Work` and `Schedules`
- the same conversation/card/run state is visible on MacBook
- no canonical conversation or work state depends on browser-local storage
- approvals and failures can be resolved from mobile views
- memory entries display provenance to file/run/conversation/artifact
- operator memory edits update compatible mini memory files through controlled adapters
- access remains Tailnet-only and aligned with `iron-claw-mini`

---

## 14. Main Risks
- local-storage assumptions may be widespread in the current codebase
- event ingestion may expose runtime integration gaps
- board fidelity will fail if card state can drift from runtime state
- mobile web constraints may degrade live-update UX
- memory split between file content and DB metadata must be made legible in the UI

---

## 15. Future Work After V1
- native iPhone app
- richer notification model
- Apple Handoff
- stronger project-space scoping
- semantic memory search
- workflow templates
- deeper artifact routing
- richer model analytics
- broader admin controls if security posture allows
```

## Assumptions
- The next step after approval would be to write these as two files in the repo or a notes workspace.
- The background brief is optimized for a technical product/design peer.
- The build spec is optimized for implementation planning, not end-user communication.
