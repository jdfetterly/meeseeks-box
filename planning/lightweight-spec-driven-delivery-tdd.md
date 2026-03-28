# Technical Design Document

## 1. Document Control

- Feature / Initiative: Meeseek Box lightweight spec-driven delivery
- Author: Codex
- Date: 2026-03-24
- Status: Draft
- Source FDD: [lightweight-spec-driven-delivery-fdd.md](/Users/jdfetterly/Documents/projects-folder/meeseeks-box/planning/lightweight-spec-driven-delivery-fdd.md)

## 2. Context and Inputs

The approved FDD defines a lightweight planning model where `Spec` becomes the default planning artifact between project context and execution cards. The design must satisfy:

- chat-first spec creation and refinement
- spec-to-card decomposition with explicit confirmation
- planning-only vs execution-ready card gating
- workspace-aware execution for code work
- review outputs traceable to spec and card acceptance criteria

Primary requirement coverage:

- `FR-001` through `FR-010` are in v1 scope
- `FR-011`, `FR-013`, and `FR-014` should be designed for but can be partially staged
- `FR-012` remains an extensibility hook, not a hard implementation target in the first slice

The current Meeseek Box baseline already includes:

- projects, playbooks, workspace bindings, work items, board, review queue
- persistent chat panel
- project-first board and review surfaces

The missing layer is the first-class `Spec` object plus the orchestration that turns specs into execution-ready cards at the correct level.

## 3. Technical Goals

- Add a first-class `Spec` model that fits the existing product-state architecture.
- Implement spec creation, storage, update, and decomposition without introducing heavyweight planning artifacts.
- Keep the interaction model AI-forward by using proposal-and-confirm flows through the chat panel.
- Extend board and review data so work can be traced back to parent specs and acceptance criteria.
- Preserve the current workspace model and use it as the readiness gate for code-backed execution.

## 4. Non-Goals

- Do not implement formal FDD/TDD artifact generation inside the product flow.
- Do not redesign the entire board, review queue, or project shell again.
- Do not add multi-workspace-per-project support in this slice.
- Do not add full automatic decomposition without operator confirmation.
- Do not attempt a repo-wide workflow bootstrap from `agent-workflow`.

## 5. Architecture Overview

The feature should be implemented as a new planning layer inside the existing product-state spine.

Technical shape:

1. Add `Spec` and `SpecCardLink` product-state records.
2. Add service-layer orchestration for:
   - spec creation and update
   - spec readiness evaluation
   - agent proposal generation for card decomposition
   - promotion of confirmed proposals into work items
3. Extend chat-panel proposal handling to support:
   - spec draft proposals
   - decomposition proposals
   - follow-up card proposals from review feedback
4. Extend board and review read models so cards and outputs expose parent spec lineage.
5. Extend project detail with a spec list and spec detail surface.

The design should keep the agent-facing workflow in app-level services and APIs. The LLM/chat layer proposes specs and card sets, but persistence and promotion remain controlled by app contracts.

## 6. System Boundaries and Ownership

| Component / System | Responsibility | Owner / Boundary Notes |
| --- | --- | --- |
| Product-state DB | Canonical storage for specs, spec-card links, and derived summaries | Meeseek Box-owned |
| Project service layer | Assemble project context and workspace readiness signals | Existing Meeseek Box service boundary |
| Spec service layer | Own spec lifecycle, readiness rules, and decomposition orchestration | New Meeseek Box domain service |
| Chat panel | Collect intent, show proposals, and confirm actions | Existing UI shell, extended for spec flows |
| Work item APIs and board service | Persist and render execution cards created from specs | Existing boundary, extended with parent spec linkage |
| Review queue | Display completed outputs with spec-linked acceptance context | Existing boundary, extended with spec lineage |
| Workspace model | Gate execution readiness for code-backed cards | Existing boundary, reused |

## 7. Component and Module Responsibilities

| Unit | Responsibility | Depends On |
| --- | --- | --- |
| `lib/product-state/entities.ts` | Add `SpecRecord`, `SpecStatus`, `SpecType`, `SpecCardLinkRecord` | Product-state DB |
| `lib/product-state/db.ts` | Add schema migrations for specs and links | SQLite product-state DB |
| `lib/product-state/repositories.ts` | CRUD and listing for specs, links, and status updates | Entities, DB |
| `lib/specs/service.ts` | Spec readiness, decomposition rules, proposal normalization, and card promotion | Repositories, project service |
| `app/api/product-state/specs/*` | Read/write specs and confirm decomposition proposals | Spec service |
| `components/chat-panel/ChatPanelProvider.tsx` | Add `spec_planning` and `spec_decomposition` proposals | Existing proposal framework |
| `app/projects/[id]/page.tsx` and spec UI components | Render spec inventory, detail, and next actions | Project detail, spec service |
| `lib/work-board/service.ts` | Surface parent spec metadata on cards | Work item summaries, spec links |
| `lib/review-queue/service.ts` | Include parent spec title and acceptance references | Review items, spec links |

## 8. Data Model and Storage Changes

