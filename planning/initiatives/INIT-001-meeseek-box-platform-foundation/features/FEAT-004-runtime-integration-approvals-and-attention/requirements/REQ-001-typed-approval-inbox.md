# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-004`
- Requirement ID: `REQ-001`
- Title: Inbox derivation and typed approval events create correct attention and resolution flows
- Status: draft
- Priority: High
- Last Updated: `2026-03-19`
- Source: `meeseeks-box-plan-draft-v3.md`

## Requirement Statement

The system shall support typed approval steps and other high-signal attention sources in Inbox with the correct context, linked work state, and operator resolution actions.

## Expected Behavior

1. An approval-needed or other supported attention state occurs.
2. The system creates the corresponding Inbox item.
3. The operator resolves the item when action is required.
4. The resulting resolution updates linked work and run state.

## Edge Cases

- The approval is data input, task completion, or path selection rather than yes/no.
- The operator does not act before timeout.
- The attention source is a failed no-retry run, blocked work item, missed schedule, or explicit memory review prompt rather than an approval.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given a typed approval event, when the operator sees it in Inbox, then the approval type and linked context are clear. |
| AC-002 | Given a typed approval resolution, when it is completed, then linked run and work state update consistently. |
| AC-003 | Given a failed no-retry run, blocked work item, missed schedule, or explicit memory review prompt, when it is derived, then a corresponding Inbox item appears with the correct source context. |
