# Meeseek Box — Functional Specification Rev A

**Version:** 1.0 Draft Rev A
**Date:** 2026-03-26
**Author:** Design lead (functional spec owner)
**Purpose:** Revised decision-complete functional specification for the intent-to-outcome redesign. This revision preserves the original structure while incorporating review findings and clarified interaction rules.
**Scope:** v1 unless marked `[v1.1]`
**Supersedes:** This document becomes the active product contract. [meeseek-box-functional-spec.md](../archive/chat-briefs/meeseek-box-functional-spec.md) remains preserved as historical reference.

---

## How To Read This Document

This spec is organized into testable units. Each numbered section is self-contained enough to be converted into an independent TDD spec file. Cross-references use section numbers (for example, "see Section 5.4").

**Conventions:**
- `MUST` — Required for v1. Implementation cannot ship without this.
- `SHOULD` — Strongly recommended for v1. Can be deferred only with explicit justification.
- `MAY` — Optional for v1. Nice to have.
- `[v1.1]` — Explicitly deferred. Do not implement in v1.
- `[Multi-user hook]` — Single-user in v1, but the spec calls out where multi-user would change behavior.

---

## Table of Contents

1. Product Model
2. Control Plane Protocol
3. Plan and Card Derivation
4. Conversation Model
5. Open Loop Model
6. Review and Follow-Up Pipeline
7. Workspace Model
8. Briefing Surface
9. Inbox Surface
10. Review Queue Surface
11. Project Detail Surface
12. Board Surface
13. Schedules Surface
14. Surface Handoff Protocol
15. Delegation and Execution
16. Mobile Variant
17. Zero-State and First-Run
18. Scope Decisions (v1 vs v1.1)

---

## 1. Product Model

This section defines the durable product objects and the user-facing model they create.

### 1.1 Core Objects

#### Project

The durable context container. Projects carry goals, current plan, memory, linked conversations, standing delegated work, and open loops.

**Rules:**
- Every meaningful work object MUST belong to a project unless it is explicitly general and not yet attached.
- A project MAY exist before a workspace exists.
- A project MUST expose one active `current plan` at a time.
- Projects own context; they do not own execution. Execution remains cards, schedules, and review items.

#### Plan

The structured planning artifact that turns intent into bounded execution.

**Rules:**
- The plan MUST remain structured, not free text only.
- Plan revisions MUST preserve version history.
- The plan is the canonical source for derived cards unless the user explicitly chooses direct ad hoc work.
- If direct ad hoc work grows beyond a small bounded task, the system SHOULD propose creating or updating a plan.

#### Card (WorkItem)

The unit of delegatable or manually owned execution.

**Rules:**
- Cards SHOULD be derived from plan items.
- Cards MAY be created directly for ad hoc work, but this is an explicit exception path.
- Cards MUST expose their parent plan or clearly show that they are ad hoc.
- Cards MUST carry acceptance criteria before agent delegation.

#### ReviewItem

A completed output waiting for judgment.

**Rules:**
- Completed agent work MUST create a ReviewItem.
- Review items belong canonically in Review Queue.
- Review items MAY be previewed elsewhere but MUST have Review Queue as their source of truth.

#### Schedule

Standing delegated work that produces recurring outputs.

**Rules:**
- Schedules are defined by purpose and expected output first, cadence second.
- A schedule SHOULD belong to a project whenever possible.
- The default output path for schedules SHOULD be `review_queue`.
- `auto_approve` and `notify_only` MAY exist as advanced fallback modes, but they MUST NOT be the default interaction path.
- Schedules MUST expose a minimum usefulness signal in v1: `useful`, `review value`, or `unclear value`.

#### Conversation

A saved, project-linked working context container. Conversations store transcript, summary, linked objects, unresolved state, and lineage.

**Rules:**
- Conversations are not the primary product shell.
- Conversations preserve operational context so the user does not need to restate work.
- Conversations MUST support project grouping, explicit status, linked objects, and minimal v1 branching.

#### OpenLoop

A structured record for unfinished work, unresolved decisions, or required follow-up. Defined fully in Section 5.

