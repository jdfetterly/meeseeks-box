# Functional Design Document

- Artifact: FDD
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-002`
- Status: draft
- Approval Status: draft
- Last Updated: `2026-03-19`
- Source Inputs: `meeseeks-box-plan-draft-v3.md`, `planning/plan-v3-review-feedback.md`, `requirements/index.md`

## Problem Statement and Context

Meeseek Box is intended to be iPhone-first and Kanban-first for active operator work, but that depends on launch flows being fast, delayed work being visible, one-shot scheduling behavior being explicit, and chat being able to create tracked work cleanly.

## Goals

- Make saved-preset launching fast and reliable.
- Support one-shot delayed work visibly and consistently.
- Label one-shot work by source (`runtime-native` or `product-managed`).
- Surface minimum schedule-health state alongside scheduled work.
- Turn chat into tracked work without losing linkage.

## Functional Requirements

| Requirement ID | Requirement | Priority | Notes |
| --- | --- | --- | --- |
| `REQ-001` | The system shall allow the operator to launch work from a saved preset and create tracked work with the expected defaults. | High | Includes immediate or delayed launch paths |
| `REQ-002` | The system shall support one-shot scheduled launches and surface them consistently in Work and Schedules with source labels and minimum schedule-health state. | High | Distinct from recurring schedules |
| `REQ-003` | The system shall allow chat threads to be escalated into tracked work while preserving conversation linkage. | High | Chat is a front door, not a dead end |
