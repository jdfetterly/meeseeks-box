# Chat Brief: Schedules Page

You are helping define the Schedules page and Schedule Detail page for Meeseek Box.

## Product Direction

Schedules should be agent-led and project-aware.

The user should be able to say what they want automated, answer a small number of follow-up questions, confirm once, and then let the app create the schedule.

The page should emphasize:

- output usefulness
- health
- linked project/work context

Not raw cron configuration as the main experience.

## Locked Decisions

- Chat is the primary setup surface.
- Schedules are attached to project/work context.
- Review Queue should receive completed outputs that need judgment.
- Forms can remain as advanced fallback tools.

## What This Chat Should Produce

Define:

- Schedules list page
- schedule creation flow
- schedule detail page
- conversational setup model
- advanced/manual fallback behavior

## Please Cover

- “new schedule with agent” flow
- what the agent asks
- what the confirmation card contains
- outputs-first schedule detail structure
- runtime health presentation
- recurring controls
- workspace-aware schedule behavior for code-backed work
- project linkage

## Constraints

- Do not make cron/config the primary mental model.
- Keep operator control available, but secondary.

## Output Format

Return:

1. Schedules list spec
2. Schedule setup flow
3. Schedule detail spec
4. Edge cases and failure states
5. Acceptance criteria
