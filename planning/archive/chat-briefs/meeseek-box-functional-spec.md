# Meeseek Box — Functional Specification

**Version:** 1.0 Draft
**Date:** 2026-03-25
**Author:** Design lead (functional spec owner)
**Purpose:** Decision-complete functional specification for Meeseek Box redesign. Intended to be converted into TDD-style acceptance specs by a separate implementor.
**Scope:** v1 unless marked `[v1.1]`

---

## How To Read This Document

This spec is organized into testable units. Each numbered section is self-contained enough to be converted into an independent TDD spec file. Cross-references use section numbers (e.g., "see §3.2").

**Conventions:**
- `MUST` — Required for v1. Implementation cannot ship without this.
- `SHOULD` — Strongly recommended for v1. Can be deferred only with explicit justification.
- `MAY` — Optional for v1. Nice to have.
- `[v1.1]` — Explicitly deferred. Do not implement in v1. Spec included for context and to prevent v1 decisions that block v1.1.
- `[Multi-user hook]` — Single-user in v1, but the spec calls out where multi-user would change behavior.

---

## Table of Contents

1. Product Model
2. Control Plane Protocol
3. Plan and Card Derivation
4. Conversation Model
5. Open Loop Model
6. Review and Follow-Up Pipeline
7. Workspace Model
8. Home Surface
9. Project Detail Surface
10. Board Surface
11. Schedules Surface
12. Surface Handoff Protocol
13. Delegation and Execution
14. Mobile Variant
15. Zero-State and First-Run
16. Scope Decisions (v1 vs v1.1)

---

## 1. Product Model

This section defines every domain object, its relationships, lifecycle states, and transition rules.

### 1.1 Domain Objects

#### Project

The durable context container. Everything in the system belongs to a project.

```
Project
├── id: string
├── name: string
├── goal: string (what success looks like)
├── status: "planning" | "active" | "paused" | "completed" | "archived"
├── plan: Plan | null
├── playbook: Playbook
├── learnings: Learning[]
├── workspace: Workspace | null
├── pulse: ProjectPulse (computed, §9.5)
├── open_loops: OpenLoop[]
├── conversations: Conversation[] (linked, not owned — see §4)
├── created_at: timestamp
└── updated_at: timestamp
```

**Rules:**
- A project MUST have a name and goal at creation. All other fields are optional or system-generated.
- A project MUST NOT automatically create a workspace on creation (see §7).
- A project with no workspace is in "planning" mode. Code execution is not available.
- A project with a workspace in `ready` state MAY have cards delegated for execution.
- `status` transitions: planning → active (when first card is created or workspace is bound), active → paused (user action), paused → active (user action), active → completed (user action or all plan items done), any → archived (user action).
- A project is broader than a repo. A project MAY have a workspace, but a project is not defined by its workspace.

**[Multi-user hook]:** In v1, a project has one owner (the user). In multi-user, projects would have members and role-based access.

#### Plan

The structured planning artifact that drives card derivation.

```
Plan
├── id: string
├── project_id: string
├── goal: string (inherited from project, can be refined)
├── sections: PlanSection[]
├── version: number (increments on revision)
├── last_revised: timestamp
└── created_at: timestamp
```

```
PlanSection
├── id: string
├── title: string (initiative or workstream name)
├── description: string (what this section accomplishes)
├── order: number
└── items: PlanItem[]
```

```
PlanItem
├── id: string
├── title: string
├── description: string
├── sizing: "small" | "medium" | "large"
├── status: "not_started" | "card_created" | "in_progress" | "done" | "cancelled"
├── linked_card_id: string | null
├── dependencies: string[] (PlanItem IDs)
├── acceptance_criteria: string[]
└── order: number
```

**Rules:**
- A project MUST have at most one active plan at a time.
- The plan MUST be a structured object, not free text. This enables deterministic card derivation and drift detection.
- Plan items MUST track their linked card status. When a linked card's status changes, the plan item status MUST update (see §3.4).
- A plan MAY be created through conversation (recommended) or through a structured form (advanced fallback).
- Plan revisions MUST increment the version number and preserve previous versions for auditability `[v1.1: version history UI]`.

#### Card (WorkItem)

The unit of delegatable work. Cards are derived from plan items or created directly.

```
Card
├── id: string
├── project_id: string
├── plan_item_id: string | null (null if created outside a plan)
├── title: string
├── spec: string (what the agent should do — the "brief")
├── acceptance_criteria: string[]
├── status: "to_do" | "in_progress" | "in_review" | "done" | "cancelled"
├── assignment: "unassigned" | "agent" | "user"
├── sizing: "small" | "medium" | "large"
├── priority: "low" | "medium" | "high"
├── dependencies: string[] (Card IDs)
├── delegation_receipt: DelegationReceipt | null (§13.3)
├── follow_up_from: string | null (Card ID, if this is a follow-up from review rejection)
├── linked_conversations: string[] (Conversation IDs)
├── linked_review_item: string | null (ReviewItem ID)
├── open_loops: string[] (OpenLoop IDs)
├── created_at: timestamp
└── updated_at: timestamp
```

**Rules:**
- A card MUST have at minimum: title, spec, and at least one acceptance criterion to be eligible for delegation (see §13.1 delegation-readiness).
- A card with `assignment: "agent"` is being worked on by the agent. A card with `assignment: "user"` is being worked on by the user manually (see §13.5 "hand back to me").
- Status transitions: to_do → in_progress (delegation starts or user takes it), in_progress → in_review (agent completes or user submits), in_review → done (review approved or changes requested — original card stays done, a new follow-up card is created in to_do, see §6.3), any → cancelled (user action or plan item deleted).
- A card linked to a plan item MUST keep the plan item status in sync (see §3.4).
- Cards SHOULD be derived from plan items (see §3). Cards MAY be created directly via copilot for ad-hoc work, but this SHOULD be the exception.

#### ReviewItem

An output waiting for human judgment.

```
ReviewItem
├── id: string
├── card_id: string
├── project_id: string
├── title: string (inherited from card)
├── summary: string (agent-generated summary of what was done)
├── output_reference: OutputRef (link to artifacts, commits, files)
├── disposition: "pending" | "approved" | "approved_with_notes" | "changes_requested" | "rejected"
├── feedback: string | null (user's review feedback)
├── follow_up_card_id: string | null (if changes_requested, link to the follow-up card)
├── linked_conversation: string | null (Review conversation ID)
├── created_at: timestamp
└── resolved_at: timestamp | null
```

**Rules:**
- A ReviewItem MUST be created automatically when an agent-assigned card completes execution.
- A ReviewItem for a user-assigned card SHOULD be created when the user moves the card to `in_review`, but this is optional (user may self-approve). `[Multi-user hook: team review would make this mandatory]`
- Dispositions and their effects are defined in §6.
- A ReviewItem MUST link to the originating card and project.

#### Schedule

Standing delegated work.

```
Schedule
├── id: string
├── project_id: string | null (schedules MAY be project-linked or standalone)
├── name: string
├── purpose: string (why this schedule exists — what value it produces)
├── spec: string (what the agent does each run)
├── cadence: CadenceConfig (cron, interval, or trigger-based)
├── output_handling: "review_queue" | "auto_approve" | "notify_only"
├── status: "active" | "paused" | "disabled"
├── health: ScheduleHealth (computed)
├── last_run: RunSummary | null
├── next_run: timestamp | null
├── workspace_id: string | null (required for code-backed schedules)
├── usefulness_score: number | null (computed, see §11.3)
├── created_at: timestamp
└── updated_at: timestamp
```

```
ScheduleHealth
├── status: "healthy" | "degraded" | "failing"
├── consecutive_failures: number
├── last_success: timestamp | null
└── last_failure: timestamp | null
```

