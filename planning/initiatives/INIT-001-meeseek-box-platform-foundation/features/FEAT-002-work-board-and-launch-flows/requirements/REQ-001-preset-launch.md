# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-002`
- Requirement ID: `REQ-001`
- Title: Launching work from a saved preset creates tracked work with expected defaults
- Status: draft
- Priority: High
- Last Updated: `2026-03-18`
- Source: `meeseeks-box-plan-draft-v3.md`

## Problem / User Need

The operator needs a fast mobile-first way to start common work without re-entering the same launch configuration repeatedly.

## Requirement Statement

The system shall allow the operator to launch work from a saved preset and create the corresponding work item and run using the preset's default scope, agent, timing, and output settings.

## Actor

- Primary actor: operator
- Supporting actors: launch flow, preset system

## Trigger

The operator taps a saved preset from Home or Launch.

## Preconditions

- A saved preset exists.

## Expected Behavior

1. The operator selects a saved preset.
2. The system applies the preset defaults.
3. The system creates a work item and run or one-shot scheduled item as appropriate.

## Edge Cases

- The operator edits the launch before submitting.
- The preset references a no-longer-valid default value and needs correction.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given a saved preset, when the operator launches it, then a work item and run are created with the expected defaults. |
| AC-002 | Given a preset configured for delayed launch, when the operator confirms it, then the resulting item is created as a scheduled work item rather than an immediate run. |

## Dependencies

- Shared product-state layer
- saved preset storage

## Open Questions

- None at the functional level.

## Traceability

- Feature: `../feature.md`
- FDD: `../fdd.md`
- TDD: `../tdd/index.md`
- Tasks: `../delivery/tasks-active.md`
- Tests: `../delivery/test-cases-active.md`
- Bugs: `../delivery/bugs-open.md`
