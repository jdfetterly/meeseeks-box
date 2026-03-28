# Personal AI Command Center — Build Context Brief

## Core product thesis

This should not be designed as “a UI for OpenClaw.”

It should be designed as **your personal AI command center**: a browser-based operating layer that helps you see, steer, inspect, and trust a growing system of agents, tasks, memory, and automations running on your Mac mini.

The strongest version of this product is not chat-first. Chat is one interaction mode. The center of gravity is **operational visibility + controllability + context continuity**.

That matters because your actual working style is not “open one assistant and ask a question.” You are building toward a more persistent agentic environment where multiple things may be happening at once:

- background tasks
- recurring jobs
- agent teams with distinct roles
- evolving memory/context
- work that spans devices
- work that shifts between exploration, execution, and review

So the product needs to answer four constant questions:

1. **What exists?**
2. **What is happening right now?**
3. **What happened and why?**
4. **What needs my attention or decision?**

That is the frame for the whole build.

---

## Product direction

The best way to think about the fork is as an **AI operations and orchestration surface** made up of a few connected layers:

- **fleet model**: agents, teams, tools, memory scopes, schedules
- **runtime model**: runs, events, task state, artifacts, failures, approvals
- **work model**: queued work, blocked work, recurring work, handoffs
- **context model**: memory, lineage, relationships, provenance
- **interaction model**: chat, task initiation, drilldowns, approvals

Most dashboards fail because they over-index on one of these and neglect the others.

What you need is a UI that makes the system legible as it grows.

---

## Highest-value feature ideas

## 1. Fleet overview as a real control surface

This should be the landing page. Its job is not to be pretty. Its job is to compress system state into something you can scan in seconds from your Mac, the Mini, or your phone.

### What it should answer
- Is the system healthy?
- What is currently running?
- What is stuck or failing?
- What is coming up next?
- What changed recently?
- What needs me?

### Components
- health strip
- active runs panel
- attention panel
- upcoming schedules
- recent artifacts
- recent memory changes
- live event preview
- cost / usage snapshot

### Why this matters for you
You are unlikely to use this as a passive dashboard sitting on a TV. You are more likely to use it in short, repeated check-ins:
- at the start of the day
- between meetings
- when something feels off
- when you want to know whether your background automations actually ran
- when you want quick reassurance that the system is “alive”

This is closer to how operators use an internal control plane than how consumers use an assistant app.

### Likely use cases
- You wake up, open the dashboard on your phone over Tailscale, and immediately see:
  - overnight jobs completed
  - one recurring task failed
  - a memory extraction agent wrote three new items
  - a scheduled research agent is queued for later
- You are on your personal Mac and want to know whether the Mini is actively processing anything before kicking off another heavy workflow
- You are in a work block and want a quick “system pulse” without opening terminals

---

## 2. Agent catalog and org graph

This is the persistent model of your system: what agents exist, how they relate, what they can do, and how they are configured.

This is not the same thing as runtime execution. That distinction matters.

### What it should show
- agent list
- hierarchy / team graph
- tools and capabilities
- parent-child relationships
- memory scopes / namespaces
- schedules owned by each agent
- recent activity
- last changed / last indexed

### Why it matters
As your setup grows, the main failure mode is not “the model was bad.” It is:
- duplicated roles
- overlapping responsibilities
- unclear boundaries
- agents with too much tool access
- agents that exist but are not actually used
- memory structures that drift out of sync with agent purpose

This page gives you a structural map of the system.

### Likely use cases
- You add a new “research synthesis” agent and want to see where it sits relative to your strategy, knowledge, and execution agents
- You are debugging why two agents keep doing similar work and want to compare tools, scope, and role
- You want a quick visual answer to: “what agents do I actually have now?”
- You want to know which agents are scheduled, which are dormant, and which are acting as hubs

### Design principle
The org graph should be the answer to **what exists**.

It should not try to explain what happened in a specific run.

---

## 3. Runs as a first-class execution explorer

This is one of the strongest ideas from the earlier thread, and it is probably the most important one to preserve.

Most AI tools flatten execution into chat or logs. That is not enough.

A run should be treated as a discrete object with structure, state, history, and outputs.

### What a run view should contain
- run summary
- trigger source
- start/end time
- status
- duration
- model/tool usage
- execution graph
- event timeline
- retries
- approvals
- outputs and artifacts
- memory reads/writes

### Why this matters
When something goes wrong, you do not want “a bunch of text.” You want a model of what actually happened:
- which agent acted
- which tool was called
- what memory was read
- what branch failed
- whether a retry happened
- whether the issue was a tool problem, prompt problem, context problem, or dependency problem

That is what makes a system operable.

### Likely use cases
- You kick off a content or research workflow and later want to inspect how the system reached a conclusion
- A scheduled task silently underperforms and you need to see whether it was:
  - missing context
  - broken tool access
  - bad prompt/role fit
  - failure to hand off to the right sub-agent