#### Workspace

The execution environment for code-backed work. Defined fully in Section 7.

### 1.2 Relationship Rules

- `Project` is the durable context layer.
- `Plan` is the live working contract.
- `Card` is the usual execution derivative of the plan.
- `ReviewItem` is the completion and judgment artifact.
- `Schedule` is standing delegated work.
- `Conversation` is working context and lineage, not just message storage.
- `OpenLoop` captures unresolved commitments and decisions.
- `Inbox` is the canonical operational queue.
- `Review Queue` is the canonical completion queue.
- `Briefing` is the synthesized surface that previews and ranks what matters; it does not replace Inbox or Review Queue.

### 1.3 Surface Naming

The product MUST use the following user-facing terms:

- `Briefing` instead of `Home`
- `Assistant` for the active conversational work surface
- `Conversations` for history, recovery, and search
- `Inbox` for operational attention
- `Review Queue` for completed outputs awaiting judgment

---

## 2. Control Plane Protocol

This section defines the active work model: what Assistant is, how it differs from Conversations, how context is injected, and how proposals are confirmed.

### 2.1 Core Principle

The product standard is `intent -> outcome`.

The user should be able to express intent from any surface or from no surface at all. The system then:
1. carries the best available context,
2. asks only for missing information,
3. creates a structured proposal,
4. executes only on confirmation,
5. preserves the resulting conversation and object lineage.

### 2.2 Assistant vs Conversations

| Surface | Purpose | Canonical behavior |
| --- | --- | --- |
| `Assistant` | Active conversation UI where work happens now | Starts work, continues work, proposes changes, confirms actions |
| `Conversations` | History, recovery, search, and branch browsing | Finds saved conversations, reopens prior work, compares alternatives |

**Rules:**
- The product MUST NOT require the user to start work in Assistant and then hand off to Conversations just to continue the same work.
- Active work stays in Assistant.
- Conversations exist so the user can recover, search, or reopen work later.

### 2.3 Start Modes

The Assistant supports exactly two start modes:

1. `General start`
   - Trigger: user opens Assistant with no current object context.
   - Behavior: Assistant starts unscoped and either stays general or proposes attaching the work to an existing or new project.

2. `Contextual start`
   - Trigger: user opens Assistant from Briefing, Project, Board, Review Queue, Schedule, or a specific card/review/open loop.
   - Behavior: Assistant opens with carried context already attached.

### 2.4 Intent Taxonomy

The Assistant MUST resolve input to one of these intent families or to `unclear`:

- `project.create`
- `project.update`
- `project.plan`
- `project.bind_workspace`
- `project.bootstrap_workspace`
- `card.create`
- `card.update`
- `card.delegate`
- `card.split`
- `card.close`
- `schedule.create`
- `schedule.update`
- `schedule.pause`
- `schedule.resume`
- `schedule.delete`
- `review.approve`
- `review.reject`
- `review.comment`
- `loop.create`
- `loop.resolve`
- `loop.snooze`
- `navigate`
- `search`
- `explain`
- `unclear`

**Rules:**
- If the Assistant cannot resolve intent confidently after two clarification turns, it MUST present a structured fallback instead of continuing to guess.
- The Assistant SHOULD tell the user what context it is assuming when the current surface is ambiguous.

### 2.5 Context Injection

The Assistant MUST inject visible context from the current surface according to these rules:

| Current surface | Default project context | Default object context |
| --- | --- | --- |
| Briefing | None unless launched from a specific item | Selected item if launched from one |
| Project Detail | That project | Focused plan item / open loop / conversation if selected |
| Board | Current board project filter | Selected card or plan item if selected |
| Review Queue | Selected review item's project | Selected review item |
| Schedule Detail | Selected schedule's project | Selected schedule |
| Conversation Detail | Linked project if present | That conversation |

**Rules:**
- Context injection MUST be visible in the UI.
- The user MUST be able to clear or change the current context before confirming a proposal.
- If the user starts generally and the conversation becomes project-scoped, the Assistant SHOULD propose attaching the conversation to the project.

### 2.6 Proposal Schema

