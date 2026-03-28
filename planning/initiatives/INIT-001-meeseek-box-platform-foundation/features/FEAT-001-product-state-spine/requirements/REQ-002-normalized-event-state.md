# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-001`
- Requirement ID: `REQ-002`
- Title: Normalized event ingestion drives derived product state
- Status: draft
- Priority: High
- Last Updated: `2026-03-18`
- Source: `meeseeks-box-plan-draft-v3.md`

## Problem / User Need

If runs, Inbox items, work cards, and related product surfaces derive state from inconsistent raw runtime payloads or UI-local assumptions, the operator will see contradictory system behavior.

## Requirement Statement

The system shall normalize runtime and product events into a canonical event model and use that model to derive run timelines, Inbox state, work-card badges, memory provenance links, and schedule health summaries.

## Actor

- Primary actor: operator
- Supporting actors: event ingestion layer, adapters, product-state services

## Trigger

The runtime or product layer emits an event that changes run, work, approval, schedule, memory, or artifact state.

## Preconditions

- Event ingestion layer is active.
- Canonical event types are defined.

## Expected Behavior

1. A raw event enters the product boundary.
2. The event is normalized into the canonical schema.
3. Derived product-state consumers update consistently from the normalized event.

## Edge Cases

- An upstream event is incomplete or malformed.
- Event ordering is delayed or duplicated.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given a raw `approval_requested` event, when it is normalized, then the corresponding Inbox item, run state, and work-card badge are all derived consistently. |
| AC-002 | Given duplicate or delayed events, when they are processed, then canonical state remains internally consistent and traceable. |

## Dependencies

- adapter contracts
- canonical event schema

## Open Questions

- What exact OpenClaw event shapes are available natively?

## Traceability

- Feature: `../feature.md`
- FDD: `../fdd.md`
- TDD: `../tdd/index.md`
- Tasks: `../delivery/tasks-active.md`
- Tests: `../delivery/test-cases-active.md`
- Bugs: `../delivery/bugs-open.md`
