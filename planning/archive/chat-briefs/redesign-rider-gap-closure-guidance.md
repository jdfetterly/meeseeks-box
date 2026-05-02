# Meeseek Box Redesign — Gap Closure Guidance

**Date:** 2026-03-25
**Status:** Detailed implementation guidance — companion to rider feedback document
**Purpose:** For each gap identified in the rider, this document provides a concrete recommendation for how to close it. Intended for direct use in spec revision.

---

## Table of Contents

1. Control Plane Protocol
2. Attention Routing Table
3. Plan Schema and Card Derivation Pipeline
4. Conversation Lifecycle
5. Open Loop Lifecycle
6. Proposal Schema and Confirmation Protocol
7. Review-Rejection-to-Follow-Up Pipeline
8. Home Ranking Function
9. Mobile Interaction Model
10. Board View Model
11. Delegation-Readiness Checklist
12. First-Run and Zero-State Design
13. Surface Handoff Protocol
14. Delegation Receipt Pattern
15. Project Pulse
16. Conversation-to-Project-Memory Extraction
17. "Hand Back To Me" Action
18. "Nothing To Do" State
19. Plan as Primary Board View

---

## 1. Control Plane Protocol

### The problem
Chat is declared the control plane but has no intent taxonomy, no context injection model, no conversation-to-action binding, and no error/fallback protocol. An engineer implementing this today would build a generic chatbot that creates objects via function-calling. That is not a control plane.

### Recommended approach

#### 1.1 Intent taxonomy

Define a closed set of intents the system recognizes. Every user utterance in the copilot must resolve to one of these, or to `unclear`. The taxonomy should be organized by domain object, not by surface.

**Project intents:**
- `project.create` — Create a new project from a description of goals
- `project.update` — Change project metadata, playbook, or learning
- `project.plan` — Start or revise the current plan for a project
- `project.bind_workspace` — Attach an existing repo/directory
- `project.bootstrap_workspace` — Scaffold a new workspace

**Card intents:**
- `card.create` — Create a new card (should usually be derived from plan, but allow direct)
- `card.update` — Edit an existing card's spec, priority, or metadata
- `card.delegate` — Hand a card to the agent for execution
- `card.split` — Break a card into smaller cards
- `card.close` — Mark a card done or cancelled

**Schedule intents:**
- `schedule.create` — Set up a new recurring or one-shot schedule
- `schedule.update` — Change an existing schedule
- `schedule.pause` — Temporarily disable
- `schedule.resume` — Re-enable
- `schedule.delete` — Remove

**Review intents:**
- `review.approve` — Accept an output
- `review.reject` — Request changes (triggers follow-up pipeline)
- `review.comment` — Add feedback without a disposition

**Open loop intents:**
- `loop.create` — Manually flag something as an open loop
- `loop.resolve` — Mark an open loop resolved
- `loop.snooze` — Defer an open loop to a later time

**System intents:**
- `navigate` — Go to a specific page or object
- `search` — Find something across projects, cards, conversations
- `explain` — Ask the system to explain what's happening with an object
- `unclear` — System cannot resolve intent; triggers clarification flow

**Why a closed taxonomy matters:** Without it, the agent will attempt to handle open-ended requests ("make my project better") by guessing, which breaks the `intent -> outcome` contract. A closed taxonomy forces the agent to map every input to a concrete action or explicitly ask for clarification.

#### 1.2 Context injection rules

The copilot panel should inject context based on three factors: current page, current selection, and active project. Define the precedence:

| User is on... | Default project context | Default object context |
|---|---|---|
| Home (no selection) | None — agent asks or infers from conversation | None |
| Home (attention item selected) | The item's project | The item itself |
| Project Detail | That project | None (unless a section is focused) |
| Board (no card selected) | The active project filter, or ask | None |
| Board (card selected) | The card's project | The card |
| Review Queue (item selected) | The item's project | The review item |
| Schedules (schedule selected) | The schedule's project | The schedule |
| Work Detail | The card's project | The card |

**Rule:** If context is ambiguous (e.g., Board with multi-project view, no card selected), the copilot should state what it's assuming and let the user correct it in one turn. Never silently assume context the user hasn't signaled.

**Rule:** Context injection should be visible. The copilot panel should show a small context badge (e.g., "Working in: Project X / Card #42") that the user can tap to change. This makes context tangible, not invisible.

#### 1.3 Conversation-to-action binding

When the agent resolves an intent and gathers sufficient input, it produces a **proposal**. The proposal is a structured preview of what the system will do. The user confirms, edits, or rejects.

**Proposal lifecycle:**
1. Agent identifies intent → gathers missing info (1-2 turns max)
2. Agent renders a proposal card (not a chat message — a structured UI element embedded in the conversation)
3. User can: **Confirm** (system executes), **Edit** (opens the proposal for inline modification), or **Cancel** (discards)
4. On Confirm, the system creates/modifies the underlying objects and posts a confirmation receipt in the conversation