When sufficient information exists, the Assistant produces a structured proposal rather than a plain-text suggestion.

Each proposal MUST include:
- proposal type
- summary
- affected objects
- key assumptions
- fields the user can edit before confirming
- confirmation result preview

Supported proposal types:
- `project`
- `plan`
- `plan_breakdown`
- `card`
- `delegation`
- `schedule`
- `review_follow_up`
- `open_loop_resolution`

### 2.7 Confirmation Protocol

- No consequential mutation may happen without confirmation.
- The user MUST be able to edit proposal fields inline before confirmation.
- Batch proposals are allowed and SHOULD be used when the utterance implies multiple related objects.
- Confirming a proposal MUST create a receipt inside the active conversation and update linked objects.

### 2.8 Fallback Rules

Fallback is permitted when a structured surface is faster or safer than conversation:

- bulk editing
- complex workspace configuration
- agent uncertainty after two clarification turns
- explicit user preference for manual controls

Fallback MUST be framed as a faster path, not as Assistant failure.

---

## 3. Plan and Card Derivation

### 3.1 Plan Creation

- Plans SHOULD be created conversationally through Assistant.
- The persisted plan MUST be structured enough to support deterministic card derivation and drift checks.
- A plan MUST include goal, sections or workstreams, items, dependencies, and acceptance criteria.

### 3.2 Plan Revision

- Plan revisions MUST produce a visible diff-style proposal when existing work may be affected.
- Revising a plan MUST preserve older versions for audit and recovery.
- When a revision affects in-progress execution, the system MUST create unresolved-state warnings or open loops rather than silently rewriting active work.

### 3.3 Card Derivation

- The default behavior for turning plan into execution is Assistant-generated card proposals.
- The system SHOULD batch-derive un-carded plan items rather than prompting one card at a time.
- Each proposed card MUST include:
  - parent plan item
  - title
  - spec
  - acceptance criteria
  - split reason
  - readiness notes

### 3.4 Change Propagation

- If a plan item changes while its linked card is `to_do`, the system SHOULD propose updating the card.
- If a plan item changes while its linked card is `in_progress` or `in_review`, the system MUST create candidate unresolved state and MAY promote it to a durable open loop depending on impact.
- If a plan item is removed while linked work is active, the system MUST create a decision-oriented unresolved state rather than silently cancelling work.

### 3.5 Direct Card Exception

- Direct card creation remains available for ad hoc work.
- The Board MUST NOT foreground manual card creation as the default mode.
- If the user repeatedly creates direct cards within the same project, the Assistant SHOULD suggest updating the plan.

---

## 4. Conversation Model

Conversations are working context containers, not just transcripts.

### 4.1 Conversation Schema

Each conversation MUST store:
- `id`
- `project_id` or `null`
- `type`
- `status`
- transcript
- distilled summary
- linked objects
- candidate unresolved states
- durable open loop references
- `parent_conversation_id` or `null`
- `branch_from_message_id` or `null`
- timestamps

### 4.2 Conversation Types

Supported types:
- `planning`
- `delegation`
- `review`
- `schedule`
- `general`

The system MUST assign a type when a conversation is first saved.

### 4.3 Conversation Status Lifecycle

Statuses:
- `active`
- `waiting_on_user`
- `waiting_on_agent`
- `needs_follow_up`
- `resolved`
- `superseded`
- `archived`

**Rules:**
- `waiting_on_user` means the user must answer or confirm something before the system can proceed.
- `waiting_on_agent` SHOULD usually remain a conversation state, not a durable open loop.
- `needs_follow_up` means a next action exists but is not yet complete.
- `superseded` is used when a branch or newer conversation becomes authoritative.

### 4.4 Distilled Summaries

Each conversation summary MUST capture:
- current objective
- latest proposal
- confirmed decisions
- unresolved questions
- recommended next action
- linked objects

**Rules:**
- Summaries MUST update when a proposal is confirmed.
- Active planning or follow-up conversations SHOULD refresh summaries periodically.
- User-edited summaries MUST not be overwritten automatically.

### 4.5 Minimal v1 Branching

Branching is in v1.

