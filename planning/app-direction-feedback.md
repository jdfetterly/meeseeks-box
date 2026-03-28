# App Direction Feedback — From Operational Dashboard to AI-Forward Command Center

Date: 2026-03-22
Reviewer: external model (Opus)
Scope: full app codebase review + operator interview

---

## The Core Problem

The app that was built is an **operational monitoring dashboard** — it shows status, organizes things into lanes, and provides forms for creating objects. That's what a model builds when it reads a plan about "durable operational objects" and "canonical product state."

But the operator's actual workflow is **plan → delegate → review**. He manages agents like a team. He wants to describe what needs to happen, have agents drive the setup and execution, and then review what was produced. The tool should feel like working with a capable team, not like operating a control panel.

The gap is not in the data model or the backend. The gap is in the interaction model. Almost every surface in the app defaults to "human fills out forms and reads dashboards" when it should default to "human talks to agents and agents drive the work."

---

## What Needs to Change — Summary

| Area | Current State | Target State |
|------|--------------|--------------|
| Chat | Isolated page, secondary to dashboard | Primary interaction surface, available everywhere |
| Work/Kanban | Operational status lanes (queued, running, failed) | Project-focused task organization with agent delegation |
| Schedules | Cron expression forms | "Tell the agent, agent asks questions, agent sets it up" |
| Creation flows | Forms everywhere (memory, work items, schedules) | Conversation-first creation; forms are fallback/edit mode |
| Home | Status dashboard | "What needs me + quick delegate" |
| Navigation model | Page-per-entity (chat page, work page, schedule page) | Chat as co-pilot alongside any page |

---

## 1. Chat: From Isolated Page to Primary Surface

### What's wrong now

Chat lives at `/chat` and `/chat/[id]`. It's a good conversation UI (streaming, slash commands, attachments, TTS). But it's a **page** — when you're in chat, you can't see the work board. When you're on the work board, you can't talk to an agent.

The operator said: "Chat IS the app" mixed with "Chat should be available everywhere as a side panel." That means chat needs to be the primary way things get done, and it needs to be accessible from any context.

### What to change

**Add a persistent chat panel.** On desktop, this should be a collapsible right-side panel (not a page) that stays open while the operator navigates between Work, Schedules, Memory, etc. On mobile, it can be a bottom-sheet overlay or a floating action button that opens a chat sheet.

The current `/chat` page can remain as a full-screen conversation view for deep conversation work, but the panel is the default way to interact.

**Chat should be context-aware.** When the operator is looking at a specific work item, schedule, or artifact, the chat panel should know that. "Set up a recurring run for this" should work without the operator re-explaining what "this" is. The panel should carry context from the current page/entity.

**Chat should be the primary creation path.** Instead of forms being the default and chat being supplementary, the default "create" action for work items, schedules, memory entries, and most objects should open the chat panel with a contextual prompt. The agent asks clarifying questions and drives the setup. Forms remain available as a "manual/advanced" fallback or for quick edits.

### Specific implementation guidance

- Extract `ConversationView` into a `ChatPanel` component that can render in a side panel (fixed-width, ~400px on desktop) or as a page
- Add a `ChatPanelProvider` at the layout level that manages panel open/close state and current context (entity type, entity ID, page)
- The panel should support "pinning" a conversation — the operator can keep talking to one agent while navigating
- The panel should support starting a new conversation with context: "I'm looking at schedule X, help me adjust it"
- Keyboard shortcut to toggle panel (Cmd+J or similar)

---

## 2. Work Board: From Operational Lanes to Project-Focused Tasks

### What's wrong now

The Kanban board uses operational status lanes: `queued`, `running`, `scheduled`, `needs_input`, `needs_approval`, `blocked`, `failed`, `completed`. These are runtime states, not project organization.

The operator wants to organize work by **project** — "features I want implemented from a Git project" or "personal items I'm working through." He wants to filter down to a project's tasks. The current board doesn't support projects as an organizing concept at all.

Additionally, the board treats cards as operational units (linked to runs, approvals, agents). The operator wants cards that represent **things to get done** — tasks he can describe to an agent and delegate.

### What to change

**Add a project/group concept.** Work items should be taggable with a project (or multiple tags). The board should support filtering by project. A project is lightweight — just a name and optional description, not a heavyweight entity with its own schema. Think of it as the operator's way of saying "these tasks are related."

**Simplify the lane model.** The operational lanes (queued, running, blocked, failed) are useful for system visibility but shouldn't be the primary board view. The primary view should be something like:

- **To Do** — things not yet started
- **In Progress** — things an agent is working on or the operator is actively working through
- **In Review** — things that produced output and need operator review
- **Done** — completed

The operational status (running, failed, needs_approval) should be **badges on cards**, not lanes. A card in "In Progress" might have a badge showing "needs approval" or "failed — retry available." The operator can click to handle it. But the organizing principle is project workflow, not system state.

**Keep the operational view as a secondary mode.** Don't delete the status-lane view — make it a toggle or secondary tab. "By project" (default) vs "By status" (operational). Some operators will want the status view for debugging. But it shouldn't be the first thing they see.

