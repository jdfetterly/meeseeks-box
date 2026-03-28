# Shell Variant Scenarios and Scorecard

Use this as the only canonical comparison checklist for the shell exploration.

## Variants

- `control`
- `cockpit`
- `board_os`

## Shared Test Setup

- Use the same seeded data set for all three variants.
- Run each variant from its own cwd/worktree and fixed port.
- Record results on desktop first.
- Only note mobile findings after the desktop scenario passes.

## Scenario Pack

### 1. New Project From Ambiguous Intent

Prompt:

> I want to plan and build a new feature, but I only know the rough goal.

Check:

- Assistant opens with visible project context or makes the ambiguity explicit.
- The shell makes the next move obvious in one step.
- A current plan or equivalent planning artifact becomes visible.

### 2. Existing Project With Ready Workspace

Prompt:

> Move this project forward and turn the current plan into executable work.

Check:

- Plan context is visible before advanced setup.
- Board makes plan-derived execution legible.
- The route to first executable card is short and obvious.

### 3. Active Card Zoom

Action:

- Select a delegated card from the board.

Check:

- The shell transitions into a deeper execution surface without navigation confusion.
- The card retains plan context and conversation linkage.
- The user can adjust the work from the same shell.

### 4. Review Completion

Action:

- Open a project with pending review output.

Check:

- The shell previews review work without replacing Review Queue.
- The canonical route to `/review` remains obvious.
- The work-to-review lineage is legible.

### 5. Review Rejection and Follow-Up

Action:

- Reject review-ready work and request changes.

Check:

- The user does not need to restate original context.
- Follow-up generation path is obvious.
- The shell still respects Review Queue ownership.

### 6. Persistent Memory Reuse

Action:

- Revisit a project with existing playbook, decisions, and learning suggestions.

Check:

- Memory context is visible without a separate hunt.
- The shell helps the user understand why the work exists, not just what is running.
- Assistant prompts clearly inherit that context.

### 7. Standing Delegated Work

Prompt:

> Set up a recurring delegated outcome for this project.

Check:

- The shell still works for standing work, not just coding cards.
- Workspace gating and purpose/output expectations remain clear.
- The shell does not collapse into a pure coding-work board.

## Scorecard

Score each variant from 1-5 on the following dimensions:

- Time from intent to first executable card
- Number of navigation/context switches
- Clarity of “what matters next”
- Visibility and usefulness of persistent memory
- Tightness of execution-to-review loop
- Fit for non-code and standing delegated work
- Desktop quality
- Mobile survivability
- Assistant continuity
- Plan-first board behavior
- Review Queue ownership

## Decision Rule

- `board_os` only wins if it materially improves execution tightness without materially harming Assistant continuity, memory visibility, or Review Queue ownership.
- If the result is close, choose `cockpit`.

## Result Template

Copy this block when recording a run:

```md
### Variant: [control|cockpit|board_os]
- Branch/worktree:
- Route:
- Scenario:
- What felt fast:
- What felt confusing:
- Memory quality:
- Review quality:
- Non-code/standing work quality:
- Score summary:
- Recommendation from this run:
```
