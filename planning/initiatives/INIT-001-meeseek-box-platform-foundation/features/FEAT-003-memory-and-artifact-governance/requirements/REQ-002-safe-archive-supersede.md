# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-003`
- Requirement ID: `REQ-002`
- Title: Archive and supersede flows are explicit and do not imply unsupported source deletion
- Status: draft
- Priority: High
- Last Updated: `2026-03-18`
- Source: `meeseeks-box-plan-draft-v3.md`

## Problem / User Need

The operator needs to manage stale or replaced memory safely without the app implying that metadata-level actions deleted the underlying runtime source content.

## Requirement Statement

The system shall provide archive and supersede flows for governed memory and distinguish those actions clearly from source deletion unless the source is adapter-owned and safely deletable.

## Actor

- Primary actor: operator
- Supporting actors: memory UI, memory adapter

## Trigger

The operator archives or supersedes an existing memory entry.

## Preconditions

- The target memory entry exists.

## Expected Behavior

1. The operator chooses archive or supersede.
2. The system updates metadata and linkage accordingly.
3. The system does not imply source deletion unless the underlying source supports it safely.

## Edge Cases

- The archived entry still has historical provenance value.
- The operator replaces an entry with a newer entry rather than removing it.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given a memory archive action, when it completes, then the entry is hidden from default active views while preserving provenance. |
| AC-002 | Given a supersede action, when it completes, then the old and new entries remain linked without implying the original source was deleted. |

## Dependencies

- memory metadata model
- memory UI

## Open Questions

- Which specific source types, if any, will support safe hard delete in v1?

## Traceability

- Feature: `../feature.md`
- FDD: `../fdd.md`
- TDD: `../tdd/index.md`
- Tasks: `../delivery/tasks-active.md`
- Tests: `../delivery/test-cases-active.md`
- Bugs: `../delivery/bugs-open.md`