**Partial confirmation:** A user should be able to edit any field in the proposal before confirming. "Yes but change the project" is an edit-then-confirm, not a new turn. The proposal card must be field-editable.

**Batched proposals:** If the agent detects multiple actions from one utterance (e.g., "create three cards for the auth work"), it should produce one proposal with multiple items, not three sequential proposals. The user confirms the batch.

#### 1.4 Fallback triggers

The system should fall back to forms (or route the user to the appropriate detail page) in these cases:

- **Bulk editing.** Editing 5+ cards at once is faster via a table/form than via conversation.
- **Complex workspace configuration.** Bind/bootstrap flows that require file pickers, branch selection, or scaffold configuration should use a structured form after the initial conversational setup.
- **Agent uncertainty.** If the agent cannot resolve intent after 2 clarification turns, it should offer: "I'm not sure what you're asking. Would you like to [do X] or [open the form to configure this manually]?"
- **User preference.** Any user who says "just show me the form" should get the form immediately, no friction.

**Critical rule:** Fallback is not failure. The system should present it as "here's a faster way to do this" not "I can't help you." The tone matters because it shapes whether users trust the conversational path next time.

---

## 2. Attention Routing Table

### The problem
Home, Board, Project Detail, and Inbox all claim to surface what needs attention. Without a routing table, every surface shows everything and none feel distinct.

### Recommended approach

Define one **primary owner** per attention class. Other surfaces may show a **badge count** or **reference link**, but not the full item.

| Attention class | Primary surface | Secondary surfaces (badge only) | Notes |
|---|---|---|---|
| Review item ready | Review Queue | Home (count + top item), Project Detail (count) | Home links to Review Queue, not to the item directly |
| Card blocked (workspace missing) | Project Detail (workspace section) | Board (blocked badge on card), Inbox (if blocked > 24h) | Primary owner is the project because it's a project-level problem |
| Card blocked (dependency) | Board (blocked badge + tooltip) | Project Detail (open loops section) | Board is primary because it's an execution-level problem |
| Schedule failed | Inbox | Home (count), Schedules (health badge) | Inbox is primary because this is operational intervention |
| Schedule missed | Inbox | Home (count), Schedules (health badge) | Same as above |
| Approval needed | Inbox | Home (count) | Inbox owns all approval flows |
| Open loop (stale) | Home (briefing section) | Project Detail (open loops section) | Home is primary because open loops are cross-project attention |
| Open loop (active, not stale) | Project Detail (open loops section) | — | Not shown elsewhere until it ages |
| Agent execution in progress | Board (progress badge on card) | Home (active work summary) | Board is primary for active execution |
| Agent execution completed | Review Queue (new item) | Home (count), Board (card moves to In Review lane) | Completion always routes to Review |

**Key design rule:** Home shows *counts and the single most important item* for each attention class. It does not render full lists. The user clicks through to the primary surface for the full view. This keeps Home as a briefing, not a dashboard.

**Key design rule:** Inbox only contains items that require *user intervention to unblock the system*. If the system can continue without the user, it doesn't go to Inbox. This keeps Inbox narrow and high-signal.

---

## 3. Plan Schema and Card Derivation Pipeline

### The problem
"Cards should be derived from the plan" is a core claim with zero mechanical specification. The plan has no defined data structure, and the derivation pipeline has no triggers or approval flow.

### Recommended approach

#### 3.1 Plan data structure

The plan should be a structured document, not free text. Recommended schema:

```
Plan
├── goal: string (what success looks like for this project)
├── sections: Section[]
│   ├── title: string (initiative or workstream name)
│   ├── description: string (what this section accomplishes)
│   ├── items: PlanItem[]
│   │   ├── title: string
│   │   ├── description: string
│   │   ├── sizing: "small" | "medium" | "large"
│   │   ├── status: "not_started" | "card_created" | "in_progress" | "done"
│   │   ├── linked_card_id: string | null
│   │   ├── dependencies: PlanItem[] (references to other items)
│   │   └── acceptance_criteria: string[]
│   └── order: number
└── last_revised: timestamp
```

**Why structured, not free text:** If the plan is markdown or prose, derivation requires the LLM to re-parse it every time, which is fragile. A structured plan lets the system deterministically track which items have cards and which don't.

**How the plan is created:** The plan should be authored through conversation. The user describes what they want to accomplish. The agent produces a structured plan as a proposal (using the proposal schema from Section 1). The user confirms, edits, or revises. The plan is then persisted as a project-level object.

**How the plan is revised:** The user says "I want to add X to the plan" or "let's restructure the auth section." The agent produces a diff-style proposal showing what changes. The user confirms. Existing cards linked to unchanged plan items are unaffected.

#### 3.2 Derivation pipeline

