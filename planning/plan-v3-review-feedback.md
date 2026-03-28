# Plan v3 Review Feedback

Reviewer: external model (Opus), 2026-03-19
Scope: `meeseeks-box-plan-draft-v3.md` plus full `planning/` tree (FEAT-001 through FEAT-004, all requirements, FDDs, TDDs, delivery artifacts, workflow docs)

Purpose: flag gaps, contradictions, and execution risks so the implementing model stays on track. This is not a rewrite — it is a companion document to the approved plan and planning tree.

---

## 1. What v3 Gets Right

Before the concerns: v3 is materially stronger than v2. The key improvements that should be preserved:

- Memory delete/archive semantics are now honest about what v1 can and cannot do against shared source files like `MEMORY.md`. This was the biggest semantic trap in v2 and it's fixed.
- Approval risk tiers now include `low-risk product-state write` as a distinct category, which prevents the system from requiring approval for trivial UI actions. Good calibration.
- Soft scoping language no longer implies runtime enforcement. The "what scopes do not do" section is critical and should survive into implementation.
- In-app-first attention model with Slack as fallback (not primary) is the correct inversion of what v2 specified.
- The planning tree structure (project → initiative → feature → requirement) with FDD/TDD gates and delivery tracking is well-suited for agent-driven execution.

---

## 2. Structural Gaps in the Planning Tree

### 2.1 No feature owns chat/Kanban migration from browser-local to server-backed

The v3 plan (Section 2) states: "chat and Kanban migration from browser-local to server-backed is foundational work, not polish."

The project manifest (project.md) repeats: "server-backed conversations and work board."

But none of the four features explicitly own this migration as a requirement or task.

- FEAT-001 (Product State Spine) owns canonical persistence for conversations, work items, and runs — but its requirements (REQ-001) assume server-backed state already exists. They specify "shared conversations, work items, runs persist canonically" as a requirement, not "migrate existing browser-local chat/Kanban to server-backed storage."
- FEAT-002 (Work Board and Launch Flows) assumes the board is already server-backed.

**Risk:** The implementing model may build new server-backed APIs without realizing there is an existing Claw-Tower codebase with browser-local storage that must be migrated or replaced. This is not a greenfield build — there is existing browser-local state that users may have accumulated.

**Recommendation:** FEAT-001 should include an explicit requirement or task acknowledging the migration path: what happens to existing browser-local data, whether an import is needed, and what the cutover looks like. The FEAT-001 backlog item "browser-local import strategy" exists but it's backlog, not active. If migration is truly foundational, it should be active scope.

### 2.2 No feature owns the responsive web app shell or navigation skeleton

All four features assume a working web app with pages (Home, Work, Chat, Inbox, Runs, Artifacts, Memory, Schedules, Agents, Settings). But no feature owns:

- the app shell and routing
- the responsive layout system (iPhone vs MacBook)
- the navigation structure
- the universal drawer system (v3 Section 15)
- the persistent activity rail (desktop)
- linked cross-entity navigation

These are cross-cutting UI concerns that every feature depends on but none owns.

**Risk:** The implementing model builds feature-specific pages without a shared app shell, and then has to retrofit navigation, drawers, and responsive behavior later — or worse, each feature builds its own patterns.

**Recommendation:** Either add a lightweight FEAT-000 for app infrastructure (shell, routing, responsive breakpoints, drawer system, navigation), or add explicit tasks to FEAT-001 since it's the foundational feature. The TDD for FEAT-002 references Playwright golden-path tests on "desktop and iPhone viewport" — that implies the responsive system exists. Make sure it does before FEAT-002 tests run.

### 2.3 Inbox derivation rules exist in v3 plan but not in the planning tree

The v3 plan (Section 14) lists what the Inbox surfaces: approvals, failures, blocked items, stale work, memory review prompts.

FEAT-004 (REQ-001) covers "typed approval events create correct Inbox state." But Inbox as a derived surface is broader than approvals:

- failure-driven inbox items → where are these owned?
- stale-work inbox items → where is the staleness threshold defined?
- memory review prompts → FEAT-003 or FEAT-004?

**Risk:** The implementing model builds approval-to-inbox correctly but misses the other Inbox sources, because they're not in any requirement.

**Recommendation:** Either expand FEAT-004 REQ-001 to cover all Inbox derivation sources (not just approvals), or add a cross-feature requirement that explicitly enumerates what drives Inbox state.

---

## 3. Ambiguities That Will Bite the Implementing Model

### 3.1 "Adapter" is doing a lot of work across multiple features

The word "adapter" appears in FEAT-001 (event ingestion), FEAT-003 (memory write-through), and FEAT-004 (approval blocking/resume). Each feature's TDD and contract tests reference adapter fixtures and contract validation.

But there is no shared definition of:

- Is this one adapter or three?
- What is the adapter's runtime boundary? Does it run as a sidecar process, a module in the backend, or a polling job?
- What is the adapter's auth model? How does it authenticate to OpenClaw?
- What is the adapter's failure mode? If OpenClaw is unreachable, what happens to events, approvals, and memory sync?

