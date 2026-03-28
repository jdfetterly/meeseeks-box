# Interaction Models

Use this reference when choosing how the product should expose adaptive behavior to users.

## Selection Heuristic

Choose the simplest model that still makes state, agency, and control legible.

## Model 1: Conversational Copilot

Choose this when users are exploring, learning, comparing, or asking for help.

Strengths:
- low friction input
- flexible intent capture
- strong for discovery and ambiguity

Weaknesses:
- poor state visibility
- hard to inspect plans and dependencies
- weak for long-running or multi-object work unless paired with structured panels

## Model 2: Plan-And-Execute Workspace

Choose this when work spans multiple steps, artifacts, tools, or approvals.

Typical UI zones:
- conversation or command bar
- plan/task list
- artifacts/output panel
- activity log
- approval or exception queue

This is the default for serious agentic products.

## Model 3: Ambient Adaptive UI

Choose this when the product should reconfigure itself around detected context:
- prefilled views
- surfaced next actions
- dynamic controls
- context-sensitive panels

Use sparingly. Users still need stable anchors and predictable controls.

## Model 4: Mixed Initiative System

Choose this when the agent should proactively suggest actions but not fully take over.

Require:
- visible reasoning summary
- clear proposed action
- explicit approval boundary
- undo or rollback path

## Design Rules

- Never hide execution state inside prose when a structured status panel would be clearer.
- Never replace core navigation with chat if the user must repeatedly inspect objects, compare states, or edit structured data.
- Show what the system knows, what it is doing, and what it needs from the user.
- Distinguish draft output, accepted decisions, and live system state.

## Anti-Patterns

- Chat pasted on top of a normal CRUD app with no change in information architecture
- Agent actions that mutate state without visible checkpoints
- Adaptive UI changes with no explanation
- Long-running work with no progress model, event stream, or resumable state