**Rules:**
- A schedule MUST have a name, purpose, spec, and cadence.
- A schedule with `output_handling: "review_queue"` MUST create a ReviewItem on each successful run.
- A schedule with `output_handling: "auto_approve"` creates a ReviewItem with `disposition: "approved"` automatically (visible in history, not in queue).
- Code-backed schedules MUST have a linked workspace in `ready` state.
- Schedule health MUST be computed from run history. `failing` = 3+ consecutive failures.
- When health is `failing`, the system MUST create an Inbox-class attention item on Home (see §8.3).

#### OpenLoop

An unresolved commitment or decision tracked by the system. Defined fully in §5.

#### Conversation

A project-linked, typed interaction thread. Defined fully in §4.

#### Workspace

The execution environment for code-backed work. Defined fully in §7.

### 1.2 Object Relationship Map

```
Project (1)
├── has one Plan (optional)
│   └── has many PlanSections
│       └── has many PlanItems
│           └── links to one Card (optional)
├── has many Cards
│   ├── links to one ReviewItem (when completed)
│   ├── links to one DelegationReceipt (when delegated)
│   └── links to many OpenLoops
├── has many Conversations (by project_id)
├── has many OpenLoops
├── has many Schedules (optional)
├── has one Workspace (optional)
├── has one Playbook
└── has many Learnings
```

### 1.3 Playbook and Learnings

```
Playbook
├── project_id: string
├── content: string (structured guidance for the agent)
├── sections: PlaybookSection[]
│   ├── title: string
│   └── content: string
└── updated_at: timestamp
```

```
Learning
├── id: string
├── project_id: string
├── content: string (what was learned)
├── source_type: "review_feedback" | "execution_discovery" | "user_authored" | "conversation_extraction"
├── source_id: string | null (conversation or review item that generated this)
├── created_at: timestamp
└── status: "active" | "dismissed"
```

**Rules:**
- The playbook MUST be visible and editable on Project Detail.
- Learnings MUST show their source so the user can trace why they exist.
- The system SHOULD propose new learnings after review feedback and delegation completion (see §16 conversation-to-memory extraction, `[v1.1]`).
- In v1, learnings are user-authored or proposed by the agent and confirmed by the user. No automatic insertion.

### 1.4 Shared Type Definitions

These types are referenced across multiple domain objects.

```
ObjectRef
├── type: "card" | "review_item" | "plan_item" | "schedule" | "conversation" | "open_loop"
├── id: string
├── title: string (display name, denormalized for UI)
└── status: string | null (current status of the referenced object, denormalized)
```

```
OutputRef
├── type: "commit" | "file" | "artifact" | "url"
├── ref: string (commit SHA, file path, artifact ID, or URL)
├── label: string (human-readable description)
└── diff_summary: string | null (for commits: one-line summary of changes)
```

```
Message
├── id: string
├── role: "user" | "agent" | "system"
├── content: string
├── proposal: Proposal | null (if this message contains a proposal, §2.5)
├── created_at: timestamp
└── metadata: object | null (extensible, for tool calls, status changes, etc.)
```

```
CadenceConfig
├── type: "cron" | "interval" | "manual"
├── cron_expression: string | null (if type is "cron", e.g., "0 9 * * 1-5")
├── interval_seconds: number | null (if type is "interval")
└── timezone: string (IANA timezone, e.g., "America/New_York")
```

```
RunSummary
├── run_id: string
├── status: "success" | "failure" | "cancelled"
├── started_at: timestamp
├── completed_at: timestamp | null
├── output_summary: string (one-line description of what the run produced)
├── error_message: string | null (if status is "failure")
└── review_item_id: string | null (if output was sent to review queue)
```

```
ScaffoldConfig
├── tech_stack: string (e.g., "nextjs", "express", "python-flask")
├── template: string | null (specific scaffold template name)
├── git_init: boolean
├── initial_branch: string (default: "main")
└── additional_options: object | null (extensible, template-specific options)
```

---

## 2. Control Plane Protocol

This section defines how the conversational control plane works: what it understands, how it responds, and when it falls back to structured UI.

### 2.1 Core Principle

The control plane follows one pattern: **intent → gather → propose → confirm → execute.**

1. User states intent (in natural language, in the copilot panel)
2. Agent identifies the intent from the taxonomy (§2.2)
3. Agent gathers any missing required information (1-2 turns max)
4. Agent renders a structured proposal (§2.5)
5. User confirms, edits, or cancels
6. System executes and posts a confirmation receipt

This pattern applies to every action in the system. There are no exceptions where the agent silently creates objects.

### 2.2 Intent Taxonomy

The system recognizes a closed set of intents. Every user utterance in the copilot MUST resolve to one of these, or to `unclear`.

#### Project intents
| Intent | Description | Minimum required input |
|---|---|---|
| `project.create` | Create a new project | Name, goal |
| `project.update` | Change project metadata, playbook, or settings | Project context + what to change |
| `project.plan` | Create or revise the project plan | Project context |
| `project.bind_workspace` | Attach an existing repo/directory | Project context + repo path |
| `project.bootstrap_workspace` | Scaffold a new workspace | Project context + tech stack/scaffold preferences |

#### Card intents
| Intent | Description | Minimum required input |
|---|---|---|
| `card.create` | Create a card (direct, not from plan) | Project context + title + spec |
| `card.update` | Edit a card's spec, priority, or metadata | Card context + what to change |
| `card.delegate` | Delegate a card to the agent | Card context (must pass readiness check §13.1) |
| `card.split` | Break a card into smaller cards | Card context |
| `card.close` | Mark done or cancel | Card context + disposition |
| `card.take` | User takes over a card ("hand back to me") | Card context |

#### Plan intents
| Intent | Description | Minimum required input |
|---|---|---|
| `plan.derive_cards` | Create cards from plan items | Project context + which items (or all un-carded items) |
| `plan.revise` | Modify plan structure or items | Project context + what to change |

#### Schedule intents
| Intent | Description | Minimum required input |
|---|---|---|
| `schedule.create` | Set up a new schedule | Purpose + spec + cadence |
| `schedule.update` | Modify an existing schedule | Schedule context + what to change |
| `schedule.pause` | Temporarily disable | Schedule context |
| `schedule.resume` | Re-enable | Schedule context |
| `schedule.delete` | Remove permanently | Schedule context + confirmation |

#### Review intents
| Intent | Description | Minimum required input |
|---|---|---|
| `review.approve` | Accept an output | Review item context |
| `review.approve_with_notes` | Accept with feedback for future work | Review item context + notes |
| `review.request_changes` | Request modifications (triggers follow-up) | Review item context + feedback |
| `review.reject` | Reject entirely | Review item context + reason |

#### Open loop intents
| Intent | Description | Minimum required input |
|---|---|---|
| `loop.create` | Manually flag an open loop | Description + project context |
| `loop.resolve` | Mark resolved | Loop context + optional note |
| `loop.snooze` | Defer to a later date | Loop context + snooze date |

#### System intents
| Intent | Description |
|---|---|
| `navigate` | Go to a specific page or object |
| `search` | Find something across the system |
| `explain` | Ask the system to explain an object's state |
| `unclear` | System cannot resolve intent |

### 2.3 Context Injection

The copilot panel MUST inject context based on the user's current location and selection. Context determines which project and object the agent assumes the user is referring to.

| User is on... | Default project context | Default object context |
|---|---|---|
| Home (no selection) | None — agent MUST ask or infer | None |
| Home (attention item focused) | The item's project | The item |
| Project Detail | That project | None (unless section is focused) |
| Board (no card selected) | Active project filter, or agent MUST ask | None |
| Board (card selected) | Card's project | The card |
| Review Queue (item selected) | Item's project | The review item |
| Schedules (schedule selected) | Schedule's project | The schedule |

**Rules:**
- The copilot panel MUST display a context badge showing current assumed context: "Working in: [Project Name]" and optionally "/ [Object name]".
- The user MUST be able to tap the context badge to change context.
- If context is ambiguous (e.g., Board with multi-project view, no card selected), the agent MUST state its assumption and allow correction in one turn: "I see you're on the Board with multiple projects. Which project are you referring to?"
- The agent MUST NOT silently assume context the user hasn't signaled when ambiguity exists.

