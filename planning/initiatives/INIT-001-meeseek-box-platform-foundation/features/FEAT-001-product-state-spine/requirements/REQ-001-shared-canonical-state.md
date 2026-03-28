# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-001`
- Requirement ID: `REQ-001`
- Title: Shared canonical state for conversations, work items, and runs
- Status: draft
- Priority: High
- Last Updated: `2026-03-18`
- Source: `meeseeks-box-plan-draft-v3.md`

## Problem / User Need

The current shell has browser-local chat and Kanban state, which breaks cross-device continuity and prevents the app from acting as a real operator console.

## Requirement Statement

The system shall persist conversations, work items, and runs in canonical shared product state so the same objects are visible and linked across iPhone, MacBook, and other supported clients.

## Actor

- Primary actor: operator
- Supporting actors: product-state API, browser clients

## Trigger

The operator starts or updates work from any supported client.

## Preconditions

- Product-state storage is available.
- Core object identities are generated centrally.

## Expected Behavior

1. A client creates or updates a conversation, work item, or run.
2. The product-state layer stores the object using a canonical ID.
3. Another client can query and render the same object with the same linked relationships.

## Edge Cases

- A client refreshes mid-flow and must recover the canonical state cleanly.
- Multiple clients read the same object while updates are in flight.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given a conversation created on one client, when another client loads it, then the same conversation ID, messages, and linked work/run state are returned. |
| AC-002 | Given a work item linked to a run, when the item is viewed from another client, then the same linked run appears with the same canonical identifiers. |

## Dependencies

- `REQ-002` normalized event ingestion
- product-state persistence layer

## Open Questions

- None at the functional level.

## Traceability

- Feature: `../feature.md`
- FDD: `../fdd.md`
- TDD: `../tdd/index.md`
- Tasks: `../delivery/tasks-active.md`
- Tests: `../delivery/test-cases-active.md`
- Bugs: `../delivery/bugs-open.md`
