# Discovery Outputs

This folder holds the concrete outputs required by the initiative discovery gate.

Expected files:
- `claw-tower-audit.md`
- `openclaw-event-fixtures.md`
- `approval-capability-check.md`
- `one-shot-scheduling-check.md`
- `runtime-workspace-inspection.md`
- `decision-log.md`

## Working Rules

- Discovery outputs are evidence-backed working documents, not loose notes.
- Each file should record:
  - source repo, command, or observation path
  - exact files, payloads, or screenshots used as evidence
  - concrete findings
  - decisions or recommended defaults
  - downstream planning artifacts that must be updated
- If a question cannot be answered yet, record the blocker explicitly rather than leaving a silent gap.

## Promotion Rules

Once a discovery answer is stable, propagate it into:
- `../shared-contracts.md` for shared type or behavior decisions
- `../delivery/shared-test-cases.md` when the finding affects cross-feature validation
- feature `requirements/`, `fdd.md`, `tdd/index.md`, and `delivery/tasks-active.md` where implementation assumptions change
- fixture libraries or test assets once code work begins

## Completion Standard

Discovery is complete only when:
- each required output has evidence-backed findings
- the decision log records the current chosen path
- downstream blocked tasks can cite a discovery artifact instead of an assumption