### 2.4 Conversation-to-Action Routing

When the agent resolves an intent, it MUST route to the appropriate conversation type:

| Intent category | Conversation type | Lifecycle |
|---|---|---|
| `project.plan`, `plan.revise` | Planning | Long-lived, stays open |
| `card.delegate` | Delegation | Short-lived, auto-closes on card completion |
| `review.*` | Review | Anchored to review item, auto-closes on disposition |
| All others | Ad-hoc | Short-lived, auto-closes after 48h inactivity |

If a relevant conversation of the correct type already exists and is Active for the same project + object context, the agent SHOULD continue that conversation rather than creating a new one.

### 2.5 Proposal Schema

When the agent has gathered sufficient input, it MUST render a **proposal** — a structured UI element embedded in the conversation, not a plain text message.

```
Proposal
├── id: string
├── intent: string (from taxonomy)
├── summary: string (one-line human description)
├── fields: ProposalField[]
│   ├── key: string
│   ├── label: string
│   ├── value: any
│   ├── editable: boolean
│   └── source: "user_provided" | "agent_inferred" | "system_default"
├── items: ProposalItem[] (for batched proposals)
├── warnings: string[] (e.g., "This project has no workspace")
├── status: "pending" | "confirmed" | "edited" | "cancelled"
└── created_at: timestamp
```

**Rules:**
- Every field MUST show its source (`user_provided`, `agent_inferred`, `system_default`). Inferred values MUST be visually distinct so the user knows to check them.
- The user MUST be able to edit any editable field inline before confirming.
- For batched proposals (e.g., deriving multiple cards from plan items), the user MUST be able to remove individual items before confirming the batch.
- Warnings MUST be shown prominently but MUST NOT block confirmation (they are informational).

### 2.6 Confirmation Protocol

| Action | Behavior |
|---|---|
| **Confirm** | System executes. Proposal status → confirmed. Confirmation receipt replaces the proposal. |
| **Edit + Confirm** | User modifies field(s), then confirms. Proposal status → edited → confirmed. |
| **Cancel** | Proposal discarded. Conversation continues. No objects created. |

**Undo model:**
- Within 30 seconds of confirmation, an "Undo" button MUST appear on the confirmation receipt.
- Undo deletes the created objects and restores the proposal to `pending` state.
- Undo is NOT available if the confirmed action has already triggered downstream execution (e.g., agent run started). In that case, the user MUST cancel the run instead.
- After 30 seconds, the undo button disappears. The user modifies objects through normal flows.

### 2.7 Fallback Rules

The system MUST fall back to structured UI in these cases:

| Condition | Fallback behavior |
|---|---|
| Bulk editing (5+ items) | Offer to open a table/batch edit view |
| Complex workspace configuration (file pickers, branch selection) | Use structured form after initial conversational setup |
| Agent cannot resolve intent after 2 clarification turns | Offer: "Would you like to [best guess action] or [open the form]?" |
| User explicitly requests a form ("just show me the form") | Open the form immediately, no friction |

**Critical rule:** Fallback MUST be presented as "here's a faster way to do this" not "I can't help you." The tone shapes whether users trust the conversational path next time.

### 2.8 Agent Behavioral Rules

- The agent MUST NOT ask for information that exists in the project playbook, learnings, or current plan. It MUST use what it already knows.
- The agent MUST NOT ask more than 2 follow-up questions before producing a proposal. If it needs more, it SHOULD make reasonable inferences and mark them as `agent_inferred` in the proposal.
- The agent MUST NOT silently create repos, directories, workspaces, or any object without a confirmed proposal.
- The agent SHOULD explain what it is about to do before doing it, in one sentence, not a paragraph.

---

## 3. Plan and Card Derivation

This section defines how plans are created, how cards are derived from plans, and how plan changes propagate.

### 3.1 Plan Creation

**Primary flow (conversational):**
1. User opens copilot in a project context and states intent: "Let's plan this project" or "I want to add a plan"
2. Agent asks for high-level goals and scope (1-2 turns, referencing project goal if already set)
3. Agent produces a plan proposal: sections, items, sizing estimates, acceptance criteria
4. User reviews the plan proposal (can edit inline — add/remove/reorder sections and items)
5. User confirms. Plan is created and linked to the project.

**Fallback flow:** `[v1.1]` Structured plan editor where users can directly create sections and items via form UI.

**Rules:**
- A plan proposal MUST include at least one section with at least one item.
- Each plan item MUST have a title, description, sizing estimate, and at least one acceptance criterion.
- The agent SHOULD size items based on the spec-driven delivery model: small = <4 hours agent work, medium = 4-16 hours, large = >16 hours. Large items SHOULD be flagged for splitting.

### 3.2 Plan Revision

1. User states intent: "I want to change the plan" or "let's add a section for X"
2. Agent produces a revision proposal showing a diff: items added, removed, modified, reordered.
3. User confirms.
4. Plan version increments. Previous version is preserved.
5. Change propagation rules fire (§3.4).

**Rules:**
- The agent MUST show what's changing relative to the current plan, not just the new plan state.
- Revision proposals MUST flag affected cards: "Card #42 is linked to an item you're modifying."

### 3.3 Card Derivation

Card derivation turns un-carded plan items into board-ready cards.

**Trigger modes:**
1. **On plan creation/revision:** After a plan is confirmed or updated, the system SHOULD propose card derivation for un-carded items. This is a suggestion, not automatic.
2. **On demand:** User says "create cards for the auth section" or "derive all remaining cards." Agent produces a batch proposal.

**Derivation flow:**
1. System identifies plan items where `linked_card_id` is null and `status` is `not_started`.
2. For each item, the system produces a card proposal: title (from plan item), spec (expanded from plan item description + context from playbook), acceptance criteria (from plan item), sizing, priority (inferred from section order and dependencies).
3. Proposals are presented as a batch.
4. User can edit individual cards, remove items from the batch, or confirm all.
5. On confirm, cards are created. Each card's `plan_item_id` is set. Each plan item's `linked_card_id` and `status` are updated to `card_created`.

**Rules:**
- Derived cards MUST inherit acceptance criteria from the plan item but MAY expand them.
- The agent SHOULD use the project playbook to enrich card specs (e.g., coding standards, architectural preferences).
- Large plan items (sizing: "large") SHOULD trigger a split suggestion: "This item is large. Want me to break it into smaller cards?"
- A plan item that already has a linked card MUST NOT generate a duplicate card during derivation.

### 3.4 Change Propagation

When the plan changes, linked cards MUST be handled according to these rules:

| Plan change | Card status | Propagation behavior |
|---|---|---|
| Plan item revised | `to_do` | Card spec is updated. User is notified: "Card #X spec updated due to plan change." |
| Plan item revised | `in_progress` | Card is NOT updated. Open loop created: "Plan changed while Card #X is in progress — review needed." (urgency: medium) |
| Plan item revised | `in_review` or `done` | No propagation. The card reflects the plan as it was when work started. |
| Plan item deleted | `to_do` | System proposes cancelling the card. User confirms. |
| Plan item deleted | `in_progress` | Open loop created: "Plan item deleted while Card #X is in progress." (urgency: high). Card is NOT auto-cancelled. |
| Plan item deleted | `in_review` or `done` | No propagation. Card retains its history. |
| Plan item dependency added | any | If the dependency's linked card is not `done`, the dependent card gets a dependency badge. Delegation-readiness warns about the dependency (§13.1). |

### 3.5 Plan Item Status Sync

Plan items MUST stay in sync with their linked cards:

| Card status change | Plan item status |
|---|---|
| Card created | `card_created` |
| Card moved to `in_progress` | `in_progress` |
| Card moved to `done` (review approved) | `done` |
| Card cancelled | `not_started` (reverts, item is available for re-derivation) |
| Follow-up card created (from review rejection) | `card_created` (links to follow-up card) |

---

## 4. Conversation Model

This section defines how conversations work as project-linked, typed, lifecycle-managed objects.

### 4.1 Conversation Schema

