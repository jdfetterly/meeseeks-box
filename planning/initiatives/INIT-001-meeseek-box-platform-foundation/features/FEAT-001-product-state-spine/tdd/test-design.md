# Test Design

- Artifact: TDD Test Design
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-001`
- Last Updated: `2026-03-19`

## Strategy

Use a layered strategy with the heaviest emphasis on service integration and contract coverage, but do not finalize event contracts until real OpenClaw fixtures are captured through the discovery gate.

## Planned Coverage

| Requirement ID | Test Level | What Will Be Verified |
| --- | --- | --- |
| `REQ-001` | Integration | Shared conversation, work item, and run state persists and is readable across simulated device contexts |
| `REQ-002` | Unit + Contract + Integration | Raw events normalize correctly and update Inbox, board state, and run timelines consistently |
| `REQ-003` | Integration | Fake OpenClaw adapter, temp SQLite DB, temp artifact store, temp memory workspace, and deterministic clock support reliable repeatable tests |
| `REQ-004` | Discovery + Contract | Real OpenClaw outputs become golden fixtures before event normalization contracts are finalized |

## Tooling and Data Notes

- Use an ephemeral SQLite database per test run
- Use temp directories for artifacts and memory workspace
- Maintain a fixture library for raw runtime events and normalized events
- Seed the fixture library from real OpenClaw captures, not invented payloads
- Provide deterministic time helpers for staleness, scheduling, and event ordering tests

## Required Harnesses

- fake shared `OpenClaw Integration Adapter` implementing events, approvals, and workspace bridges
- runtime event fixture library
- seeded SQLite helpers
- temp workspace filesystem helpers
- deterministic clock/time helpers

## Explicit Non-Coverage

- No broad page composition tests
- No real Tailnet/runtime dependency in automated tests
