# Functional Design Document

- Artifact: FDD
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Status: draft
- Approval Status: draft
- Last Updated: `2026-03-26`
- Source Inputs:
  - `../../../../chat-briefs/meeseek-box-functional-spec-rev-a.md`
  - `requirements/index.md`

## Problem Statement and Context

Meeseek Box has already moved away from the original dashboard-and-setup product model, but several load-bearing surfaces still collapse back into traditional app behavior. The major regressions are thread-first chat entry, Home replacing canonical queues, weak unfinished-work detection, board launch/setup gravity, and mobile paths that drift back into generic chat behavior.

Rev A fixes those structural issues by clarifying surface ownership and giving the system a stronger interaction contract:
- Assistant is where active work happens
- Conversations is where saved work is recovered
- Briefing is the synthesis layer, not the queue owner
- Inbox owns operational attention
- Review Queue owns completed outputs awaiting judgment
- open loops identify unfinished work before the user manually catalogs it

## Goals

- Preserve one coherent intent-to-outcome model across desktop and mobile.
- Keep active work in Assistant and prevent thread-first drift.
- Keep canonical queue ownership explicit while still giving the user a simple top-level briefing.
- Detect unfinished work reliably enough that the product feels AI-forward.
- Make Project and Board plan-first and execution-first rather than setup-first.
- Make schedules read like standing delegated work instead of admin/runtime records.

## Functional Requirements

| Requirement ID | Requirement | Priority | Notes |
| --- | --- | --- | --- |
| `REQ-001` | Assistant is the active work surface and Conversations is the saved-history surface. | High | Core interaction model |
| `REQ-002` | Briefing previews ranked work without replacing Inbox or Review Queue. | High | Fixes queue and notification ownership |
| `REQ-003` | The system tracks unfinished work through candidate unresolved state and durable open loops. | High | Core AI-forward capability |
| `REQ-004` | Conversations support project grouping, actionable status, and minimal branch lineage in v1. | High | Prevents context fragmentation |
| `REQ-005` | Mobile uses the `/mobile` command shell without thread-first drift. | High | Maintains one model across devices |
| `REQ-006` | Project and Board default to plan-first execution instead of manual setup. | High | Aligns execution with planning artifact |
| `REQ-007` | Review Queue remains the canonical completion surface with fast follow-up generation. | High | Preserves review-centered completion |
| `REQ-008` | Schedules behave as standing delegated work centered on purpose, output, and usefulness. | High | Keeps recurring work AI-first |

## Core Product Consequences

- `Home` becomes `Briefing` everywhere in product language and planning artifacts.
- Active work no longer requires the user to think in terms of threads or pages.
- Assistant and Conversations must share the same underlying conversation records without forcing navigation handoffs.
- Open-loop detection becomes part of the product-state layer, not just the chat layer.
- Project and Board must consume plan lineage as primary read state.
- Review Queue and Inbox remain independent surfaces even if Briefing previews both.
- Schedule usefulness is no longer deferred entirely; the product must carry a minimum opinion about recurring value in v1.

## Traceability and Delivery Notes

- Rev-A section numbers are the product-facing traceability anchor.
- `delivery/tasks-active.md` owns implementation sequencing.
- `delivery/test-cases-active.md` owns feature-level verification.
- initiative-level `shared-test-cases.md` must be updated with end-to-end flows that cross existing features.
