# Chat Brief: Spec-Driven Delivery Model

You are helping define the spec-driven delivery model for Meeseek Box so that kanban cards are created at the right level and agents can execute them effectively.

## Product Direction

The board should support project-focused execution, not generic operational task tracking.

The user wants to manage Git-based project work from the board, prioritize features, and have an agent execute. The app should not create cards that are too vague, too large, or too operationally shallow.

## Locked Decisions

- Projects are first-class.
- Board is project-first by default.
- Workspace-ready projects are the execution context for code work.
- Review Queue is where outputs wait for judgment.
- Chat is the primary control plane.
- The app should support both existing repo work and brand-new build projects.

## What This Chat Should Produce

Define a spec-driven approach that turns project intent into the right execution units.

The goal is to answer:

- what kinds of specs exist
- how much detail each spec should hold
- when a spec becomes one kanban card vs several
- what makes a card executable by an agent
- how cards connect to review and acceptance

## Please Cover

- the hierarchy between project, initiative, spec, card, task, and review artifact
- how to size work for agent execution
- how to split large specs into multiple cards
- what metadata a card needs to be executable
- how acceptance criteria should be represented
- how review should happen when a card completes
- how planning-only cards differ from execution-ready cards

## Constraints

- Avoid giant ambiguous cards.
- Avoid cards that are so small they create noise.
- Optimize for agent execution plus human review.
- Make the model work for both repo-backed implementation work and non-code project work.

## Output Format

Return:

1. Spec hierarchy
2. Card sizing model
3. Rules for splitting specs into cards
4. Minimum executable card schema
5. Review and acceptance model
6. Acceptance criteria

Be opinionated. Recommend a concrete model rather than listing many equal options.