- You are iterating on agent roles and want to compare how similar runs behaved across versions
- You want to review how an artifact was produced before trusting or reusing it

### Strong feature idea
The run view should support both:
- **timeline mode** for sequential understanding
- **graph mode** for structural understanding

That combination is much stronger than logs alone.

---

## 4. Work board as orchestration, not project management cosplay

The board should not imitate Jira or Trello unless that metaphor genuinely helps.

The reason to have a board is to make agent work legible and steerable.

### Better lane model
Not just:
- To Do
- Doing
- Done

More useful:
- queued
- running
- waiting on input
- needs approval
- blocked
- failed
- completed

That reflects real agent workflows.

### What a work item should include
- assigned agent
- linked run
- linked memory/context
- dependencies
- outputs
- retries
- approval state
- priority
- trigger type
- handoff history

### Why this matters
Your actual workflow often includes a mix of:
- things you are actively asking for
- things you want done later
- things that need review
- things that should happen automatically
- things that are waiting on you to decide

A work board helps convert the agent layer from “interesting automation” into something you can manage.

### Likely use cases
- You ask an agent to produce a draft, then later move it into “needs review”
- You have recurring tasks that generate artifacts, and some of them should route into a board lane instead of just disappearing into logs
- You use the board as a place to hand work from one agent to another
- You want to see what is blocked because it is waiting on your decision, not because the system is broken

### Strong insight
The board becomes much more valuable when each card can open a drawer that shows the actual run, events, artifacts, and dependencies behind it.

Without that, it becomes superficial.

---

## 5. Global event console

This is your real-time nervous system.

The event console should not just show raw logs. It should show **meaningful system events**.

### Event examples
- agent started
- tool invoked
- memory read
- memory write
- artifact created
- approval requested
- run completed
- retry started
- run failed
- schedule missed

### Why this matters
You want a way to understand the system across all pages and all workflows, not just one run at a time.

This is especially useful when multiple things are happening in parallel.

### Likely use cases
- You are working from your Mac and want a persistent side rail showing the latest meaningful events
- You notice something odd in system behavior and want to filter events by one agent or one task type
- You want to inspect patterns over time, such as repeated tool failure or memory churn
- You are using the system as a true background command center and need one place to watch the pulse of everything

### Strong product move
Make the event console globally accessible from anywhere in the app. It should function like a universal activity rail, not a buried page.

---

## 6. Scheduler and recurring job intelligence

Because you want a persistent system, scheduled work becomes central.

This is not a settings screen. It is an operations surface.

### What it should show
- all jobs
- next run
- last successful run
- recent failures
- run duration trends
- failure streaks
- freshness of outputs
- missed runs
- heatmap of recent outcomes

### Why this matters
Recurring work is where trust either compounds or breaks down.

A lot of agent systems feel impressive when manually triggered. The real question is whether they behave predictably over time.

### Likely use cases
- morning or evening check-ins on whether your recurring tasks ran
- verifying that a research, synthesis, or memory-maintenance job is still healthy
- spotting stale outputs even when the job technically ran
- deciding whether a recurring job should be retired, re-scoped, or escalated

### Strong insight
The more useful metric is often not just “did it run?” but:
- did it produce something useful?
- is that output still fresh?
- is it stable over time?

That is much closer to your thinking style around measurable outcomes and second-order effects.

---

## 7. Memory as lineage, not just storage

This is a big one.

A lot of systems treat memory as hidden infrastructure or a folder browser. That is too thin.

Memory should be inspectable in terms of:
- what it is
- where it came from
- what changed it
- what used it
- what depends on it

### What it should contain
- memory browser
- relationship view
- timeline view
- provenance panel
- faceted search
- namespace view

### Why this matters
You care a lot about:
- lineage
- structured context
- defensibility
- context degradation over time
- durable knowledge structures

That means memory cannot remain opaque.

### Likely use cases
- tracing how a durable preference or reference got into the system
- understanding which agents are touching which memory domains
- checking whether some memory object is stale, duplicated, or overused
- building confidence that the system’s evolving context is inspectable rather than mystical

### Strong insight
This is one of the areas where your working style is ahead of most casual users. You are not just looking for “assistant memory.” You are trying to build **context infrastructure**.

So the memory experience should be closer to context governance than to a notes browser.

---

## 8. Chat as a useful front door, not the center of the product

Chat still matters. But it should not dominate the architecture.

### What chat should do well
- talk to a chosen agent
- attach files / voice / screenshots
- show related context
- surface generated artifacts
- link to work items
- link to runs
- escalate conversations into tracked work

### Why this matters
Chat is your best low-friction initiation surface:
- when you are on your phone
- when you want to ask for something quickly
- when you are exploring rather than orchestrating

But if chat is a dead end, the system fragments.

### Likely use cases
- starting work from your iPhone while away from your desk
- kicking off a task via chat and later reviewing it in the board or run explorer
- using voice or quick text to capture a task into the system
- initiating work conversationally, then managing it operationally later

