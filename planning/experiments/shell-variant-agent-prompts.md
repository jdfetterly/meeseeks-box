# Shell Variant Branch Brief and Agent Prompts

Use this when opening a new chat to work on one branch or one design question in isolation.

## Why These Branches Exist

This exploration is not a rewrite. It is a controlled product experiment inside the existing Meeseeks Box model.

We are trying to answer one question:

`What shell best supports Meeseeks Box's AI-first, spec-driven workflow without collapsing into a generic kanban app?`

The shared product rules do not change across branches:

- conversation stays central
- projects remain the durable context container
- the current plan/spec is the planning artifact
- cards come from the spec
- review is about outcomes, not activity
- persistent memory must stay visible and useful

The branches exist because we are testing different answers to one design question:

- should the app feel like a spec-first project workspace
- or should it feel like a board-dominant execution system

## Approach

We are using one shared base plus separate variant branches so we can compare shell behavior without corrupting the core product model.

- `codex/mb-variant-base`
  - shared experiment substrate
  - owns reusable shell primitives and shared fixes
- `codex/mb-option-2-cockpit`
  - tests a balanced, spec-first workspace
- `codex/mb-option-3-board-os`
  - tests a board-dominant execution shell

This is a product-learning exercise, not a parity exercise.

We are not asking:

- does every button work yet
- is every route finished
- which branch has more UI on screen

We are asking:

- which shell makes the next move obvious
- which shell better supports `intent -> spec -> decomposition -> execution -> review`
- which shell preserves Meeseeks Box's AI-first character

## Branch Briefs

### `control`

- Branch/worktree: live control workspace
- Route focus:
  - `/projects/[id]`
  - `/work?projectId=[id]`
  - `/review`
- Product role: baseline
- Best for learning:
  - what the current product already gets right
  - where context is fragmented
  - which existing surfaces should survive no matter what

### `codex/mb-option-2-cockpit`

- Worktree: `/Users/jdfetterly/Ops/meeseeks-box-opt2`
- Port: `3002`
- Route focus:
  - `/lab/project/[id]/cockpit`
- Product thesis:
  - Meeseeks Box should feel like a spec-first project workspace
- Distinguishing traits:
  - starts with intent and spec shaping
  - assistant and execution share one workspace
  - board appears after decomposition, not before
  - memory and review stay nearby but secondary
- What we are trying to learn:
  - whether the product gets clearer when the shell follows the real work sequence
  - whether the board becomes more useful when it arrives later
  - whether this preserves the north star better than a board-led model

### `codex/mb-option-3-board-os`

- Worktree: `/Users/jdfetterly/Ops/meeseeks-box-opt3`
- Port: `3003`
- Route focus:
  - `/lab/project/[id]/board-os`
- Product thesis:
  - once work is decomposed, the board should drive the operating experience
- Distinguishing traits:
  - board is primary
  - assistant is support, not co-owner
  - memory and review are subordinate to execution flow
- What we are trying to learn:
  - whether a board-led shell produces materially tighter execution
  - whether Meeseeks Box loses too much context and clarity when the board leads
  - whether a board-first shell can still respect memory and review

### `codex/mb-variant-base`

- Worktree: `/Users/jdfetterly/Ops/meeseeks-box-control`
- Product role: shared infrastructure branch
- Use it for:
  - shared experiment primitives
  - fixes both variants need
  - branch docs and test scaffolding
- Do not use it for:
  - variant-specific product decisions

## Working Rule

When the question is about product sequence, start with the earliest meaningful step in the workflow.

That means:

- if testing `cockpit`, start from a blank or ambiguous project and go through spec creation
- if testing `board_os`, start from a project that already has a spec and cards

Do not test a late-stage shell with an early-stage use case or vice versa.

## Recommended Test Routes

### Cockpit

Use the clean test project with no spec and no cards:

- `http://localhost:3002/lab/project/77235b52-bef0-40a8-b0a5-8cd829920dbb/cockpit`

This route is for validating:

- blank-project entry
- drafting the spec
- refining the spec
- deciding when the board should appear

### Board OS

Use the seeded project that already has a spec and cards:

- `http://localhost:3003/lab/project/7c37ec7e-8268-4763-9bb0-bbb5038b9571/board-os`

This route is for validating:

- execution flow from existing decomposition
- board legibility
- card zoom
- review adjacency

### Control

Use the seeded project as the baseline:

- `http://localhost:3001/projects/7c37ec7e-8268-4763-9bb0-bbb5038b9571`
- `http://localhost:3001/work?projectId=7c37ec7e-8268-4763-9bb0-bbb5038b9571`

## Copy-Paste Prompts

### Prompt: Control Baseline Review

