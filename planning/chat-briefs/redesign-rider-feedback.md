# Meeseek Box Redesign — Rider Document of Feedback

**Date:** 2026-03-25
**Status:** Internal critique memo — intended for direct incorporation into redesign spec
**Scope:** Next-pass redesign as described in chat briefs 01–11

---

## 1. Summary Judgment

The redesign makes the right structural bets: project as durable context, chat as control plane, plan-derived cards, review as the completion gate, and open loops as first-class objects. These are genuine departures from a traditional app and they're correct.

But the spec as written is still a *description of desired feelings* more than a *description of concrete behavior*. "Home should feel like a briefing" and "Board should feel like project execution" are vibes, not specs. The redesign will collapse back into a traditional app during implementation unless the following problems are resolved — because every ambiguity will be resolved by an engineer defaulting to a CRUD pattern.

The three highest-risk gaps:

1. **Chat is declared the control plane but has no defined protocol.** There is no intent taxonomy, no routing model, no failure/disambiguation behavior. A "control plane" without a protocol is just a text box.
2. **Open loops are described as first-class but have no lifecycle.** There is no creation trigger, no resolution rule, no escalation path, no staleness model. A "first-class object" without a lifecycle is just a label.
3. **Surface responsibilities overlap without tiebreakers.** Home, Board, Project Detail, and Inbox all claim to surface "what needs attention." There is no defined rule for which surface owns which kind of attention at which moment.

The spec is about 60% of the way to implementable. The remaining 40% is where the actual product lives.

---

## 2. Critical Problems

### 2.1 The control plane has no protocol

The spec repeatedly says "chat is the control plane" but never defines what that means mechanically. Specifically:

- **No intent taxonomy.** The spec lists example intents (create project, create work, create schedule, review output) but doesn't define how the system identifies, routes, or disambiguates them. What happens when a user says "I need to update the API" — is that a new card, an edit to an existing card, a planning conversation, or a schedule change? Who decides?
- **No context injection model.** The copilot panel is described as "contextual" but there's no rule for what context gets injected and when. If I open the copilot from Board, does it know which project? Which card? Which filter state? If I open it from Home, what's the default context?
- **No conversation-to-action binding.** The spec says the agent "drafts a structured proposal" and the user "confirms once." But there's no schema for what a proposal contains, what confirmation commits, or what happens if the user partially confirms. Can a user say "yes to the card but change the project"? What's the edit surface for a proposal?
- **No error/fallback protocol.** What happens when the agent can't determine intent? What happens when the agent misidentifies intent and the user has already confirmed? Is there an undo model? The spec says forms are "advanced fallback" but doesn't define the trigger for fallback.

**Decision needed:** Define the intent taxonomy, context injection rules, proposal schema, confirmation protocol, and fallback triggers as a concrete addendum before any page-level spec is finalized.

### 2.2 Surface responsibility overlap is unresolved

Four surfaces claim to answer "what should I do next": Home (briefing), Board (execution), Project Detail (recommended next move), and Inbox (operational attention). The spec never defines which surface wins for which class of item.

Examples of collisions:

- A card is blocked because a workspace isn't ready. Does it appear on Home (needs attention), Inbox (blocked work), Board (stuck card), or Project Detail (workspace not ready)?
- A schedule failed. Does it surface on Home, Inbox, or Schedules?
- A review item has been sitting for 3 days. Does it escalate to Home, Inbox, or stay only in Review Queue?

**Decision needed:** Define a single priority-routing table: for each attention-class (blocked work, failed run, stale review, open loop, ready-for-delegation), which surface is the *primary* owner and which surfaces show a *reference badge* only. Without this, every surface will show everything and none of them will feel distinct.

### 2.3 The conversation model is structurally weak

The spec proposes that conversations become project-linked, get explicit status, distilled summaries, linked objects, and branch/revise behavior. This is ambitious and directionally correct, but several structural problems remain:

- **No conversation lifecycle definition.** What statuses can a conversation have? The spec says "explicit status" but doesn't list them. Active? Paused? Resolved? Archived? What triggers transitions?
- **No conversation-to-object linking protocol.** The spec says conversations get "linked objects" but doesn't define who creates the links, when they're created, or what happens when a linked object is deleted or moved.
- **Branch/revise is described but not specified.** What does branching a conversation mean mechanically? Is it a fork of the full message history? A new conversation with a reference? Can you merge branches? What happens to linked objects in the original when you branch?
- **No conversation cleanup model.** If conversations are project-linked and have summaries, they accumulate. What's the archival rule? What's the relevance decay model? Does the system ever suggest closing a conversation?
- **"Grouped by project and role" is under-specified.** What roles? Is "role" the same as the agent persona, the user's intent category, or something else? How many roles per project are expected?