The v1 branching model is intentionally narrow:
- action: `Start alternative from here`
- result: child conversation
- child stores `parent_conversation_id`
- child stores `branch_from_message_id`
- child copies current summary snapshot and context
- no merge in v1

**Use cases:**
- alternate plan path
- alternate implementation approach
- alternate review response
- alternate schedule setup

### 4.6 Linked Objects

Conversations MUST automatically link to created or modified objects when proposals are confirmed.

Supported links:
- project
- plan
- card
- review item
- schedule
- open loop

Deleted linked objects MUST render as tombstones rather than rewriting conversation history.

### 4.7 Cleanup and Continuation

- The system SHOULD suggest resolving stale conversations when the work is clearly complete.
- Resolved or archived conversations remain searchable in Conversations.
- A project surface SHOULD expose a `Continue conversation` affordance for its most relevant active or waiting conversation.

### 4.8 Grouping in Conversations and Project Detail

Primary grouping: by project.

Secondary grouping inside each project:
- planning
- execution follow-up
- review follow-up
- recurring work
- general context

Sort order:
- actionable first (`waiting_on_user`, `needs_follow_up`, `active`)
- then `waiting_on_agent`
- then `resolved`, `superseded`, `archived`

---

## 5. Open Loop Model

Open loops are the structured expression of unfinished work.

### 5.1 Two-Layer Model

The product MUST distinguish between:

1. `candidate unresolved state`
   - lightweight, detected immediately
   - visible inline in Assistant, Project, and Briefing
   - may auto-resolve without becoming a durable record

2. `durable open loop`
   - persisted object
   - promoted when blocking, overdue, user-owned, persistent, or explicitly confirmed

### 5.2 Durable Open Loop Schema

Each durable open loop MUST include:
- `id`
- `project_id`
- `conversation_id` or `null`
- `source_type`
- `title`
- `reason`
- `owner`
- `waiting_on`
- `blocking`
- `priority`
- `status`
- `escalate_after`
- `recommended_resolution_type`
- `dedupe_key`
- linked objects
- timestamps

### 5.3 Creation Taxonomy

Candidate unresolved states MAY originate from:
- unconfirmed proposal
- missing user answer
- promised follow-up not yet created
- unresolved decision
- revisit later reminder
- plan/card mismatch
- review rejection
- schedule usefulness uncertainty

Promotion to durable open loop MUST happen when one or more of these are true:
- it blocks progress
- it requires user action
- it persists beyond the configured threshold
- it is explicitly confirmed by the user
- it is produced by a structured workflow that requires lineage, such as review rejection

### 5.4 What Is Not a Durable Open Loop

- ordinary agent progress while work is running
- transient system events the user never needs to act on
- resolved proposals
- routine runtime telemetry

Operational failures such as failed runs or missed schedules belong canonically in Inbox, though they MAY cross-reference related open loops.

### 5.5 Resolution Protocol

Resolution types:
- manual resolve
- auto-resolve from linked object state
- confirm proposal and proceed
- create follow-up object
- snooze / revisit later
- supersede through a newer branch or plan change

**Rules:**
- A user-owned blocking unresolved state SHOULD promote quickly.
- A `waiting_on_agent` state SHOULD generally not promote unless it has become stale and user attention is required.
- Durable open loops MUST never be silently deleted.

### 5.6 Escalation and Surfacing

Escalation MUST be rule-based:

- blocking operational issue -> Inbox, previewed in Briefing
- blocking user-owned open loop -> Briefing and Project
- stale non-blocking open loop -> Project first, then Briefing if overdue
- schedule drift with user intervention required -> Inbox plus Briefing preview

### 5.7 Briefing Promotion Waterfall

Items are promoted to Briefing in this order:
1. operational blocker requiring user action now
2. review due
3. blocking user-owned open loop
4. recommended next move

This waterfall MUST be stable and predictable.

---

## 6. Review and Follow-Up Pipeline

### 6.1 Review Item Creation

- Completed agent work MUST create a pending review item.
- Completed user-assigned work MAY create a review item when the user submits it for review.
- Review items MUST include output summary, linked artifacts, and source card lineage.