**Card creation should be agent-driven.** The current `LaunchComposer` is a form. The primary "add task" flow should open the chat panel: "I need to build a feature that does X." The agent breaks it down, creates the cards, assigns itself or recommends an agent. The composer form stays as a quick-add fallback.

### Specific implementation guidance

- Add a `project` field to WorkItem (nullable string or tag). Add a project filter to the board header.
- Rethink the board lanes. Default lanes: To Do, In Progress, Review, Done. Cards carry operational status as metadata/badges.
- Add a "By Status" toggle that switches to the current lane model for operators who want it.
- The card drawer already has good detail (conversation, run, artifacts, approvals). Keep that — it's the "review" surface the operator needs.
- Allow drag-and-drop between To Do → In Progress (which could trigger "assign to agent" or "launch run").

---

## 3. Agent-Driven Creation: Conversation First, Forms as Fallback

### What's wrong now

Almost every creation flow in the app is form-based:

- `WriteMemoryEntryForm` — form to create memory
- `RegisterScheduleArtifactForm` — form to register artifact
- `RecurringScheduleActions` — form fields to edit cron expressions
- `LaunchComposer` — form to create work
- `CreateTicketModal` — form to create Kanban ticket

The operator was explicit: "I should tell the agent to schedule the job, they should ask some questions and then drive the setup." And when asked if this extends everywhere: "Yes, everywhere."

### What to change

**Default "create" actions should open the chat panel with context, not a form.** When the operator clicks "New Schedule," the chat panel opens with a contextual message like: "What would you like to schedule?" The agent asks about cadence, scope, output expectations, and then creates the schedule object. The operator confirms.

**Forms become "edit mode."** Once an object exists (created by agent or manually), the operator can click into it and edit fields directly. Forms are the **editing** interface, not the creation interface. This is a critical distinction — creation is conversational, editing is direct manipulation.

**The agent needs tool access to create objects.** This means the chat backend (or the agent runtime) needs to be able to call product-state APIs to create work items, schedules, memory entries, etc. The agent should be able to say "I've created a weekly schedule for X — here's what it looks like, want me to adjust anything?" rather than the operator filling out a form.

### Specific implementation guidance

- For each "create" action, add a chat-panel-first path: clicking "+" or "New" opens the panel with context
- Keep form components but reposition them as edit/detail views, not creation flows
- The agent needs MCP tools or API access to create/update product-state objects (work items, schedules, memory entries)
- Consider a "confirmation card" pattern in chat: when the agent proposes creating something, it shows a preview card the operator can approve, edit, or reject inline

---

## 4. Schedules: From Cron Admin to Agent-Managed Jobs

### What's wrong now

The Schedules page is a cron administration panel. It shows cron expressions, sync status, pause/resume buttons, and health metrics. Creating a schedule means filling out a form with cron syntax.

The operator doesn't want to write cron expressions. He wants to say "run this research job every Monday morning" and have the agent handle it.

### What to change

**Schedule creation is conversational.** The agent asks: "What should run? How often? What agent should handle it? What output do you expect?" Then it creates the schedule and shows a summary for confirmation.

**The schedule page should focus on what schedules produce, not how they're configured.** The primary view should be: what schedules exist, when they last ran, what they produced, and whether anything needs attention. Cron expressions are an implementation detail — show them in an "advanced" section, not as the headline.

**Schedule health should emphasize outputs, not just runs.** "This schedule ran but produced nothing useful" is a different problem than "this schedule failed." The operator cares about value, not just uptime.

### Specific implementation guidance

- Reorder the schedule detail page: outputs/artifacts first, then health, then configuration (cron expression, agent assignment, etc.) at the bottom
- "New Schedule" opens chat panel, not a form
- Consider showing schedules on the Home page grouped by "healthy," "needs attention," "missed" — not as a flat list

---

## 5. Home Page: From Status Dashboard to Command Briefing

### What's wrong now

The Home page shows four quadrant cards: "Needs review," "In progress," "Problems," "Upcoming." Plus recent conversations and recent memory. It's a status dashboard — it answers "what's happening" but doesn't help the operator decide what to do next.

### What to change

**Home should answer: "What needs me, and what should I work on next?"** It's the operator's briefing, not a monitoring dashboard.

Suggested restructure:

- **Needs your attention** — approvals, failures, stale items. Actionable from here (approve, retry, dismiss). This stays similar but should be tighter.
- **Active projects** — the operator's current projects with a quick status line each. Click to filter the work board to that project.
- **Recent agent activity** — what agents have done since the operator last checked. Summarized, not raw events. "Agent X completed the research task and produced a report. Agent Y is waiting for your input on the content plan."
- **Quick actions** — pinned launch presets and a prominent "Tell an agent what to do" button that opens the chat panel.

The "recent conversations" and "recent memory" sections are less useful as home widgets. Conversations are accessible from the chat panel. Memory is a governance surface, not a daily-check item.

### Specific implementation guidance