**Decision needed:** Define conversation statuses, transition triggers, linking protocol, branch mechanics, and archival rules. Without these, conversations will become an unstructured pile that makes `/chat` history worse, not better.

---

## 3. Workflow Gaps

### 3.1 No defined path from "open the app" to "first useful action"

The spec describes Home as a briefing surface but doesn't define the first-use or cold-start experience. A user opens Meeseek Box for the first time. They have no projects, no conversations, no schedules. What do they see? What do they do? The spec says "Chat should drive setup" but doesn't define what the empty-state Home or empty-state copilot panel says or does.

**Decision needed:** Define the zero-state for Home, the copilot panel, and the first-run onboarding flow. This is where most users will form their mental model.

### 3.2 No handoff protocol between surfaces

The spec implies a workflow: Home → identify what matters → navigate to the right surface → take action. But there's no defined handoff behavior. If Home says "Review item ready on Project X," and I tap it, where do I land? On Review Queue filtered to Project X? On the review item detail? On Project Detail with the review section highlighted? Each choice implies a different mental model.

**Decision needed:** For each attention item type on Home, define the exact navigation target and arrival state.

### 3.3 Plan-to-card derivation is not specified

The spec says "cards should be derived from the plan, not manually assembled." This is a core claim. But the spec doesn't define:

- What "the plan" looks like as a data structure.
- How the system identifies that a plan has changed and cards need to be re-derived.
- What happens to in-progress cards when the plan changes.
- Whether re-derivation is automatic, suggested, or manual.
- How the user reviews/approves derived cards before they hit the board.

This is the single most important workflow in the system and it has zero mechanical specification.

**Decision needed:** Define the plan schema, the derivation trigger, the derivation-to-approval flow, and the change-propagation rules.

### 3.4 Review → follow-up generation is hand-waved

The spec says Review is "the center of completion and follow-up generation." But the follow-up generation workflow isn't defined. When I review an output and say "this needs changes":

- Does the system create a new card? Reopen the old one? Create an open loop?
- Does the follow-up go to the same project and plan, or can it be redirected?
- Who writes the follow-up spec — the agent, the user, or a hybrid?
- Does the original card stay in "Done" or move back to "In Progress"?

**Decision needed:** Define the full review-rejection flow: what objects are created, where they land, and how they connect to the original work.

### 3.5 No delegation-readiness checklist

The spec defines when code execution requires a workspace (workspace-ready state). But delegation readiness is broader than workspace readiness. Before an agent can execute a card, it needs:

- A workspace in ready state (defined)
- A card with sufficient spec detail (mentioned but not quantified)
- Access to relevant project memory/playbook (implied but not verified)
- No blocking dependencies from other cards (not addressed)

**Decision needed:** Define a concrete delegation-readiness checklist that the system evaluates before allowing "delegate with copilot" to proceed.

---

## 4. Conversation Model Gaps

### 4.1 Conversations are overloaded

The spec asks conversations to serve as: control plane interactions, planning sessions, project memory context, execution logs, and review discussions. These are fundamentally different conversation types with different lifecycle needs. A planning conversation might last weeks. A delegation conversation should last minutes. Mixing them under one model guarantees that the conversation list becomes unusable.

**Recommendation:** Define explicit conversation types (planning, delegation, review, ad-hoc) with different default behaviors for each. Planning conversations stay open by default. Delegation conversations auto-close when the card completes. Review conversations are anchored to a review item.

### 4.2 "Distilled summaries" have no defined creation or update trigger

The spec says conversations get distilled summaries. But when are they created? After every message? After a status change? On demand? Are they LLM-generated or rule-based? Can the user edit them? Do they update when the conversation continues?

**Decision needed:** Define summary creation trigger, update frequency, editability, and where summaries surface (project detail? home briefing? conversation list?).

### 4.3 The relationship between conversations and the copilot panel is ambiguous

The spec describes a persistent copilot panel on desktop. It also describes conversations as project-linked with rich metadata. Are copilot interactions conversations? If I use the copilot from Board to delegate a card, does that create a conversation? Is it the same conversation as the one I started from Project Detail? If not, how does the system avoid fragmenting context?

**Decision needed:** Define whether the copilot panel creates conversations, extends existing ones, or operates in a transient mode. Define the rules for each.

---