```
Conversation
├── id: string
├── project_id: string | null (null for system-level conversations)
├── type: "planning" | "delegation" | "review" | "ad_hoc"
├── status: "active" | "paused" | "resolved" | "archived"
├── title: string (auto-generated from first intent, user-editable)
├── summary: string | null (distilled summary, see §4.4)
├── linked_objects: ObjectRef[] (cards, review items, plan items, schedules)
├── messages: Message[]
├── parent_conversation_id: string | null (if branched, see §4.5)
├── created_at: timestamp
├── updated_at: timestamp
└── resolved_at: timestamp | null
```

### 4.2 Conversation Types

| Type | Created when... | Default behavior | Auto-close rule |
|---|---|---|---|
| **Planning** | User starts `project.plan`, `plan.revise`, or any planning discussion | Stays open. Long-lived. | Suggest close when plan is confirmed and no open threads remain. |
| **Delegation** | A card is delegated via `card.delegate` | Short-lived. Tracks execution. | Auto-resolve when linked card moves to `in_review` or `done`. |
| **Review** | User starts `review.*` on a review item | Anchored to a review item. | Auto-resolve when review disposition is set. |
| **Ad-hoc** | User asks a question, requests navigation, `explain`, or anything not fitting above | Short-lived. Utility. | Auto-resolve after 48 hours of inactivity. |

**Rules:**
- The system MUST assign a type when a conversation is created. Type is determined by the initial intent.
- If a conversation changes purpose (user starts with a question and then wants to plan), the system SHOULD suggest creating a new Planning conversation rather than continuing in the Ad-hoc one: "Looks like you want to plan. Should I start a planning conversation for this project?"
- The copilot panel SHOULD continue an existing Active conversation of the same type and project/object context rather than creating a new one. If multiple Active conversations match, the copilot SHOULD ask which to continue.

### 4.3 Conversation Status Lifecycle

```
Active → Paused (user action: "pause this conversation")
Active → Resolved (user action, or auto-close rule triggers)
Active → Archived (system: 7 days inactivity for Ad-hoc type only)
Paused → Active (user action: "resume" or sends a new message)
Resolved → Active (user reopens: "I have more to add to this")
Resolved → Archived (system: 30 days after resolution)
Archived → Active (user reopens from search/history)
```

**Rules:**
- Only `Active` conversations appear in the default conversation list and on Project Detail.
- `Paused` conversations appear in a "Paused" section below Active.
- `Resolved` and `Archived` conversations are accessible via search and `/chat` history.
- The system MUST NOT auto-delete conversations. Archive only.

### 4.4 Distilled Summaries

**Creation trigger:** A summary MUST be generated when a conversation moves to `Resolved` status.

**Update trigger:** For `Active` Planning conversations, the summary SHOULD be regenerated after every 5 messages or after a proposal is confirmed — whichever comes first.

**Content:** The summary is LLM-generated and captures: what was discussed, what decisions were made, what objects were created or modified, and what remains open (if anything).

**Editability:** The user MAY edit the summary. Edited summaries are marked "user-edited" and are not auto-regenerated.

**Display locations:**
- Conversation list (as subtitle)
- Project Detail → Conversations section (as subtitle)
- Home briefing (for conversations that generated attention items)

### 4.5 Branching

`[v1.1]`

In v1, conversations are linear. Branching (forking a conversation to explore an alternative) is deferred.

**Why defer:** Branching adds complexity to the conversation list, the summary model, and linked object management. The v1 conversation model needs to prove itself before adding branches. If a user wants to explore an alternative, they can start a new Planning conversation and reference the original.

**v1.1 design intent:** Branch creates a new conversation that references the parent and copies the context summary. No merge. Branches are independent.

### 4.6 Linked Objects

**Who creates links:** The system creates links automatically when a conversation results in object creation or modification.

| Conversation action | Link created |
|---|---|
| Card created via proposal | Conversation → Card |
| Card delegated | Delegation conversation → Card, → Run |
| Review disposition set | Review conversation → ReviewItem |
| Plan created/revised | Planning conversation → Plan |
| Schedule created | Conversation → Schedule |
| Open loop created | Conversation → OpenLoop |

**Rules:**
- Links are bidirectional: the conversation references the object, and the object references the conversation.
- If a linked object is deleted, the link becomes a tombstone: "Card #42 — deleted." The conversation is not modified.
- Linked objects appear as a collapsible section in the conversation view.

### 4.7 Conversation Cleanup

The system SHOULD surface a "resolve this?" prompt when:
- A Planning conversation has had no activity for 14 days
- A Delegation conversation's linked card has been `done` for 3 days
- An Ad-hoc conversation has had no activity for 48 hours

