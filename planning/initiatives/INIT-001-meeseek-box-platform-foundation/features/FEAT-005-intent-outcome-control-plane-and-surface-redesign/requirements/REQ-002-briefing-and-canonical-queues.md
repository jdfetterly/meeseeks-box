# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Requirement ID: `REQ-002`
- Title: Briefing previews ranked work without replacing Inbox or Review Queue
- Status: draft
- Priority: High
- Last Updated: `2026-03-26`
- Source: `meeseek-box-functional-spec-rev-a.md`

## Requirement Statement

The system shall provide a synthesized Briefing surface that ranks what matters now while preserving Inbox as the canonical operational queue and Review Queue as the canonical completion queue.

## Expected Behavior

1. Briefing computes a hero item and small previews.
2. Inbox owns operational items requiring intervention.
3. Review Queue owns completed outputs waiting for judgment.
4. Briefing links into those canonical destinations rather than replacing them.

## Edge Cases

- Multiple high-signal items compete for hero placement.
- No operational or review items exist and Briefing must still be useful.
- An open loop is important but should not outrank an operational blocker.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given simultaneous operational, review, and open-loop items, when Briefing computes the hero item, then it follows the documented waterfall of operational blocker, review due, blocking user-owned open loop, then recommended next move. |
| AC-002 | Given operational items, when the user opens Briefing, then the surface shows preview rows that link into Inbox rather than a standalone replacement queue. |
| AC-003 | Given completed outputs awaiting judgment, when the user opens Briefing, then the surface previews top review items while Review Queue remains the canonical pending list. |
