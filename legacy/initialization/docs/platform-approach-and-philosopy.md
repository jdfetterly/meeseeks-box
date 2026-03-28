# Personal AI Command Center: Reconciled Operating Document

**Purpose:** This is the governing design document for building a dashboard and interaction layer on top of an OpenClaw CLI runtime running on a self-hosted Mac mini. It synthesizes and resolves three independent research efforts into one opinionated position.

**Constraint:** OpenClaw CLI is the fixed execution substrate. This document does not propose replacing it. Everything below describes the control plane, product state, and interaction surfaces that sit on top of that runtime.

---

## 1. Core Thesis

**What this product is:** An operator-grade control plane for a personal agentic runtime. It makes work visible, controllable, and continuous across iPhone, iPad, and MacBook—while OpenClaw handles execution on the Mac mini.

**What it is not:** A chatbot. Not a voice assistant. Not a "personal Siri replacement." Chat and voice are input surfaces. The product is the operational layer—agents, runs, events, artifacts, schedules, memory, and the decisions made about them.

**Strongest framing:** Think of it as a personal operations center. OpenClaw is the engine room. The dashboard is the bridge. You should be able to glance at your phone, see what's running, what needs your attention, and what was produced—then drill in or redirect from any device. The system should work like a well-run async team: most work happens in the background; you intervene only when it matters; everything is inspectable after the fact.

**Non-negotiable design stance:** The system is organized around durable operational objects (agents, runs, events, work items, schedules, conversations, artifacts, memory), not around chat threads. Chat is one way to create and interact with those objects. It is never the canonical representation of them.

---

## 2. Layer Model

### Layer 1: Execution Substrate (OpenClaw CLI)

**Owner:** OpenClaw on Mac mini.

**Responsibilities:**
- Agent runtime (spawning, executing, terminating agents)
- Tool calling and tool execution (MCP servers, shell, filesystem, APIs)
- Model invocation (local via Ollama/MLX, hosted via API)
- Schedule execution (cron-like recurring work)
- Workspace operations (file I/O, git, local services)
- Structured output enforcement at the tool boundary

**Boundary rule:** OpenClaw emits events, produces artifacts, and reports status. It does not own how those things are displayed, stored long-term, or acted upon by the user across devices. It is stateless from the dashboard's perspective—meaning the dashboard must never rely on OpenClaw retaining product-level state between sessions.

### Layer 2: Product State Layer (Dashboard Backend)

**Owner:** Dashboard backend (likely a lightweight service on the Mac mini or a synced store).