The FEAT-001 TDD says "fake adapter" for testing. The FEAT-004 TDD says "runtime approval envelope fixtures." These are different contracts but may need to be the same process.

**Risk:** Three features each build their own adapter abstraction, and they diverge. Or the implementing model builds a clean fake adapter for tests but never defines the real adapter's shape, and integration day is painful.

**Recommendation:** Add an explicit architectural decision record (or a section in the FEAT-001 FDD) that defines the adapter as a component: its responsibility boundaries, its interface contract, and whether it's one process or multiple. The fake adapter in the test harness should implement all three contracts (events, memory, approvals) so it stays honest.

### 3.2 Event idempotency and sequence_key are specified but the source is unknown

FEAT-001 REQ-002 specifies normalized event ingestion with idempotency. The TDD references `sequence_key` inputs. The contract tests reference "raw adapter payload → normalized event fixtures."

But the v3 plan (Section 7) and the project's open questions both acknowledge: the actual OpenClaw event emission format is unknown.

**Risk:** The implementing model designs an elegant event normalization layer against fixture data that doesn't match what OpenClaw actually produces. The contract tests pass against fakes but fail against reality.

**Recommendation:** Before FEAT-001 implementation begins, someone (human or agent) needs to capture actual OpenClaw runtime output for at least three scenarios: a simple run completion, a tool failure, and a schedule trigger. Those real outputs become the golden fixtures. The FEAT-001 backlog item "event replay tooling" is related but doesn't address the discovery step. This should be an explicit prerequisite task, not a backlog item.

### 3.3 One-shot scheduling: product-managed vs runtime-native is still open

FEAT-002 REQ-002 specifies "one-shot scheduled launches visible in Work and Schedules." The FEAT-002 backlog includes "one-shot vs runtime mapping" as an open question.

The v3 plan (Section 7) says: "if OpenClaw supports creation natively, use it. If not, the product must explicitly document that one-shot scheduling is product-managed."

**Risk:** The implementing model builds product-managed one-shot scheduling (a timer in the Meeseek Box backend) without checking whether OpenClaw already supports it. Or builds against OpenClaw's scheduler and discovers it doesn't support one-shot. Either way, the test design doesn't distinguish the two paths.

**Recommendation:** Resolve this before FEAT-002 implementation. Check OpenClaw's `cron` or scheduling API. If it supports one-shot, define the adapter call. If it doesn't, define the product-managed timer and make clear that "scheduled" means "Meeseek will trigger an OpenClaw run at the specified time" — not "OpenClaw has a pending schedule." This affects how the Schedules page renders it.

### 3.4 Artifact "family key" for version grouping is underspecified

FEAT-003 REQ-003 specifies "recurring artifacts retain stable version history." The FEAT-003 backlog notes "artifact family key generation may need project-specific rules."

The v3 plan says artifacts should be versioned when produced by recurring schedules, but doesn't define how versions are grouped. What makes two artifacts "versions of the same thing"?

Options include: same schedule + same output path, same schedule + same artifact name pattern, explicit family key set by the producing agent, or manual grouping by the operator.

**Risk:** The implementing model picks an implicit grouping strategy (e.g., by schedule ID) that doesn't match the operator's mental model. A schedule that produces different types of outputs gets all of them grouped as versions of one artifact.

**Recommendation:** Define the grouping key explicitly. The simplest v1 approach is: `family_key = schedule_id + output_name_pattern`. If the operator needs manual override, add it as a backlog item. But the default must be defined before FEAT-003 implementation.

---

## 4. Testing Gaps and Risks

### 4.1 No test coverage for cross-feature flows

Each feature has its own TDD and test cases. But the real product value comes from cross-feature flows:

- Launch a preset (FEAT-002) → creates a run → run produces an artifact (FEAT-003) → run needs approval (FEAT-004) → all state visible in canonical store (FEAT-001)
- Chat escalation (FEAT-002) → creates work item → memory is written (FEAT-003) → memory provenance is visible (FEAT-001)

None of these end-to-end flows appear in any feature's test design.

**Risk:** Each feature passes its own tests but the integrated product doesn't work because cross-feature state transitions have gaps.

**Recommendation:** Add 2-3 cross-feature integration test cases, either as a section in the initiative-level testing strategy or as explicit test cases shared across features. These should be service-level integration tests, not Playwright tests — they validate the data flow, not the UI.

### 4.2 Playwright tests reference iPhone viewport but no responsive implementation is specified

FEAT-002 TDD specifies "golden-path browser behavior on desktop and iPhone viewport." FEAT-004 TDD references "resolve approval from Inbox."

But there is no specification of:

- what viewport dimensions count as "iPhone"
- what responsive breakpoints the app uses
- whether the Playwright tests should run against a real mobile Safari emulation or just a narrow Chrome viewport

**Risk:** Playwright tests pass against a narrow Chrome viewport, but the actual iPhone experience over Tailnet in Safari is broken.

**Recommendation:** Define viewport dimensions in a shared test config. Acknowledge that Playwright iPhone-viewport tests are necessary but not sufficient — the manual smoke tests (already planned) must cover real Safari on real iPhone. This is already implied by the initiative's test strategy but should be explicit in the Playwright test setup.

