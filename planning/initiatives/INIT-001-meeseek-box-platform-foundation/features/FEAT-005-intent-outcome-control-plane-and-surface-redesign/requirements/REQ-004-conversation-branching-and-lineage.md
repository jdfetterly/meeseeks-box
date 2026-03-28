# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Requirement ID: `REQ-004`
- Title: Conversations support project grouping, actionable status, and minimal branch lineage in v1
- Status: draft
- Priority: High
- Last Updated: `2026-03-26`
- Source: `meeseek-box-functional-spec-rev-a.md`

## Requirement Statement

The system shall preserve conversations as project-linked working context with explicit status, distilled summaries, linked objects, and minimal child-branch lineage so alternatives do not fragment into unrelated top-level threads.

## Expected Behavior

1. Conversations are grouped under projects and grouped again by purpose.
2. Each conversation exposes an actionable status and summary.
3. The user can start an alternative from a specific turn.
4. The child conversation preserves lineage without requiring merge support.

## Edge Cases

- The originating conversation becomes superseded by a branch.
- The user reopens a resolved conversation after additional work appears.
- A linked object is deleted but conversation history must stay intact.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given project-linked conversations, when the user browses Conversations or Project Detail, then conversations are grouped by project and purpose and sorted by actionable state first. |
| AC-002 | Given a saved conversation, when the system updates it, then the conversation maintains a distilled summary, linked objects, and one of the documented statuses such as active, waiting_on_user, waiting_on_agent, needs_follow_up, resolved, superseded, or archived. |
| AC-003 | Given a specific turn in an active conversation, when the user starts an alternative from there, then the system creates a child conversation with `parent_conversation_id`, `branch_from_message_id`, and copied context snapshot while leaving the parent intact. |