| Change | Affected Store / Schema | Migration / Compatibility Notes |
| --- | --- | --- |
| Add `specs` table | Product-state SQLite | New table, no existing data migration required |
| Add `spec_card_links` table | Product-state SQLite | Links one spec to many work items |
| Add `parent_spec_id` column on `review_items` or derive via `spec_card_links` | Product-state SQLite | Prefer derivation if possible to avoid duplicate write paths |
| Add optional `parent_spec_id` on `work_items` or derive via link table | Product-state SQLite | Link table is cleaner if cards may be reparented later |
| Add acceptance criteria payload storage | `specs` and/or `work_items` metadata | Store normalized JSON array for card-level review use |

Recommended `SpecRecord` functional shape:

- `id`
- `projectId`
- `title`
- `intent`
- `outcome`
- `inScope`
- `outOfScope`
- `currentContext`
- `dependencies`
- `executionNotes`
- `acceptanceCriteria`
- `reviewExpectations`
- `status`: `draft` | `approved` | `superseded` | `archived`
- `executionMode`: `planning_only` | `non_code` | `workspace_required`
- `workspaceRequired`: boolean
- `createdAt`, `updatedAt`

Recommended `SpecCardLinkRecord` shape:

- `id`
- `specId`
- `workItemId`
- `decompositionReason`
- `createdAt`

Compatibility approach:

- Existing projects and cards continue working without specs.
- New spec-driven cards populate parent spec links.
- UI should gracefully handle cards with no parent spec during rollout.

## 9. Interfaces, APIs, Events, and Contracts

| Interface | Direction | Contract Summary | Error Cases |
| --- | --- | --- | --- |
| `POST /api/product-state/specs` | UI -> app | Create a spec draft or approved spec from normalized payload | Invalid project, invalid execution mode, missing required fields |
| `GET /api/product-state/specs?projectId=` | UI -> app | List specs for a project | Invalid project |
| `GET /api/product-state/specs/[id]` | UI -> app | Return full spec plus linked cards and readiness state | Spec not found |
| `POST /api/product-state/specs/[id]` | UI -> app | Update spec fields or status | Invalid transition, spec not found |
| `POST /api/product-state/specs/[id]/decompose` | UI/chat -> app | Normalize a proposed breakdown into a confirmed set of work item creation commands | Spec not approved, ambiguous criteria, workspace missing for code cards |
| `POST /api/product-state/specs/[id]/follow-up` | Review -> app | Create a follow-up proposal from rejected review context | Spec not found, missing linked review context |
| Chat proposal contract | Chat panel internal | Support `spec`, `spec_decomposition`, and `spec_follow_up` proposal kinds | Missing project context, invalid workspace readiness |

Contract rules:

- A spec cannot decompose into code-backed execution cards when `executionMode = workspace_required` and the project workspace is not `ready`.
- A decomposition proposal must include at least one decomposition reason per card.
- A work item created from a spec must have localized acceptance criteria and expected review output.

## 10. Primary Flows and Sequence Logic

### 10.1 Main Flow: Spec Creation and Decomposition

1. Operator opens project context and starts a planning conversation.
2. Chat panel gathers project, playbook, and workspace context.
3. Agent drafts a spec proposal.
4. Operator confirms the spec.
5. UI calls `POST /api/product-state/specs`.
6. Spec service persists the spec and computes readiness:
   - `workspace_required` vs `planning_only` vs `non_code`
   - whether decomposition is currently allowed
7. Operator asks to plan execution.
8. Agent proposes one or more cards from the approved spec.
9. UI confirms the decomposition proposal through `POST /api/product-state/specs/[id]/decompose`.
10. Spec service validates readiness, creates work items, records spec-card links, and returns created cards.
11. Board shows the cards with parent spec metadata.

### 10.2 Main Flow: Review and Follow-up

1. Execution agent completes a card.
2. Existing artifact/review pipeline creates or updates a review item.
3. Review queue resolves the parent spec through `spec_card_links`.
4. Review surface renders:
   - parent spec title
   - card title
   - localized acceptance criteria
   - output summary
5. Operator accepts or rejects.
6. On rejection or follow-up request, chat or review actions create a follow-up card proposal tied to the parent spec.

### 10.3 Failure / Alternate Flows

- Ambiguous spec:
  - mark as `draft`
  - block decomposition API
  - return missing-field reasons to UI
- Missing workspace for code execution:
  - decomposition API returns structured `workspace_required` error
  - UI routes user to bind/bootstrap flow
- Oversized spec:
  - decomposition proposal service returns a `split_recommended` state with suggested sub-spec grouping
- Non-code spec:
  - decomposition can proceed without workspace checks

## 11. Security, Privacy, and Authorization

- Reuse the existing app trust model; this feature does not introduce multi-user auth.
- Ensure workspace paths are not silently inferred into executable state when a project is planning-only.
- Keep proposal confirmation as a hard gate before spec persistence or card creation.
- Store only app-relevant planning context; do not capture unnecessary raw chat transcript content in spec records unless the operator confirms it.
- Follow existing product-state data handling and runtime adapter boundaries; spec planning must not bypass workspace safety rules.