### 4.3 Manual runtime smoke tests are listed but have no procedure

FEAT-003 and FEAT-004 both list manual smoke tests (real runtime write-through, real Slack delivery, real approval block/resume). The initiative strategy allocates 10% coverage to manual runtime/device smoke.

But there is no procedure document for what these tests actually check, what "pass" looks like, or what fixtures/preconditions are needed.

**Risk:** Manual smoke tests get skipped or done inconsistently because there's no checklist.

**Recommendation:** Before the first manual smoke milestone, create a short checklist for each manual test: precondition, action, expected result, pass/fail criteria. This doesn't need to be elaborate — a markdown table per feature is sufficient.

---

## 5. V2 Feedback That Was Dropped — Implications

Several items from the v2 review were intentionally not incorporated into v3. For the implementing model's awareness:

### 5.1 Run replay depth

V2 specified LangGraph checkpoint model and Relay's run replay as reference patterns, with "retry from last good step." V3 says "replay/time-travel for completed runs, timeline-first." The FDD for FEAT-001 doesn't mention retry-from-step.

**Implication:** V1 replay is read-only inspection, not re-execution. The implementing model should not build retry-from-step infrastructure. If a failed run offers retry, it should be a full re-run, not a partial replay. This is the right v1 scope, but it should be documented as an explicit non-goal so no one builds it accidentally.

### 5.2 Attention derivation rules — specifics

V2 included specific derivation rules (which events → which inbox items, configurable staleness thresholds, etc.). V3 keeps the Inbox page concept but the derivation rules are not in the planning tree's requirements.

**Implication:** The implementing model must define derivation rules during implementation. This is fine — but document the rules chosen so they can be reviewed later. Don't let them be implicit in code.

### 5.3 Schedule health — failure streaks and freshness

V2 specified failure streak detection and output freshness (did the schedule produce something useful, not just "did it run"). V3 says "health metrics and missed runs" but the FEAT-001 and FEAT-002 requirements don't specify what health metrics means.

**Implication:** The implementing model needs to define "schedule health" concretely. Minimum viable: success/failure count over last N runs, average duration, last failure reason. Freshness and streak detection can be backlog.

### 5.4 Device-specific affordances — specifics

V2 included detailed per-device design guidance (iPhone one-handed 30-second interactions, iPad review surface, MacBook deep work). V3 Section 5 keeps the framing but the feature-level specs don't reference device-specific design decisions.

**Implication:** The implementing model should test key flows (launch, approve, triage) on a narrow viewport during development, not just at the end. "iPhone-first" is a design principle, not a testing afterthought.

---

## 6. Dependency Ordering — What Must Ship First

The planning tree shows FEAT-001 as a hard dependency for FEAT-002, FEAT-003, and FEAT-004. This is correct. But within FEAT-001, the task ordering matters:

1. **TASK-001** (SQLite schema + repository layer) — everything depends on this
2. **TASK-006** (test harness: fake adapter, deterministic clock, temp storage) — all other features' tests depend on this
3. **TASK-002/003** (conversation and work item persistence) — FEAT-002 depends on these
4. **TASK-004** (event ingestion) — FEAT-003 and FEAT-004 depend on this
5. **TASK-005** (run and event persistence) — FEAT-004 approval linking depends on this

**Critical path:** TASK-001 → TASK-006 → (TASK-002 + TASK-003 + TASK-004 in parallel) → TASK-005

If TASK-006 (test harness) is delayed, every downstream feature's test development is blocked. Treat it as equal priority to the schema work.

---

## 7. Open Questions That Block Execution

These are already listed in project.md's open questions but deserve emphasis because they block real work:

| Question | Blocks | Severity |
|----------|--------|----------|
| What does OpenClaw actually emit for events? | FEAT-001 event normalization, all contract tests | Blocking |
| Can OpenClaw block/resume externally for approvals? | FEAT-004 approval mechanics | Blocking for approval-heavy flows |
| What is OpenClaw's one-shot scheduling capability? | FEAT-002 REQ-002 | Blocking for schedule implementation |
| What is the actual file layout of runtime memory paths? | FEAT-003 allowlist definition | Blocking for write-through |
| What does the Claw-Tower codebase actually look like? | FEAT-001 migration tasks, app shell | Blocking for realistic task estimation |

The implementing model should resolve these through investigation (reading OpenClaw docs, inspecting the Claw-Tower codebase, running test commands against the runtime) before writing production code for the affected features.

---

## 8. Summary: Top 5 Things to Get Right

1. **Build the test harness (FEAT-001/TASK-006) in parallel with the schema, not after.** Every other feature's tests depend on it.

2. **Capture real OpenClaw output before designing event normalization.** Golden fixtures from reality, not from imagination.

3. **Define the adapter as one architectural component with a clear contract**, not three separate feature-specific abstractions that diverge.

4. **Own the browser-local migration explicitly.** It is foundational work called out in the plan but not present as an active requirement or task in any feature.

5. **Add 2-3 cross-feature integration tests** that validate the full data flow (launch → run → artifact → approval → canonical state). Feature-isolated tests are necessary but not sufficient.
