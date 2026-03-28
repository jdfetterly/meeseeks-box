# Functional Design Document

## 1. Document Control

- Feature / Initiative: Meeseek Box lightweight spec-driven delivery
- Author: Codex
- Date: 2026-03-24
- Status: Draft
- Source Inputs:
  - operator feedback on AI-forward project workflow
  - workspace-backed project model agreed in Meeseek Box
  - preference for lightweight default over heavyweight `agent-workflow`
  - need for kanban cards at the right level for agent execution and human review

## 2. Problem Statement and Context

Meeseek Box already has projects, playbooks, work cards, review queue, and workspace binding, but it still lacks a clear planning object that turns intent into the right execution units. Without that planning layer, cards risk being too vague, too large, too operational, or too disconnected from what the user is actually trying to build.

The product needs a lightweight default model that fits how work gets done:

- describe the outcome
- refine it with an agent
- turn it into execution-ready cards
- execute in the right workspace
- review outputs against clear acceptance criteria

The design must avoid forcing every project through heavyweight planning artifacts like formal FDD/TDD chains, while still giving agents enough structure to break work down well and produce reviewable results.

## 3. Goals

- Make `Spec` the default planning artifact for Meeseek Box project work.
- Let the agent create, refine, and decompose specs through chat-first workflows.
- Ensure kanban cards are generated at a size appropriate for agent execution and human review.
- Distinguish clearly between planning-only work and execution-ready work.
- Make review criteria explicit so completed cards can be judged quickly and consistently.
- Support both existing-repo work and brand-new build projects.

## 4. Non-Goals

- Do not require formal FDD/TDD artifacts for normal project work.
- Do not define a full repo-wide planning standard in this document.
- Do not prescribe internal implementation architecture, storage schema, or UI framework details.
- Do not replace project playbooks, workspaces, or review queue with a separate planning system.
- Do not attempt to solve portfolio-scale multi-project governance in v1.

## 5. Actors and User Types

| Actor | Description | Permissions / Constraints |
| --- | --- | --- |
| Operator | Primary user managing projects, priorities, and reviews | Can create projects, refine specs, confirm card breakdowns, bind/bootstrap workspaces, and review outputs |
| Planning Agent | Agent that helps clarify scope and produce specs or card breakdowns | Must ask for missing details, surface assumptions, and wait for confirmation before creating execution work |
| Execution Agent | Agent that executes approved cards in a workspace or produces non-code outputs | Must work from approved card context and return outputs for review |
| Reviewer | Human role, usually the operator, judging outputs against acceptance criteria | Must be able to inspect results, accept, reject, or request follow-up |

## 6. Functional Scope Summary

The system must support:

- a lightweight `Spec` object inside a project
- agent-led creation and refinement of specs
- decomposition of specs into executable kanban cards
- explicit readiness states for cards
- clear acceptance criteria attached to each card
- reviewable outputs tied back to the originating spec and card
- optional escalation from lightweight spec flow into more formal planning only when needed

## 7. User Workflows and Scenarios

### 7.1 Primary Workflow: Existing Repo Feature Work

1. The operator opens a project that already has a bound workspace.
2. The operator tells the copilot what they want built or changed.
3. The agent proposes a lightweight spec with outcome, constraints, scope boundaries, and acceptance criteria.
4. The operator confirms or edits the spec.
5. The agent proposes a card breakdown from the approved spec.
6. The operator confirms the breakdown.
7. The system creates execution-ready cards in the project board.
8. The execution agent works those cards in the bound workspace.
9. Completed outputs land in Review Queue with the related acceptance criteria.
10. The operator reviews and either accepts or requests follow-up work.

Relevant requirements: `FR-001`, `FR-002`, `FR-003`, `FR-004`, `FR-006`, `FR-007`, `FR-009`, `FR-010`

### 7.2 Primary Workflow: Brand-New Build Project

1. The operator creates a planning-only project.
2. The operator asks the copilot to define what should be built.
3. The agent creates or refines a lightweight spec.
4. The operator confirms the spec.
5. The operator chooses to bootstrap a workspace when ready for implementation.
6. The system binds the new workspace to the project.
7. The agent proposes the execution card breakdown from the approved spec.
8. The operator confirms and the cards are created.
9. Work executes in the new workspace and outputs flow to review.

Relevant requirements: `FR-001`, `FR-002`, `FR-003`, `FR-004`, `FR-005`, `FR-006`, `FR-007`, `FR-010`

### 7.3 Alternate / Failure Paths

- Scenario: The operator gives a vague request like “make onboarding better.”
  - Expected behavior: The agent must ask clarifying questions and avoid generating execution cards until the spec is sufficiently defined.
