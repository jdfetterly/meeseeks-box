# Making The AI-First Vision Real

- Artifact: Product direction companion
- Project: `Meeseek Box`
- Status: `active`
- Last Updated: `2026-03-25`

## Purpose

This document translates the AI-first north star into concrete design and product consequences.

It is not an implementation plan. It is the working interpretation of what must become true for Meeseek Box to feel AI-forward in real use instead of becoming a traditional app with AI layered on top.

## The Core Shift

The product should not ask the user to construct the system.

The user should:

- state what they want
- correct what the system misunderstood
- confirm consequential actions
- review outputs

The system should:

- gather missing context
- translate intent into plans, cards, schedules, and setup
- preserve project context
- adapt to the user over time
- surface the next best move

## What Must Be True

### 1. Chat Becomes The Control Plane

Chat has to be the primary operating mechanism across the app.

This means:

- chat is available everywhere
- the user does not need to start with a blank form
- context from the current project, card, schedule, or review item is carried automatically
- the system proposes work, schedules, workspace actions, and plan changes inline

The product fails the vision if the user still has to “go to chat” as a separate mode before the app becomes intelligent.

### 2. Projects Become The Memory Layer

Projects cannot just be containers for cards.

They need to carry:

- active goals
- current focus
- preferred agents
- review preferences
- repo and workspace context
- recurring work patterns
- recent decisions
- learned suggestions

The point of project memory is not personalization theater. It is to reduce repetitive explanation and let the system make better default moves over time.

### 3. The App Needs One Current Plan In Focus

The user should not manage a planning library.

For most work, the system should keep one current lightweight plan in focus per project and use it to:

- explain what is being built
- generate the right-sized cards
- attach acceptance criteria to review
- absorb refinements over time

The current plan is the minimum useful planning artifact between a vague prompt and executable work.

### 4. Cards Must Be Derived, Not Hand-Assembled

If the user has to manually create most cards, the system is not AI-first enough.

The agent should derive cards from the current plan, project context, and workspace reality. The user’s job is to steer the quality of decomposition, not type out the structure of work.

Good cards should be:

- small enough for an agent to execute cleanly
- small enough for a human to review quickly
- linked back to the plan that produced them
- explicit about what “done” means

### 5. Review Must Become The Center Of Completion

An AI-forward product is not complete when something is marked done.

It is complete when:

- the output is available
- the acceptance context is visible
- the operator can judge it quickly
- the system can create the next step if the result is partial or wrong

That means `Review Queue` must be treated as a primary product surface, not an afterthought.

### 6. Home Must Synthesize, Not Report

A traditional app reports state.
An AI-first app synthesizes action.

Home should not mainly show:

- counts
- raw operational status
- passive lists

Home should mainly show:

- what needs the operator now
- which project deserves attention next
- what the agent recommends doing
- what is ready for review

### 7. Runtime And CLI Details Must Stay In The Basement

The app can rely on OpenClaw and CLI adapters behind the scenes, but the user should not experience the product as a wrapper over runtime concepts.

The product language should remain:

- project
- plan
- workspace
- card
- review
- schedule
- delegation

Not:

- cron
- job id
- runtime sync state
- transport-specific constraints

Operational details matter, but they should surface only when they help the user recover or understand risk.

## Design Consequences

These should guide future design work:

- If a form is the first thing the user sees, the flow is probably wrong.
- If a page is mostly lists of objects, the flow is probably not synthesized enough.
- If a user must repeatedly explain their project, memory is not working.
- If the main surface is about system status rather than advancing work, the design is drifting.
- If “AI” is mostly a shortcut to existing CRUD actions, the product is not yet AI-first.

## The Real Work Ahead

Making the vision real requires more than adding chat to screens.

It requires:

- conversational orchestration patterns that can create and update real product objects
- visible memory that gets smarter without becoming opaque
- strong plan-to-card decomposition
- a review loop that is faster than traditional task management
- interface simplification as confidence and context increase

The key standard is simple:

Every iteration should reduce the amount of system-shaping the user has to do.

If the app is truly learning and adapting, the operator should feel increasing leverage over time, not increasing setup burden.

## Near-Term Design Focus

Use the north star to drive these priorities:

1. Make chat the default control plane on every meaningful page.
2. Replace create-first forms with proposal-and-confirm flows.
3. Strengthen project memory and current-plan behavior.
4. Reframe Home around recommended next actions.
5. Reframe Schedules around value and output, not admin.
6. Keep board interactions centered on project momentum and plan-derived execution.

## Final Standard

The app should increasingly feel like this:

- “It knows what I’m working on.”
- “It understands how I like to work.”
- “It helps me move faster with less setup.”
- “It brings me the work that actually needs me.”
- “It gets better as it works with me.”

If a design does not move the product toward those outcomes, it is not aligned with the vision.