### 6.2 Review Dispositions

Supported dispositions:
- `approve`
- `approve_with_notes`
- `request_changes`
- `reject`

Each disposition MUST update linked card and plan state consistently.

### 6.3 Request Changes Flow

`request_changes` creates a new follow-up card rather than reopening the original card.

The follow-up MUST:
- retain lineage to the original card and review item
- preserve original context and acceptance criteria
- incorporate requested changes
- appear in execution as new work

This flow MUST also create either a candidate unresolved state or durable open loop if further user action is still required.

### 6.4 Review Queue as Primary Surface

Review Queue is a standalone primary surface in v1.

**Rules:**
- Completed outputs awaiting judgment MUST land in Review Queue.
- Briefing MAY preview the top review items.
- Project Detail and Board MAY show review state badges or counts.
- The canonical pending list lives in Review Queue, not in Briefing.

### 6.5 Review Surface Behavior

Each review item MUST show:
- project
- source card
- acceptance criteria
- output summary
- preview or expandable output context
- recommended next move when the output is partial or ambiguous

Primary actions:
- Accept
- Accept with notes
- Request changes
- Reject
- Create follow-up

---

## 7. Workspace Model

### 7.1 Workspace Purpose

Workspace is the execution environment for code-backed work. It is not the project itself.

### 7.2 Bind Existing Workspace

- Assistant SHOULD support conversational setup for binding.
- Complex choices MAY use structured fallback.
- Binding MUST be read-only until confirmation.

### 7.3 Bootstrap New Workspace

- Assistant may propose bootstrap options conversationally.
- Execution begins only after confirmation.
- Bootstrap failures route to Inbox if they block expected work.

### 7.4 Status Model

Supported states:
- `pending`
- `configuring`
- `ready`
- `error`

### 7.5 Execution Gating

- Code-backed delegation requires workspace `ready`.
- Missing or broken workspace status MUST block code-backed delegation and offer the workspace setup flow.
- Workspace problems belong canonically in Inbox and MAY be previewed in Briefing if urgent.

---

## 8. Briefing Surface

Briefing replaces the old Home concept.

Briefing is the synthesized starting surface. It answers:
- what needs me now,
- what is ready for judgment,
- what unresolved work is blocking progress,
- what the system recommends next.

### 8.1 Structure

Briefing consists of:
1. hero item
2. `Needs Action` preview from Inbox
3. `Ready for Review` preview from Review Queue
4. blocking open loops preview
5. recommended next move

Briefing MUST stay intentionally small. It is a preview surface, not a full queue.

### 8.2 Hero Slot

Briefing shows exactly one hero item based on the promotion waterfall in Section 5.7.

The hero MUST include:
- why it matters
- source project
- one direct action
- link to the canonical destination

### 8.3 Needs Action Preview

- Sourced from Inbox.
- Shows the top operational items only.
- MUST NOT replace Inbox.

### 8.4 Ready for Review Preview

- Sourced from Review Queue.
- Shows the top pending items only.
- MUST NOT replace Review Queue.

### 8.5 Blocking Open Loops Preview

- Shows only blocking or overdue user-owned loops.
- Non-blocking loops stay in Project until escalation rules promote them.

### 8.6 Recommended Next Move

Recommended next move only appears when higher-priority items do not exist or when it clearly helps the user re-enter work.

It SHOULD point to a concrete action such as:
- revise the current plan
- derive cards for an unfinished section
- delegate a ready card
- review a stale output
- reassess a schedule with unclear value

### 8.7 Nothing-To-Do State

When there are no operational blockers, pending reviews, or escalated loops, Briefing SHOULD still summarize:
- recent progress
- upcoming delegated work
- idle projects worth checking
- ready-to-delegate work

---

## 9. Inbox Surface

Inbox is the canonical operational queue.

### 9.1 Inbox Ownership

Inbox owns items that require user intervention to unblock the system, including:
- approvals
- failed runs
- workspace errors
- blocked execution that needs user input
- missed schedules
- other operational interventions

### 9.2 What Inbox Excludes

