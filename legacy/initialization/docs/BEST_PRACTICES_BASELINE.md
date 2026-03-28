# ClawPort Best Practices Baseline

Source material:
- Live page: `https://www.clawport.dev/best-practices`
- In-app docs source: `components/docs/BestPracticesSection.tsx`
- Repo reconciled against local checkout on March 9, 2026

This file is the Markdown baseline for a new build. It preserves the operating model from the best-practices page, but normalizes a few points so the guidance stays usable against the current repo.

## What to Keep

### 1. Hierarchy Design

Use a 3-tier org model:

- `Orchestrator`: one root agent with `reportsTo: null`
- `Team lead`: owns a domain or pipeline end to end
- `Specialist`: single-purpose leaf agent

Recommended rules:

1. Keep exactly one root.
2. Keep hierarchy depth at 3 or less.
3. Keep `reportsTo` and `directReports` consistent.
4. Group root-level agents under leads once the root has more than about 8-10 direct reports.
5. Give leaf agents one clear job.

Current bundled fallback topology in `lib/agents.json`:

```text
Jarvis
  |- VERA
  |   |- Robin
  |       |- TRACE
  |       |- PROOF
  |- LUMEN
  |   |- SCOUT
  |   |- ANALYST
  |   |- STRATEGIST
  |   |- WRITER
  |   |- AUDITOR
  |- HERALD
  |   |- QUILL
  |   |- MAVEN
  |- Pulse
  |- ECHO
  |- SAGE
  |- KAZE
  |- SPARK
  |- SCRIBE
```

Note: the current bundled fallback registry contains 20 agents, not 22.

### 2. SOUL.md Character Docs

Each agent should have a `SOUL.md` that describes identity, expertise, limits, working style, and relationships.

Recommended structure:

```md
# AGENT_NAME - Role Title

## Identity
Who the agent is and how it communicates.

## Expertise
What it knows deeply and where it defers.

## Operating Rules
Hard constraints and required output patterns.

## Relationships
Who it reports to and collaborates with.

## Memory
What it remembers and where that memory lives.
```

Guidelines:

- Distinguish personalities so agents do not collapse into the same voice.
- Be explicit about what the agent does not do.
- Include output format examples for structured jobs.
- Keep `SOUL.md` focused; link out instead of turning it into a dump.

### 3. Naming Conventions

Use naming to signal role and scope:

- `UPPERCASE` for team or pipeline agents: `VERA`, `LUMEN`, `HERALD`, `QUILL`
- `Title Case` for orchestrators or more person-like standalone agents: `Jarvis`, `Robin`, `Pulse`

Implementation notes:

- `id` should stay a lowercase slug.
- `name` is the display value shown in the UI.

### 4. Tool Assignment

Use least privilege by default.

Recommended mapping:

| Tool | Purpose | Recommended scope |
| --- | --- | --- |
| `read` | Read workspace files | Nearly all agents |
| `write` | Produce artifacts | Writers, analysts, strategists |
| `exec` | Run commands | Orchestrator and leads only |
| `web_search` | Discover external information | Researchers and monitors |
| `web_fetch` | Pull specific URLs | Scrapers and monitors |
| `message` | Urgent coordination | Leads and orchestrator |
| `sessions_spawn` | Spawn sub-agent work | Orchestrator and limited leads |
| `memory_search` | Search memory index | Orchestrator or memory owner |
| `tts` | Spoken responses | Direct operator-facing agents only |

Default posture:

- Avoid `exec` on leaf agents.
- Avoid giving every agent `message`.
- Start with fewer tools and add only when work proves the need.

### 5. Memory Architecture

Use a 3-tier memory model:

1. Daily logs: raw, short-lived, session-level output
2. `MEMORY.md`: curated durable knowledge
3. Shared team memory: cross-agent reference files

Recommended operating pattern:

- Daily logs capture what happened.
- `MEMORY.md` captures what remains true.
- Shared files carry reusable context across agents.

Recommended logical structure:

```text
agent logs            -> raw session output
MEMORY.md             -> curated durable memory
shared team files     -> market data, ICPs, brand voice, strategy docs
```

Repo-compatible file layout today:

```text
$WORKSPACE_PATH/MEMORY.md
$WORKSPACE_PATH/memory/team-memory.md
$WORKSPACE_PATH/memory/team-intel.json
$WORKSPACE_PATH/memory/YYYY-MM-DD.md
```

If you want your baseline to line up with the current ClawPort UI and API, prefer the `memory/` layout above.

### 6. Agent Communication

Prefer files over direct agent-to-agent calls.

Recommended patterns:

- Upstream reporting: specialists write output files; leads read them later.
- Downstream delegation: leads write briefs; specialists consume them.
- Cross-team sharing: agents read shared memory files for context.

Use `message` only for urgency, not as the default transport for work products.

### 7. Cron Patterns

Cron design principle: one fetch, one decision, one output.

Guidelines:

- Put research crons on specialists.
- Put pipeline crons on team leads.
- Put briefing and synthesis crons on the orchestrator.
- Stagger schedules so upstream work lands before downstream reads.
- Isolate failures so stale data degrades gracefully.

Treat the example cron assignments from the page as patterns, not bundled repo content.

### 8. Voice System

Voice is most useful for agents the operator speaks with directly.

Recommended usage:

- Give voices to operator-facing agents.
- Skip voices for quiet pipeline workers.
- Keep voice optional and metadata-driven.

Current repo note:

- `voiceId` exists in the agent model and agent detail UI.
- A TTS API route exists.
- Chat playback is not fully wired to per-agent `voiceId` yet.

### 9. Design Principles

Carry these forward into the build:

1. Agents are characters, not anonymous functions.
2. Least privilege is the default.
3. Files are the primary coordination layer.
4. One agent should do one job well.
5. Keep hierarchy shallow.
6. Centralize memory curation instead of making every agent maintain itself.

## Baseline Decisions For A New Build

If the goal is to use ClawPort's current documentation as the starting point, the safest baseline is:

- Keep the 3-tier hierarchy and shallow org structure.
- Use explicit `SOUL.md` files for agent identity and constraints.
- Store shared memory in `$WORKSPACE_PATH/memory/` so it matches the current UI and API surface.
- Treat tool assignment and file-based coordination as operational policy, not UI-enforced guarantees.
- Treat voice as optional until per-agent playback is wired end to end.
