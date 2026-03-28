# Chat Brief: Board Page

You are helping define the Board page for Meeseek Box.

## Product Direction

The board is the primary execution surface for project work.

It should support:

- prioritizing project work
- seeing what is in progress
- understanding what is ready for review
- delegating feature work to agents

It should not primarily reflect runtime/ops lanes.

## Locked Decisions

- Default board lanes:
  - To Do
  - In Progress
  - In Review
  - Done
- Secondary mode:
  - By Status
- Projects are first-class.
- Chat is the control plane.
- Code execution requires a workspace-ready project.
- Spec-driven delivery model will determine card sizing and execution-readiness.

## What This Chat Should Produce

Define the Board page:

- lane behavior
- filters
- card anatomy
- card actions
- project vs status grouping
- execution gating when no workspace exists

## Please Cover

- default board mode
- project filter behavior
- multi-project vs single-project mode
- card metadata
- operational badges
- drag behavior if any
- “delegate with copilot” entry points
- what happens when a card needs execution but the project has no workspace
- how specs/cards should show execution readiness

## Constraints

- Do not revert to an ops-first runtime board.
- Keep operational visibility available but secondary.
- The board should feel like project execution, not background process monitoring.

## Output Format

Return:

1. Board goals
2. Lane and grouping model
3. Card model
4. User actions and transitions
5. Edge cases
6. Acceptance criteria
