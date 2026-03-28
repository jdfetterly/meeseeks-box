# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Requirement ID: `REQ-006`
- Title: Project and Board default to plan-first execution instead of manual setup
- Status: draft
- Priority: High
- Last Updated: `2026-03-26`
- Source: `meeseek-box-functional-spec-rev-a.md`

## Requirement Statement

The system shall make current plan, plan-derived execution, and recommended next move primary on Project and Board while demoting manual launch and setup UI to secondary or advanced paths.

## Expected Behavior

1. Project Detail opens with current plan and next-step context.
2. Board defaults to plan view with execution state layered onto plan items.
3. Cards are usually created through derivation proposals.
4. Manual creation remains available but is not the primary path.

## Edge Cases

- A project has no plan yet.
- A project has only ad hoc work.
- A plan item changes while linked work is already in progress.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given a project with a plan, when the user opens Project Detail, then current plan, readiness, recommended next move, and unresolved state are visible before advanced forms and secondary metadata. |
| AC-002 | Given a project with a plan, when the user opens Board, then plan view is the default and manual launch/setup UI does not dominate the first screen. |
| AC-003 | Given plan-derived work, when a plan change affects execution, then the system preserves lineage and creates update proposals or unresolved-state warnings instead of silently drifting. |