- Scenario: The project has no workspace but the user asks to implement code.
  - Expected behavior: The agent must route the operator into bind/bootstrap workspace flow before creating execution-ready code cards.
- Scenario: A spec is too large for a clean breakdown.
  - Expected behavior: The agent must split it into multiple sub-specs or epics before creating cards.
- Scenario: A card finishes but does not meet its acceptance criteria.
  - Expected behavior: Review must support rejection or follow-up card creation tied to the same spec.

## 8. Functional Requirements

| ID | Requirement | Priority | Notes |
| --- | --- | --- | --- |
| FR-001 | The system shall support a first-class `Spec` planning artifact inside a project as the default way to define work before execution. | Must | Lightweight default planning object |
| FR-002 | The system shall allow the operator to create or refine a spec through chat-first interaction where the agent asks only for missing information. | Must | Conversation-first planning |
| FR-003 | The system shall store enough spec detail to support decomposition into executable cards without requiring formal FDD/TDD artifacts by default. | Must | Lightweight but detailed |
| FR-004 | The system shall allow an approved spec to be decomposed into one or more kanban cards by an agent proposal that the operator can confirm or adjust. | Must | Human confirms breakdown |
| FR-005 | The system shall distinguish planning-only cards from execution-ready cards and prevent code execution work from starting when no ready workspace exists. | Must | Workspace-aware gating |
| FR-006 | The system shall ensure each execution-ready card contains the minimum metadata needed for an agent to act without reinterpreting the full project from scratch. | Must | Executable card contract |
| FR-007 | The system shall attach explicit acceptance criteria to each card so review can be performed against concrete expectations. | Must | Reviewable completion |
| FR-008 | The system shall allow one spec to produce multiple cards when the work crosses multiple concerns, surfaces, or acceptance boundaries. | Must | Prevent giant cards |
| FR-009 | The system shall route completed card outputs into Review Queue with traceable links back to the spec and card that produced them. | Must | Review loop |
| FR-010 | The system shall support the same spec flow for existing-repo projects and brand-new build projects, while adjusting execution readiness based on workspace state. | Must | Same model, different readiness |
| FR-011 | The system shall allow non-code project work to use specs and cards without requiring a bound code workspace. | Should | Research, planning, ops, writing |
| FR-012 | The system shall support optional escalation from lightweight spec flow into more formal design stages when the agent or operator identifies elevated scope, risk, or coordination needs. | Should | Escalation path, not default |
| FR-013 | The system shall show the operator why a proposed card split exists, including which acceptance boundary or execution concern caused the split. | Should | Transparency in decomposition |
| FR-014 | The system shall support follow-up card creation from review feedback without requiring the operator to recreate the original spec from scratch. | Should | Review-driven iteration |

## 9. Business Rules and Constraints

| ID | Rule / Constraint | Rationale |
| --- | --- | --- |
| BR-001 | `Spec` is the default planning artifact for Meeseek Box project work. | Keeps the default lightweight |
| BR-002 | The agent must not generate execution-ready cards from an ambiguous request. | Prevents low-quality breakdowns |
| BR-003 | A card should represent one reviewable outcome, not a broad area of effort. | Keeps review fast and actionable |
| BR-004 | A card should be split when it spans multiple distinct outputs, multiple major files/surfaces, or materially different acceptance criteria. | Prevents giant cards |
| BR-005 | Planning-only cards may exist without a workspace, but execution-ready code cards require a ready workspace. | Aligns planning with execution reality |
| BR-006 | Acceptance criteria must be attached to the card, not left only in the parent spec. | Keeps review localized |
| BR-007 | The system should prefer fewer, clearer cards over noisy micro-tasks. | Avoids card spam |
| BR-008 | The system should not force formal FDD/TDD artifacts unless explicitly escalated. | Preserves lightweight default |
| BR-009 | Spec refinement and card decomposition should happen through proposal-and-confirm flows. | AI-forward interaction model |
| BR-010 | Review artifacts must remain traceable to the originating spec and card. | Preserves context and accountability |

## 10. Data Inputs and Outputs (functional view only)

| Type | Name | Source / Consumer | Notes |
| --- | --- | --- | --- |
| Input | Project context | Project, playbook, workspace | Used to ground spec creation |
| Input | Operator brief | Chat panel or project context | Raw intent or outcome request |
| Input | Workspace state | Project workspace binding | Determines execution readiness |
| Input | Repo context | Linked repos, workspace contents, project playbook | Helps scope execution cards |
| Input | Review preferences | Project playbook | Shapes what “done” means |
| Output | Spec | Planning agent, project detail, board decomposition flow | Default planning artifact |
| Output | Card proposal set | Planning agent, operator review | Proposed breakdown from spec |
| Output | Execution-ready cards | Board, execution agents | Work units ready to act on |
| Output | Review artifact bundle | Review Queue | Output plus acceptance context |
| Output | Follow-up cards | Planning/review loop | Spawned from rejected or partial review |

