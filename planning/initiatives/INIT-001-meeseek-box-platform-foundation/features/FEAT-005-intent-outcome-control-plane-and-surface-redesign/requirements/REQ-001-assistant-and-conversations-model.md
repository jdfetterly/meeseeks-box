# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Requirement ID: `REQ-001`
- Title: Assistant is the active work surface and Conversations is the saved-history surface
- Status: draft
- Priority: High
- Last Updated: `2026-03-26`
- Source: `meeseek-box-functional-spec-rev-a.md`

## Requirement Statement

The system shall let the user start and continue active work in Assistant, while keeping Conversations as the saved history, recovery, and search surface rather than a required continuation step.

## Expected Behavior

1. The user opens Assistant either generally or from a current context.
2. Assistant carries visible context, resolves intent, and produces proposals.
3. The user confirms or edits without being pushed into Conversations.
4. The resulting conversation is saved and remains recoverable later from Conversations or the originating surface.

## Edge Cases

- The user starts generally and later needs to attach the work to a project.
- The current surface has ambiguous context, such as multi-project Board view.
- The user explicitly prefers a manual form after Assistant clarifies the task.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given a general start, when the user begins work, then Assistant remains the active surface and can later attach the conversation to a project without forcing a navigation jump. |
| AC-002 | Given a contextual start from Project, Board, Review Queue, Schedule, or Briefing, when Assistant opens, then the carried context is visible and editable before confirmation. |
| AC-003 | Given an active conversation, when the user continues the work later, then they can resume it from the originating surface or from Conversations without any required Assistant-to-Conversations handoff. |
