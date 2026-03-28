# Implementation Task Plan

## 1. Planning Context

- Feature / Initiative: `FEAT-005 Intent-Outcome Control Plane and Surface Redesign` / `INIT-001 Meeseek Box Platform Foundation`
- Source TDD: `../tdd/index.md`
- Planning Date: `2026-03-26`
- Assumptions:
  - Existing product-state and attention foundations from `FEAT-001` through `FEAT-004` remain the substrate.
  - Rev-A is now the active product contract for this cross-cutting redesign.
  - This feature coordinates changes that will land across existing application surfaces rather than replacing prior features.

## 2. Delivery Strategy

Build the redesign from the inside out. First land the active-work model and unfinished-work model, then lock queue ownership and Briefing ranking, then rebuild the project/board/review/schedule read models around those rules, and finally validate the full interaction model across desktop and mobile.

## 3. Dependency and Sequencing Notes

- `TASK-001` is the contract checkpoint: it establishes Assistant session, Conversations role, and open-loop promotion semantics used by every later task.
- `TASK-002` depends on `TASK-001` because Briefing ranking and queue ownership require a stable unresolved-state and active-work model.
- `TASK-003` depends on `TASK-001` and `TASK-002` because Project and Board must consume the revised conversation/open-loop and queue read models.
- `TASK-004` depends on `TASK-002` because Review Queue and Inbox separation must be stable before review follow-up wiring is finalized.
- `TASK-005` depends on `TASK-002` and `TASK-004` because schedule usefulness and escalation rely on queue ownership and review pathways.
- `TASK-006` should land after core read models are stable so the mobile surface does not ossify a drifted interaction contract.
- `TASK-007` is the end-to-end validation and cleanup slice after the read models and mobile paths are wired.

## 4. Task Inventory