## 5. Open Loop Model Gaps

### 5.1 No creation taxonomy

The spec says open loops are "first-class records tied to conversations and projects." But it never defines what creates an open loop. Possible sources:

- Agent detects an unresolved commitment in a conversation
- User manually flags something as an open loop
- Review rejection generates a follow-up loop
- Schedule failure generates an attention loop
- Plan change invalidates existing cards

Are all of these open loops? If so, they need different urgency levels, different resolution paths, and different display treatments. If not, which ones are open loops and which ones are something else?

**Decision needed:** Define the open loop creation taxonomy with explicit sources, urgency classification, and resolution criteria for each source type.

### 5.2 No resolution protocol

The spec doesn't define how an open loop gets resolved. Possibilities:

- User manually marks it resolved
- System auto-resolves when linked object reaches a certain state
- Agent suggests resolution and user confirms
- Time-based expiration

Without a resolution protocol, open loops will accumulate indefinitely and become noise.

**Decision needed:** Define resolution triggers (manual, automatic, suggested, expired) and the conditions for each.

### 5.3 No escalation model

What happens when an open loop sits unresolved for a long time? Does it escalate? Where does it escalate to? Does it change priority? Does it block related work? The spec treats open loops as records but not as actors in the workflow.

**Decision needed:** Define staleness thresholds and escalation behavior (re-surface on Home, generate Inbox item, block card delegation, or notify via schedule).

### 5.4 Open loops vs. Inbox items vs. blocked cards — boundary is unclear

The spec defines three attention mechanisms: open loops, Inbox items, and blocked board cards. These will collide constantly. A blocked card *is* an open loop. A failed schedule is both an Inbox item and an open loop. Without clear boundaries, the system creates three inboxes instead of one.

**Decision needed:** Define the mutual exclusivity rules. Either open loops subsume Inbox items and blocked cards (making them the universal attention type), or define explicitly which mechanism owns which class of problem and how they cross-reference without duplicating.

---

## 6. Surface-Specific Pushback

### 6.1 Home

The spec says Home should be a "synthesized briefing surface." This is the right idea, but the spec doesn't define what "synthesized" means computationally. A briefing requires ranking, filtering, and narrative framing. The spec lists sections (Needs Your Attention, Review Ready, Active Projects, Recent Agent Progress, Quick Delegate) but these are just categories, not a synthesis.

A real briefing surface should answer one question: "Here is the single most important thing, and here is why." Everything else is a ranked list below it. The spec doesn't describe this prioritization logic.

**Pushback:** Without a defined ranking algorithm, Home will render as five unranked lists — which is a dashboard, not a briefing. Define the ranking function or drop the "briefing" claim.

### 6.2 Board

The spec says Board should be "centered on plan-derived execution." But the board still uses traditional kanban lanes (To Do, In Progress, In Review, Done). Plan-derived execution would mean the board's primary grouping is by plan section or initiative, not by status lane. The spec contradicts itself: it wants plan-centered execution but specifies status-centered lanes.

**Pushback:** Either change the default board grouping to plan-section (with status as a secondary view) or acknowledge that the board is still status-centered and drop the "plan-derived" framing. The current spec tries to be both.

### 6.3 Schedules

The spec says schedules should be "centered on purpose, output, and usefulness." But the list page spec still asks for runtime health presentation, recurring controls, and workspace-aware behavior — all of which are operational/admin concerns. The spec doesn't define what "purpose" and "usefulness" look like as UI elements.

**Pushback:** Define what a schedule's "purpose" field contains and how "usefulness" is measured and displayed. Otherwise the schedule page will default to showing cron + last-run-status because those are the only concrete fields defined.

### 6.4 Project Detail

The spec says projects should center on "current plan, memory, readiness, open loops, and recommended next move." The "recommended next move" is the hardest part of this entire redesign and gets one bullet point. What generates the recommendation? What inputs does it consider? Can the user override or dismiss it? Is it always visible or only when relevant?

**Pushback:** "Recommended next move" is either the killer feature or vaporware. Spec it completely or remove it from the project detail definition.

### 6.5 Inbox

The spec correctly limits Inbox to operational attention. But it also says the system should detect unfinished work and unresolved commitments as open loops. If open loops are separate from Inbox, then Inbox becomes very narrow — just approvals, failures, and blocked work. That may not be enough content to justify a dedicated surface.

**Pushback:** Evaluate whether Inbox should be merged into Home as a section rather than existing as a standalone page. If the open loop model works, Inbox might not need to exist independently.

