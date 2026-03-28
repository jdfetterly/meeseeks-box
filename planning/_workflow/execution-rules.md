# Execution Rules

## Start Conditions

Before implementation work begins for a feature, read:

1. `planning/project.md`
2. the relevant feature folder
3. `feature.md`
4. `tdd/test-design.md`
5. `delivery/test-cases-active.md`
6. `delivery/bugs-open.md`

## Source of Truth

- Approved FDD is the functional source of truth.
- Approved TDD is the technical source of truth.
- Delivery files are the execution source of truth.

## Current Testing Rule

Testing work is not implied.

For each feature:
- update `tdd/test-design.md` when the strategy changes
- update `delivery/test-cases-active.md` when coverage changes or execution results appear
- update `delivery/bugs-open.md` when defects or flaky areas are discovered

## Completion Rule

Implementation is not complete until:
- code is updated
- relevant test cases are updated
- execution status is recorded
- bugs are captured when found
