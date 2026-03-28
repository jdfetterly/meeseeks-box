# Meeseek Box Plan v2 — Change Summary

Date: 2026-03-18

This document summarizes the gap analysis performed against five supporting documents and the resulting changes in v2.

---

## Sources Reviewed

1. `meeseeks-box-plan-draft-v1.md` — the plan under review
2. `personal-ai-command-center-build-brief.md` — product thesis and feature ideas
3. `platform-approach-and-philosopy.md` — reconciled operating document with best practices, tradeoffs, and architecture decisions
4. `chat-storage-limitiations.md` — findings on browser-local state in Claw-Tower
5. `BEST_PRACTICES_BASELINE.md` — ClawPort operational model baseline
6. `BEST_PRACTICES_RECONCILIATION.md` — audit of what ClawPort actually implements vs. documents

## Operator Decisions (from clarifying questions)

- **Storage:** SQLite for v1 (simpler to operate, single-operator)
- **V1 scope additions:** Typed HITL approvals (4 step types) and run replay/time-travel are IN scope
- **Notifications:** Slack-only in v1
- **Domain scoping:** Soft scoping (filtered views, scoped memory, no hard isolation)
- **Sequencing:** Not prescribed — focus on features, architecture, and design

---

## Critical Findings

### 1. Chat and Kanban are browser-local — the plan didn't acknowledge this

**Finding:** The `chat-storage-limitiations.md` document confirms that chat history and Kanban cards are stored in browser localStorage. Conversations started on MacBook do not appear on iPhone. This is a foundational blocker for the plan's multi-device continuity promise.

**V1 plan said:** "no canonical conversation or work state depends on browser-local storage" (acceptance criterion) — but didn't acknowledge this as a migration task.

**V2 change:** Explicitly added "migrate chat and Kanban from browser-local to server-backed" as foundational work in the architecture section and the current-state assessment. This is not Phase 4 work — it's prerequisite work.

### 2. Approval system was specified as an entity but not as a design

**Finding:** The platform doc specifies four HITL step types (Approval, Data Input, Task, Path Selection), risk tiering (read-only → auto-approve, reversible write, irreversible write, external communication), approve-with-edit, and time-boxing. V1 listed `Approval` as a core entity and mentioned "OpenClaw approval integration" but didn't spec any of this.

**V2 change:** Added a full "Approval System Design" section covering typed steps, risk tiering, approval mechanics (including OpenClaw pause/resume contract), and time-boxing with escalation. This is now a top-level section, not a bullet point.

### 3. Memory governance model was thin

**Finding:** The platform doc specifies a three-tier memory model (ephemeral/situational/long-term) with explicit retention policies, domain scoping, and user-facing CRUD. V1 had `MemoryEntry` and `MemorySource` for metadata but didn't operationalize the tier model, retention policies, or governance UI.

**V2 change:** Rewrote the memory section to map the three-tier conceptual model to the file-backed reality. Added memory governance UI requirements (view, search, edit, delete with audit trail). Added scoping rules. Added freshness tracking and review queue. Memory is now treated as context governance, not passive storage.

### 4. OpenClaw integration points were hand-waved

**Finding:** The platform doc flags five critical unresolved questions about OpenClaw: event emission format, pause/resume capability, concurrent run handling, schedule API, and memory access tracking. V1 listed "OpenClaw adapter" as a required backend component but didn't specify what it needs to do or what happens if OpenClaw can't do it.

**V2 change:** Added a full "OpenClaw Integration Contract" section that documents each integration requirement and the fallback if OpenClaw doesn't support it natively. Flagged these as the primary technical risk.

### 5. Run replay / time-travel was missing from v1 scope

