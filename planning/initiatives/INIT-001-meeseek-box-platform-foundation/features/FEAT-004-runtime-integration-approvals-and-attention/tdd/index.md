# Technical Design Document

## 1. Document Control

- Feature / Initiative: `FEAT-004 Runtime Integration, Approvals, and Attention` / `INIT-001 Meeseek Box Platform Foundation`
- Author: Codex
- Date: `2026-03-19`
- Status: `draft`
- Source FDD: `../fdd.md`

## 2. Context and Inputs

This design covers the least stable and most security-sensitive boundary in the product: the shared OpenClaw adapter's approval-facing behavior, typed approvals, broader Inbox derivation, conservative approval gates, and Slack fallback attention.

The driving requirements are:
- `REQ-001` Inbox derivation and typed approval events create correct attention state and resolution paths
- `REQ-002` runtime or filesystem writes require approval unless explicitly allowlisted
- `REQ-003` Slack fallback alerts appear only for narrow high-signal conditions

## 3. Technical Goals

- Standardize approval events into typed Inbox items that preserve resolution context and linked work/run state.
- Derive Inbox items from approvals, failures, blocked work, missed schedules, and explicit memory-review prompts.
- Introduce a conservative approval classifier that defaults unknown or state-mutating actions to approval-required.
- Add a fallback alert pipeline that emits Slack notifications only for configured high-signal conditions.

## 4. Architecture Overview

`FEAT-004` extends the product-state spine with a security-sensitive attention layer:
- the shared `OpenClaw Integration Adapter` provides approval-facing envelopes and runtime callbacks
- an approval classifier tags actions as `allowlisted_metadata`, `approval_required`, or `rejected`
- an Inbox service creates typed attention items linked to runs and work items
- an approval resolution service applies operator decisions and emits audit/state events
- a fallback notifier sends Slack alerts for configured categories such as approval-required states, no-retry failures, and high-signal missed schedules

## 5. Interfaces, APIs, Events, and Contracts

Key contracts:
- `ApprovalEnvelope`
- Inbox derivation rules from `approval_requested`, no-retry failure, blocked work, missed schedule, and explicit memory-review prompt
- approval resolution API
- narrow Slack fallback category routing

## 6. Security and Authorization

- unknown or ambiguous actions fail closed into approval-required behavior
- runtime or filesystem writes are high-risk by default unless explicitly allowlisted as metadata-only
- Slack alerts contain minimum high-signal context; sensitive detail stays in the app
- approval resolution remains bound to the single trusted operator model

## 7. Test Strategy

- unit tests for classification, timeout policy, and fallback routing
- contract tests for approval envelopes and typed resolution payloads
- integration tests for Inbox derivation and resolution updates
- Playwright for the Inbox approval path only
- manual runtime and Slack smoke for behaviors automation cannot safely prove

## 8. Traceability Matrix

| Requirement ID | Technical Coverage | Planned Tests |
| --- | --- | --- |
| `REQ-001` | approval envelopes, Inbox derivation, resolution service | contract: typed fixtures; integration: derivation + resolve flow; Playwright: Inbox flow |
| `REQ-002` | approval classifier, allowlist config, fail-closed policy | unit: classification rules; integration: ambiguous action requires approval |
| `REQ-003` | fallback notifier, delivery log, narrow category routing | unit/integration: routing logic; manual: Slack delivery smoke |