**Trigger:** Derivation happens in two modes:
1. **On plan creation/revision.** When the plan is confirmed or updated, the system identifies plan items that don't have linked cards and proposes card creation.
2. **On demand.** The user says "create cards for the auth section" and the system derives cards from those plan items.

**Derivation flow:**
1. System identifies un-carded plan items
2. For each item, system produces a card proposal (title, spec, acceptance criteria, sizing estimate, project assignment)
3. Proposals are presented as a batch (not one at a time)
4. User confirms the batch, edits individual cards, or removes items from the batch
5. On confirm, cards are created and `linked_card_id` is set on the plan items

**Change propagation rules:**
- If a plan item is revised and its linked card is in `To Do`, the card spec is updated (with a notification to the user showing what changed).
- If a plan item is revised and its linked card is `In Progress`, the system creates an open loop: "Plan changed while card #X is in progress — review needed." The card is *not* auto-updated because work is underway.
- If a plan item is deleted and its linked card is `To Do`, the system proposes cancelling the card.
- If a plan item is deleted and its linked card is `In Progress` or `In Review`, the system creates an open loop rather than cancelling.

**Why this matters:** Without propagation rules, the plan and the board will drift apart within a week. The plan becomes decoration and cards become manually managed, which is exactly the traditional app pattern.

---

## 4. Conversation Lifecycle

### The problem
The spec gives conversations rich attributes (status, summaries, linked objects, branches) but never defines the lifecycle mechanics.

### Recommended approach

#### 4.1 Conversation types

Define four conversation types with different default behaviors:

| Type | Created when... | Default lifecycle | Auto-close rule |
|---|---|---|---|
| **Planning** | User starts a planning discussion in a project context | Stays open until explicitly resolved | Suggest close when plan is confirmed and no open threads |
| **Delegation** | A card is delegated via copilot | Active during execution | Auto-close when card moves to Review or Done |
| **Review** | User starts a review discussion on a review item | Active during review | Auto-close when review disposition is set |
| **Ad-hoc** | User asks a question, requests navigation, or does anything that doesn't map to the above | Short-lived | Auto-close after 24 hours of inactivity |

**Why types matter:** Without them, the conversation list becomes a mix of 5-minute utility exchanges and months-long planning threads. Types let the system present and archive them differently.

#### 4.2 Conversation statuses

- **Active** — Ongoing, visible in the conversation list and in project context
- **Paused** — User explicitly paused; hidden from default list, but preserved
- **Resolved** — Conversation purpose is complete; visible in history, not in active list
- **Archived** — System-archived after inactivity; recoverable via search

**Transitions:**
- Active → Paused: User action only
- Active → Resolved: User action, or auto-triggered by auto-close rule
- Active → Archived: System-triggered after 30 days of Resolved status, or 7 days of inactivity for Ad-hoc type
- Paused → Active: User action
- Resolved → Active: User reopens (e.g., "I have more to add to this planning discussion")
- Archived → Active: User reopens from search/history

#### 4.3 Linked objects

**Who creates links:** The system creates links automatically when a conversation results in object creation or modification. For example:
- User creates a card via copilot in a Planning conversation → the card is linked to that conversation
- User delegates a card → the Delegation conversation links to the card, the run, and the review item when it's created

**What happens on deletion:** If a linked object is deleted, the link becomes a tombstone ("Card #42 — deleted") rather than breaking. The conversation retains its history.

**Display:** Linked objects appear as a collapsible sidebar section in the conversation view. On Project Detail, each conversation's linked objects are shown as chips.

#### 4.4 Branch mechanics

Keep branching simple for v1:

- A **branch** creates a new conversation that references the parent conversation and copies its context summary (not the full message history).
- The parent conversation gets a "branched into: [new conversation]" marker.
- Branches are independent — no merge. If you branch from a planning conversation to explore an alternative approach, and then decide to go with it, you manually close the original and continue in the branch.
- Linked objects do not transfer on branch. The branch starts clean.

**Why no merge:** Merge is genuinely hard and rarely needed. Users branch to explore alternatives. They pick one. The simpler model is: branch, explore, decide, close the loser.

#### 4.5 "Grouped by project and role" — clarified

Drop "role" as a grouping axis. It's under-specified and will cause confusion. Instead:

- **Primary grouping:** By project
- **Secondary grouping:** By conversation type (Planning, Delegation, Review, Ad-hoc)
- **Tertiary sort:** By status (Active first, then Paused, then Resolved)

This gives the conversation list a clear hierarchy without introducing a new concept ("role") that needs its own definition.

#### 4.6 Conversation cleanup

**Rule:** The system should surface a "resolve this?" prompt when:
- A Planning conversation has had no activity for 14 days
- A Delegation conversation's linked card is Done and has been for 3 days
- An Ad-hoc conversation has had no activity for 48 hours

**Rule:** Resolved conversations auto-archive after 30 days. Archived conversations are searchable but not listed in the default view.

**Rule:** The system should never auto-delete conversations. Archive only.

---

