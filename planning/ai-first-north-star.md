# AI-First North Star

- Artifact: Directional north star
- Project: `Meeseek Box`
- Status: `active`
- Last Updated: `2026-03-25`

## Core Promise

Meeseek Box turns intent into outcomes.

The user should be able to say what they want, have the system ask only what is missing, and then watch the app plan, set up, delegate, and surface results for review with minimal manual configuration.

The app should feel like working with a capable chief of staff, not operating software.

## What This Means

- Conversation is the primary interface.
- The user expresses intent before they manage objects.
- The agent drives setup, not the user.
- Projects are the durable context for work, memory, and adaptation.
- The system should learn the user over time so it asks less and recommends more.
- Work is complete when it produces a reviewable outcome, not when an object changes state.

## Design Principles

- Conversation before configuration.
- Intent before objects.
- Projects before operational state.
- Reviewable outcomes before activity tracking.
- Learning must reduce friction, not add mystery.
- Forms and admin controls are fallback tools, not the main path.
- The app should synthesize what matters next, not just display what exists.

## Product Expectations

### Interaction Model

- Chat is the operating surface, not a separate feature.
- Every important creation flow starts with intent, then moves through proposal and confirmation.
- Manual forms are available only for fallback, advanced editing, or direct correction.
- Context should follow the user automatically across Home, Projects, Board, Review, and Schedules.

### Product Model

- `Project` is the durable planning and memory container.
- `Workspace` is the execution environment once implementation work is ready.
- `Current plan` is the lightweight planning artifact the system works from.
- `Cards` are execution-ready slices derived from the current plan.
- `Review Queue` is where finished outputs wait for judgment.
- `Inbox` is reserved for operational attention.

### Surface Expectations

- `Home` answers: what needs me, what matters next, and what should I delegate now.
- `Projects` show context, current plan, workspace readiness, and learned preferences.
- `Board` shows project execution flow, not administrative setup.
- `Chat` does not require thread setup before use.
- `Schedules` emphasize output, usefulness, and project context over cron and sync details.
- `Review` makes it easy to judge work against explicit expectations.

## Anti-Patterns To Reject

Reject designs where:

- the user has to create or configure objects before they can express intent
- chat is treated as a page or secondary feature instead of the operating surface
- boards are organized primarily by runtime or system state
- schedules are treated as cron admin instead of delegated recurring work
- home is mostly a monitoring dashboard
- the product repeats the user’s prior prompt instead of distilling the next best move
- memory is hidden, magical, or not clearly useful

## Design Test

Every meaningful design change should be reviewed against these questions:

1. Can the user start by stating intent directly?
2. Does the system ask only for missing information?
3. Is the agent doing the setup work instead of the user?
4. Does the surface understand project context automatically?
5. Does the app get simpler as it learns the user?
6. Is the primary view about moving work forward, not managing objects?
7. Are runtime and admin details secondary rather than dominant?
8. Does completion end in a reviewable outcome, not just a status change?
9. If chat disappeared from this flow, would the design collapse back into a traditional app?

A design should fail review if it cannot answer these well.

## Practical Rule

When there is tension between:

- explicit control and agent-led orchestration
- manual setup and conversational setup
- object visibility and user simplicity

default toward the option that preserves `intent -> outcome` with the least operator effort.
