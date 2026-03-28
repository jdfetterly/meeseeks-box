# Initiative

- Artifact: Initiative
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Initiative Name: `Meeseek Box Platform Foundation`
- Status: `active`
- Last Updated: `2026-03-19`
- Owner: `JD`

## Objective

Establish the first shippable foundation for Meeseek Box as an operator-facing command center over the OpenClaw runtime, including the app shell, discovery gate, shared product state, work organization, governed memory/artifact handling, runtime-aware approvals, and a right-sized test strategy.

## Scope Summary

- In scope:
  - app shell, navigation, responsive layout, and fresh-start cutover
  - explicit discovery milestone for Claw-Tower and OpenClaw behavior
  - product-state spine
  - work board and launch flows
  - memory and artifact governance
  - runtime integration, approvals, and attention model
  - feature-level and initiative-level testing strategy from unit through UI/manual validation
- Out of scope:
  - native mobile apps
  - public deployment
  - multi-user collaboration
  - full runtime/admin replacement

## Shared Constraints

- Must align with `iron-claw-mini`
- OpenClaw remains the execution substrate
- Testing should be integration-heavy and adapter-aware
- UI automation should stay focused on golden paths
- Real-runtime validation should be deliberately small and manual

## Feature Inventory

| Feature ID | Name | Status | Notes |
| --- | --- | --- | --- |
| `FEAT-000` | App Shell, Navigation, and Fresh-Start Cutover | draft | Routing, responsive patterns, drawers, browser-local cutover, viewport profiles |
| `FEAT-001` | Product State Spine | draft | Shared state, event ingestion, persistence, harnesses, discovery-backed adapter contracts |
| `FEAT-002` | Work Board and Launch Flows | draft | Launch, board, chat escalation, one-shot scheduling, schedule-health visibility |
| `FEAT-003` | Memory and Artifact Governance | draft | Memory provenance, write-through, archive/supersede, artifact versioning |
| `FEAT-004` | Runtime Integration, Approvals, and Attention | draft | Shared adapter contracts, approval tiers, Inbox derivation, Slack fallback |

## Discovery Gate

Before implementation begins on OpenClaw-dependent behavior, the initiative must produce:
- Claw-Tower audit for browser-local state, routing, and shell entrypoints
- real OpenClaw fixtures for run completion, tool failure, and schedule trigger
- approval capability check for native block/resume versus wrapper mediation
- one-shot scheduling capability check
- runtime workspace inspection for writable memory path candidates

These outputs live in `discovery-gate.md` and feed the fixture library plus adapter contracts.

## Shared Contracts

This initiative uses one shared `OpenClaw Integration Adapter` subsystem with three contract surfaces:
- `EventSource`
- `ApprovalBridge`
- `WorkspaceBridge`

Shared types and defaults live in `shared-contracts.md`, including:
- `AppShellContract`
- `ViewportProfile`
- `OpenClawIntegrationAdapter`
- `ApprovalEnvelope`
- `InboxDerivationRule`
- `OneShotScheduleSource`
- `ArtifactFamilyKey`
- `ManualSmokeChecklist`

## Shared Testing Strategy

Use a right-sized five-layer testing strategy across the initiative:
- Unit tests for pure logic only
- Contract tests for unstable adapter boundaries
- Service integration tests as the main automated confidence layer
- Small Playwright suite for golden-path browser journeys
- Short manual real-runtime smoke validation for device/runtime-sensitive flows

Coverage intent for v1:
- `25%` unit
- `45%` integration + contract
- `20%` browser E2E/UI validation
- `10%` manual runtime/device smoke

Shared additions:
- 2-3 cross-feature service integration tests that validate launch, artifact, approval, memory, and inbox flow together
- one shared Playwright viewport profile for desktop and one for iPhone
- short manual smoke checklists stored in initiative delivery artifacts

## PR Gate and Release Validation

PR gate:
- unit tests
- contract tests
- service integration tests
- 1-2 smoke Playwright journeys

Manual pre-release validation:
- full Playwright suite
- iPhone browser over Tailnet
- MacBook browser smoke
- Slack fallback validation
- real or near-real OpenClaw runtime smoke

## Source Inputs

- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/meeseeks-box-plan-draft-v3.md`
- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/planning/plan-v3-review-feedback.md`
- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/legacy/meeseeks-box-plan-draft-v2.md`
- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/legacy/plan-v2-change-summary.md`
- `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/legacy/initialization/docs/`