The user can dismiss the prompt (it won't re-appear for 7 days) or resolve the conversation.

### 4.8 Conversation Grouping (in `/chat` and Project Detail)

- **Primary grouping:** By project (conversations with no project are grouped under "General")
- **Secondary grouping:** By type (Planning, Delegation, Review, Ad-hoc)
- **Sort:** Active first, then Paused, then Resolved. Within each status, most recently updated first.

---

## 5. Open Loop Model

This section defines open loops — the system's mechanism for tracking unresolved commitments and decisions.

### 5.1 Open Loop Schema

```
OpenLoop
├── id: string
├── title: string (what's unresolved)
├── description: string (context)
├── source_type: "conversation" | "review_rejection" | "plan_drift" | "manual"
├── source_id: string (originating object)
├── project_id: string
├── urgency: "low" | "medium" | "high"
├── status: "open" | "snoozed" | "resolved"
├── snoozed_until: timestamp | null
├── created_at: timestamp
├── last_surfaced_at: timestamp (when the system last showed this to the user)
├── resolution_note: string | null
├── linked_objects: ObjectRef[] (cards, conversations, review items)
└── resolved_at: timestamp | null
```

### 5.2 Creation Taxonomy

| Source | Trigger | Default urgency | Auto-created? |
|---|---|---|---|
| **Review rejection** | User selects `review.request_changes` or `review.reject` | High | Yes — automatic |
| **Plan-execution drift** | Plan item revised while linked card is `in_progress` | Medium | Yes — automatic |
| **Plan item deletion** | Plan item deleted while linked card is `in_progress` | High | Yes — automatic |
| **Conversation extraction** | Agent detects unresolved commitment in conversation (e.g., "I still need to decide on the auth approach") | Medium | Agent proposes, user confirms |
| **Manual creation** | User explicitly flags via `loop.create` | User-set | User initiates |

**Rules:**
- Auto-created open loops MUST notify the user (via the copilot or a toast, depending on context) when created.
- Conversation extraction MUST be user-confirmed — the agent proposes, the user accepts or dismisses. The system MUST NOT create loops from conversation content without user consent.

### 5.3 What is NOT an Open Loop

- Schedule failures → Attention item on Home (§8.3), not an open loop
- Approval requests → Attention item on Home (§8.3), not an open loop
- Blocked cards (workspace missing) → Project-level issue shown on Project Detail (§9.4), not an open loop
- Agent execution in progress → Board badge (§10.3), not an open loop

**Boundary rule:** Open loops represent **unresolved human commitments or decisions**. Attention items represent **system events requiring intervention**. If it requires a human decision, it's a loop. If it requires a human action on a system event, it's an attention item.

### 5.4 Resolution Protocol

| Resolution type | Trigger | Behavior |
|---|---|---|
| **Manual resolve** | User invokes `loop.resolve` | Status → resolved. User prompted for optional resolution note. |
| **Auto-resolve** | Linked card reaches `done` status (review approved) | Status → resolved. System generates note: "Resolved: linked card completed." |
| **Auto-resolve** | Follow-up card created from review rejection loop | Status → resolved. Note: "Resolved: follow-up card #X created." |
| **Suggested resolve** | Agent detects conditions have changed | Agent posts suggestion in linked conversation. User confirms. |
| **Snooze** | User invokes `loop.snooze` with a date | Status → snoozed. Reappears on snooze date as `open`. `last_surfaced_at` updates. |

**Rules:**
- Open loops MUST NOT expire automatically. No time-based deletion.
- Snoozed loops MUST resurface on the snooze date as `open` and appear on Home.
- Resolved loops are preserved in history (on Project Detail, under a "Resolved" section).

### 5.5 Escalation Model

| Condition | Escalation behavior |
|---|---|
| Open loop unresolved for 7 days | Promoted to Home hero/briefing (§8.2) |
| Open loop unresolved for 14 days | Urgency auto-upgraded one level (low → medium, medium → high) |
| High-urgency loop unresolved for 7 days | Creates an attention item on Home: "Open loop requires resolution" |
| Open loop linked to a card about to be delegated | Delegation-readiness check warns (§13.1) |

**Rules:**
- Escalation is rule-based, not AI-decided. The user MUST be able to predict when escalation will happen.
- Escalation resets when the user interacts with the loop (snooze, edit, add a note).

---

## 6. Review and Follow-Up Pipeline

This section defines how review works and what happens when work is rejected or needs changes.

### 6.1 Review Item Creation

- When an agent-assigned card completes execution, the system MUST create a ReviewItem with `disposition: pending` and move the card to `in_review` status.
- The ReviewItem MUST include: card title, agent-generated summary of what was done, and a reference to outputs (commits, files, artifacts).
- The ReviewItem MUST appear in the Review section on Home and be accessible from the Board (card in In Review lane).

### 6.2 Review Dispositions

| Disposition | Effect on Card | Effect on Plan Item | Effect on Board | Follow-up |
|---|---|---|---|---|
| **Approve** | → `done` | → `done` | Card moves to Done lane | None |
| **Approve with notes** | → `done` | → `done` | Card moves to Done lane | Notes saved as Learning (proposed to user) |
| **Request changes** | Stays `done` (original) + new follow-up card created in `to_do` | → `card_created` (re-linked to follow-up) | Follow-up appears in To Do | See §6.3 |
| **Reject** | → `cancelled` | → `not_started` | Card removed from board (or shown as cancelled) | Open loop created: "Rejected work needs replanning" |

### 6.3 "Request Changes" Flow (Follow-Up Pipeline)

This is the most common non-approval disposition. The flow:

1. User selects "Request changes" on a ReviewItem.
2. User provides feedback (free text or structured: "fix X, change Y, add Z").
3. System creates a **new card** (not a reopened card):
   - Title: "Follow-up: [original card title]"
   - Spec: Original card spec + rejection feedback + reference to original output
   - Acceptance criteria: Inherited from original + any new criteria from feedback
   - `follow_up_from`: original card ID
   - `plan_item_id`: same as original (plan item re-links to follow-up)
   - Status: `to_do`
   - Assignment: `unassigned`
4. Original card stays `done` with a status note: "Follow-up created: [follow-up card link]."
5. ReviewItem disposition → `changes_requested`. `follow_up_card_id` set.
6. Open loop created: "Follow-up pending: [original card title]" (urgency: high, source: review_rejection).
7. The Review surface MUST offer a one-tap shortcut: **"Delegate follow-up now"** — opens copilot with the follow-up card pre-loaded for `card.delegate`.

**Why a new card:** The original card is a historical artifact. It records what the agent tried and what the feedback was. The follow-up is new work with new context. Separating them keeps the audit trail clean and allows side-by-side comparison of attempts.

### 6.4 Review Surface Behavior

The Review surface is NOT a standalone page in v1. It is a section on Home (§8.3) and accessible as a filtered view.

**Review item anatomy (as displayed):**
- Project name + card title
- Agent-generated summary (2-3 sentences of what was done)
- Output reference (expandable: diff, files, artifacts)
- Time since completion
- Disposition buttons: Approve | Approve with Notes | Request Changes | Reject

**Rules:**
- Review items MUST be sorted by age (oldest first — oldest items need attention most).
- Review items MUST be filterable by project.
- The user MUST be able to expand inline to inspect output detail without leaving the review context.
- After setting a disposition, the review item MUST move out of the pending list immediately.

---

## 7. Workspace Model

This section defines how workspaces attach to projects and gate code execution.

### 7.1 Workspace Schema

```
Workspace
├── id: string
├── project_id: string
├── type: "bound" | "bootstrapped"
├── status: "pending" | "configuring" | "ready" | "error"
├── path: string (repo path or directory)
├── repo_url: string | null
├── branch: string | null (default working branch)
├── scaffold_config: ScaffoldConfig | null (for bootstrapped workspaces)
├── created_at: timestamp
└── updated_at: timestamp
```

### 7.2 Bind Existing Workspace Flow

1. User states intent: "I want to connect this project to my repo" (or `project.bind_workspace`)
2. Agent asks for repo path (or the user provides it upfront)
3. Agent validates the path exists and is a git repo (or a valid directory for non-git workspaces)
4. Agent produces a proposal:
   - Repo path
   - Detected branch (default: current branch)
   - Detected tech stack (if identifiable)
   - Suggested playbook additions based on detected tech
5. User confirms.
6. Workspace created with `status: ready`.

**Rules:**
- The agent MUST NOT modify the repo during binding. Binding is read-only discovery + link creation.
- If the path is not a valid repo/directory, the agent MUST report the error and ask for correction.
- One workspace per project in v1. `[v1.1: multiple workspaces]`

### 7.3 Bootstrap New Workspace Flow

1. User states intent: "I want to start building" (or `project.bootstrap_workspace`)
2. Agent asks for: target directory, tech stack, scaffold preferences (1-2 turns, referencing playbook if available)
3. Agent produces a proposal:
   - Target directory path
   - Scaffold type (e.g., Next.js, Express, Python, etc.)
   - Initial structure description
   - Git init: yes/no
4. User confirms.
5. Workspace created with `status: configuring`.
6. System executes scaffold. On success: `status: ready`. On failure: `status: error` + error details shown on Project Detail.

**Rules:**
- The agent MUST NOT create directories or repos until the user confirms the proposal.
- Bootstrap failure MUST be recoverable: the user can retry or change configuration via copilot.
- Scaffold configuration SHOULD use the advanced form fallback for complex options (file pickers, branch naming, CI setup).

### 7.4 Workspace Status Transitions

```
(none) → pending (bind/bootstrap initiated)
pending → configuring (bootstrap executing)
pending → ready (bind successful)
configuring → ready (bootstrap successful)
configuring → error (bootstrap failed)
error → configuring (user retries)
error → pending (user changes configuration)
```

### 7.5 Execution Gating

- Code-backed card delegation MUST require the project's workspace to be in `ready` status.
- If a user attempts to delegate a card on a project with no workspace or a workspace in `error` status, the delegation-readiness check (§13.1) MUST block and offer: "This project needs a workspace first. Want to set one up?"
- Non-code cards (planning, research, content) MAY be delegated without a workspace. The card spec MUST indicate whether the work requires code execution.

---

## 8. Home Surface

Home is the synthesized briefing surface. It answers: "What's the single most important thing right now, and what else should I know?"

### 8.1 Home Structure

Home consists of:
1. **Hero slot** — The single most important item (§8.2)
2. **Attention section** — Operational items requiring intervention (replaces standalone Inbox)
3. **Review section** — Outputs ready for judgment
4. **Open loops section** — Stale unresolved commitments
5. **Active projects section** — Projects with in-progress work
6. **Recent completions** — Work completed in the last 48 hours

Empty sections MUST be hidden, not shown as empty containers.

### 8.2 Hero Slot Selection

The hero slot shows the single most important item. Selection follows a priority waterfall — first match wins:

| Priority | Condition | Hero content |
|---|---|---|
| 1 | Attention item requiring immediate intervention (failed run, approval needed, workspace error, blocked card >24h) | "[Intervention type]: [description]. [Action button]" |
| 2 | Review items pending (any age) | "You have [N] outputs ready for review. Oldest: [item title] ([age])." + "Review now" button |
| 3 | High-urgency open loop overdue (>7 days) | "[Loop title] has been unresolved for [N] days. [Resolve / Snooze]" |
| 4 | Card ready for delegation (passes all readiness checks) | "Ready to delegate: [card title] on [project]. [Delegate now]" |
| 5 | No items match any condition | Proactive briefing (§8.6) |

**Rules:**
- The hero slot MUST show exactly one item (the highest priority match), not a list.
- The hero slot MUST include a direct action button so the user can act without navigating.
- Tapping the hero item navigates to the appropriate detail context (see §12 handoff protocol).

### 8.3 Attention Section (Replaces Standalone Inbox)

This section contains operational items that require user intervention to unblock the system. It replaces the standalone Inbox page.

**Item categories:**
- Failed agent runs (with error summary and retry/inspect actions)
- Failed schedule runs (with error summary and retry/disable actions)
- Approval requests `[v1.1: multi-user approvals]`
- Workspace errors (with fix/retry actions)
- Blocked cards (>24h, with reason and unblock actions)
- High-urgency open loops that have escalated (§5.5)

**Rules:**
- Items MUST be sorted by severity (failures first, then blocks, then approvals).
- Each item MUST show: source project, description, time since creation, and 1-2 direct action buttons.
- Resolved items MUST disappear immediately from the section.
- This section MUST show a count badge in the Home nav item when items are present.
- The section SHOULD be collapsed by default if empty, and expanded if items exist.

### 8.4 Review Section

- Shows count of pending review items + the top 3 (sorted by age, oldest first).
- Each item shows: project name, card title, age, and an "Open review" button.
- "See all" link navigates to the full Review view (filtered list of all pending ReviewItems).

### 8.5 Active Projects Section

- Shows projects with `status: active` that have at least one card in `in_progress` or `in_review`.
- Each project shows: name, project pulse (§9.5), count of in-progress cards, agent activity status.
- Tapping a project navigates to Project Detail.

### 8.6 "Nothing To Do" State (Proactive Briefing)

When no attention items, review items, or stale open loops exist, the hero slot becomes:

> "Everything's on track. Here's what's happening."

Below it, Home shows:
1. **Progress since last visit** — Which projects advanced, with deltas ("Project X: 2 cards completed")
2. **Upcoming schedule runs** — Next 24 hours of scheduled work
3. **Idle projects** — Projects with no activity in 7+ days: "These haven't moved recently."
4. **Ready to delegate** — Cards that pass readiness checks but haven't been delegated

**Rules:**
- The proactive briefing MUST still feel useful. "Nothing to do" should not mean "nothing to show."
- Idle project callouts SHOULD include a one-tap "Check in" button that opens the copilot in that project's context.

---

## 9. Project Detail Surface

Project Detail is the deep inspection surface for a single project. It is the primary context for understanding and acting on a project.

### 9.1 Project Detail Structure

| Section | Content | Actions |
|---|---|---|
| **Header** | Project name, goal, status, pulse (§9.5) | Edit name/goal via copilot |
| **Current Plan** | Plan outline with item statuses, progress indicators | "Revise plan" (opens copilot), "Derive cards" (opens copilot) |
| **Workspace** | Workspace status, path, branch, health | "Bind workspace" / "Bootstrap workspace" (copilot), "Open in editor" `[v1.1]` |
| **Open Loops** | Active open loops for this project | "Resolve" / "Snooze" per loop, "Create loop" (copilot) |
| **Conversations** | Active + Paused conversations, grouped by type | "Start conversation" (copilot), tap to continue |
| **Playbook** | Playbook content, editable | Inline edit or copilot-assisted edit |
| **Learnings** | List of learnings with sources | Dismiss, edit, "Add learning" (copilot) |
| **Schedules** | Linked schedules with health badges | "Create schedule" (copilot), tap to inspect |

### 9.2 Current Plan Section

- Renders the plan as a structured outline (same structure as Board plan view, §10.2).
- Each plan item shows: title, status badge, linked card status (if card exists), sizing badge.
- Un-carded items show a "Create card" action.
- The section MUST show a progress bar: [done items] / [total items].

### 9.3 Workspace Section

| Workspace state | Section display |
|---|---|
| No workspace | "No workspace yet. This project is in planning mode." + "Bind existing" / "Bootstrap new" buttons (→ copilot) |
| Pending / Configuring | "Setting up workspace..." + progress or status message |
| Ready | Path, branch, tech stack badge. "Open in editor" `[v1.1]`. |
| Error | Error message + "Retry" / "Reconfigure" buttons (→ copilot) |

### 9.4 Open Loops Section

- Shows all `open` and `snoozed` loops for this project.
- Sorted by urgency (high first), then by age (oldest first).
- Each loop shows: title, urgency badge, age, source badge (review rejection / plan drift / manual / conversation).
- Actions per loop: Resolve, Snooze, View source (navigates to the originating object).
- A "Resolved" sub-section (collapsed by default) shows recently resolved loops.

### 9.5 Project Pulse

Project Pulse is a single computed summary line displayed in the Project Detail header and in the Home active projects section.

**Format:** `[Status indicator] [One-line summary]`

**Computation logic (waterfall — first match wins):**

| Condition | Pulse |
|---|---|
| Workspace in `error` state | "Blocked — workspace error" |
| Any high-urgency open loop >7 days | "Needs attention — [N] unresolved open loops" |
| Any card blocked >24h | "Blocked — [N] cards waiting" |
| Cards in progress and reviews pending | "Active — [N] in progress, [M] ready for review" |
| Cards in progress, no reviews pending | "Active — [N] in progress" |
| All plan items done, reviews pending | "Wrapping up — [N] reviews pending" |
| All plan items done, no reviews pending | "Complete" |
| No cards, plan exists | "Planned — ready to start" |
| No cards, no plan | "New — needs planning" |
| No activity in 14+ days | "Idle — no activity in [N] days" |

**Rules:**
- Pulse MUST be computed, never manually set.
- Pulse MUST link to the most relevant section on Project Detail (e.g., "Needs attention" links to Open Loops section).

---

## 10. Board Surface

The Board is the execution surface. It shows plan-derived work and its status.

### 10.1 Board Views

The Board MUST support two views:

| View | Description | Default? |
|---|---|---|
| **Plan view** | Plan outline with status badges on each item | Yes (default) |
| **Status view** | Traditional kanban lanes (To Do, In Progress, In Review, Done) | No (toggle) |

The user MUST be able to switch between views via a toggle. The system MUST remember the user's last-used view per project.

### 10.2 Plan View (Default)

The Board renders the project plan as a structured outline:

```
[Project Name] — [Plan Goal]

[Section: Auth]
├── [✓ Done] Set up auth provider integration
├── [⟳ In Progress — agent working] Implement JWT refresh
│   └── Delegated 2h ago — estimated 80% complete
├── [○ To Do] Add role-based access control
│   └── Ready to delegate ✓
└── [◌ No card] Write auth documentation
    └── [Create card]

[Section: API]
├── [⏳ In Review] REST endpoint schema
│   └── Review ready — submitted 4h ago
├── [○ To Do] Implement CRUD endpoints
│   └── Blocked: depends on "REST endpoint schema"
└── [○ To Do — delegated 🤖] Rate limiting middleware
    └── Agent working — estimated 30% complete
```

**Rules:**
- Each plan section renders as a collapsible group.
- Each plan item shows: status badge, title, and a subtitle line with the most relevant detail (delegation status, readiness, dependency, or review age).
- Items without cards show "No card" with a "Create card" action.
- Items with cards show the card's current status and assignment.
- Tapping an item opens the card detail panel (or, for un-carded items, opens the copilot with `card.create` pre-seeded).
- The plan view MUST show plan sections in order, preserving the author's intended sequence.

**For projects without a plan:** If no plan exists, the Board MUST default to Status View and show a prompt: "This project has no plan. Cards are shown by status. Create a plan to organize work by initiative."

### 10.3 Status View (Secondary)

Traditional kanban with four lanes: **To Do**, **In Progress**, **In Review**, **Done**.

**Card anatomy in status view:**
- Title
- Project name (if multi-project view)
- Priority badge
- Sizing badge
- Assignment badge: 🤖 Agent / 👤 User / (unassigned)
- Delegation status (if agent-assigned): "Working — [progress]" or "Completed"
- Dependency badge (if blocked)
- Open loop indicator (if card has linked open loops)

**Rules:**
- Cards MUST be sortable by: priority, age, sizing.
- Cards MUST be filterable by: project, assignment, priority.
- `[v1.1: drag-and-drop reordering within lanes]`
- In v1, card status changes are done via: copilot (primary) or action menu on the card (secondary). Not drag-and-drop.

### 10.4 Board Scope

- **Default scope:** Single project (the most recently viewed or copilot-context project).
- **Multi-project mode:** Available via filter. Shows cards from all active projects. In plan view, each project's plan renders as a top-level group.
- The user MUST be able to switch projects or enable multi-project mode via a project picker.

### 10.5 Board Actions

| Action | Entry point | Behavior |
|---|---|---|
| Delegate card | Card action menu or copilot | Opens copilot with `card.delegate` + card context |
| Create card | "+" button or copilot | Opens copilot with `card.create` + project context |
| Derive cards from plan | Plan view header action | Opens copilot with `plan.derive_cards` + project context |
| Take card ("hand back to me") | Card action menu | Marks card as user-assigned (§13.5) |
| View card detail | Tap card | Opens card detail panel |
| Open review | Card in "In Review" lane | Navigates to review context |

---

## 11. Schedules Surface

Schedules are standing delegated work. The Schedules surface emphasizes purpose and output, not runtime configuration.

### 11.1 Schedules List

**List item anatomy:**
- Schedule name
- Purpose (one-line description of why this exists)
- Project link (if project-linked)
- Health badge: Healthy ✓ / Degraded ⚠️ / Failing ✕
- Cadence summary (e.g., "Every weekday at 9am", "Every 6 hours")
- Last output summary (one line from most recent run)
- Usefulness indicator (§11.3)

**Sort:** Active first, then paused. Within each status, by last run time (most recent first).
**Filter:** By project, by health status.

### 11.2 Schedule Detail

| Section | Content |
|---|---|
| **Header** | Name, purpose, health badge, status toggle (active/paused) |
| **Recent outputs** | Last 5 runs with: timestamp, success/failure, output summary, link to ReviewItem (if output_handling is review_queue) |
| **Configuration** | Cadence, output handling, workspace link. Editable via copilot or advanced form. |
| **Usefulness** | Usefulness score + rationale |
| **Project link** | Linked project name + link to Project Detail |

### 11.3 Usefulness Score

`[v1.1]`

In v1, the schedule detail shows recent outputs and health. The "usefulness" concept is acknowledged but not computed.

**v1.1 design intent:** Usefulness is computed based on: whether outputs are being reviewed (or ignored), whether the schedule's output has led to follow-up work, and whether the schedule has been paused/resumed frequently (suggesting uncertainty about its value). Displayed as a simple indicator: "Useful" / "Review value" / "Consider removing."

### 11.4 Schedule Setup Flow

1. User states intent: "I want to automate X" (or `schedule.create`)
2. Agent gathers: purpose, what to do each run, how often, where to send output (review queue / auto-approve / notify only), project link (optional)
3. Agent produces a schedule proposal
4. User confirms
5. Schedule created with `status: active`

**Rules:**
- The agent SHOULD suggest a cadence based on the stated purpose rather than asking the user to specify a cron expression.
- For code-backed schedules, the agent MUST verify workspace readiness before proposing.
- Schedule proposals MUST show the `output_handling` field prominently — users need to understand whether they'll be reviewing output.

---

## 12. Surface Handoff Protocol

This section defines exactly where the user lands when they tap an item on one surface that references an object on another.

### 12.1 Home → Destination Handoffs

| Item on Home | Tap target | Arrival state |
|---|---|---|
| Hero: Attention item (failed run) | Home → Attention section expanded, item detail shown inline | Action buttons visible (retry, inspect, dismiss) |
| Hero: Review item ready | Review view, filtered to that project, oldest item expanded | Disposition buttons visible |
| Hero: Open loop overdue | Project Detail → Open Loops section, loop highlighted | Resolve/Snooze buttons visible |
| Hero: Card ready to delegate | Board (plan view) → card highlighted, copilot pre-opened with `card.delegate` | User confirms delegation in one step |
| Attention section item | Same surface, item expands inline | Action buttons visible |
| Review section item | Review view, item expanded | Disposition buttons visible |
| Active project | Project Detail | Full project context |
| Open loop item | Project Detail → Open Loops section | Loop highlighted |

### 12.2 Board → Destination Handoffs

| Item on Board | Tap target | Arrival state |
|---|---|---|
| Card (any status) | Card detail panel (slide-over or modal) | Shows spec, status, delegation receipt, linked conversations, open loops |
| Card in "In Review" | Card detail panel with review section prominent | "Open review" button visible |
| Un-carded plan item | Copilot opens with `card.create` pre-seeded with plan item data | User can confirm card creation |
| Project name (in multi-project view) | Project Detail | Full project context |

### 12.3 Project Detail → Destination Handoffs

| Item on Project Detail | Tap target | Arrival state |
|---|---|---|
| Plan item with card | Board → plan view, item highlighted | Card detail accessible |
| Plan item without card | Copilot opens with `card.create` | Pre-seeded with plan item data |
| Conversation | Copilot opens that conversation | Conversation resumes |
| Schedule | Schedule detail | Full schedule context |
| Open loop source link | Navigates to source object (card, conversation, review item) | Source object in context |

### 12.4 Design Rule

Handoffs MUST drop the user into the **action state**, not the reading state. If they tapped an attention item, they want to act. Pre-open the relevant panel, pre-filter the relevant list, pre-select the relevant item.

---

## 13. Delegation and Execution

This section defines how work gets delegated to the agent and how execution is tracked.

### 13.1 Delegation-Readiness Checklist

Before `card.delegate` can proceed, the system MUST evaluate:

| Condition | Required? | If not met |
|---|---|---|
| Project workspace in `ready` state | Yes (code-backed cards only) | "This project needs a workspace first. Want to set one up?" |
| Card has title, spec, and ≥1 acceptance criterion | Yes | "This card needs more detail. Want to flesh it out?" |
| Card has no unresolved high-urgency open loops | Yes | "There's an open loop on this card: [title]. Resolve it or override." |
| Card has no blocking dependencies on `in_progress` cards | Warning | "This card depends on [card title] which is still in progress. Delegate anyway?" |
| Project playbook is populated | Warning | "No playbook set up. The agent will work without project-specific guidance. Set up first?" |
| Card is not already in `in_progress` with agent assignment | Yes | "This card is already being worked on." |

**Rules:**
- "Yes" conditions MUST block delegation until resolved.
- "Warning" conditions MUST be shown but MAY be overridden by the user.
- The readiness check runs automatically when `card.delegate` intent is resolved. The user does not invoke it manually.

### 13.2 Delegation Flow

1. User invokes `card.delegate` (via copilot, or "Delegate" action on a card).
2. System runs readiness checklist (§13.1).
3. If all checks pass (or warnings are overridden), agent produces a delegation proposal:
   - Card summary
   - Execution plan (agent's brief description of how it will approach the work)
   - Estimated effort/time
   - Any assumptions flagged
4. User confirms.
5. Card assignment → `agent`. Card status → `in_progress`.
6. Delegation receipt created (§13.3).
7. Delegation conversation created (§4.2).
8. Agent begins execution.

### 13.3 Delegation Receipt

A persistent record of what was delegated. Appears in three places:

1. **In the delegation conversation** — as a structured card showing: card title, project, spec summary, execution plan, acceptance criteria.
2. **On card detail** — as a "Delegation" section showing: delegation time, execution plan, run status, link to delegation conversation.
3. **On Board** — as a status badge: "Delegated [time] — [status]."

```
DelegationReceipt
├── card_id: string
├── conversation_id: string
├── execution_plan: string (agent's stated approach)
├── delegated_at: timestamp
├── run_status: "running" | "completed" | "failed" | "cancelled"
├── progress_estimate: number | null (0-100, agent-reported)
└── completed_at: timestamp | null
```

### 13.4 Execution Tracking

- While an agent is executing, the delegation conversation SHOULD receive periodic progress updates (agent-reported).
- The Board MUST show a progress indicator on delegated cards (if progress_estimate is available).
- On completion, the system creates a ReviewItem (§6.1) and the delegation conversation auto-resolves.
- On failure, the system creates an attention item on Home (§8.3) and the delegation conversation stays active with the error context.

### 13.5 "Hand Back To Me" Action

The user can take over work from the agent at any point.

| Context | Action | Behavior |
|---|---|---|
| Card in `to_do`, unassigned | "I'll take this" | Card assignment → `user`. Card shows "Manual" badge. Not in delegation pipeline. |
| Card in `to_do`, ready to delegate | "I'll take this" | Same as above. |
| Card in `in_progress`, agent executing | "I'll take this" | Agent run is cancelled (or allowed to complete, user's choice). Card assignment → `user`. Partial output is preserved and surfaced: "Here's what the agent completed: [summary/diff]." |
| Follow-up card from review rejection | "I'll handle this" | Card assignment → `user`. Follow-up is user-assigned. |

**Rules:**
- User-assigned cards still move through status lanes normally.
- User-assigned cards still go to Review Queue when moved to `in_review` (the user can self-review or skip). `[Multi-user hook: team review would apply here]`
- The user MUST be able to re-delegate a user-assigned card back to the agent via `card.delegate`.

---

## 14. Mobile Variant

Desktop and mobile have different interaction models. This section defines where they diverge.

### 14.1 Desktop Model

- **Copilot:** Persistent right rail, always available, contextual (§2.3).
- **Surfaces:** Home, Board, Project Detail, Schedules, `/chat` all render fully.
- **`/chat`:** History and search. Not the primary interaction entry point.

### 14.2 Mobile Model

- **Copilot:** Full-screen modal, invoked from any surface via a floating action button (FAB).
- **Surfaces:** Home, Board, Project Detail, Schedules render as simplified views.
- **`/chat`:** Accessible via bottom tab. Functions as both history/search AND a way to start new interactions (because on mobile, full-screen chat is the natural pattern).

### 14.3 Mobile Surface Simplifications

| Surface | Mobile simplification |
|---|---|
| Home | Hero slot + Attention + Review sections only. Active projects as a compact list. Proactive briefing (§8.6) hidden. |
| Board | Plan view only (no status view toggle in v1 mobile). Cards show title + status badge only, no subtitles. Tap → card detail as a sheet. |
| Project Detail | Sections render as collapsible accordion. Only Plan + Open Loops + Workspace expanded by default. |
| Schedules | List only. No inline schedule detail. Tap → schedule detail as a sheet. |
| Review | Full review item detail (this is a high-priority mobile action — don't simplify). |

### 14.4 Mobile-Specific Rules

- Proposals MUST render correctly in full-screen chat context, not just side panel.
- The FAB MUST be present on every surface except when the copilot modal is open.
- `[v1.1: mobile Board status view, drag-and-drop]`
- Mobile `/chat` tab MUST show a "New conversation" button. This is NOT available on desktop `/chat` (where the copilot panel is the primary entry).

---

## 15. Zero-State and First-Run

This section defines what the user sees before they've created any data.

### 15.1 First-Run Home

The hero slot shows:

> "What are you working on? Tell me about a project and I'll help you get started."

Below it, 2-3 example starting points (not a tutorial):
- "I have an existing codebase I want to work on" → opens copilot with `project.create` + `project.bind_workspace` flow
- "I want to plan and build something new" → opens copilot with `project.create` + `project.plan` flow
- "I want to automate a recurring task" → opens copilot with `schedule.create` flow

**Rules:**
- No feature tour. No tooltip walkthrough. The user learns by doing.
- Starting points are pre-seeded copilot intents, not static pages.
- Once the user creates their first project, the first-run state disappears and normal Home takes over.

### 15.2 Zero-State Surfaces

| Surface | Zero-state |
|---|---|
| Board | "No cards yet. Create a project and plan, then derive cards to populate the board." + FAB to copilot. |
| Project Detail | (only reachable if a project exists) Sections render but show empty states: "No plan yet — create one" / "No workspace — set one up" / etc. Each empty state includes a copilot action. |
| Schedules | "No schedules yet. Ask the assistant to set one up." + FAB to copilot. |
| `/chat` | "No conversations yet. Start one from the assistant panel (desktop) or the + button (mobile)." |
| Review | "Nothing to review yet. Outputs will appear here when agent work completes." |

**Rules:**
- Every zero-state MUST make the next action obvious and achievable in one tap.
- Zero-states MUST NOT explain the surface's purpose in abstract terms. Show the user what to do, not what the surface "is for."

---

## 16. Scope Decisions (v1 vs v1.1)

### 16.1 v1 Scope (MUST ship)

| Capability | Notes |
|---|---|
| Project CRUD + lifecycle | Full lifecycle from planning to completion |
| Plan creation and revision (conversational) | Structured plan with sections and items |
| Card derivation from plan | Batch derivation with approval |
| Card delegation to agent | Full readiness check + delegation receipt |
| Workspace bind and bootstrap | Both flows, with copilot-led setup |
| Review pipeline | All four dispositions, follow-up card creation |
| Open loop lifecycle | Auto-creation, manual creation, resolution, escalation |
| Home surface | Hero slot, attention section, review section, active projects |
| Board surface | Plan view (default) + status view (toggle) |
| Project Detail surface | All sections per §9 |
| Schedules surface | List + detail + conversational setup |
| Control plane protocol | Full intent taxonomy, proposals, confirmation, fallback |
| Conversation model | Types, statuses, lifecycle, linked objects, summaries |
| Mobile variant | Simplified surfaces, FAB copilot, mobile `/chat` |
| Zero-state and first-run | All zero-states per §15 |
| Delegation receipt | Persistent record in conversation, card detail, board |
| Project pulse | Computed summary on Project Detail and Home |
| "Hand back to me" | All three contexts per §13.5 |
| "Nothing to do" state | Proactive briefing per §8.6 |
| Change propagation (plan → cards) | Rules per §3.4 |

### 16.2 v1.1 Scope (Deferred)

| Capability | Reason for deferral |
|---|---|
| Conversation branching | Adds complexity; linear conversations are sufficient for v1 |
| Plan version history UI | Backend should version, but UI to browse versions is low-priority |
| Usefulness score for schedules | Requires enough run history to compute meaningfully |
| Conversation-to-project-memory extraction | High-value but requires tuning; v1 learnings are user-authored or agent-proposed |
| Plan fallback editor (structured form) | Conversational plan creation is primary; form editor is a v1.1 convenience |
| Board drag-and-drop | Cards move via copilot or action menu in v1 |
| Mobile board status view | Mobile board is plan-view-only in v1 |
| Multiple workspaces per project | One workspace per project in v1 |
| Multi-user (team projects, shared review) | v1 is single-user |
| "Open in editor" from workspace section | Requires IDE integration |

### 16.3 Decisions That Must Not Be Reversed

These v1 decisions are load-bearing. Reversing them in v1.1 would require significant rework:

1. **Project as the durable context layer.** Every object resolves to a project.
2. **Plan as a structured data object.** Not free text, not markdown.
3. **Cards derived from plan items.** Plan items have `linked_card_id`. Cards have `plan_item_id`.
4. **Proposals as structured UI elements.** Not chat messages.
5. **Open loops as first-class records.** Not notes, not tags, not chat messages.
6. **Review as a separate pipeline.** Not a card status. Not an inbox item.
7. **Conversations are typed and lifecycle-managed.** Not a flat message list.
8. **Plan view as the default Board.** Not status lanes.

---

*End of functional specification.*
