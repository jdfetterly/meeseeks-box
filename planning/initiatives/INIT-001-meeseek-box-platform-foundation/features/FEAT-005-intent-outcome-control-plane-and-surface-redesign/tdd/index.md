# Technical Design Document

## 1. Document Control

- Feature / Initiative: `FEAT-005 Intent-Outcome Control Plane and Surface Redesign` / `INIT-001 Meeseek Box Platform Foundation`
- Author: Codex
- Date: `2026-03-26`
- Status: `draft`
- Source FDD: `../fdd.md`

## 2. Context and Inputs

This design operationalizes the Rev-A product contract. The core challenge is not adding a new page; it is preventing the product from regressing into multiple conflicting control models.

The driving requirements are:
- `REQ-001` Assistant is the active work surface and Conversations is the saved-history surface
- `REQ-002` Briefing previews ranked work without replacing Inbox or Review Queue
- `REQ-003` The system tracks unfinished work through candidate unresolved state and durable open loops
- `REQ-004` Conversations support project grouping, actionable status, and minimal branch lineage in v1
- `REQ-005` Mobile uses full-screen Assistant takeover without thread-first drift
- `REQ-006` Project and Board default to plan-first execution instead of manual setup
- `REQ-007` Review Queue remains the canonical completion surface with fast follow-up generation
- `REQ-008` Schedules behave as standing delegated work centered on purpose, output, and usefulness

## 3. Technical Goals

- Unify active-work behavior so Assistant is the same conceptual surface across desktop and mobile.
- Separate preview/read-model logic from canonical queue ownership.
- Add unresolved-state and durable-open-loop derivation to product state.
- Add minimal branch lineage to conversations without introducing merge complexity.
- Rebuild key read models for Briefing, Project, Board, Review Queue, and Schedules around the revised product semantics.

## 4. Non-Goals

- Full visual redesign or motion spec
- Mergeable branches or collaborative multi-user flows
- Multiple workspaces per project
- Exhaustive LLM orchestration logic beyond the closed intent taxonomy

## 5. Architecture Overview

`FEAT-005` is a cross-cutting interaction-model feature. It will likely land across app shell, product-state services, and multiple existing read models.

Core technical layers:
- `Assistant session layer` for general start, contextual start, proposal lifecycle, and continuation
- `Conversation state layer` for summaries, status, branch lineage, and linked objects
- `Unresolved-state / open-loop derivation layer`
- `Briefing query service` that ranks previews without becoming a queue owner
- revised `Inbox` and `Review Queue` read models
- revised `Project`, `Board`, and `Schedules` read models aligned to plan, review, and purpose/output-first framing

## 6. System Boundaries and Ownership

| Component / System | Responsibility | Owner / Boundary Notes |
| --- | --- | --- |
| Assistant session model | Active conversation state, context injection, proposal lifecycle | In-scope product-state + UI |
| Conversations surface | Search, recovery, branch browsing, reopen flows | In-scope UI + query layer |
| Open loop derivation service | Candidate unresolved state, durable promotion, resolution, escalation | In-scope backend |
| Briefing query service | Hero selection and preview ranking | In-scope backend / API |
| Inbox read model | Canonical operational attention | In-scope backend / API |
| Review Queue read model | Canonical completion queue | In-scope backend / API |
| Project and Board queries | Plan-first project and execution read models | In-scope backend / API |
| Schedules query service | Purpose/output/usefulness-first recurring work views | In-scope backend / API |

## 7. Component and Module Responsibilities

| Unit | Responsibility | Depends On |
| --- | --- | --- |
| `services/assistant-sessions` | Manage active Assistant context, start mode, proposals, continuation | conversations, object repos |
| `services/conversations` | Status lifecycle, summaries, links, branch lineage | shared state spine |
| `services/open-loops` | Derive unresolved state and durable loops | conversations, reviews, plans, schedules |
| `queries/briefing` | Rank hero and preview lists | inbox, review queue, open loops, projects |
| `queries/inbox` | Canonical operational items only | FEAT-004 attention contracts |
| `queries/review-queue` | Pending outputs with lineage and disposition actions | review pipeline |
| `queries/project-context` | Current plan, next move, unresolved state, readiness | plan, board, open loops |
| `queries/board` | Plan view default, status view secondary | plan, cards, review, open loops |
| `queries/schedules` | Purpose/output/usefulness-first list and detail | schedules, review, inbox |

## 8. Data Model and Storage Changes

Recommended additions:

- `assistant_sessions`
  - start mode
  - current context snapshot
  - active conversation reference
- `conversation_summaries`
  - current objective
  - latest proposal kind
  - decisions
  - unresolved questions
  - recommended next action
- `conversation_lineage`
  - `parent_conversation_id`
  - `branch_from_message_id`
- `candidate_unresolved_states`
  - lightweight or derived record tied to conversation/project/object
- `open_loops`
  - owner
  - waiting_on
  - blocking
  - escalation metadata
- `briefing_rank_cache` or equivalent projection
  - hero candidate
  - preview lists by source queue

## 9. Interfaces, APIs, Events, and Contracts