Inbox MUST NOT be used for:
- pending reviews
- routine in-progress work
- every unresolved conversation state
- non-operational open loops unless they escalate into operational attention

### 9.3 Display Rules

Each item MUST show:
- project
- operational reason
- age
- direct action
- link to source object

Resolved items MUST leave the active queue immediately and remain accessible in history if retained.

---

## 10. Review Queue Surface

Review Queue is the canonical completion queue.

### 10.1 Queue Ownership

Review Queue owns all pending completed outputs awaiting judgment.

### 10.2 Display Rules

Items MUST be sortable by age, project, and urgency.

Each row or card MUST expose:
- project
- source card
- completion age
- summary
- expandable preview
- disposition actions

### 10.3 Cross-Surface References

- Briefing MAY preview review items.
- Project Detail MAY show review-ready counts.
- Board MAY show an `in_review` state.

The full pending list MUST live in Review Queue.

---

## 11. Project Detail Surface

Project Detail is the primary deep-context surface for a single project.

### 11.1 Structure

Project Detail MUST prioritize:
1. header and goal
2. current plan
3. recommended next move
4. open loops and unresolved state
5. workspace readiness
6. active execution and review-ready work
7. memory, playbook, and learned preferences
8. schedules
9. advanced editing controls

### 11.2 Current Plan

- The current plan MUST be visually and structurally dominant.
- The user SHOULD be able to revise the plan or derive cards directly from this section.

### 11.3 Recommended Next Move

Project Detail SHOULD compute a next move from:
- plan state
- open loops
- readiness
- active execution
- pending review

It MUST be concrete and actionable, not generic coaching text.

### 11.4 Open Loops and Unresolved State

Project Detail shows both:
- inline candidate unresolved states relevant to current work
- durable open loops for the project

### 11.5 Workspace

Workspace section shows readiness, errors, and setup entry points.

### 11.6 Conversations

Project Detail SHOULD show active or waiting conversations grouped by purpose and let the user continue the most relevant one.

---

## 12. Board Surface

Board is the execution surface, not the planning or notification center.

### 12.1 Views

The Board MUST support:
- `plan view` as default
- `status view` as secondary

### 12.2 Plan View

Plan view shows plan sections and items with execution state layered onto them.

Each item SHOULD expose:
- plan lineage
- card status
- split reason
- readiness or block reason
- linked review/open loop signals where relevant

### 12.3 Status View

Status view uses traditional lanes:
- `to_do`
- `in_progress`
- `in_review`
- `done`

Status view remains useful but secondary.

### 12.4 Manual Creation and Launch UI

- Manual card creation and launch/setup UI MUST NOT dominate the default board surface.
- Those controls MAY live behind `Advanced`, an action menu, or a secondary panel.

### 12.5 Scope and Filters

- Default board scope is the current project.
- Multi-project mode MAY exist as a filter state.

---

## 13. Schedules Surface

Schedules are standing delegated work centered on purpose and output.

### 13.1 List Surface

Each schedule entry MUST emphasize:
- name
- purpose
- project
- last useful output
- next delivery
- health
- usefulness signal

### 13.2 Detail Surface

Schedule detail MUST prioritize:
1. purpose and owning project
2. expected output
3. last useful output
4. next delivery
5. usefulness signal and rationale
6. recent outputs
7. diagnostics and runtime details

### 13.3 Minimum v1 Usefulness Signal

v1 MUST include a simple usefulness state:
- `useful`
- `review value`
- `unclear value`

This MAY be derived from review engagement, follow-up generation, pause/resume behavior, or lack of consumption.

### 13.4 Setup Flow

Schedules SHOULD be created through Assistant from recurring intent.

The proposal MUST make the following clear before confirmation:
- purpose
- cadence
- expected output
- destination
- linked project
- any workspace dependency

---

## 14. Surface Handoff Protocol

Handoffs MUST land the user in an action-ready state.

### 14.1 Briefing Handoffs

- operational item -> Inbox with item highlighted
- review preview -> Review Queue with item or project filter active
- open loop preview -> Project Detail with loop highlighted or Assistant with loop context
- recommended next move -> directly to the action surface or Assistant with context

