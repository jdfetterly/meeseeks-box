# Feature

- Artifact: Feature
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Feature Name: `Intent-Outcome Control Plane and Surface Redesign`
- Status: `draft`
- Last Updated: `2026-03-26`
- Owner: `JD`

## Objective

Turn Meeseek Box into a clearer intent-to-outcome product by making Assistant the active work surface, preserving canonical Inbox and Review Queue ownership, strengthening unfinished-work detection, and reshaping Briefing, Project, Board, Schedules, and mobile behavior around that model.

## Scope Summary

- In scope:
  - Rev-A functional spec as the active product contract
  - Assistant vs Conversations interaction model
  - Briefing surfacing rules and canonical queue separation
  - candidate unresolved state and durable open loop lifecycle
  - minimal conversation branching and lineage
  - mobile full-screen Assistant takeover
  - plan-derived execution framing for Board
  - review-queue-first completion model
  - output-first standing delegated schedules
- Out of scope:
  - mergeable conversation branches
  - multiple workspaces per project
  - fully structured plan editing UI
  - exhaustive visual redesign polish

## Requirement Inventory

| Requirement ID | Title | Status | Priority |
| --- | --- | --- | --- |
| `REQ-001` | Assistant is the active work surface and Conversations is the saved-history surface | draft | High |
| `REQ-002` | Briefing previews ranked work without replacing Inbox or Review Queue | draft | High |
| `REQ-003` | The system tracks unfinished work through candidate unresolved state and durable open loops | draft | High |
| `REQ-004` | Conversations support project grouping, actionable status, and minimal branch lineage in v1 | draft | High |
| `REQ-005` | Mobile uses full-screen Assistant takeover without thread-first drift | draft | High |
| `REQ-006` | Project and Board default to plan-first execution instead of manual setup | draft | High |
| `REQ-007` | Review Queue remains the canonical completion surface with fast follow-up generation | draft | High |
| `REQ-008` | Schedules behave as standing delegated work centered on purpose, output, and usefulness | draft | High |

## Traceability

- Functional spec: `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/planning/chat-briefs/meeseek-box-functional-spec-rev-a.md`
- Requirements index: `requirements/index.md`
- FDD: `fdd.md`
- TDD: `tdd/index.md`
- Delivery: `delivery/`