## 5. Open Loop Lifecycle

### The problem
Open loops are described as first-class but have no creation taxonomy, resolution protocol, escalation model, or clear boundary with Inbox items and blocked cards.

### Recommended approach

#### 5.1 Creation taxonomy

Open loops are created from four sources. Each source has a different urgency profile:

| Source | Example | Default urgency | Auto-created? |
|---|---|---|---|
| **Conversation extraction** | Agent detects "I still need to figure out the auth approach" | Medium | Yes — agent proposes, user confirms |
| **Review rejection** | User says "this needs changes" on a review item | High | Yes — automatic |
| **Plan-execution drift** | Plan item changed while linked card is in progress | Medium | Yes — automatic |
| **Manual creation** | User explicitly flags something as an open loop | User-set | No — user initiates via copilot or UI |

**What is NOT an open loop:**
- Schedule failures → these are Inbox items (operational intervention)
- Approval requests → these are Inbox items (operational intervention)
- Blocked cards (workspace missing) → these are project-level issues shown on Project Detail

The boundary rule: **Open loops represent unresolved commitments or decisions. Inbox items represent system events requiring intervention.** If it's a commitment, it's a loop. If it's a runtime event, it's an Inbox item.

#### 5.2 Open loop schema

```
OpenLoop
├── id: string
├── title: string (what's unresolved)
├── description: string (context on why this matters)
├── source_type: "conversation" | "review_rejection" | "plan_drift" | "manual"
├── source_id: string (link to the originating object)
├── project_id: string
├── urgency: "low" | "medium" | "high"
├── status: "open" | "snoozed" | "resolved"
├── snoozed_until: timestamp | null
├── created_at: timestamp
├── last_surfaced_at: timestamp
├── resolution_note: string | null
└── linked_objects: ObjectRef[] (cards, conversations, review items)
```

#### 5.3 Resolution protocol

| Resolution type | Trigger | What happens |
|---|---|---|
| **Manual resolve** | User marks it resolved via copilot or UI | Status → resolved, user prompted for optional resolution note |
| **Auto-resolve** | Linked object reaches terminal state (card Done, review Approved) | Status → resolved, system generates resolution note |
| **Suggested resolve** | Agent detects that conditions have changed and suggests resolution | Agent posts suggestion in linked conversation; user confirms |
| **Snooze** | User snoozes to a specific date | Status → snoozed, reappears on snooze date |

**Rule:** No time-based expiration. Open loops do not expire. If they become irrelevant, the user resolves them or the system auto-resolves based on linked object state. This prevents the system from silently dropping commitments.

#### 5.4 Escalation model

| Condition | Escalation behavior |
|---|---|
| Open loop unresolved for 7 days | Promoted to Home briefing (moves from Project Detail to the "Open loops need attention" section on Home) |
| Open loop unresolved for 14 days | Urgency auto-upgraded one level (Medium → High) |
| High-urgency open loop unresolved for 7 days | Generates an Inbox item: "Open loop requires resolution" with a link to the loop |
| Open loop linked to a card that's about to be delegated | Delegation-readiness check blocks delegation until the loop is resolved or explicitly overridden |

**Why this matters:** Without escalation, open loops become a graveyard. The system needs to progressively nag. But the escalation should be predictable (rule-based), not surprising (AI-decided).

---

## 6. Proposal Schema and Confirmation Protocol

### The problem
The spec says the agent "drafts a structured proposal" and the user "confirms once." But there's no schema, no partial-confirmation model, and no undo.

### Recommended approach

#### 6.1 Proposal schema

A proposal is a structured UI element rendered inside a conversation. It is NOT a chat message. It has a defined schema:

```
Proposal
├── intent: string (from the intent taxonomy, e.g., "card.create")
├── summary: string (one-line human description of what this will do)
├── fields: ProposalField[]
│   ├── key: string
│   ├── label: string
│   ├── value: any
│   ├── editable: boolean
│   └── source: "user_provided" | "agent_inferred" | "system_default"
├── items: ProposalItem[] (for batched proposals, e.g., multiple cards)
├── status: "pending" | "confirmed" | "edited" | "cancelled"
├── warnings: string[] (e.g., "This project has no workspace — card will not be executable")
└── created_at: timestamp
```

**Field source visibility matters.** The user should be able to see which values they provided, which the agent inferred, and which are system defaults. This builds trust. Inferred values should be visually distinct (e.g., lighter text, "inferred" label) so the user knows to check them.

#### 6.2 Confirmation protocol

1. **Confirm** — All fields are accepted. System executes. A confirmation receipt replaces the proposal in the conversation.
2. **Edit + Confirm** — User taps a field, changes the value inline, then confirms. The proposal status moves to "edited" then "confirmed."
3. **Cancel** — Proposal is discarded. Conversation continues. No objects created.

**Partial confirmation is edit-then-confirm.** The user doesn't confirm "part" of a proposal — they edit the parts they disagree with and then confirm the whole thing. This is simpler than partial acceptance.

