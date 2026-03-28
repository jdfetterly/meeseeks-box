# Meeseeks Box Shell Variant Exploration

This repo is running an internal exploration of two shell variants built on the same product-state model.

## Read This First

Before editing anything for the shell exploration, read in this order:

1. `planning/_workflow/README.md`
2. `planning/initiatives/INIT-001-meeseek-box-platform-foundation/features/FEAT-005-intent-outcome-control-plane-and-surface-redesign/requirements/REQ-001-assistant-and-conversations-model.md`
3. `planning/initiatives/INIT-001-meeseek-box-platform-foundation/features/FEAT-005-intent-outcome-control-plane-and-surface-redesign/requirements/REQ-006-plan-first-project-and-board.md`
4. `planning/initiatives/INIT-001-meeseek-box-platform-foundation/features/FEAT-005-intent-outcome-control-plane-and-surface-redesign/requirements/REQ-007-review-queue-and-follow-up.md`
5. `planning/experiments/shell-variant-scenarios.md`
6. `planning/experiments/shell-variant-agent-prompts.md`

## What Exists

- `control`: current `/projects/[id]`, `/work`, `/review`
- `cockpit`: `/lab/project/[id]/cockpit`
- `board_os`: `/lab/project/[id]/board-os`

These variants are experiments. They must not replace or rewrite the control routes during exploration.

## Branch and Worktree Map

Use this topology:

- `control`: current workspace/branch
- `codex/mb-variant-base`: shared extraction branch
- `codex/mb-option-2-cockpit`: Option 2 branch, worktree `../meeseeks-box-opt2`
- `codex/mb-option-3-board-os`: Option 3 branch, worktree `../meeseeks-box-opt3`

Fixed ports:

- control: `3001`
- opt2: `3002`
- opt3: `3003`

## Variant Briefs

### `control`

- Route focus: current `/projects/[id]`, `/work`, `/review`
- Product role: baseline and safety rail
- Distinguishing trait: existing Meeseeks Box flow with project context, plan management, board, and review separated into current production-style surfaces
- What we are learning: what the current product already does well, where it creates too many hops, and which improvements should be preserved no matter which lab shell wins

### `codex/mb-option-2-cockpit`

- Route focus: `/lab/project/[id]/cockpit`
- Product role: spec-first project workspace
- Distinguishing traits:
  - starts with intent and spec shaping
  - assistant and execution share the workspace
  - board appears after decomposition, not before
  - memory and review stay close but secondary
- What we are learning:
  - whether Meeseeks Box should feel like a project cockpit centered on `intent -> spec -> cards -> review`
  - whether a balanced assistant-plus-board shell preserves the AI-first north star better than a board-dominant shell
  - whether the board becomes clearer when it is delayed until there is something real to execute

### `codex/mb-option-3-board-os`

- Route focus: `/lab/project/[id]/board-os`
- Product role: board-dominant execution shell
- Distinguishing traits:
  - board is the primary operating surface
  - assistant is secondary support
  - plan, memory, and review support board movement rather than co-owning the screen
- What we are learning:
  - whether a board-led model materially improves execution tightness
  - whether Meeseeks Box loses too much AI-first clarity when the board becomes the driver
  - whether memory and review can stay useful without dominating the shell

### `codex/mb-variant-base`

- Product role: shared substrate, not a user-facing variant
- Distinguishing trait: owns shared primitives, experiment routing, and fixes that both lab variants should inherit
- What we are learning: which shell differences are truly variant-specific versus which improvements belong everywhere

## Ownership Rules

- The integration agent owns `codex/mb-variant-base`.
- One variant agent owns Option 2 after the base stabilizes.
- One variant agent owns Option 3 after the base stabilizes.
- A single agent must never edit both variant branches in the same session.

## Shared-Base Invariants

These are hard constraints for both variants:

- Assistant continuity remains intact. No forced thread-first handoff.
- Project and Board remain plan-first.
- Review Queue remains the canonical completion surface.
- Product-state lineage for project, spec, card, review, and memory remains the source of truth.
- Exploration must not introduce new schema or external API contracts unless a blocker is proven.

## Shared-Fix Rule

If a variant branch discovers a shared issue:

1. Stop.
2. Write the issue down in the handoff block below.
3. Route the change back to `codex/mb-variant-base`.
4. Merge or cherry-pick the base fix into both variant branches.

Do not patch shared primitives ad hoc in both variants.

## Route Map

- Control project: `/projects/[id]`
- Control board: `/work?projectId=[id]`
- Control review: `/review`
- Lab cockpit: `/lab/project/[id]/cockpit`
- Lab board OS: `/lab/project/[id]/board-os`

## File Boundaries

- Shared data/model or reusable shell primitives belong in `lib/experiments/*` and `components/experiments/*`.
- Variant pages belong only under `app/lab/project/[id]/*`.
- Control routes should remain functionally unchanged during exploration.

## Required Handoff Block

Every agent working on the exploration should leave a short handoff in their task summary with:

- current branch/worktree
- current route under test
- known drift from base
- blocked decisions
- latest scenario results from `planning/experiments/shell-variant-scenarios.md`

## Response Preference

After substantial implementation work, end with a compact summary using these headings:

- Completed
- Remaining
- Verification
- Blockers

Keep it brief and concrete. Prefer this format over long narrative recaps.

## Anti-Patterns

Do not:

- scatter giant `if (variant)` conditionals through control routes
- create separate data models per variant
- create extra comparison docs beyond the canonical scenario file
- optimize for board tightness by hiding memory or bypassing Review Queue

## Success Condition

The exploration succeeds when both lab routes are real enough to dogfood against the same scenario pack, and the winner can be chosen without re-litigating the product-state model.
