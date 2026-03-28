# Implementation Task Plan

## 1. Planning Context

- Feature / Initiative: Meeseek Box lightweight spec-driven delivery
- Source TDD: [lightweight-spec-driven-delivery-tdd.md](/Users/jdfetterly/Documents/projects-folder/meeseeks-box/planning/lightweight-spec-driven-delivery-tdd.md)
- Planning Date: 2026-03-24
- Assumptions:
  - Existing project, workspace, board, review queue, and chat panel infrastructure remain in place.
  - The first delivery slice should cover spec creation, decomposition, board lineage, and review lineage.
  - Formal-design escalation can be deferred behind lightweight spec v1.

## 2. Delivery Strategy

Implement this in six slices:

1. Product-state foundations for specs and spec-card lineage
2. Spec service contracts and API routes
3. Chat-panel proposal support for spec creation and decomposition
4. Project UI for spec inventory and detail
5. Board and review lineage rendering
6. Verification and rollout cleanup

This order keeps storage and contracts stable before UI depends on them, and it allows the existing project/workspace model to remain intact while the planning layer is added.

## 3. Dependency and Sequencing Notes

- Schema and repository work must land before APIs and UI.
- Spec readiness rules must land before decomposition endpoints.
- Decomposition contracts must land before board and review try to render spec lineage.
- Review linkage depends on either a link table or a denormalized parent spec reference being available.
- Manual QA should happen only after project detail, chat, board, and review have all been wired.

## 4. Task Inventory

| Task ID | Title | Objective | Depends On | TDD References | Planned Touchpoints | Acceptance Criteria | Verification | Suggested PR Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-001 | Add spec product-state schema | Introduce canonical storage for specs and spec-card links. | None | Sections 7, 8, 13; FR-001, FR-008 | `lib/product-state/entities.ts`, `lib/product-state/db.ts`, `lib/product-state/repositories.ts` | New tables and entities exist, migrations apply cleanly, repositories support CRUD/listing for specs and links. | `npx tsc --noEmit`; repository tests for create/list/get/update | Schema + repository foundation |
| TASK-002 | Implement spec service layer | Add readiness rules, execution-mode gating, decomposition validation, and card-promotion orchestration. | TASK-001 | Sections 5, 7, 9, 10; FR-003, FR-004, FR-005, FR-006, FR-008, FR-010 | `lib/specs/service.ts`, `lib/projects/service.ts`, related tests | Service can determine whether a spec is decomposable, enforce workspace gating, and normalize decomposition output into work item creation commands. | Unit tests for readiness, split rules, and workspace-required failures | Service logic boundary |
| TASK-003 | Add spec APIs | Expose spec CRUD, decomposition, and follow-up interfaces for UI and chat. | TASK-001, TASK-002 | Sections 9, 10, 13; FR-001, FR-004, FR-014 | `app/api/product-state/specs/route.ts`, `app/api/product-state/specs/[id]/route.ts`, `app/api/product-state/specs/[id]/decompose/route.ts`, optional follow-up route, API tests | APIs return structured success and failure responses, including ambiguity and workspace-required errors. | API route tests with temp state dir | Backend contracts |
| TASK-004 | Extend chat panel for spec proposals | Support `spec`, `spec_decomposition`, and follow-up proposal kinds in the AI control plane. | TASK-003 | Sections 7, 9, 10; FR-002, FR-004, FR-013, FR-014 | `components/chat-panel/ChatPanelProvider.tsx`, supporting UI helpers | Chat can draft a spec, confirm it, request decomposition, and surface split reasons before card creation. | Targeted UI logic tests/manual QA | Chat planning flow |
| TASK-005 | Add project spec UI surfaces | Render specs in project detail and allow operators to create, inspect, and advance specs. | TASK-003 | Sections 5, 7, 10; FR-001, FR-002, FR-003, FR-010 | `app/projects/[id]/page.tsx`, new `components/projects/*Spec*` components | Project detail shows spec inventory, spec status, readiness, and actions to refine or decompose a spec. | Manual QA; component/integration tests where practical | Project page planning UI |
| TASK-006 | Add board lineage and spec-aware cards | Surface parent spec metadata and execution readiness context on board cards. | TASK-002, TASK-005 | Sections 7, 10; FR-006, FR-008, FR-010 | `lib/work-board/service.ts`, `app/work/page.tsx`, card detail components | Cards created from specs show parent spec context and preserve existing board behavior for older cards. | Board service tests; manual QA | Board integration |
| TASK-007 | Add review lineage and follow-up actions | Show spec-linked acceptance criteria in Review Queue and enable follow-up creation from rejected work. | TASK-002, TASK-003 | Sections 9, 10; FR-007, FR-009, FR-014 | `lib/review-queue/service.ts`, `app/review/page.tsx`, review actions/API wiring | Review entries expose parent spec and card acceptance criteria, and rejection can generate follow-up proposals. | Review service tests; manual QA | Review loop integration |
| TASK-008 | Add observability and operational safeguards | Log spec lifecycle events, decomposition failures, and review outcomes tied to spec lineage. | TASK-002, TASK-003 | Sections 12, 15; FR-004, FR-005, FR-009 | logging/metrics touchpoints in service and API layers, existing observability helpers | Structured lifecycle logging exists for create/update/decompose/review paths and failure modes are diagnosable. | Service/API tests plus log inspection during manual QA | Observability slice |
| TASK-009 | Final verification and rollout prep | Validate the full project -> spec -> card -> review flow and document any rollout caveats. | TASK-001 through TASK-008 | Sections 13, 14, 15; FR-001 through FR-010 | test docs, manual QA checklist, optional demo data updates | End-to-end flow works for existing-repo and planning-only projects, and fallback behavior for non-spec cards remains intact. | `npx tsc --noEmit`; focused Vitest suite; manual browser QA | Release readiness |

