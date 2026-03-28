# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Requirement ID: `REQ-005`
- Title: Mobile uses full-screen Assistant takeover without thread-first drift
- Status: draft
- Priority: High
- Last Updated: `2026-03-26`
- Source: `meeseek-box-functional-spec-rev-a.md`

## Requirement Statement

The system shall preserve the same active-work model on mobile by using a full-screen Assistant takeover from every major surface, while keeping Conversations as history and recovery rather than the primary start point.

## Expected Behavior

1. The user taps the persistent mobile Assistant entry point.
2. Assistant opens full-screen with visible current context.
3. The user completes or continues work there.
4. The user returns to the originating surface with context preserved.

## Edge Cases

- The user starts generally from Briefing.
- The user starts from a card, review item, or schedule and expects that context to carry.
- The user opens Conversations to recover older work rather than start something new.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given any major mobile surface, when the user opens Assistant, then it opens as a full-screen takeover instead of a split panel and shows the carried context at the top. |
| AC-002 | Given mobile Conversations, when the user browses it, then it behaves as history, recovery, and search and does not require a thread-first new-conversation path for starting work. |
| AC-003 | Given active work on mobile, when the user closes or completes the Assistant flow, then they return to the originating surface with continuation state preserved. |