**Batched proposals:** For multi-item proposals (e.g., creating 4 cards from a plan section), the user can remove individual items before confirming the batch. The remaining items are created.

#### 6.3 Undo model

- **Within 30 seconds of confirmation:** "Undo" button appears on the confirmation receipt. Clicking it deletes the created objects and restores the proposal to editable state.
- **After 30 seconds:** No automatic undo. The user must explicitly delete/modify the created objects through normal flows (copilot or detail pages).
- **Exception:** If a delegated card has already started agent execution, undo is not available. The user must cancel the run instead.

**Why 30 seconds and not longer:** The longer the undo window, the more complex the state management. Objects created by a proposal may immediately trigger downstream effects (a card delegation starts a run, a schedule fires). Keeping the undo window short limits the blast radius.

---

## 7. Review-Rejection-to-Follow-Up Pipeline

### The problem
The spec says Review is "the center of completion and follow-up generation" but doesn't define what happens on rejection.

### Recommended approach

#### 7.1 Review dispositions

| Disposition | What happens |
|---|---|
| **Approve** | Card → Done. Review item → Approved. Plan item status → Done. |
| **Approve with notes** | Same as Approve, but notes are attached to the card and surfaced in project memory. |
| **Request changes** | Triggers follow-up pipeline (below). |
| **Reject** | Card → Cancelled. Review item → Rejected. Plan item status → reverts to "not_started." Open loop created: "Rejected work — needs replanning." |

#### 7.2 "Request changes" flow

This is the most important disposition because it's the most common.

1. User selects "Request changes" and provides feedback (free text, or structured: "fix X, change Y, add Z").
2. System creates a **new card** (not a reopened card). The new card:
   - Title: "Follow-up: [original card title]"
   - Spec: Includes the original card's spec + the rejection feedback + a diff reference to the original output
   - Linked to: The original card (as a follow-up), the review item, and the review conversation
   - Status: To Do
   - Plan item link: Same plan item as the original (the plan item status reverts to "card_created")
3. The original card stays in **Done** with a status note: "Follow-up created: [new card link]." It does not revert to In Progress. This preserves history — you can always see what the agent produced and what feedback was given.
4. An open loop is created: "Follow-up work pending for [original card title]" (urgency: High, source: review_rejection).
5. The new follow-up card appears on the Board in To Do and is immediately eligible for delegation.

**Why a new card, not a reopened one:** Reopening conflates two pieces of work. The original attempt is a historical artifact worth preserving — it shows what the agent tried and what the feedback was. The follow-up is a new piece of work with new context (the rejection feedback). Keeping them separate makes the audit trail clean and makes it possible to compare the two outputs.

#### 7.3 Follow-up delegation shortcut

After the follow-up card is created, the Review surface should offer a one-tap action: "Delegate follow-up now." This opens the copilot with the follow-up card pre-loaded, ready for delegation. The user confirms (via the normal proposal flow) and the agent starts a new run with the updated spec and feedback context.

---

## 8. Home Ranking Function

### The problem
Without a ranking algorithm, Home renders as five unranked lists — which is a dashboard, not a briefing.

### Recommended approach

Home should have one **hero slot** at the top (the single most important item) and then ranked sections below.

#### 8.1 Hero slot selection

The hero slot is selected by the following priority waterfall. The first match wins:

1. **Inbox item requiring immediate intervention** (failed run, approval needed, blocked work > 24h) → "Your attention is needed: [item description]"
2. **Review items ready** (oldest first) → "You have [N] outputs ready for review. Oldest: [item]"
3. **High-urgency open loop overdue** → "[Open loop title] has been unresolved for [N] days"
4. **Card ready for delegation** (workspace ready, spec complete, no blocking loops) → "Ready to delegate: [card title] on [project]"
5. **No items match** → See "Nothing to do" state (Section 18)

#### 8.2 Section ordering

Below the hero slot, sections render in this order (empty sections are hidden, not shown as empty):

1. **Needs intervention** — Inbox items that require action. Count badge. Links to Inbox.
2. **Ready for review** — Review items. Count badge. Shows top 3. Links to Review Queue.
3. **Open loops** — Only stale loops (>7 days). Count badge. Shows top 3. Links to Project Detail.
4. **Active projects** — Projects with in-progress cards. Shows project name + card count + agent status. Links to Project Detail.
5. **Recent completions** — Cards that moved to Done in the last 48 hours. Shows project + card title. Informational only.

**What Home should never show:** Raw schedule configuration. Card-level detail. Conversation history. Workspace health. These belong on their respective surfaces.

#### 8.3 Why this works as a briefing

The hero slot answers "what is the single most important thing right now." The sections answer "what else should I know." The waterfall ensures that intervention needs always outrank review needs, which always outrank open loops, which always outrank proactive delegation. This is a defensible ranking because it matches the user's actual decision priority: fix what's broken → evaluate what's done → close what's hanging → advance what's next.

