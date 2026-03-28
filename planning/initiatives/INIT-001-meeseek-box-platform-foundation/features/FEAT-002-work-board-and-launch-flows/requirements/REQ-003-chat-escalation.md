# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-002`
- Requirement ID: `REQ-003`
- Title: Chat threads can be escalated into tracked work without losing linkage
- Status: draft
- Priority: High
- Last Updated: `2026-03-18`
- Source: `meeseeks-box-plan-draft-v3.md`

## Problem / User Need

Chat must be a useful front door, not a dead end. The operator needs to turn conversations into tracked work without losing the relationship between the conversation, work item, and run.

## Requirement Statement

The system shall allow the operator to escalate a chat thread or message into tracked work and preserve the canonical linkage between conversation, work item, and any resulting run.

## Actor

- Primary actor: operator
- Supporting actors: chat surface, work board

## Trigger

The operator uses an escalation action from a conversation.

## Preconditions

- A conversation thread exists.

## Expected Behavior

1. The operator selects an escalation action from chat.
2. The system creates or links a work item.
3. The resulting work item and any run remain linked back to the source conversation.

## Edge Cases

- The operator escalates into an existing work item instead of creating a new one.
- The escalated work is scheduled instead of run immediately.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given a conversation thread, when the operator escalates it into tracked work, then the resulting work item retains a canonical link to the originating conversation. |
| AC-002 | Given escalated work that creates a run, when the run is inspected, then the conversation linkage remains visible. |

## Dependencies

- Shared product-state layer
- work item lifecycle

## Open Questions

- None at the functional level.

## Traceability

- Feature: `../feature.md`
- FDD: `../fdd.md`
- TDD: `../tdd/index.md`
- Tasks: `../delivery/tasks-active.md`
- Tests: `../delivery/test-cases-active.md`
- Bugs: `../delivery/bugs-open.md`
