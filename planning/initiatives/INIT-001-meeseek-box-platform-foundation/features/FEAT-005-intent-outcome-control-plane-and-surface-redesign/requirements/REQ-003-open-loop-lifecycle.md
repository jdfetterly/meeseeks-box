# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Requirement ID: `REQ-003`
- Title: The system tracks unfinished work through candidate unresolved state and durable open loops
- Status: draft
- Priority: High
- Last Updated: `2026-03-26`
- Source: `meeseek-box-functional-spec-rev-a.md`

## Requirement Statement

The system shall identify unfinished work before the user manually catalogs it, using candidate unresolved state for immediate detection and durable open loops for persisted blocking or user-owned follow-up.

## Expected Behavior

1. Assistant or product state detects unresolved work.
2. The product creates candidate unresolved state inline.
3. The state either resolves quickly or promotes to a durable open loop when blocking, persistent, or user-owned.
4. The loop escalates and resolves according to documented rules.

## Edge Cases

- The work is waiting on agent progress and should not become a durable loop.
- An unconfirmed proposal blocks forward progress.
- Review rejection should create durable follow-up context immediately.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given an unconfirmed proposal, missing user answer, promised follow-up, unresolved decision, revisit-later reminder, or plan-card mismatch, when the condition appears, then the system creates candidate unresolved state without requiring manual user bookkeeping. |
| AC-002 | Given a blocking, persistent, or user-owned unresolved state, when promotion rules are met, then a durable open loop is created with owner, waiting-on, blocking, escalation, and linked-object context. |
| AC-003 | Given a resolved proposal, follow-up creation, linked object completion, or superseding branch, when the underlying condition clears, then the candidate or durable loop resolves predictably and no longer pollutes Briefing. |