### Strong design principle
A conversation should be able to produce:
- a run
- a work item
- artifacts
- memory updates

And you should be able to navigate between them.

That is what turns chat from “a messaging layer” into a real front end for the system.

---

## 9. Artifact-centric thinking

This is worth pulling out explicitly.

Many systems treat outputs as an afterthought. You should not.

Artifacts are often the thing you actually care about:
- draft documents
- summaries
- plans
- notes
- images
- structured outputs
- memory writes
- files
- logs worth keeping

### Why this matters
A lot of your work ends in reusable outputs:
- strategy documents
- enablement assets
- structured thinking
- planning docs
- content drafts
- research syntheses

So the system should help you trace, inspect, reuse, and route artifacts.

### Likely use cases
- opening the artifact trail from a run to find the actual useful output
- seeing which recurring jobs generated something worth reviewing
- browsing outputs by project, agent, or date
- connecting artifacts into your broader knowledge and workflow environment

### Strong feature move
Have an artifact tray or artifact drawer pattern that appears consistently across runs, chat, board items, and schedules.

---

## 10. Attention management and triage

One of the best hidden opportunities here is to make the system good at showing **what deserves your attention**.

That is more valuable than just showing everything.

### What deserves attention
- failures
- retries exhausted
- approvals needed
- stale jobs
- outdated memory
- repeated bottlenecks
- underused agents
- expensive but low-value runs

### Why this matters
You do not need another system that generates more activity for you to sift through.

You need one that helps you allocate attention intelligently.

### Likely use cases
- checking what needs your intervention before a work block
- identifying which automations are worth improving versus ignoring
- spotting drift in agent roles or memory quality
- understanding where the system is producing noise instead of leverage

This is where the product starts becoming genuinely useful instead of just interesting.

---

## The pages to anchor around

The strongest page set is:

- **Overview**
- **Agents**
- **Runs**
- **Work**
- **Schedules**
- **Memory**
- **Events**
- **Chat**
- **Artifacts**
- **Settings**

That structure maps well to:
- system model
- execution model
- work model
- context model
- interaction model

---

## Most important cross-cutting UI patterns

These matter more than any one page.

## Universal drawers
From anywhere in the app, you should be able to open:

- run drawer
- agent drawer
- artifact drawer
- work item drawer

This matters because the real system is relational. You should be able to jump between objects without losing context.

## Persistent activity rail
A global stream of meaningful system events. Not just on the Events page.

## Linked navigation across entities
From:
- chat → run
- run → artifact
- work item → dependency
- schedule → recent runs
- memory object → provenance

This is how the app becomes a command center instead of a collection of pages.

## Saved views
You will likely develop recurring operational perspectives:
- “what failed recently”
- “what is waiting on me”
- “what changed in memory this week”
- “which agents are most active”
- “which recurring jobs are unstable”

Those should be savable.

---

## Use cases grounded in your habits and flow

## Short mobile check-ins
Because your system is browser-based and available over Tailscale, one of the most natural usage patterns is quick iPhone check-ins:
- scan status
- confirm jobs ran
- see what needs attention
- glance at recent artifacts
- ask an agent to start something

This argues for a clean summary-first home page and strong mobile drawers rather than dense desktop-only layouts.

## Builder/operator loops
You tend to think in systems, iterate quickly, and refine structure as you learn. That means you will likely move in loops like:
- inspect current system
- identify friction or overlap
- adjust agent role/tooling
- run again
- compare results

That makes the Agents and Runs surfaces particularly important.

## Context governance behavior
You are more likely than a typical user to care about:
- where context came from
- how it evolves
- whether it remains useful
- whether memory is becoming noisy

That makes the Memory and Artifacts layers unusually important for your build.

## Background automation with selective intervention
You do not want to manually drive every task. But you also do not want opaque automation. Your likely preference is:
- let things run
- intervene only when needed
- maintain the ability to inspect and trust outputs

That makes the Overview, Events, and Schedules pages central.

## Multi-device continuity
You are moving across:
- personal Mac
- Mac mini
- iPhone

So the app should support quick transitions:
- start in chat on phone
- inspect in runs on desktop
- review artifact later on another device

That argues strongly for linked entities and persistent state, not isolated interfaces.

---

## Deeper product insight

The most important idea is not any individual visualization.

It is this:

**The system should be designed around durable operational objects, not around screens.**

Those objects are:
- agents
- runs
- events
- work items
- schedules
- memory objects
- artifacts
- conversations

If those are modeled well, you can create:
- graphs
- timelines
- boards
- dashboards
- alerts
- saved views
- lineage tools

If they are not modeled well, the product becomes a visually attractive wrapper around logs and chats.

That is the difference between a toy and a command center.

---

## Recommended framing for build notes

> Build this as a personal AI operating layer that makes agents, runs, work, schedules, memory, and artifacts visible, steerable, and trustworthy across devices.

Sharper version:

> Chat starts work. Runs explain work. Boards organize work. Events expose work. Memory preserves context. Artifacts capture value.