### 6.6 `/chat` as history/recovery/search

Demoting `/chat` to history/search is correct if the copilot panel genuinely works as the primary interaction surface. But the spec doesn't address what happens on mobile. The spec says mobile uses "full-screen assistant takeover" — which means on mobile, the assistant *is* a full-page chat. So `/chat` is simultaneously demoted (desktop) and promoted (mobile). This is a coherence problem.

**Pushback:** Define the mobile interaction model explicitly. If mobile is full-screen chat, then the mobile IA is fundamentally different from desktop, and the spec needs to address that rather than hand-waving "full-screen assistant takeover."

---

## 7. What The Spec Still Has Right

These elements should be preserved and protected during revision:

- **Project as the durable context layer.** This is the correct anchor. Every surface should resolve to a project. Do not weaken this.
- **Chat as control plane (the concept, not the current implementation).** The intent is correct even though the protocol is missing. Don't retreat to forms-first.
- **Plan-derived cards (the concept).** Manual card assembly is the wrong model for AI-forward execution. The derivation pipeline needs to be specified, but the direction is right.
- **Review Queue as a separate, judgment-focused surface.** This is the strongest part of the current design. It correctly separates evaluation from operations.
- **Workspace as explicit, gated execution context.** The two-stage model (planning-only → workspace-ready) prevents premature execution coupling. Keep the gate explicit.
- **Open loops as a concept.** The idea that the system should track unresolved commitments is a genuine product insight. The model needs a lifecycle, but the instinct is sound.
- **Forms as advanced fallback, not primary entry.** This is the right default. Do not let implementation pressure reverse it.
- **"The app should not feel like a traditional app with AI layered on top."** This is the correct north star. Every spec decision should be evaluated against it.

---

## 8. Required Revisions Before Implementation

These must be resolved before any page-level implementation begins:

1. **Define the intent taxonomy and routing protocol for the control plane.** List every intent the system supports, how each is identified, and where each routes. This is the spec's load-bearing wall.

2. **Define the attention-routing table.** For each class of attention item, designate one primary surface and define reference behavior for other surfaces.

3. **Define the plan data structure and card derivation pipeline.** Schema, triggers, approval flow, change propagation.

4. **Define the conversation lifecycle.** Statuses, types, transition triggers, archival rules, and the relationship between copilot interactions and persistent conversations.

5. **Define the open loop lifecycle.** Creation sources, urgency classification, resolution triggers, escalation rules, and boundaries with Inbox and blocked cards.

6. **Define the proposal schema and confirmation protocol.** What a proposal contains, what confirmation commits, partial-confirmation behavior, and undo/rollback.

7. **Define the review-rejection-to-follow-up pipeline.** What objects are created on rejection, where they go, and how they connect to the original.

8. **Define the Home ranking function.** How items are prioritized and why the top item is the top item.

9. **Define the mobile interaction model.** If mobile is fundamentally different from desktop, spec it as a variant, not an afterthought.

10. **Resolve the Board contradiction.** Either plan-grouped or status-grouped as the default. Pick one.

---

## 9. Optional But High-Value Improvements

These are not blocking but would significantly strengthen the redesign:

- **Define a "delegation receipt" pattern.** When the user delegates work via copilot, the system should produce a visible, persistent receipt (not just a chat message) showing what was delegated, to which project, with what spec, and the expected completion signal. This makes the control plane tangible.

- **Add a "project pulse" to Project Detail.** A single computed indicator showing: how active this project is, whether it's on track, and whether anything is stuck. This replaces the need for users to scan multiple sections to assess project health.

- **Define conversation "working context" extraction.** If conversations are supposed to build project memory, define how and when conversation content gets promoted to project-level context (playbook, learning, plan). Without this, conversations stay siloed and project memory depends on the user manually updating it.

- **Add an explicit "hand back to me" action.** The spec is heavily oriented toward delegation. Define the pattern for when the user wants to take over execution mid-stream — pick up a card themselves, pause an agent, or convert a delegated task to manual work. The absence of this creates a one-way ratchet toward AI execution that will frustrate power users.

- **Define the "nothing to do" state.** What does Home look like when everything is on track, no reviews are pending, and no loops are open? If the answer is "empty," that's a missed opportunity. If the answer is "suggest proactive work," define how.

- **Consider making the plan the primary Board view.** Instead of status lanes with plan as a filter, make the plan outline the default Board structure with status badges on each item. This would be a genuine departure from kanban-as-default and would align with "plan-derived execution" more honestly.

---

*End of rider document.*