```md
You are reviewing the current Meeseeks Box control experience as the baseline for the shell-variant exploration.

Context:
- Product: Meeseeks Box
- Core model: conversation before configuration, projects as durable context, current plan/spec before cards, reviewable outcomes over activity tracking, persistent memory as a first-class part of the product
- This is not a generic kanban app
- The current control routes are the baseline to compare against, not the target state

What I want from you:
- study the current control flow
- identify what it already gets right
- identify where it creates unnecessary hops or splits context
- identify what must be preserved even if cockpit or board_os wins

Focus on:
- `/projects/[id]`
- `/work?projectId=[id]`
- `/review`

Use this project for the review:
- `http://localhost:3001/projects/7c37ec7e-8268-4763-9bb0-bbb5038b9571`
- `http://localhost:3001/work?projectId=7c37ec7e-8268-4763-9bb0-bbb5038b9571`

Do not just summarize pages. Evaluate the UX flow against the intended product model.

Required output:
1. What the control flow does well
2. Where the control flow breaks the AI-first or spec-driven model
3. What should be preserved in any winning shell
4. What should be removed or collapsed
5. The highest-leverage changes to improve the control flow
```

### Prompt: Cockpit Design Review

```md
You are reviewing the `cockpit` branch of the Meeseeks Box shell exploration.

Branch context:
- Branch: `codex/mb-option-2-cockpit`
- Route: `/lab/project/[id]/cockpit`
- Thesis: Meeseeks Box should feel like a spec-first project workspace
- Intended sequence: `intent -> spec -> decomposition -> board -> review`

Core product constraints:
- conversation remains central
- projects are the durable context container
- the board should not lead before there is a real spec and execution-ready cards
- persistent memory must remain visible and useful
- review is canonical and should stay tied to explicit expectations

What I want from you:
- evaluate whether cockpit actually supports a spec-driven workflow
- focus on whether the user can start from a blank project, build the spec, and naturally progress into decomposition and execution
- identify where the shell still jumps ahead, duplicates itself, or obscures the next move

Use this clean test route:
- `http://localhost:3002/lab/project/77235b52-bef0-40a8-b0a5-8cd829920dbb/cockpit`

Evaluate this exact sequence:
1. blank project
2. draft spec
3. refine spec
4. confirm the moment when board should appear
5. judge whether the shell makes the next action obvious at each step

Do not optimize for density or feature count. Optimize for the human user's ability to understand what to do next.

Required output:
1. Does cockpit successfully support `intent -> spec -> decomposition -> board`?
2. Where is the UX still confusing?
3. What belongs on the first screen, and what should be hidden until later?
4. How should assistant, memory, and review behave during spec creation?
5. The most important product-level changes to make cockpit feel correct
```

### Prompt: Board OS Design Review

```md
You are reviewing the `board_os` branch of the Meeseeks Box shell exploration.

Branch context:
- Branch: `codex/mb-option-3-board-os`
- Route: `/lab/project/[id]/board-os`
- Thesis: once the spec has been decomposed, the board should drive the operating experience

Core product constraints:
- Meeseeks Box is still AI-first, not a generic kanban app
- projects remain the durable context container
- persistent memory must remain legible and useful
- review remains canonical
- board_os should be judged on execution flow, not on blank-project spec creation

What I want from you:
- evaluate whether board_os is a better execution shell after decomposition exists
- identify whether board dominance improves focus or strips too much context away
- identify whether assistant, memory, and review are in the right supporting roles

Use this seeded route:
- `http://localhost:3003/lab/project/7c37ec7e-8268-4763-9bb0-bbb5038b9571/board-os`

Evaluate this exact sequence:
1. understand what the project is
2. identify the next card to act on
3. open a card into active work
4. judge how review and memory stay connected to execution

Do not critique it as a spec-authoring surface. Critique it as an execution shell.

Required output:
1. Does board_os materially improve execution clarity?
2. What context is missing or too hidden?
3. Does the board lead at the right moment in the workflow?
4. What must stay secondary vs visible by default?
5. The most important product-level changes to make board_os viable
```

### Prompt: Cross-Variant Decision Review

```md
You are comparing the shell variants for Meeseeks Box.

Context:
- `control` is the baseline
- `cockpit` is the spec-first project workspace
- `board_os` is the board-dominant execution shell
- We are not choosing the most feature-rich version
- We are choosing the shell that best preserves Meeseeks Box's AI-first, spec-driven product model

Product constraints:
- conversation before configuration
- projects before operational state
- current plan/spec before cards
- reviewable outcomes before activity tracking
- persistent memory as a first-class product capability

Important rule:
- cockpit should be judged primarily on blank-project and spec-shaping flow
- board_os should be judged primarily on post-decomposition execution flow

What I want from you:
- compare the branches as product bets
- make the tradeoffs explicit
- recommend which shell should become the default direction

Required output:
1. What each branch is actually good at
2. Where each branch breaks the intended product model
3. Which branch should win and why
4. What should be merged from the losing branch into the winner
5. The most important next design moves after the decision
```
