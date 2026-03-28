# Chat Brief: Detail Pages

You are helping define the detailed inspection surfaces for Meeseek Box.

Focus on:

- Project Detail
- Work Detail
- optionally Run Detail where needed

## Product Direction

These pages should be deep inspection and adjustment surfaces, not the primary place where setup begins.

They should help the user:

- understand current context
- inspect outputs and linked artifacts
- see linked project/workspace/schedule/review state
- adjust through copilot without falling back into giant form workflows

## Locked Decisions

- Chat is the control plane.
- Projects are first-class.
- Execution may depend on workspace readiness.
- Review Queue and Inbox are separate.
- Detail pages should be project-aware.

## What This Chat Should Produce

Define the role of each detail page:

- what information belongs there
- what actions should be available
- how much editing should happen directly on the page
- when the page should route the user back into the copilot

## Please Cover

- Project Detail
- Work Detail
- how schedules, artifacts, conversations, review items, and workspace state appear on detail pages
- what summary vs deep-inspection blocks should exist
- what actions should be inline vs copilot-driven

## Constraints

- Detail pages should not become setup-heavy admin forms.
- They should remain useful as the “open it and understand the full situation” surface.

## Output Format

Return:

1. Role of each detail page
2. Section-by-section spec
3. Action model
4. Edge cases
5. Acceptance criteria
