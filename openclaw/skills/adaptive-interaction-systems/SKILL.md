---
name: adaptive-interaction-systems
description: "Design and implementation guidance for adaptive interaction systems: AI-first web apps, agentic product surfaces, context-aware copilots, multi-step orchestration interfaces, memory-backed UX, tool-using assistants, and conversation-plus-workspace products. Use when Codex needs to define architecture, interaction models, context/memory strategy, tool boundaries, frontend/backend contracts, streaming patterns, or evaluation plans for software that adapts to user intent and system state over time."
---

# Adaptive Interaction Systems

## Overview

Use this skill to turn vague "AI app" ideas into concrete product and system decisions. Focus on adaptive behavior: how the system senses user intent, accumulates context, chooses actions, explains state, and safely evolves across a session or workflow.

## Workflow

1. Identify the adaptive surface.
2. Choose the interaction model.
3. Define the context architecture.
4. Define the action space and system topology.
5. Specify memory, streaming, and evaluation.
6. Recommend implementation phases.

## Step 1: Identify The Adaptive Surface

State what must adapt and what must remain stable.

- User-side variability: goals, expertise, urgency, trust needs, preferred modality.
- System-side variability: available tools, retrieved knowledge, prior memory, execution state, errors, confidence.
- Stable rails: policy, permissions, design system, domain constraints, data contracts, escalation paths.

Do not start with "chat UI" as the product definition. Start with the loop:
intent -> context assembly -> reasoning -> action -> visible state -> revision.

## Step 2: Choose The Interaction Model

Pick one primary model and explicitly justify it:

- Conversational copilot: best when the user explores, asks, compares, and iterates.
- Plan-and-execute workspace: best when work spans multiple steps, artifacts, or approvals.
- Ambient adaptive UI: best when the interface reconfigures around context without requiring constant prompting.
- Mixed initiative system: best when the agent proposes next actions but the user retains checkpoints and approval.

Prefer hybrid designs over pure chat when the system must:
- show execution progress
- expose structured state
- support interruption, rollback, or approval
- preserve long-running work across sessions

For interaction-pattern guidance, read [references/interaction-models.md](./references/interaction-models.md).

## Step 3: Define The Context Architecture

Treat context as a designed system, not a transcript dump.

Specify:
- Bootstrap context: durable instructions, role, values, product boundaries, tool policies.
- Working context: active task state, user goals, current plan, recent tool outputs, UI selection/focus.
- Retrieved context: relevant docs, examples, schemas, domain facts, architectural decisions.
- Persistent memory: user preferences, project decisions, reusable artifacts, prior outcomes.
- Discardable noise: stale branches, verbose logs, abandoned options, raw dumps.

Default rules:
- Keep always-loaded context short and normative.
- Retrieve deep references on demand.
- Summarize decisions, not every exploration step.
- Treat memory as untrusted input that requires scoping and sanitization.

For architecture details, read [references/context-architecture.md](./references/context-architecture.md).

## Step 4: Define The Action Space And Topology

Model the system at four levels:
- L1: actors, system boundary, external dependencies
- L2: containers and trust boundaries
- L3: internal components for orchestration, memory, retrieval, tool routing, UI state
- L4: code only when implementing or debugging a specific component

Require explicit contracts for:
- tool invocation
- API schemas
- event and stream payloads
- memory read/write rules
- approval and rollback points

Prefer:
- OpenAPI or equivalent machine-readable contracts for actions
- MCP-style tool boundaries for external capabilities
- design tokens or semantic styling constraints for UI generation
- server-mediated streaming, never direct client-to-model calls for production systems

For implementation guidance, read [references/implementation-blueprint.md](./references/implementation-blueprint.md).

## Step 5: Specify Memory, Streaming, And Evaluation

Define memory by horizon:
- Session memory: current thread, transient working state, active branch.
- Project memory: stable decisions, architecture choices, operating assumptions.
- User memory: preferences and recurring goals, only when allowed and useful.

Choose streaming by collaboration mode:
- SSE for standard token streaming and simpler scale.
- WebSockets when the user must interrupt, steer, or co-edit during execution.

Evaluate the system on:
- task completion quality
- context precision and retrieval quality
- action success and recovery rate
- visual coherence and state legibility
- interruption, handoff, and long-horizon consistency

## Deliverables

When using this skill, produce concrete artifacts rather than general advice:
- an interaction model recommendation
- a C4-style architecture outline
- a context and memory design
- an action/tool contract strategy
- a streaming and state-management choice
- a phased implementation plan
- risks and anti-patterns

## Sub-Agent Guidance

Use a specialist sub-agent only when the task warrants deep parallel analysis. Do not use a separate agent just to compensate for a weak skill.

Create or invoke a specialist when:
- the product spans frontend, orchestration, memory, and tool design simultaneously
- multiple candidate architectures need comparison
- a team needs repeated expert reviews on AIS decisions
- you want a reusable "architecture critic" for adaptive systems

Keep the skill as the router and operating manual. Use the sub-agent as a focused worker with a narrow charter such as:
- adaptive UX architect
- context systems architect
- agent runtime reviewer

For a recommended specialist prompt and operating boundary, read [references/specialist-subagent.md](./references/specialist-subagent.md).