---

## 9. Mobile Interaction Model

### The problem
The spec says mobile uses "full-screen assistant takeover," which means the assistant is a full-page chat on mobile. This simultaneously demotes `/chat` on desktop and promotes it on mobile, creating a coherence problem.

### Recommended approach

Accept that mobile and desktop have different interaction models, and spec them explicitly as variants.

#### 9.1 Desktop model
- **Copilot panel:** Persistent right rail, always available, contextual
- **Surfaces:** Home, Board, Projects, Review, Inbox, Schedules all render fully
- **`/chat`:** History and search surface, not primary entry point

#### 9.2 Mobile model
- **Copilot:** Full-screen modal, invoked from any surface via a persistent floating action button (FAB)
- **Surfaces:** Home, Board, Projects, Review render as simplified views (fewer sections, collapsed detail)
- **`/chat`:** Accessible via a tab, functions as both history/search AND a way to start new interactions (because on mobile, full-screen chat IS the natural interaction pattern)
- **Key difference:** On mobile, `/chat` is not demoted. It's the secondary entry point after the FAB. Users can start new conversations from the chat tab or from the FAB — both are valid.

#### 9.3 What this means for the spec
- Every surface spec needs a "mobile behavior" subsection that defines: what sections are visible, what's collapsed, and how the copilot FAB interacts with the surface.
- The conversation list on mobile should be more prominent than on desktop (it's closer to a primary surface).
- Proposal cards and confirmation flows must work in full-screen chat context, not just in a side panel.

#### 9.4 What to defer
- Don't try to make mobile and desktop identical. They serve different usage contexts (desktop = working session, mobile = triage and review).
- Don't build a full mobile Board with drag-and-drop. Mobile Board should be read + delegate, not rearrange.
- Don't defer mobile as "phase 2." Spec it now even if you build it later, because mobile constraints will reveal problems in the data model.

---

## 10. Board View Model

### The problem
The spec wants "plan-derived execution" but defines traditional status lanes (To Do, In Progress, In Review, Done). These are contradictory defaults.

### Recommended approach

See Section 19 ("Plan as Primary Board View") for the full recommendation. Short version: make the plan outline the default Board structure, with status badges on each item. Preserve status lanes as an available secondary view.

The locked decision in the board spec says "Default board lanes: To Do, In Progress, In Review, Done." **This locked decision should be revisited.** If plan-derived execution is the design intent, the default view must reflect the plan, not status. Otherwise the "plan-derived" claim is purely backend — the user never sees it.

If the decision is to keep status lanes as the default, then be honest about what the Board is: a kanban board with cards that happen to link to plan items. That's fine. But don't call it "plan-derived execution" — call it "plan-linked kanban." The language shapes engineer and designer expectations.

---

## 11. Delegation-Readiness Checklist

### The problem
The spec defines workspace-readiness but delegation readiness is broader.

### Recommended approach

Before allowing "delegate with copilot" to proceed, the system should evaluate a concrete checklist. If any item fails, the system should tell the user what's missing and offer to fix it (via copilot) rather than silently blocking.

#### Delegation-readiness checklist

| Condition | Required? | If not met |
|---|---|---|
| Project has a workspace in `ready` state | Yes, for code-backed cards | "This project doesn't have a workspace yet. Want to set one up?" |
| Card has a spec with at least: title, description, and acceptance criteria | Yes | "This card needs more detail before delegation. Want to flesh it out?" |
| Card has no unresolved high-urgency open loops | Yes | "There's an open loop on this card: [loop title]. Resolve it first or override." |
| Card has no blocking dependencies on other in-progress cards | Warning | "Card #X depends on Card #Y which is still in progress. Delegate anyway?" |
| Project playbook is populated | Warning | "This project has no playbook yet. The agent will work without project-specific guidance. Set up playbook first?" |
| Card is not already delegated/in-progress | Yes | "This card is already being worked on." |

**Override behavior:** Warnings can be overridden. "Required" conditions cannot be bypassed — the user must resolve them first.

**Why this matters:** Without a readiness check, users will delegate half-baked cards, get bad outputs, and blame the system. The readiness check is quality control at the delegation gate. It reduces the volume of review rejections.

---

## 12. First-Run and Zero-State Design

### The problem
The spec doesn't define what happens when a user opens the app for the first time with no projects, no conversations, and no schedules.

### Recommended approach

#### 12.1 First-run Home

The Home hero slot should contain a single, action-oriented prompt:

> "What are you working on? Tell me about a project and I'll help you get started."

Below it, show 2-3 example starting points (not a tutorial, not a feature tour):
- "I have an existing codebase I want to work on"
- "I want to plan and build something new"
- "I want to automate a recurring task"

Each starting point opens the copilot with a pre-seeded context for that intent.

#### 12.2 First-run copilot

The copilot's first message should be warm but direct:

> "I'm your AI workspace. I can help you plan projects, create and delegate work, and review outputs. What would you like to work on?"

It should NOT give a feature tour or list capabilities. It should invite the user to state intent immediately.

#### 12.3 Zero-state surfaces

| Surface | Zero-state behavior |
|---|---|
| Home | Hero prompt (above). No sections rendered. |
| Projects | Empty state: "No projects yet. Start one from the assistant." + copilot FAB. |
| Board | Empty state: "Create a project first, then add work to your board." |
| Review | Empty state: "Nothing to review yet. Outputs will appear here when agent work is complete." |
| Inbox | Empty state: "All clear. Alerts and approvals will appear here." |
| Schedules | Empty state: "No schedules yet. Ask the assistant to set one up." |

**Key principle:** Every zero-state should make the next action obvious and achievable in one tap/utterance. Don't explain the surface — help the user fill it.

---

## 13. Surface Handoff Protocol

### The problem
If Home says "Review item ready on Project X," where does the user land when they tap it? No handoff target is defined.

### Recommended approach

Define exact navigation targets for each attention item type:

| Item on Home | Tap target | Arrival state |
|---|---|---|
| Review item ready | Review Queue, filtered to that project, with the item expanded | User can immediately read the summary and take action |
| Inbox item (failed run) | Inbox, with the item expanded | User sees failure details and action buttons |
| Inbox item (approval needed) | Inbox, with the item expanded | User sees approval context and approve/reject buttons |
| Open loop (stale) | Project Detail → Open Loops section, with the loop highlighted | User sees the loop in project context |
| Active project (with summary) | Project Detail | User sees full project state |
| Card ready for delegation | Board, filtered to that project, with the card selected and copilot pre-opened with `card.delegate` intent | User confirms delegation in one step |
| Recent completion | Review Queue, with the completed item expanded | User can review immediately |

**Design rule:** The handoff should drop the user into the *action state*, not the *reading state*. If they tapped an attention item, they want to act, not browse. Pre-open the relevant panel, pre-filter the relevant list, pre-select the relevant item.

---

## 14. Delegation Receipt Pattern

### The value
When a user delegates work via copilot, the confirmation is currently a chat message. Chat messages are ephemeral — they scroll away. A "delegation receipt" makes the control plane tangible by producing a persistent, visible record of what was delegated.

### Recommended approach

When a card is delegated, the system produces a **Delegation Receipt** that appears in three places:

1. **In the conversation** — as a structured card (not a chat message) showing: card title, project, spec summary, acceptance criteria, and expected completion signal.
2. **On the card detail page** — as a "Delegation" section showing: when it was delegated, the run status, and a link to the delegation conversation.
3. **On the Board** — as a status badge on the card: "Delegated [time ago] — [run status]."

The receipt should also include the agent's execution plan (if available) — a brief summary of what the agent intends to do. This gives the user visibility into *how* the work will be done, not just *that* it was started.

---

## 15. Project Pulse

### The value
Users currently need to scan multiple sections on Project Detail to assess project health. A single computed indicator replaces this.

### Recommended approach

**Project Pulse** is a single summary line displayed at the top of Project Detail and as a subtitle in the project list on Home. It's computed, not user-authored.

Format: `[Status emoji] [One-line summary]`

Examples:
- "On track — 3 cards in progress, 1 ready for review"
- "Needs attention — 2 open loops unresolved for >7 days"
- "Blocked — workspace not ready, 4 cards waiting"
- "Idle — no activity in 14 days"
- "Wrapping up — all plan items done, 1 review pending"

**Computation inputs:**
- Card statuses and counts
- Open loop count and max age
- Workspace readiness
- Days since last activity
- Review items pending
- Plan completion percentage

**Rule:** Pulse is always computed, never manually set. The user can't override it. This keeps it honest.

**Rule:** Pulse links to the most relevant section on Project Detail. If it says "Needs attention — 2 open loops," tapping it scrolls to the open loops section.

---

## 16. Conversation-to-Project-Memory Extraction

### The value
The spec says conversations build project context, but without a mechanism to promote conversation content to project-level memory, conversations stay siloed. The project playbook and learning become stale.

### Recommended approach

#### 16.1 Extraction triggers

The system should propose memory extraction in three cases:

1. **After a planning conversation is resolved.** "This planning conversation included decisions about [X]. Want to add them to the project playbook?"
2. **After a delegation conversation completes.** "The agent learned that [Y] during execution. Want to add this to project learning?"
3. **After a review conversation with substantive feedback.** "Your review feedback included guidance about [Z]. Want to save this as a project learning?"

#### 16.2 Extraction flow

1. System identifies extractable content (decisions, preferences, patterns, constraints)
2. System proposes a structured addition to either playbook or project learning
3. User confirms, edits, or dismisses
4. On confirm, the content is appended to the playbook or learning and linked to the source conversation

#### 16.3 What gets extracted

- **To playbook:** Decisions about architecture, technology choices, coding standards, design patterns, and process preferences.
- **To learning:** Things the agent got wrong and how to do them differently, user preferences discovered during review, edge cases to remember.

**Rule:** Extraction is always proposed, never automatic. The user controls what enters the project's permanent memory.

---

## 17. "Hand Back To Me" Action

### The value
The spec is oriented toward delegation but doesn't define the pattern for the user taking over. Without this, the system creates a one-way ratchet: once something is delegated, the user's only option is to review the output. Power users will want to intervene mid-stream.

### Recommended approach

Add an explicit "I'll take this" action available in three contexts:

#### 17.1 On a card in "To Do"
"I'll take this" removes the card from the delegation pipeline and marks it as user-assigned. The card stays on the Board but shows a "Manual" badge instead of "Ready to delegate." The agent does not touch it.

#### 17.2 On a card in "In Progress" (agent executing)
"I'll take this" pauses the current agent run (if possible) or lets it complete, then marks the card as user-assigned. The system preserves whatever the agent has done so far (partial output, commits, etc.) and surfaces it to the user: "Here's what the agent completed before you took over: [summary/diff]."

#### 17.3 On a follow-up card (from review rejection)
"I'll handle the follow-up" marks the follow-up card as user-assigned. This is particularly important because users will sometimes want to make the changes themselves rather than re-delegating.

**Board behavior:** User-assigned cards appear with a distinct badge. They do not show delegation-readiness indicators. They still move through lanes normally (the user manually moves them to In Review when done, and they still go to Review Queue for self-review or team review if applicable).

---

## 18. "Nothing To Do" State

### The value
The spec doesn't define what Home looks like when everything is on track. An empty Home is a missed opportunity.

### Recommended approach

When no attention items, review items, or open loops are pending, Home should show a **proactive briefing** instead of an empty state.

#### 18.1 Proactive briefing content

The hero slot becomes:

> "Everything's on track. Here's what's happening across your projects."

Below it, show:
1. **Project progress summary** — Which projects advanced since last visit, with deltas (e.g., "Project X: 2 cards completed, 1 new card derived from plan")
2. **Upcoming schedule runs** — Next 24 hours of scheduled work, so the user knows what's coming
3. **Idle projects** — Projects with no activity in 7+ days: "These projects haven't moved recently. Want to check in on one?"
4. **Suggested next delegations** — Cards that are ready to delegate but haven't been: "These cards are ready to go. Want to kick one off?"

#### 18.2 Design principle

The "nothing to do" state should feel like a calm day at the office, not a broken dashboard. It should still be useful — the user opens the app, sees that everything is fine, and either starts proactive work or closes the app. Both are valid outcomes.

---

## 19. Plan as Primary Board View

### The value
If cards are derived from the plan, the Board should reflect the plan structure by default. This is the most visible way to make "plan-derived execution" real instead of abstract.

### Recommended approach

#### 19.1 Default view: Plan outline

The Board default view renders the plan as a structured outline:

```
Project: Meeseek Box v2
Plan: AI-Forward Redesign

Auth Section
├── [Done ✓] Set up auth provider integration
├── [In Progress ⟳] Implement JWT token refresh
├── [To Do] Add role-based access control
└── [No card yet] Write auth documentation

API Section
├── [In Review ⏳] Design REST endpoint schema
├── [To Do] Implement CRUD endpoints
└── [Delegated 🤖] Build rate limiting middleware
```

Each line is a plan item. Items with linked cards show the card's status badge. Items without cards show "No card yet" and offer a one-tap "Create card" action.

**Interaction:** Tapping a plan item opens the card detail (if a card exists) or offers to create one. The copilot is always available for delegation.

#### 19.2 Secondary view: Status lanes

The traditional kanban view (To Do, In Progress, In Review, Done) is available as a toggle. Some users will prefer it for day-to-day execution. That's fine. But it's not the default.

#### 19.3 Why this is better

- **It makes the plan visible during execution.** Users can see which parts of the plan are progressing and which are stuck without switching to Project Detail.
- **It makes un-carded plan items visible.** The current kanban view only shows cards that already exist. The plan view shows the full intended scope.
- **It reinforces the mental model.** "The plan drives the work" is a claim the app makes. If the Board shows the plan, users internalize this. If the Board shows status lanes, users internalize kanban.
- **It reduces duplicate navigation.** Users won't need to bounce between Project Detail (to see the plan) and Board (to see card status).

#### 19.4 Risks

- Plan view requires a well-structured plan. If the plan is sparse or disorganized, the Board view will look bad. Mitigation: the system should flag when a plan is too thin to be useful as a Board view and suggest enriching it.
- Some projects won't have plans (ad-hoc or ops-oriented). Mitigation: for projects without a plan, the Board defaults to status lanes. The plan view is only available when a plan exists.

---

*End of gap closure guidance.*