## 12. Observability and Operational Readiness

| Signal Type | What to Capture | Why It Matters |
| --- | --- | --- |
| Log | Spec created, updated, approved, decomposed | Audit planning lifecycle |
| Log | Decomposition blocked due to ambiguity or missing workspace | Explain why execution could not start |
| Metric | Number of specs created per project | Measure adoption |
| Metric | Avg cards per spec | Monitor decomposition quality |
| Metric | Review rejection rate by spec/card | Identify bad sizing or poor criteria |
| Metric | Follow-up cards created from review | Measure planning quality and rework |
| Trace | Spec -> card -> review lineage | Debug end-to-end planning loop |

Operational notes:

- Preserve compatibility with existing review and board flows during rollout.
- Add structured error payloads for decomposition failures so the UI can recover cleanly.

## 13. Migration, Backfill, or Rollout Strategy

- Feature flags:
  - optional UI flag for rendering spec inventory and decomposition actions
- Migration steps:
  1. Add DB migration for specs and link table
  2. Add repository and service layer
  3. Add APIs
  4. Add UI surfaces and chat proposal support
  5. Extend board/review read models
- Backfill:
  - no mandatory backfill for old cards
  - optionally support manual “attach to spec” later
- Rollback approach:
  - UI can hide spec surfaces
  - existing cards, board, and review continue functioning without parent specs

## 14. Test Strategy

| Test Level | Coverage | Notes |
| --- | --- | --- |
| Unit | Spec readiness evaluation, sizing rules, decomposition validation | `lib/specs/service.ts` |
| Unit | Repository CRUD for specs and links | Product-state repositories |
| Integration | Spec create/update/decompose APIs | API route tests with temp DB |
| Integration | Workspace-required gating for code-backed specs | Project + workspace + spec flow |
| Integration | Review lineage lookup from card to spec | Review queue service |
| Contract | Chat proposal normalization for `spec` and `spec_decomposition` kinds | Chat panel proposal functions |
| E2E / Manual | Project -> spec -> card -> review flow in UI | Validate operator workflow |

## 15. Risks and Tradeoffs

| Risk / Tradeoff | Impact | Mitigation / Decision |
| --- | --- | --- |
| Introducing a new planning object may add perceived complexity | Medium | Keep spec lightweight and embed it in project flows, not as a heavyweight document system |
| Poor decomposition heuristics could create bad cards | High | Require confirmation and explain split reasons |
| Existing cards without specs create a mixed model during rollout | Low | Support both linked and unlinked cards |
| Review lineage may be duplicated if stored in multiple places | Medium | Prefer a single link table and derive where possible |
| Build tooling may warn on broad dynamic path usage in server code | Low | Avoid unnecessary dynamic filesystem access in UI code paths and revisit server path helpers later |

## 16. Traceability Matrix

| FDD Requirement ID | Technical Design Coverage | Planned Tests |
| --- | --- | --- |
| FR-001 | `specs` table, spec APIs, spec service | Repository + API tests |
| FR-002 | Chat proposal support, spec create/update flow | Contract + UI/manual tests |
| FR-003 | Spec record shape and readiness rules | Unit tests |
| FR-004 | Decomposition API and spec-card link creation | Unit + integration tests |
| FR-005 | Workspace-required validation in spec service | Integration tests |
| FR-006 | Work item creation contract from confirmed decomposition | API + board tests |
| FR-007 | Acceptance criteria storage and review rendering | Review integration tests |
| FR-008 | Decomposition rule engine and split reasons | Unit tests |
| FR-009 | Review lineage resolution through link table | Review queue integration tests |
| FR-010 | Shared spec flow with workspace-aware branching | Integration tests |
| FR-011 | Non-code execution mode path | Unit + integration tests |
| FR-012 | Escalation hook in spec service status/metadata | Unit tests, deferred UI |
| FR-013 | Decomposition reason fields surfaced in responses | API tests |
| FR-014 | Follow-up card proposal contract | Integration tests |

## 17. Open Questions

- Should spec detail live entirely in product-state or also support file-backed export later?
- Should decomposition proposals be persisted as drafts, or remain transient until confirmation?
- Should review rejection create a new card directly or first route through a follow-up proposal card?
- How much of spec detail should appear directly on board cards versus only in drill-down views?

## Summary

The implementation approach adds a first-class `Spec` planning layer to the existing Meeseek Box product-state model. Specs are created and refined through chat-first flows, confirmed by the operator, decomposed into execution-ready cards through an explicit service boundary, and traced through board and review using spec-card links. The design keeps the workflow lightweight by default while preserving future escalation paths.

## Unresolved Technical Questions / Risky Assumptions

- Whether decomposition proposals need their own persisted draft entity
- Whether review lineage should be derived only or partially denormalized for faster reads
- How much UI surface area specs need in v1 beyond project detail and chat

## Next Step

The next step is to run `$tdd-to-implementation-tasks` to produce the execution plan.
