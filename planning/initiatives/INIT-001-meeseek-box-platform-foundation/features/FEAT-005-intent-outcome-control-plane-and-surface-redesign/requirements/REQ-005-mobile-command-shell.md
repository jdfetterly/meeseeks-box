# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Requirement ID: `REQ-005`
- Title: Mobile uses the `/mobile` command shell without thread-first drift
- Status: draft
- Priority: High
- Last Updated: `2026-03-26`
- Source: `meeseek-box-functional-spec-rev-a.md`

## Requirement Statement

The system shall preserve the same active-work model on mobile through the black/green `/mobile` command shell, while keeping Conversations as history and recovery rather than the primary start point.

## Expected Behavior

1. The user opens the persistent `/mobile` command shell.
2. The command shell opens with visible current project context.
3. The user completes or continues work through command input, jobs, context, or recovery links.
4. The user returns to the relevant tab or sheet with context preserved.

## Edge Cases

- The user starts generally from Briefing.
- The user starts from a card, review item, or schedule and expects that context to carry.
- The user opens Conversations to recover older work rather than start something new.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given the mobile surface, when the user opens `/mobile`, then the command shell shows carried project context without falling back to a split panel or thread-first start path. |
| AC-002 | Given mobile Conversations, when the user browses it, then it behaves as history, recovery, and search and does not require a thread-first new-conversation path for starting work. |
| AC-003 | Given active work on mobile, when the user closes a sheet or completes a command flow, then they return to the relevant mobile tab with continuation state preserved. |