**Responsibilities:**
- Canonical identity for all operational objects: runs, agents, events, work items, artifacts, conversations, schedules, memory entries
- Cross-device state: what the user sees on iPhone must be identical to what they see on MacBook
- Approval queue and resolution state
- Artifact registry (metadata, location, provenance)
- Memory governance (what's stored, where it came from, retention rules, access scope)
- Trace and event log (every run, every tool call, every model choice, every approval)
- Notification routing (which device, which channel, what urgency)

**Boundary rule:** Product state is the system of record. OpenClaw writes into it (via events and artifact outputs). The interaction layer reads from it. No client-specific business logic lives here—only canonical state and policy.

### Layer 3: Interaction Layer (Clients)

**Owner:** Native iOS app, Mac app, and/or web dashboard.

**Responsibilities:**
- Rendering the dashboard (fleet view, run detail, artifact viewer, approval UX)
- Chat as a front door to initiate work, ask questions, provide input
- Voice as a hands-free initiation and status surface
- Device-appropriate affordances (iPhone = capture + triage; iPad = review + approve; MacBook = deep work + inspect)
- Cross-device handoff (start on phone, continue on Mac)
- Local caching for responsiveness (but never authoritative)

**Boundary rule:** Clients are views into product state. They do not store canonical data. They may cache aggressively for performance, but all mutations flow through the product state layer.

---

## 3. Best Practices for the Dashboard / Control Plane

### 3.1 Overview / Fleet Visibility

The default view should answer: "What's happening right now, what needs my attention, and what was recently completed?"

- Show active agents, running tasks, pending approvals, and recent artifacts in a single glanceable view.
- Use Relay.app's "Runs" UI as a reference: each run shows status, duration, steps completed, and whether it's waiting on human input.
- Prioritize attention signals over raw activity. A quiet dashboard with one pending approval is more useful than a busy dashboard with 50 completed runs.
- Borrow Taskade's "agents in workspace" framing: agents are named, have responsibilities, and their recent activity is visible in context—not buried in logs.

### 3.2 Runs and Events

Every unit of work OpenClaw performs should be represented as a **run** with a lifecycle: created → running → waiting (if approval needed) → completed / failed / cancelled.

- Each run has a unique ID owned by the product state layer—not the provider's session ID. This is critical for portability and handoff.
- Runs contain an ordered list of events (tool calls, model invocations, approvals, errors). This is your audit trail.
- Implement replay and "time travel" inspection: for any completed run, the user should be able to see exactly what happened, in what order, with what inputs and outputs. LangGraph's checkpoint model and Relay's run replay are the reference patterns.
- Failed runs should support "retry from last good step" without re-running everything.

### 3.3 Schedules and Recurring Work

Schedules are first-class objects, not hidden cron jobs.

- Every schedule should be visible in the dashboard with: name, cadence, last run status, next run time, and the agent/workflow it triggers.
- Allow pause/resume and manual trigger from any device.
- Show schedule health over time (success rate, average duration, failure patterns).
- Schedules that produce artifacts should link directly to the artifact registry.

### 3.4 Artifacts

Artifacts are first-class outputs—reports, files, summaries, code, data exports, images.

- Every artifact gets a stable ID, creation timestamp, producing run, and provenance chain (which agent, which tools, which inputs).
- Artifacts must be viewable from any device. Store them in a shared location (Mac mini filesystem or synced store) with a stable URL/path.
- Support artifact versioning: if a schedule produces a weekly report, all versions should be browsable.
- Artifact preview on mobile (at minimum: text, markdown, images, PDFs). Full editing stays on desktop.

### 3.5 Work Items / Approvals

The approval system is where trust is built or destroyed. Get this right early.

- Copy Relay.app's four HITL step types: Approvals (yes/no), Data Input (typed missing information), Tasks (do this and report back), and Path Selection (choose a branch). Generic "approve/deny" is insufficient.
- Approvals must be actionable from iPhone push notifications (approve with one tap for low-risk; open detail for high-risk).
- Every approval shows: what action is proposed, what data it will act on, what the consequences are, and what happens if you deny.
- Support "approve with edit" for cases where the action is mostly right but needs adjustment.
- Time-box approvals: if not acted on within a configurable window, the run should escalate or cancel—not hang forever.
- Risk classification: tag actions by risk level (read-only, reversible write, irreversible write, external communication). Default approval requirements should scale with risk.

### 3.6 Memory / Context Governance

Memory is context governance, not passive storage. This is a resolved position across all three sources.

- Implement three tiers: ephemeral (current conversation/task), situational (active multi-step work, e.g., in Redis), and long-term (persistent facts, preferences, knowledge, in Postgres or equivalent).
- Each tier has explicit retention policies. Ephemeral is discarded after task completion. Situational is garbage-collected after the workflow completes. Long-term requires explicit write and has expiry/review triggers.
- Memory must be inspectable and editable by the user. Copy Taskade's "Knowledge tab" pattern: the user can see what the system "knows," where it came from, and delete or correct entries.
- Scope memory by domain. "Work" memory and "personal" memory should not bleed into each other. Agents should opt in to which memory stores they can read/write.
- Never dump everything into one vector store. This is the single most common failure mode cited across all three sources.

### 3.7 Attention Management

The system's value is proportional to how well it manages your attention.

- Default to background work with selective surfacing. The system should not interrupt you unless something requires your input or something failed.
- Notification channels should be configurable per agent, per risk level, and per device. A scheduled research job completing at 2 AM should not send a push notification.
- Implement a daily/weekly digest artifact: a summary of what ran, what was produced, what failed, and what needs attention.
- "Inbox zero" pattern for the approval queue: the dashboard should make it easy to clear pending items quickly.

---

## 4. Best Practices for the Interaction Layer

### 4.1 Chat as Front Door

Chat is the most natural way to initiate work and ask questions. It is not the center of the system.

- A chat message like "research X and write a summary" should create a run (visible in the dashboard), not just produce inline text.
- Chat should support escalation to structured work: "turn this into a scheduled task," "save this as an artifact," "create a work item for this."
- Chat history is a conversation object in product state—not a provider's thread. You own the ID.
- On mobile, chat should be optimized for quick capture: voice-to-text input, photo/screenshot attachment, short commands. Deep editing happens on desktop.

### 4.2 Voice: Early Patterns

Voice enters as a convenience layer, not as the primary interface. This is a deliberate sequencing choice.

- Start with chained architecture (ASR → text model → TTS) for simpler engineering and clearer observability. Upgrade to speech-to-speech (Realtime API) for the core interactive conversation use case once the foundation is stable.
- Local transcription via MLX Whisper for privacy-sensitive and offline use. Cloud ASR for quality-critical interactive sessions.
- Implement VAD-driven turn-taking from day one. Silence-based endpointing is insufficient; plan for semantic VAD as the upgrade path.
- Voice should support barge-in (user interrupts the assistant mid-speech). This is table stakes for a usable voice interface.
- Voice is primarily an iPhone/AirPods use case. Design accordingly: hands-free status checks, quick approvals, dictation-to-work-item.

### 4.3 Multimodal Session Behavior

Treat audio, text, images, and screen context as views into a single session state—not separate modes.

- A session where the user sends a screenshot from iPhone, then asks a voice question about it, then reviews the result as text on MacBook, should feel like one continuous interaction.
- Implement "reference this" capture: on any device, the user can attach a photo, screenshot, file, or clipboard content to the current session.
- Copy Apple's Continuity Camera pattern: "capture on phone, use on Mac."

### 4.4 Mobile vs Desktop Roles

Different devices have different strengths. Design for them instead of making everything identical.

- **iPhone:** Quick capture (voice, photo, screenshot), triage (approve/deny), status glance (what's running, what needs me). Optimize for one-handed, 30-second interactions.
- **iPad:** Review artifacts, approve with context, read reports, light editing. A good middle ground.
- **MacBook:** Deep work surface. Full dashboard, run inspection, memory editing, artifact review, complex configuration, development/debugging.

### 4.5 Handoff Across Devices

Cross-device continuity is a first-order requirement, not a polish item.

- Every active task/session should have a "continue on [device]" affordance, modeled after Apple Handoff.
- Implementation: the product state layer maintains a "current activity" object per user. Each client reads it and can offer to resume. Use NSUserActivity if building native Apple apps; use a lightweight polling/WebSocket model otherwise.
- The handoff payload should be small (session ID, last few turns, current state pointer). Heavy data stays on the Mac mini.
- Test handoff as a first-class flow: "I start a research task on my phone during my commute, approve an intermediate result on my iPad at lunch, and review the final artifact on my MacBook at my desk." If this doesn't work smoothly, the product has failed its core promise.

### 4.6 Escalation from Conversation to Operational Object

This is the critical UX pattern that separates a command center from a chatbot.

- Any conversation should be promotable to: a run (with tracked execution), a work item (with approval flow), an artifact (with versioning and storage), a schedule (with recurrence), or a memory entry (with governance).
- The UI should make escalation effortless: "save this," "run this in the background," "schedule this weekly," "remember this."
- Once escalated, the object lives in the product state layer and is visible in the dashboard—it no longer depends on the chat thread for its existence.

---

## 5. Shared vs Local State Guidance

### Must be canonical and shared across all devices:
- Run state and event logs
- Approval queue and resolution history
- Artifact registry and artifact content
- Schedule definitions and schedule health
- Long-term memory entries
- Agent definitions and configuration
- Conversation history (as product state, not provider state)
- Notification delivery state (read/unread/acted-on)
- User preferences and system configuration

### May be cached locally for performance:
- Recent conversation turns (for fast rendering)
- Artifact thumbnails/previews
- Dashboard state snapshots (for offline glanceability)
- Voice session audio buffers (during active session only)
- Model inference cache (on Mac mini, for repeated queries)

### Should remain intentionally device-local:
- Active voice session audio (ephemeral; transcripts go to shared state)
- Draft input before submission (user is still typing/speaking)
- Device-specific UI preferences (font size, layout, dark mode)
- Biometric auth state (FaceID/TouchID tokens)
- Local model weights and inference runtime state (Ollama/MLX on Mac mini only)

---

## 6. Tradeoff Matrix

### Local-first vs Hosted-first

|                          | Local-first                                                                                                                                                                                                          | Hosted-first                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **You get**              | Privacy, offline capability, lower marginal cost, no vendor dependency for core ops                                                                                                                                  | Frontier model quality, lower engineering burden, faster initial delivery |
| **You give up**          | Frontier reasoning quality for complex tasks, engineering effort for local infra                                                                                                                                     | Privacy control, offline resilience, long-term cost efficiency            |
| **Recommended position** | Local-first for the execution substrate (it's already on a Mac mini). Hosted models as a tiered capability—routed to when local can't handle the task. Never build a system that breaks when the internet goes down. |

### Chat-centric vs Operations-centric UI

|                          | Chat-centric                                                                                                                                                                                 | Operations-centric                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **You get**              | Familiar UX, low learning curve, fast to build                                                                                                                                               | Inspectability, control, scales with complexity |
| **You give up**          | Visibility into background work, control over complex flows                                                                                                                                  | Conversational ease, fast to ship               |
| **Recommended position** | Operations-centric with chat as an input surface. Chat-centric systems collapse under complexity—you end up scrolling through threads to find what ran, what produced what, and what failed. |

### Approval-heavy vs Approval-light

|                          | Approval-heavy                                                                                                                                                                                                                                                                                                          | Approval-light                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **You get**              | Safety, trust, auditability                                                                                                                                                                                                                                                                                             | Speed, autonomy, less friction                                       |
| **You give up**          | Speed of execution, risk of approval fatigue                                                                                                                                                                                                                                                                            | Safety margin, ability to catch mistakes before they're irreversible |
| **Recommended position** | Start approval-heavy, earn your way to approval-light. Risk-tiered approvals (auto-approve read-only; require approval for irreversible writes and external communications). Build the machinery for approvals in v1 even if you initially approve everything—retrofitting approvals is much harder than relaxing them. |

### Lightweight memory vs Governed memory

|                          | Lightweight (just store and retrieve)                                                                                                                                                                                                              | Governed (scoped, tiered, inspectable)                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **You get**              | Fast to build, easy to use                                                                                                                                                                                                                         | Long-term trustworthiness, no context pollution, user control |
| **You give up**          | Control, will eventually become noisy and untrustworthy                                                                                                                                                                                            | Engineering effort upfront                                    |
| **Recommended position** | Governed from day one. The three-tier model (ephemeral / situational / long-term) with explicit scoping and user-visible inspection is a requirement, not a nice-to-have. Every source agrees: unscoped memory is the #1 long-term quality killer. |

### Browser-local state vs Shared canonical state

|                          | Browser-local                                                                                                                                                        | Shared canonical                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **You get**              | Simplicity, no sync infrastructure                                                                                                                                   | Multi-device continuity, single source of truth |
| **You give up**          | Cross-device continuity (the core promise)                                                                                                                           | Engineering effort for sync                     |
| **Recommended position** | Shared canonical for all operational objects. Browser-local only for UI preferences and ephemeral caches. This is non-negotiable given the multi-device requirement. |

### Voice-early vs Voice-later

|                          | Voice-early                                                                                                                                                                                                                                                 | Voice-later                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **You get**              | Differentiated experience, hands-free use from day one                                                                                                                                                                                                      | Simpler engineering, faster to stable product |
| **You give up**          | Engineering focus on higher-leverage features (dashboard, approvals, artifacts)                                                                                                                                                                             | Mobile convenience, the "magic" feeling       |
| **Recommended position** | Voice-later. Build the dashboard, runs, approvals, and artifact system first. Voice enters in phase 3 as chained ASR→LLM→TTS. The operational foundation is higher leverage than voice polish—and voice without a solid operations layer is just a chatbot. |

---

## 7. Anti-Patterns

### The 10 most dangerous mistakes:

1. **Building a chatbot instead of a control plane.** If your primary UI is a chat thread and everything else is secondary, you'll never have real visibility or control. Chat is input; the dashboard is the product.

2. **Coupling your task identity to a provider's session ID.** If your "run" is an OpenAI response ID or a LangGraph thread ID, you lose portability, break handoffs, and can't unify work across providers. Own your IDs.

3. **Global unscoped memory.** Shoving everything into one vector store without domains, retention policies, or access controls. It feels productive for two weeks and then becomes a liability—noisy retrieval, accidental context leakage, and impossible cleanup.

4. **Silent autonomy.** Agents that take real-world actions (sending emails, modifying files, calling APIs) without explicit logs or approvals. Trust is built by transparency, not capability.

5. **Client-specific business logic.** Putting run management, approval resolution, or memory operations inside the iOS or Mac client. This guarantees divergent behavior across devices and makes every feature twice as hard to ship.

6. **Treating voice as transcription + chat.** Voice needs its own interaction contract: turn-taking, barge-in, latency budget, and graceful degradation. Bolting ASR onto a text chat is a demo, not a product.

7. **No observability.** Launching agents without traces, logs, and replay. Every source agrees: agents fail in long-tail ways. Without traces, you can't diagnose, and without replay, you can't improve.

8. **Unbounded agent loops.** No iteration cap, no timeout, no cost budget on agentic tool-use chains. A single runaway loop can burn significant tokens and take unpredictable actions.

9. **Over-engineering the orchestration layer before building the product state layer.** Spending months on LangGraph state machines or n8n workflows before you have a canonical run/event/artifact data model. The data model is the product; orchestration is implementation.

10. **Premature computer-use automation.** Screen-scraping and pixel-clicking sounds powerful but is brittle, slow, and introduces a large attack surface. Prefer APIs and MCP tools first; use computer-use only for "no API exists" cases, and always sandboxed with strict approvals.

---

## 8. Product Implications

### Top 10 Product Requirements

1. Every unit of work is a **run** with a lifecycle, visible in the dashboard from any device.
2. **Cross-device continuity**: start on iPhone, continue on MacBook, with state preserved automatically.
3. **Tiered approvals**: auto-approve low-risk, require human input for irreversible or external actions, with typed approval steps (not just yes/no).
4. **Artifacts as first-class outputs**: stored, versioned, browsable, and linked to producing runs.
5. **Memory governance UI**: users can see, edit, and delete what the system "knows," scoped by domain.
6. **Background execution with status**: long tasks run unattended with progress, completion, and failure notifications.
7. **Attention management**: configurable notifications, daily digests, and a clear "inbox" for pending items.
8. **Chat as front door**: natural language initiation that escalates to structured operational objects.
9. **Trace and replay for every run**: full audit trail of tool calls, model choices, and approvals.
10. **Schedules as visible objects**: recurring work is browsable, pausable, and health-monitored.

### Top 10 Architecture Decisions

1. **Own your object model.** Define canonical schemas for runs, events, agents, artifacts, schedules, conversations, work items, and memory entries. This is the product's backbone.
2. **Product state layer on the Mac mini** (Postgres + Redis), separate from OpenClaw's execution state. OpenClaw writes events; the product state layer is the system of record.
3. **Thin clients, fat backend.** All clients (iOS, Mac, web) are views into product state. No client-side business logic beyond rendering and local caching.
4. **OpenClaw emits a standard event stream** that the product state layer ingests. Define the event schema as a contract between execution and product layers.
5. **Approval semantics at the product layer**, not inside OpenClaw. OpenClaw pauses and emits an approval-needed event; the product layer routes it, tracks resolution, and signals OpenClaw to resume.
6. **Memory as a governed data store** with three tiers, explicit scoping, and user-facing CRUD. Not a hidden feature of the LLM.
7. **Artifact storage on the Mac mini filesystem** (or a synced location), with metadata and provenance tracked in product state. Artifacts are addressable by stable URL.
8. **MCP as the standard tool protocol** for new integrations. Custom tool integrations should be MCP servers where possible.
9. **Tracing from day one.** Every run logs tool calls, model selections, durations, inputs, and outputs. This is not optional—it's how you debug and improve.
10. **WebSocket or SSE for real-time updates** from the Mac mini to all connected clients. Polling is acceptable as a fallback but not the primary pattern.

### Top 10 UX Requirements

1. **Glanceable dashboard**: on iPhone, the home screen answers "what's happening, what needs me" in under 3 seconds.
2. **One-tap approvals** for low-risk items directly from push notifications.
3. **Run detail view** that shows the full event timeline, tool calls, and outputs—like a debugger for agent work.
4. **Artifact viewer** that handles markdown, text, images, and PDFs inline on all devices.
5. **"Continue on [device]" affordance** visible whenever a task is active on another device.
6. **Chat input** that supports text, voice-to-text, photo/screenshot attachment, and clipboard paste.
7. **Escalation actions** in chat: "save as artifact," "run in background," "schedule this," "remember this."
8. **Memory browser**: searchable, filterable, with source attribution and delete capability.
9. **Schedule management**: create, edit, pause, resume, and view history—all from any device.
10. **Notification preferences**: per-agent, per-risk-level, per-device, with quiet hours and digest options.

### Top 10 Unresolved Questions

1. **What is OpenClaw's event emission format?** The product state layer design depends entirely on what OpenClaw can emit and how.
2. **Can OpenClaw pause and resume on external signal?** The approval system requires OpenClaw to block on an approval-needed event and resume when the product layer signals resolution. If OpenClaw can't do this natively, a wrapper is needed.
3. **How does OpenClaw handle concurrent runs?** The dashboard needs to show multiple active runs; OpenClaw's concurrency model determines whether this is straightforward or requires queuing.
4. **Where do model routing policies live?** In OpenClaw (at execution time) or in the product state layer (as configuration that OpenClaw reads)? The latter is more flexible but requires a contract.
5. **What is the right sync mechanism for cross-device state?** Apple's CloudKit? A lightweight custom sync service on the Mac mini? A shared database that clients read via API? Each has different latency, complexity, and offline characteristics.
6. **How should voice sessions integrate with the product state layer?** Does a voice session create a conversation object immediately, or only when work is escalated?
7. **What is the right artifact storage model for large files?** Filesystem with metadata in Postgres? Object storage? How do mobile clients access artifacts without downloading full files?
8. **Should there be a web dashboard in addition to native apps?** A web UI is faster to build and iterate on; native apps offer better device integration (Handoff, notifications, biometrics).
9. **How should the system handle OpenClaw upgrades?** If OpenClaw's event format or tool protocol changes, the product state layer needs a migration path.
10. **What is the trust model for multi-user?** Is this strictly single-user, or should it support a household? This affects memory scoping, approval routing, and notification design.

---

## 9. Sequencing Guidance

### Phase 1: Product State Foundation (build first, no shortcuts)

**What:** Define and implement the canonical object model (runs, events, agents, artifacts, schedules, conversations, work items, memory). Stand up Postgres + Redis on the Mac mini. Build the event ingestion pipeline from OpenClaw.

**Why first:** Everything else depends on this. You cannot build a dashboard without objects to display. You cannot build approvals without a state machine for runs. You cannot build cross-device continuity without a shared data store.

**Delivers:** A working backend that ingests OpenClaw events and maintains canonical state. No UI yet, but queryable via API.

### Phase 2: Dashboard MVP (MacBook-first)

**What:** Build the dashboard UI—initially as a web app or Mac app. Fleet view, run detail, artifact viewer, approval queue, schedule list, memory browser.

**Why second:** The dashboard is the core product surface. Build it for the device where you'll use it most (MacBook), validate the information architecture, and iterate.

**Delivers:** A usable operations center on MacBook. You can see what OpenClaw is doing, inspect runs, approve work, browse artifacts.

### Phase 3: Mobile (iPhone) + Cross-Device

**What:** Build the iOS app (or responsive web). Glanceable home screen, push notifications for approvals, one-tap approve/deny, "continue on Mac" handoff.

**Why third:** Mobile is where cross-device continuity becomes real. But it depends on the product state layer (phase 1) and a working dashboard design (phase 2).

**Delivers:** The multi-device promise. Start on phone, continue on Mac.

### Phase 4: Chat Integration

**What:** Add chat as an input surface—text input on all devices, with escalation to runs/artifacts/schedules/memory. Integrate with OpenClaw's conversational capabilities.

**Why fourth:** Chat is an interaction modality, not the product. It's more valuable when there's a product state layer to escalate into.

**Delivers:** Natural language front door. "Research X and write a summary" creates a visible run with a tracked artifact.

### Phase 5: Voice

**What:** Add voice input (chained ASR → text → TTS initially). Local Whisper for transcription. Voice-triggered approvals and status checks on iPhone.

**Why fifth:** Voice is a convenience layer. It's dramatically more useful when there's a product to interact with (runs to check, approvals to resolve, artifacts to request).

**Delivers:** Hands-free operation from iPhone/AirPods.

### Phase 6: Advanced Capabilities

**What:** Upgrade voice to speech-to-speech (Realtime API). Add computer-use automation (sandboxed, with strict approvals). Implement multi-agent coordination patterns. Advanced memory features (time-weighted retrieval, cross-domain reasoning).

**Why last:** These are capability multipliers, not foundations. They're high-effort, high-reward—but only if the foundation is solid.

**Dependencies map:**
- Phase 2 depends on Phase 1
- Phase 3 depends on Phase 1 and Phase 2
- Phase 4 depends on Phase 1 (and benefits from Phase 2)
- Phase 5 depends on Phase 4
- Phase 6 depends on everything

---

## 10. Final Recommendation

### Design stance to adopt:

**Operations-centric, not chat-centric.** The system's value is in making agentic work visible, controllable, and trustworthy across devices. Chat and voice are important input surfaces, but the dashboard and product state layer are the product.

### The five non-negotiables:

1. **Own your object model.** Runs, events, artifacts, memory, schedules—all have canonical schemas you control. Not provider IDs.

2. **Shared canonical state for all operational objects.** If it's not in the product state layer, it doesn't exist for the system. No client-side truth.

3. **Approvals with typed context, tiered by risk.** This is how trust is built. Retrofitting it is 10x harder than building it in.

4. **Traces and replay for every run.** Non-negotiable for debugging, improvement, and user trust.

5. **Memory is governed, not global.** Three tiers, explicit scoping, user-visible inspection and editing.

### Risks of ignoring them:

- Without an owned object model: you're locked to whatever OpenClaw or a provider exposes, and cross-device state becomes a nightmare.
- Without shared canonical state: your multi-device promise breaks immediately. Each device shows different things.
- Without tiered approvals: either everything requires approval (friction kills usage) or nothing does (silent autonomy erodes trust until something goes wrong).
- Without traces: you can't diagnose failures, can't improve agent quality, and can't answer "why did the system do that?"
- Without governed memory: context pollution accumulates silently, retrieval quality degrades, and the user loses trust in the system's "knowledge" without understanding why.

Build the foundation. Earn the right to add magic later.