## 5. Verification Matrix

| TDD Area / Requirement | Implementing Tasks | Verification Coverage |
| --- | --- | --- |
| Spec storage and lifecycle (`FR-001`, `FR-003`) | TASK-001, TASK-002, TASK-003 | Repository tests, service unit tests, API tests |
| Chat-first planning (`FR-002`) | TASK-004, TASK-005 | Chat/manual QA, component integration |
| Decomposition and split rules (`FR-004`, `FR-008`, `FR-013`) | TASK-002, TASK-003, TASK-004 | Service unit tests, API tests, manual QA |
| Workspace gating (`FR-005`, `FR-010`) | TASK-002, TASK-003, TASK-005 | Service tests, API tests, project flow manual QA |
| Executable card contract (`FR-006`) | TASK-002, TASK-006 | Service tests, board tests |
| Acceptance and review lineage (`FR-007`, `FR-009`, `FR-014`) | TASK-007 | Review service tests, manual QA |
| Non-code path (`FR-011`) | TASK-002, TASK-003, TASK-009 | Service/API tests and manual QA |
| Observability / rollout safety | TASK-008, TASK-009 | Log inspection, release checklist |

## 6. Open Questions and Blockers

- Should decomposition proposals be persisted as drafts or remain transient until confirmation?
- Should spec lineage on review items be derived dynamically or denormalized at write time?
- How much v1 UI is needed for spec drill-down beyond project detail and chat?
- Is follow-up generation from review better as a direct action or always via chat proposal?

## 7. Notes for Execution

- Keep the first implementation slice lightweight and product-native; do not pull in the full `agent-workflow` artifact model.
- Maintain compatibility for legacy cards that have no parent spec.
- Keep proposal-confirm flows consistent with the rest of the AI-forward control plane.
- Treat manual QA across project detail, chat panel, board, and review as mandatory before calling the feature complete.

## Summary

The delivery strategy is to add spec storage and orchestration first, then layer in chat, project UI, board lineage, and review lineage in that order. This preserves the current product architecture while adding the missing lightweight planning layer that can produce the right cards at the right level.

## Unresolved Blockers

- No hard blockers yet, but proposal persistence and review-lineage storage need early decisions because they affect API and schema shape.
