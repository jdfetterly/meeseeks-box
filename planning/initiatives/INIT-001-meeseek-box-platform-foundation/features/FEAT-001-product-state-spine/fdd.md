# Functional Design Document

- Artifact: FDD
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-001`
- Status: draft
- Approval Status: draft
- Last Updated: `2026-03-19`
- Source Inputs: `meeseeks-box-plan-draft-v3.md`, `planning/plan-v3-review-feedback.md`, `requirements/index.md`

## Problem Statement and Context

Meeseek Box cannot function as a shared command center while core conversations, work items, and board state remain browser-local and while derivative product surfaces depend on inconsistent event interpretations. The product needs one canonical product-state layer, one canonical event model, one shared adapter boundary, and discovery-backed fixtures before normalization hardens.

## Goals

- Replace browser-local truth for conversations, work items, and runs.
- Normalize raw events into one canonical event model.
- Define one shared `OpenClaw Integration Adapter` boundary for downstream features.
- Provide the harnesses and discovery outputs needed to validate the product without overreliance on the real runtime.

## Functional Requirements

| Requirement ID | Requirement | Priority | Notes |
| --- | --- | --- | --- |
| `REQ-001` | The system shall persist conversations, work items, and runs as canonical shared objects across clients. | High | Replaces browser-local truth |
| `REQ-002` | The system shall normalize runtime and product events into one canonical event model used for derived state. | High | Drives Inbox, timelines, board state, and summaries |
| `REQ-003` | The system shall provide test harness support for isolated integration-heavy validation. | High | Enables right-sized automation strategy |
| `REQ-004` | The system shall gate canonical-state cutover and event normalization on real discovery outputs and shared adapter definition. | High | Discovery is prerequisite scope, not backlog |