## 11. Error Handling and Edge Cases

| Scenario | Expected Behavior | Requirement IDs |
| --- | --- | --- |
| Spec request is too vague | Agent asks clarifying questions and stays in draft mode | FR-002, FR-003 |
| Project has no workspace but user asks to implement code | Agent routes to bind/bootstrap workspace flow before creating execution-ready code cards | FR-005, FR-010 |
| Spec would produce one giant card | Agent must split by output boundary, concern, or acceptance boundary | FR-004, FR-008, BR-004 |
| Spec is actually tiny | Agent may create a single card if it remains reviewable and executable | FR-004, BR-003 |
| Work is non-code | System allows planning and execution without requiring a code workspace | FR-011 |
| Review fails | Reviewer can reject output and create follow-up cards from the same spec/card lineage | FR-009, FR-014 |
| Operator changes project priorities after cards exist | Agent may propose a re-split, resequence, or archive action instead of silently mutating the board | FR-004, FR-013 |
| Work spans multiple repos or workspaces | Agent must either split into separate cards or explicitly note the coordination boundary | FR-006, FR-008 |

## 12. Dependencies and Assumptions

### Dependencies

- Projects, playbooks, board, review queue, and workspace binding already exist in Meeseek Box.
- Chat panel acts as the primary control plane for planning and delegation.
- Review Queue remains the main destination for completed outputs that need judgment.

### Assumptions

- A lightweight spec can be rich enough for most project work if it captures outcome, scope, constraints, dependencies, and acceptance criteria.
- Card sizing should optimize for agent execution plus human review, not for traditional team standup conventions.
- The app can store or derive enough project/workspace context to help the agent produce strong decompositions.
- Formal design stages may still be useful for larger or riskier work, but they should be optional escalation paths.

## 13. Acceptance Scenarios

| ID | Scenario | Related Requirement IDs |
| --- | --- | --- |
| AC-001 | Given a workspace-ready project, when the operator describes a feature in chat, then the agent produces a lightweight spec draft instead of immediately creating cards. | FR-001, FR-002, FR-003 |
| AC-002 | Given an approved lightweight spec, when the operator asks to plan execution, then the agent proposes a card breakdown with one or more reviewable cards. | FR-004, FR-008 |
| AC-003 | Given a planning-only project, when the operator asks to implement a code change, then the system requires a workspace bind/bootstrap step before execution-ready cards are created. | FR-005, FR-010 |
| AC-004 | Given an execution-ready card, when the execution agent completes work, then the resulting output appears in Review Queue with the related acceptance criteria visible. | FR-006, FR-007, FR-009 |
| AC-005 | Given a vague brief, when the operator has not provided enough detail, then the agent asks clarifying questions and does not create executable cards prematurely. | FR-002, FR-003 |
| AC-006 | Given a non-code project task, when the operator creates a spec, then the system can still produce cards and review outputs without requiring a code workspace. | FR-011 |
| AC-007 | Given a rejected review result, when the operator requests changes, then the system can create follow-up cards linked to the original spec and card context. | FR-014 |
| AC-008 | Given a spec that spans multiple major outputs, when the agent proposes decomposition, then it explains why the work was split into multiple cards. | FR-008, FR-013 |

## 14. Traceability Matrix

| Source Input | FDD Coverage |
| --- | --- |
| “Go lightweight” | Goals, `BR-001`, `BR-008`, `FR-001`, `FR-003`, `FR-012` |
| Need cards at the right level | Problem Statement, `FR-004`, `FR-006`, `FR-008`, `BR-003`, `BR-004`, acceptance scenarios |
| AI-forward project workflow | Problem Statement, workflows, `FR-002`, `FR-004`, `BR-009` |
| Existing repo and brand-new build both matter | Workflows 7.1 and 7.2, `FR-005`, `FR-010` |
| Planning should reflect how work actually gets done | Problem Statement, Scope Summary, workflows, `FR-001` through `FR-010` |
| Review should stay explicit and useful | `FR-007`, `FR-009`, `FR-014`, acceptance scenarios `AC-004`, `AC-007` |
| Do not make the heavy workflow a hard default | Non-Goals, `BR-008`, `FR-012`, Dependencies and Assumptions |