| Task ID | Title | Objective | Depends On | TDD References | Planned Touchpoints | Acceptance Criteria | Verification | Suggested PR Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TASK-001` | Assistant session and conversation-state foundation | Establish active Assistant session behavior, conversation status model, summaries, minimal branching metadata, and the no-handoff contract with Conversations. | `FEAT-001/TASK-001` | sections 2, 4, 16; `REQ-001`, `REQ-004`, `REQ-005` | assistant session service, conversation repositories, conversation APIs, chat-panel state, conversation list/detail | Assistant supports general and contextual start, saved conversations preserve summary and status, and child conversations can be created without merge support. | integration tests, contract tests, focused browser validation | `PR-001 Assistant + conversation foundation` |
| `TASK-002` | Open-loop v2 plus Briefing / queue ownership model | Add candidate unresolved state, durable open loops, promotion/resolution logic, Briefing ranking, and explicit preview-only ownership over Inbox and Review Queue. | `TASK-001`, `FEAT-004/TASK-001` | sections 5, 8, 9, 10; `REQ-002`, `REQ-003`, `REQ-007` | open-loop service, briefing query, inbox query, review queue query, navigation labels/copy | Briefing shows ranked previews without replacing canonical queues, and unfinished work promotes/resolves according to documented rules. | unit tests for ranking/promotion, integration tests for queue ownership, Playwright briefing drilldown | `PR-002 Briefing + open-loop lifecycle` |
| `TASK-003` | Project and Board plan-first read-model rewrite | Reframe Project Detail and Board around current plan, recommended next move, derived execution, and demoted manual launch/setup affordances. | `TASK-001`, `TASK-002`, `FEAT-002/TASK-005` | sections 3, 11, 12, 15; `REQ-006` | project query service, work board query service, project page, work page, plan drift handling | Project shows plan and next move before advanced forms, Board defaults to plan view, and plan/card drift creates visible unresolved state instead of silent divergence. | integration tests, Playwright project/board journeys | `PR-003 Project + Board redesign` |
| `TASK-004` | Review Queue primary surface and follow-up pipeline | Restore Review Queue as the canonical completion surface and tighten rejection/request-changes follow-up lineage. | `TASK-002`, `FEAT-002/TASK-006` | sections 6, 10, 14; `REQ-007` | review queue service, review page, card/review linkage, follow-up proposal pipeline | Completed work lands in Review Queue, previews remain previews, and follow-up generation preserves lineage without requiring context restatement. | integration tests, Playwright review queue path | `PR-004 Review Queue + follow-up` |
| `TASK-005` | Standing delegated schedules reframe | Update schedule list/detail/read models to lead with purpose, output, usefulness, and canonical escalation into Inbox when operational intervention is required. | `TASK-002`, `TASK-004`, `FEAT-002/TASK-004` | sections 13, 14; `REQ-008` | schedule queries, schedules page/detail, usefulness signal, Inbox linkage | Schedules read as recurring delegated outcomes, minimum usefulness exists in v1, and failures/missed runs escalate into Inbox without turning schedules into an admin-first surface. | integration tests, Playwright schedule flows | `PR-005 Schedules reframe` |
| `TASK-006` | Mobile Assistant takeover and recovery model | Implement the full-screen mobile Assistant, preserve origin return behavior, and keep Conversations as recovery/search only on mobile. | `TASK-001`, `TASK-002`, `TASK-003`, `TASK-004`, `TASK-005`, `FEAT-000/TASK-002` | sections 2, 8, 16, 17; `REQ-001`, `REQ-002`, `REQ-005` | mobile shell, Assistant launcher, modal/takeover state, conversations page, narrow-viewport behavior | Mobile uses one active-work model, no split panel, no forced thread-first start path, and origin context is preserved after close or confirm. | Playwright narrow-viewport flows, manual phone validation | `PR-006 Mobile Assistant model` |
| `TASK-007` | Cross-surface polish, copy cutover, and verification closure | Finish naming cutover to Briefing, tighten handoff affordances, update docs/tests, and close traceability gaps across surfaces. | `TASK-003`, `TASK-004`, `TASK-005`, `TASK-006` | all sections; all requirements | shell navigation copy, handoff links, delivery docs, test execution evidence | Product language is consistent, traceability is complete, and all linked automated/manual validations are recorded before the feature is marked complete. | regression pass, delivery review, manual/browser verification | `PR-007 Cross-surface closure` |

## 5. Verification Matrix

| TDD Area / Requirement | Implementing Tasks | Verification Coverage |
| --- | --- | --- |
| Assistant / Conversations (`REQ-001`) | `TASK-001`, `TASK-006` | contract tests, integration tests, Playwright desktop + narrow flows |
| Briefing + canonical queues (`REQ-002`) | `TASK-002`, `TASK-007` | unit ranking tests, integration tests, Playwright briefing drilldowns |
| Open-loop lifecycle (`REQ-003`) | `TASK-001`, `TASK-002` | unit promotion/resolution tests, integration lifecycle tests |
| Conversation grouping + branching (`REQ-004`) | `TASK-001` | integration tests, Playwright branch/reopen recovery |
| Mobile takeover (`REQ-005`) | `TASK-006`, `TASK-007` | Playwright narrow viewport, manual real-device smoke |
| Plan-first Project + Board (`REQ-006`) | `TASK-003`, `TASK-007` | integration tests, Playwright project/board path |
| Review Queue + follow-up (`REQ-007`) | `TASK-002`, `TASK-004` | integration tests, Playwright review path |
| Standing delegated schedules (`REQ-008`) | `TASK-005`, `TASK-007` | integration tests, Playwright schedules path |

## 6. Open Questions and Blockers

- The active Assistant session may need a dedicated server-backed model rather than piggybacking entirely on existing chat-thread state if current client assumptions are too thread-centric.
- Existing Home and Chat route naming may create temporary confusion during rollout; shell copy cutover should be treated as part of the product contract, not post-hoc cleanup.

## 7. Current Execution Notes

- `2026-03-26`: Created `Rev A` functional specification and initial `FEAT-005` delivery bundle.
- `2026-03-26`: Locked the product language and queue-ownership decisions:
  - `Home` is now `Briefing`
  - `Inbox` remains canonical for operational attention
  - `Review Queue` remains canonical for completed outputs awaiting judgment
  - `Assistant` is active work; `Conversations` is recovery/search/history
- `2026-03-26`: Pulled the following formerly deferred items into v1 because they are load-bearing to the interaction model:
  - minimal conversation branching
  - candidate unresolved state vs durable open loop
  - minimum schedule usefulness signal
- `2026-03-26`: Implemented the first cross-surface code pass:
  - Assistant / Conversations persistence, grouping, and branching metadata
  - Briefing page and navigation naming cutover
  - project-linked open-loop storage and API routes
  - Conversations list/detail recovery surfaces
  - mobile full-screen Assistant takeover plus floating `Ask / Delegate`
- `2026-03-26`: Extended the implementation into surface behavior:
  - Review Queue now supports `Accept` and `Request changes` decisions
  - request-changes creates follow-up work with preserved plan lineage
  - schedule list/detail surfaces now foreground purpose, output, and usefulness
- `2026-03-26`: Verification completed so far:
  - `npm run build` passes
  - focused Vitest coverage passes for review-decision routing and schedule presentation helpers

## 8. Notes for Execution

- Resist solving interaction-model gaps with extra pages or fallback forms.
- Keep Assistant proposal confirmation as the mutation boundary even when manual fallback exists.
- Preserve canonical queue ownership; Briefing must not quietly absorb Inbox or Review Queue over time.
- Treat the naming cutover as product behavior, not documentation cleanup.