### 14.2 Project Handoffs

- plan item -> Board item or Assistant for derivation/update
- active conversation -> Assistant continuing that conversation
- schedule -> Schedule detail
- open loop source -> linked source object

### 14.3 Board Handoffs

- card -> card detail or Assistant with card context
- un-carded plan item -> Assistant with `card.create` seeded
- `in_review` item -> Review Queue or review detail

### 14.4 Design Rule

Handoffs should minimize re-explanation and minimize navigation before action.

---

## 15. Delegation and Execution

### 15.1 Delegation Readiness

Before delegation, the system MUST evaluate:
- workspace readiness for code-backed work
- card spec completeness
- acceptance criteria
- blocking open loops
- blocking dependencies

### 15.2 Delegation Flow

1. User invokes delegation.
2. System runs readiness checks.
3. Assistant presents delegation proposal.
4. User confirms.
5. Card moves into active execution and delegation receipt is recorded.

### 15.3 Delegation Receipt

Delegation receipt SHOULD show:
- card summary
- execution plan
- assumptions
- timestamps
- linked conversation
- run status

### 15.4 Progress and Failure

- In-progress work stays visible on Board and linked conversations.
- Failures that require intervention route to Inbox.
- Completion routes to Review Queue.

### 15.5 Hand Back To Me

The user MUST be able to reclaim work from agent execution or choose manual ownership at any point.

---

## 16. Mobile Variant

Desktop and mobile share one conceptual model:
- Assistant is for active work
- Conversations is for saved history and recovery

They differ only in presentation.

### 16.1 Desktop Model

- Assistant is a persistent contextual rail.
- Conversations is a dedicated history/recovery/search surface.

### 16.2 Mobile Model

- Assistant is a full-screen takeover launched from a persistent `Ask / Delegate` action.
- Conversations remains a history/recovery/search surface.
- Mobile MUST NOT require `/chat` or Conversations as the primary way to start new work.

### 16.3 Mobile Rules

- No split-panel model on mobile.
- No forced handoff from Assistant into Conversations to continue work.
- Starting new work happens from the Assistant entry point.
- Reopening old work may happen from Conversations or from the originating project/surface.

### 16.4 Mobile Surface Simplifications

Mobile may simplify density and layout, but it MUST preserve:
- current context visibility
- direct review actions
- project-plan visibility
- access to Inbox and Review Queue

---

## 17. Zero-State and First-Run

### 17.1 Briefing Zero-State

The initial briefing SHOULD ask the user what they are trying to accomplish and offer a direct Assistant entry point rather than a tutorial.

Suggested starters:
- connect an existing codebase
- plan and build something new
- automate recurring work

### 17.2 Surface Zero-States

- Briefing: prompt to start with intent
- Board: prompt to create or derive work from a plan
- Project Detail: section-specific prompts to create plan, bind workspace, or start conversation
- Schedules: prompt to describe recurring intent
- Conversations: history/recovery explanation, not the primary start point
- Review Queue: clear empty state that outputs will appear here when work completes

---

## 18. Scope Decisions (v1 vs v1.1)

### 18.1 v1 Scope (MUST ship)

- Briefing naming and surfacing model
- canonical Inbox and Review Queue separation
- Assistant vs Conversations distinction
- no forced Assistant -> Conversations handoff
- candidate unresolved state vs durable open loop
- minimal v1 conversation branching
- mobile full-screen Assistant takeover
- plan-first Project and Board framing
- schedule purpose/output framing with minimum usefulness signal

### 18.2 v1.1 Scope (Deferred)

- branch merge model
- multiple workspaces per project
- richer schedule usefulness analytics
- full structured plan editor
- mobile board density improvements beyond the primary interaction model

### 18.3 Decisions That Must Not Be Reversed

- Projects remain the durable context layer.
- Cards remain plan-derived by default.
- Briefing does not replace Inbox or Review Queue.
- Assistant is the active work surface.
- Conversations are history/recovery/search plus saved working context, not the primary shell.
- Open loops must let the system identify unfinished work before the user manually catalogs it.
- Review Queue remains a primary surface.