| Interface | Direction | Contract Summary | Error Cases |
| --- | --- | --- | --- |
| `POST /api/assistant/start` | client -> Assistant session service | start general or contextual Assistant session | invalid context, missing object |
| `POST /api/assistant/proposals/:id/confirm` | client -> Assistant session service | confirm edited proposal and persist resulting mutations | invalid edits, stale proposal |
| `POST /api/conversations/:id/branch` | client -> conversation service | create child conversation from current turn | missing turn, invalid parent |
| `GET /api/briefing` | client <- briefing query | hero + preview lists with canonical links | ranking failures fall back to empty preview |
| `GET /api/review-queue` | client <- review queue query | pending review list with lineage and filter context | invalid filters |
| `GET /api/open-loops` | client <- open loop query | durable loops plus project filters | invalid project refs |
| `OpenLoopPromoted` event | internal | candidate unresolved state promoted to durable loop | duplicate / dedupe conflict |
| `ConversationSummaryUpdated` event | internal | summary or recommended next action updated | malformed summary payload |

## 10. Primary Flows and Sequence Logic

### 10.1 Main Flow: General or Contextual Assistant Start

1. User opens Assistant generally or from a specific surface.
2. Assistant session loads visible context and resolves intent.
3. Assistant either asks for missing information or produces a proposal.
4. User edits and confirms in-place.
5. The system mutates underlying objects and updates linked conversation state.
6. The resulting work stays active in Assistant and recoverable in Conversations.

### 10.2 Main Flow: Unfinished Work Detection

1. Proposal, review, plan change, or other state change introduces unresolved work.
2. Candidate unresolved state is recorded and surfaced inline.
3. Blocking or persistent conditions promote to durable open loops.
4. Briefing and Project consume the new state according to routing rules.

### 10.3 Main Flow: Briefing Ranking

1. Briefing query collects open Inbox items, pending Review Queue items, durable loops, and recommended next-action candidates.
2. Ranking waterfall selects the hero item.
3. Preview rows are capped and linked back to canonical destinations.

## 11. Security, Privacy, and Authorization

- Assistant proposal confirmation remains the only path to consequential mutation.
- Context injection must be visible so the user can detect incorrect assumptions before mutation.
- Branch lineage and open-loop resolution must preserve auditability instead of rewriting history.
- Queue previews must not create hidden side effects or silent dismissal.

## 12. Observability and Operational Readiness

| Signal Type | What to Capture | Why It Matters |
| --- | --- | --- |
| Metric | Assistant starts by mode and continuation rate | detect whether users are forced into Conversations |
| Metric | Proposal confirm vs cancel vs fallback rate | understand where Assistant flow is weak |
| Metric | Candidate unresolved state promotion rate | detect noisy or weak open-loop heuristics |
| Metric | Briefing hero source distribution | validate the ranking model |
| Trace | Assistant start -> proposal -> mutation -> linked queue update | debug intent-to-outcome continuity |
| Log | branch creation and parent-child lineage | audit fragmented or superseded planning flows |

## 13. Migration, Backfill, or Rollout Strategy

- Feature flags:
  - `assistant_active_surface_enabled`
  - `briefing_enabled`
  - `open_loop_v2_enabled`
  - `conversation_branching_v1_enabled`
  - `review_queue_primary_enabled`
  - `schedule_usefulness_v1_enabled`
- Rollout order:
  1. conversation/open-loop foundations
  2. queue ownership and Briefing read model
  3. Project and Board read models
  4. Review Queue and schedule framing
  5. mobile Assistant takeover

## 14. Test Strategy

| Test Level | Coverage | Notes |
| --- | --- | --- |
| Unit | ranking helpers, promotion rules, status transitions, branch metadata | pure logic first |
| Integration | Assistant session + conversation linkage, queue ownership, open-loop promotion/resolution | main correctness layer |
| Contract | Assistant start/confirm, briefing query, branch API | request/response stability |
| Playwright | Assistant start + continuation, Briefing previews, Review Queue, mobile takeover | small critical-path suite |
| Manual | real narrow-viewport behavior and project-context continuation | validates actual UX coherence |

## 15. Risks and Tradeoffs

| Risk / Tradeoff | Impact | Mitigation / Decision |
| --- | --- | --- |
| Open-loop derivation becomes noisy | High | keep candidate state lightweight and delay durable promotion until explicit thresholds |
| Desktop and mobile interaction models drift | High | preserve one conceptual model and vary only presentation |
| Briefing regresses into a dashboard | High | cap preview counts and keep canonical queue ownership separate |
| Branching scope balloons | Medium | v1 child conversations only, no merge |
| Plan-first board conflicts with existing manual launch flows | Medium | retain manual paths as advanced or secondary, not default |

## 16. Traceability Matrix

| Requirement ID | Technical Coverage | Planned Tests |
| --- | --- | --- |
| `REQ-001` | Assistant session model, proposal lifecycle, continuation contracts | integration: start/continue; Playwright: contextual + general start |
| `REQ-002` | Briefing query, Inbox and Review Queue ownership | integration: ranking + preview ownership; Playwright: briefing hero + drilldown |
| `REQ-003` | candidate unresolved state, durable loops, escalation and resolution services | unit: promotion rules; integration: lifecycle |
| `REQ-004` | conversation summaries, statuses, links, branch API | integration: branch + reopen; Playwright: recover branch |
| `REQ-005` | mobile Assistant takeover and Conversations recovery | Playwright narrow viewport + manual narrow-device validation |
| `REQ-006` | project-context query, board plan view default, plan drift handling | integration + Playwright |
| `REQ-007` | review queue query and review follow-up pipeline | integration + Playwright |
| `REQ-008` | schedules query/usefulness and Inbox linkage for operational failures | integration + Playwright |

## 17. Open Questions

- Should candidate unresolved state be persisted as a first-class table or derived projection with selective persistence?
- Which existing APIs are the least risky home for Assistant session state without causing duplicate chat/state contracts?
- How much of the current Work and Chat UI can be reused once the read models are updated?