**Finding:** The platform doc specifies run replay as a core debugging capability (LangGraph checkpoint model, Relay's run replay as references). V1 mentioned "run timelines" but not replay or time-travel. Operator confirmed this should be in v1.

**V2 change:** Added run replay/time-travel to the Runs section, the included-in-v1 list, and acceptance criteria. Specified that for any completed run, the operator can step through what happened with inputs and outputs.

---

## Important Additions

### 6. Escalation from chat to operational objects

**Source:** Platform doc Section 4.6 — "the critical UX pattern that separates a command center from a chatbot."

**What was missing:** V1 mentioned "create or update tracked operational objects" from chat but didn't detail the escalation affordances.

**V2 change:** Added specific escalation actions to the Chat section: "save as artifact," "run in background," "schedule this," "remember this," "create work item." Added the principle that once escalated, objects live in product state independent of the chat thread.

### 7. Device-specific affordances

**Source:** Platform doc Section 4.4.

**What was missing:** V1 claimed "iPhone-first" but didn't specify what that means per device.

**V2 change:** Added explicit device role definitions: iPhone (one-handed, 30-second interactions), iPad (review and approve), MacBook (deep work, full dashboard). These are now in both the Background Brief and UX model sections.

### 8. Schedule health monitoring

**Source:** Build brief Section 6, platform doc Section 3.3.

**What was missing:** V1 listed schedules as an entity with no health metrics.

**V2 change:** Added schedule health metrics to the Schedules page: success rate, average duration, failure patterns, failure streaks, freshness of outputs, missed run detection. Added schedule health to acceptance criteria.

### 9. Artifact versioning and cross-surface drawer pattern

**Source:** Build brief Section 9, platform doc Section 3.4.

**What was missing:** V1 listed artifacts as an entity but didn't spec versioning or consistent access patterns.

**V2 change:** Added artifact versioning (for schedule-produced recurring outputs). Added the artifact drawer pattern as a cross-cutting UI element accessible from runs, chat, board items, and schedules. Added to acceptance criteria.

### 10. Attention/inbox derivation rules

**Source:** Build brief Section 10, platform doc Section 3.7.

**What was missing:** V1 said inbox is "derived from canonical event/state" but didn't specify the derivation rules.

**V2 change:** Added explicit derivation rules: which events trigger inbox items, what "stale" means (configurable threshold), when memory review prompts appear. Added "inbox zero" pattern.

### 11. Soft scoping model

**Source:** Operator decision.

**What was missing:** V1 mentioned `DomainScope` as a core entity but didn't specify how scoping works in practice.

**V2 change:** Added a full "Soft Scoping Model" section. Scopes are metadata tags with filtering behavior. Default views filter by scope. Memory is scoped. No hard isolation in v1. Extensible.

### 12. Notification model specifics

**Source:** Operator decision.

**What was missing:** V1 said "Slack fallback alerts" with no detail.

**V2 change:** Added a "Notification Model" section specifying exactly what triggers Slack notifications (approvals for irreversible/external actions, failures with no retry, missed schedules, timeout approaching) and what doesn't (successful completions, auto-approvals, memory writes). Configuration options specified.

---

## Contradictions Resolved

| Issue | V1 Position | Supporting Docs Position | V2 Resolution |
|-------|-------------|--------------------------|---------------|
| Chat persistence | Assumed working | Confirmed browser-local | Explicitly scoped as foundational migration work |
| Kanban persistence | Assumed working | Confirmed browser-local | Explicitly scoped as foundational migration work |
| Memory tiers | Two-tier (file + metadata) | Three-tier (ephemeral/situational/long-term) | Three-tier conceptual model mapped to file-backed reality |
| Approval design | Generic entity | Typed steps + risk tiers | Full approval system design section |
| OpenClaw integration | Adapter mentioned | Five critical unknowns flagged | Integration contract with fallbacks documented |
| Storage choice | SQLite stated, not justified | Platform doc suggests Postgres | SQLite confirmed by operator; clean abstraction required for future migration |

---

## Acceptance Criteria: V1 vs V2

V1 had 8 acceptance criteria. V2 has 18, organized by domain:

| Domain | V1 Criteria | V2 Additions |
|--------|-------------|--------------|
| Core product | 4 | Added: saved presets support one-tap run from iPhone |
| Approvals | 1 (generic) | Added: typed steps, risk tiering, time-boxing, logged resolution (4 criteria) |
| Runs | 0 | Added: structured event timeline, replay for completed runs, clear failure reason with retry (3 criteria) |
| Memory | 2 | Added: scoped by domain, stale entries surface in inbox (2 criteria) |
| Artifacts | 0 | Added: versioned for recurring schedules, drawer accessible cross-surface (2 criteria) |
| Schedules | 0 | Added: health metrics, pause/trigger from any device (2 criteria) |
| Security | 1 | Added: no secrets in browser-local, memory writes through controlled adapters only (2 criteria) |

---

## Risks: V1 vs V2

V2 adds two new risk categories:

**Integration risks** (new): OpenClaw event format unknown, concurrent run behavior unknown, memory access tracking depends on unconfirmed capabilities. These are the primary technical risks.

**Refined technical risks:** SQLite single-writer contention between background event ingestion and user API calls. Claw-Tower browser-local assumptions confirmed widespread (not speculative).

**Refined product risks:** Added that approval risk-tier miscalibration can create friction — start conservative, earn the right to relax.

---

## What Was NOT Changed

- **Storage technology:** Remains SQLite per operator decision. Added clean abstraction requirement.
- **Voice:** Remains out of v1 scope. Added to future work with architecture notes.
- **Native iOS app:** Remains out of v1 scope.
- **Apple Handoff:** Remains out of v1 scope. V2 specifies how cross-device continuity works without it.
- **Hard domain isolation:** Remains out of v1 scope per operator decision.
- **Internal build sequencing:** Not prescribed per operator direction.
- **Security model:** Unchanged — Tailnet-only, iron-claw-mini aligned.
- **Core object model:** Preserved and extended, not replaced.
- **OpenClaw as execution substrate:** Unchanged — Meeseek Box sits above, not beside or below.

---

## Summary

The v1 plan had the right product direction and a sound object model. The main gaps were in three areas:

1. **Product model completeness** — missing governance systems (memory tiers, approval risk tiers, attention derivation rules), observability (run replay, schedule health), and interaction patterns (escalation, device affordances)

2. **Honest assessment of current state** — the plan assumed chat and Kanban were already shared; they are browser-local and must be migrated as foundational work

3. **Integration specifics** — the OpenClaw adapter was listed as a component but not specified; five critical integration questions were left unresolved

V2 addresses all three. The plan is now a more complete and honest specification of what v1 needs to deliver and what risks must be managed.
