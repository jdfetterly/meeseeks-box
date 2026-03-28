# Requirement

- Artifact: Requirement
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-002`
- Requirement ID: `REQ-002`
- Title: One-shot scheduled launches surface correctly in Work and Schedules
- Status: draft
- Priority: High
- Last Updated: `2026-03-19`
- Source: `meeseeks-box-plan-draft-v3.md`

## Problem / User Need

The operator needs to schedule work for later without turning every delayed launch into a recurring schedule or losing visibility into when it will run.

## Requirement Statement

The system shall support one-shot scheduled launches and surface them consistently in both the Work and Schedules views until they execute or are canceled, while explicitly labeling whether they are `runtime-native` or `product-managed`.

## Expected Behavior

1. The operator schedules a one-shot work item.
2. The system stores it as future-scheduled work.
3. The item appears in Work and Schedules with the correct scheduled time.
4. The item becomes actionable when due.
5. The item includes minimum schedule-health fields: last run outcome, last successful output time, consecutive failure count, and missed-run flag.

## Edge Cases

- The operator changes the scheduled time before execution.
- The delayed execution misses its expected run window.
- Native one-shot support is unavailable and product-managed dispatch is used instead.

## Acceptance Criteria

| AC ID | Acceptance Criterion |
| --- | --- |
| AC-001 | Given a one-shot scheduled launch, when the operator checks Work and Schedules, then the same item appears in both surfaces with the same timing metadata. |
| AC-002 | Given a one-shot scheduled launch that reaches its run window, when the system evaluates it, then the item transitions into active execution or a visible actionable state. |
| AC-003 | Given a one-shot scheduled launch, when it is rendered in Work or Schedules, then its source label and minimum schedule-health fields are visible to consumers. |