## 15. Open Questions

- Should lightweight specs be visible as a first-class object in navigation, or only inside project detail and chat flows?
- Should one spec always map to a bounded cluster of cards, or can a long-lived spec continue generating cards over time?
- How much of card decomposition should happen automatically versus always requiring an explicit confirmation step?
- Should the system support nested specs or “sub-specs” in lightweight mode, or should large specs always split into separate peer specs?
- What heuristics should trigger optional escalation into formal design mode?

## 16. Out of Scope

- Repo-wide standardization of planning artifacts across every project
- Detailed technical design for storage, schema, or UI implementation
- Formal FDD/TDD workflow design for all Meeseek Box projects
- Multi-workspace-per-project coordination model
- Automatic execution without operator confirmation for card breakdowns

## Lightweight Spec Definition

This section is intentionally detailed because it defines the lightweight default the product should use functionally.

Each lightweight spec should contain:

- `Title`
  - short name for the outcome being planned
- `Intent`
  - what the user wants to achieve and why it matters
- `Outcome`
  - what should exist or be true when the work is successful
- `In Scope`
  - what this spec covers directly
- `Out of Scope`
  - what this spec explicitly does not cover
- `Current Context`
  - relevant project state, repo/workspace context, prior decisions, and constraints
- `Dependencies`
  - repos, workspaces, people, external systems, schedules, or prerequisite decisions
- `Execution Notes`
  - implementation hints, operator preferences, agent guidance, or sequencing notes
- `Acceptance Criteria`
  - concrete checks that define success for review
- `Review Expectations`
  - what the operator should expect to inspect when the work is done

The lightweight spec is complete enough to drive decomposition when:

- the intended outcome is concrete
- the primary scope boundary is clear
- the review standard is explicit
- the required workspace or non-workspace execution context is known
- the agent can identify whether the work should be one card or several

## Card Sizing Model

The system should use this functional sizing model when converting specs into cards.

### A card is the right size when:

- it delivers one coherent reviewable outcome
- one agent can own it without repeated scope reinterpretation
- the operator can accept or reject it with a focused review
- it has a clear completion boundary

### A card is too large when:

- it would produce multiple distinct outputs
- it spans backend, frontend, infra, and docs with separate review expectations
- it requires multiple major approval points
- it would likely need to be reviewed in parts anyway

### A card is too small when:

- it only captures a trivial implementation step with no standalone review value
- it exists only because of internal sequencing rather than user-visible or reviewer-visible outcome
- the operator would rather review the combined result once

### Default split heuristics

Split a spec into multiple cards when any of the following are true:

- different outputs are needed
- different repos or workspaces are involved
- different agents are better suited to the work
- different acceptance criteria apply
- part of the work can start while another part is blocked
- review would be cleaner if the outputs were judged separately

## Minimum Executable Card Schema

Every execution-ready card should functionally include:

- `Card title`
- `Parent project`
- `Parent spec`
- `Execution mode`
  - planning-only, non-code execution, or workspace execution
- `Workspace or context binding`
  - workspace path if code-backed, otherwise relevant operational context
- `Intent summary`
  - what this card is trying to accomplish
- `Scope boundary`
  - what is in and out of this card
- `Dependencies`
  - prerequisites or linked cards
- `Acceptance criteria`
  - copied or derived from the parent spec at card level
- `Expected output for review`
  - what the reviewer should receive
- `Assigned or suggested agent`
- `Operational metadata`
  - status, review state, linked repos, badges

## Review and Acceptance Model

Completion should not mean “the agent stopped.” Completion should mean:

- the card produced the expected output
- the output is attached to Review Queue
- the reviewer can evaluate it against explicit acceptance criteria

Review should allow:

- accept
- reject
- request follow-up
- generate follow-up cards from the same lineage

The review surface should always show:

- the spec this came from
- the specific card this output satisfies
- the acceptance criteria
- the produced output or artifact summary
- the agent that did the work

## Summary

The intended feature behavior is a lightweight spec-driven planning model for Meeseek Box. `Spec` becomes the default planning object between project context and execution cards. Agents help create and refine specs through chat-first flows, then propose card breakdowns at a reviewable size. Execution-ready cards must carry enough context to act cleanly, and completed work must return to Review Queue with explicit acceptance criteria attached.

## Unresolved Questions

- Whether specs should become first-class navigable objects or stay embedded in project flows
- When large lightweight specs should split into peer specs versus child specs
- Which heuristics should promote work into a more formal planning mode

## Next Step

The next step is to run `$fdd-to-tdd` using this approved FDD as the source of truth.
