# Functional Design Document

- Artifact: FDD
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-004`
- Status: draft
- Approval Status: draft
- Last Updated: `2026-03-19`
- Source Inputs: `meeseeks-box-plan-draft-v3.md`, `planning/plan-v3-review-feedback.md`, `requirements/index.md`

## Problem Statement and Context

Meeseek Box sits on the least stable boundary in the system: the OpenClaw runtime. The product must support typed approvals, broader Inbox derivation, conservative gating for runtime-sensitive actions, and Slack fallback alerts without drifting away from the `iron-claw-mini` security posture.

## Goals

- Surface approval-needed and other supported high-signal states in a typed, operator-usable way.
- Apply conservative approval gating to runtime and filesystem writes.
- Support Slack fallback alerts for only the narrow highest-signal conditions while keeping the app primary.

## Functional Requirements

| Requirement ID | Requirement | Priority | Notes |
| --- | --- | --- | --- |
| `REQ-001` | The system shall derive Inbox state from typed approvals, failures, blocked work, missed schedules, and explicit memory-review prompts, while preserving linked context and resolution behavior. | High | Typed approval, failure, schedule, and review coverage |
| `REQ-002` | The system shall require approval for runtime or filesystem writes unless explicitly allowlisted. | High | Conservative default aligned with security model |
| `REQ-003` | The system shall send Slack fallback alerts only for configured high-signal conditions while keeping the app primary. | High | Fallback, not primary |
