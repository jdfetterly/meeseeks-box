# Requirements Index

- Artifact: Requirements Index
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-001`
- Status: `draft`
- Last Updated: `2026-03-19`
- Source Inputs:
  - `meeseeks-box-plan-draft-v3.md`
  - `planning/plan-v3-review-feedback.md`

## Requirements

| Requirement ID | Title | Status | Priority | Notes |
| --- | --- | --- | --- | --- |
| `REQ-001` | Shared conversations, work items, and runs persist canonically across devices | draft | High | Replaces browser-local truth for core state |
| `REQ-002` | Normalized event ingestion drives derived product state consistently | draft | High | Inbox, board, runs, memory, and schedules depend on this |
| `REQ-003` | The test harness supports fake runtime, temp storage, and deterministic time | draft | High | Required to keep automation integration-heavy and right-sized |
| `REQ-004` | Canonical-state cutover and event normalization are gated by real discovery outputs | draft | High | Uses Claw-Tower audit and real OpenClaw fixtures before contracts harden |