- Add a "projects" widget that shows active project tags with task counts
- Replace raw activity with agent-summarized activity (this could be a scheduled digest or an on-demand summary)
- Add a prominent chat entry point ("What do you need?" input field or button)
- Keep the attention queue but make items directly actionable (approve/retry buttons inline, not just links)

---

## 6. The "Plan, Delegate, Review" Loop

### What's missing

The app has pieces of the plan/delegate/review loop but doesn't connect them:

- **Plan:** No support. The operator can't describe a project to an agent and have it broken into tasks. The work board only shows tasks that already exist.
- **Delegate:** Partial. Work items can be assigned to agents, but creation is form-based. The operator has to do the breaking-down manually.
- **Review:** Good. The card drawer, run detail, and artifact views support reviewing agent output. This is the strongest part of the app.

### What to change

**Add a planning conversation pattern.** When the operator starts a new project, the flow should be:

1. Open chat: "I need to build feature X for project Y"
2. Agent asks clarifying questions, proposes a breakdown
3. Operator approves or adjusts
4. Agent creates work items, assigns them to appropriate agents
5. Work board shows the new project with its tasks

This is the "plan" step. The agent drives the decomposition, not the operator filling out forms.

**Delegation should be explicit and visible.** When the operator says "go" on a task, the system should show what agent picked it up, what it's doing, and when it needs the operator again. The "In Progress" lane is where this lives, with agent activity badges.

**Review should be the default landing for completed work.** When an agent finishes something, it should surface in the operator's attention queue with the output ready to review. The operator shouldn't have to go looking for it.

### Specific implementation guidance

- The chat panel needs a "project planning" mode where the agent can propose and create multiple work items at once
- Work items need a "delegated to" field that shows which agent is working on it, and a "review ready" state that surfaces in Inbox/Home
- Consider a "review queue" view that's distinct from the Inbox (which is more about approvals and failures). Review queue = "things agents finished that need your eyes."

---

## 7. What NOT to Change

Some things in the app are solid and should be preserved:

- **The data model and product-state layer.** The object model (runs, events, artifacts, memory, approvals) is sound. The problems are in the interaction model, not the data model.
- **The run detail view.** Event timelines, replay, and structured run inspection are good operational surfaces for when the operator needs to debug.
- **The artifact versioning system.** Family grouping and provenance tracking are well-designed.
- **The memory governance model.** Archive/supersede semantics, provenance, and write-through rules are correct. The UI just needs to shift from form-first to conversation-first for creation.
- **The approval system design.** Typed steps, risk tiers, and the approval mechanics are sound. The inbox surface for resolving them is fine.
- **The activity/log console.** Useful for debugging and observability. Keep it as-is.
- **The agent hierarchy view.** Reference surface, doesn't need to change.

---

## 8. Priority Order for Changes

If these changes need to be sequenced:

### Must-do (changes the fundamental interaction model)

1. **Persistent chat panel** accessible from every page with context awareness
2. **Work board rethink** — project tagging, simplified lanes (To Do / In Progress / Review / Done), operational status as badges
3. **Agent-driven creation** for work items and schedules (conversation-first, forms as edit/fallback)

### Should-do (makes the app feel like a command center, not a dashboard)

4. **Home page restructure** — attention queue + active projects + agent activity summary + quick delegate
5. **Schedule page reorder** — outputs first, config last, creation via chat

### Nice-to-do (polish and deeper integration)

6. **Project planning conversation** — agent decomposes projects into tasks
7. **Review queue** — distinct surface for "agent completed work, needs your review"
8. **Agent-summarized activity** — replace raw event lists with agent-written summaries

---

## 9. Risks and Tradeoffs

**Chat-panel-everywhere adds complexity.** A persistent panel that carries context across pages is architecturally non-trivial. It needs to manage its own conversation state, know what the operator is looking at, and not interfere with the page layout on mobile. Budget time for this.

**Agent-driven creation requires agent tool access.** The chat backend needs to be able to create product-state objects. This means either extending the OpenClaw gateway integration or adding MCP tools that the agent can call. If the agent can't actually create a schedule or work item, the conversation-first pattern becomes hollow — it generates text but still requires the operator to fill out a form.

**Simplifying the board lanes loses operational visibility.** The status lanes (failed, blocked, needs_approval) are genuinely useful for system health. Making them badges instead of lanes means the operator has to look more carefully. The "By Status" toggle mitigates this, but it's a tradeoff — the app will feel less "operational" and more "project management." That's what the operator wants, but it's a deliberate shift.

**This is a significant UX restructure, not a refactor.** The backend, data model, and most components can stay. But the page layout, navigation model, and primary interaction patterns all change. This is a redesign of how the app feels, even though most of the underlying code survives.

---

## 10. One-Line Summary for the Implementing Model

**Stop building a dashboard that the operator reads. Start building a command center where the operator talks to agents and agents drive the work. Chat is the primary surface, the board is for organizing projects, forms are for editing — not creating — and the agent should always be the one asking "what do you need?" not the operator filling out fields.**
