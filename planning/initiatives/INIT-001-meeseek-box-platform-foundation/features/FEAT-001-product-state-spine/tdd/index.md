# Technical Design Document

## 1. Document Control

- Feature / Initiative: `FEAT-001 Product State Spine` / `INIT-001 Meeseek Box Platform Foundation`
- Author: Codex
- Date: `2026-03-19`
- Status: `draft`
- Source FDD: `../fdd.md`

## 2. Context and Inputs

This design implements the canonical shared state, normalized event ingestion, shared adapter contract, and shared test harness foundation that every later feature depends on. The driving requirements are:
- `REQ-001` shared canonical state for conversations, work items, and runs
- `REQ-002` normalized event ingestion as the source for derived state
- `REQ-003` shared harnesses for integration-heavy validation
- `REQ-004` discovery-backed cutover readiness and real fixture capture

## 3. Technical Goals

- Provide one server-backed product-state service that owns canonical IDs, persistence, and linkage for core objects.
- Introduce a normalized event pipeline that converts raw runtime and product signals into durable `RunEvent` records plus derived state updates.
- Centralize runtime integration behind one shared `OpenClaw Integration Adapter` subsystem.
- Provide deterministic harnesses for DB, filesystem, time, and fake runtime integration so downstream features can be tested through service boundaries.

## 4. Architecture Overview

`FEAT-001` introduces the shared backend spine for the app:
- a `product-state API` that owns canonical create/read/update operations
- a relational `state store` backed by SQLite with JSON payload columns where event variance requires flexibility
- one shared `OpenClaw Integration Adapter` subsystem with `EventSource`, `ApprovalBridge`, and `WorkspaceBridge` surfaces
- an `event ingestion service` that accepts raw adapter events and product events, normalizes them, persists them, and updates projections
- a small set of `projection updaters` that keep read models for runs, work summaries, inbox state, and schedule health in sync
- a reusable `test harness package` that provisions temp DBs, temp artifact/memory paths, fake adapters, and deterministic clocks

## 5. Interfaces, APIs, Events, and Contracts

Key interfaces:
- canonical APIs for conversation, work item, and run create/read flows
- `POST /api/events/ingest` for raw event envelopes
- `OpenClawIntegrationAdapter` with `EventSource`, `ApprovalBridge`, and `WorkspaceBridge`
- normalized event contract with idempotency via `(source, sequence_key)`
- fixture library seeded from real OpenClaw captures before production normalization is finalized

## 6. Migration, Backfill, or Rollout Strategy

- canonical cutover depends on `FEAT-000` fresh-start shell work
- no automatic browser-local import is assumed in v1
- event normalization rules harden only after discovery captures real OpenClaw payloads
- rollout uses feature flags for product-state APIs, event ingest, read models, and adapter enablement

## 7. Test Strategy

- unit tests for event precedence, idempotency, and reducers
- contract tests for raw adapter payload -> normalized event fixtures
- integration tests for shared create/read/update state plus projection convergence
- discovery-backed contract validation for real OpenClaw captures
- harness tests for deterministic DB/filesystem/clock/fake adapter setup

## 8. Traceability Matrix

| Requirement ID | Technical Coverage | Planned Tests |
| --- | --- | --- |
| `REQ-001` | canonical schema, repositories, APIs, object links | integration: shared object visibility across device contexts |
| `REQ-002` | normalized events, idempotency, projections | contract: raw -> normalized fixtures; integration: derived state consistency |
| `REQ-003` | shared test harness, fake shared adapter, deterministic clock | harness self-tests and integration smoke |
| `REQ-004` | discovery gate, real fixture capture, cutover dependency on `FEAT-000` | discovery review and fixture validation |
