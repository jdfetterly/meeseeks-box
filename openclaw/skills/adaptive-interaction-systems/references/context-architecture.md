# Context Architecture

Use this reference when defining how an adaptive interaction system should assemble, protect, and prune context.

## Design Principles

- Minimize always-loaded context. Keep only durable rules, identity, values, and operating constraints in the bootstrap layer.
- Retrieve specifics just in time. Load architecture notes, domain facts, and implementation details only when they are needed.
- Preserve decisions, not transcripts. Summaries should capture commitments, rationale, and open questions.
- Separate root context from branch context. Exploration threads should not pollute the main working thread.
- Treat memory as potentially unsafe. Scope it per project or user, sanitize inputs, and never grant unrestricted file traversal.

## Context Layers

### 1. Bootstrap Context

Use for durable instructions:
- role and operating stance
- product scope and exclusions
- trust and policy boundaries
- tool permissions
- design system rules
- evaluation goals

Keep this layer compact and normative.

### 2. Working Context

Use for the active task:
- current user request
- task plan
- selected files or objects
- most recent tool outputs
- current UI panel, mode, or selection
- unresolved blockers

This layer changes constantly and should be aggressively pruned.

### 3. Retrieved Context

Use retrieval for:
- architecture docs
- API specs
- decision logs
- examples and prior implementations
- domain knowledge

Retrieve by semantic relevance plus structural relevance. A related but wrong artifact is often worse than no retrieval.

### 4. Persistent Memory

Store only information with reuse value:
- accepted architecture decisions
- naming and design conventions
- user preferences that influence future work
- known failure modes and proven fixes

Avoid storing:
- raw logs
- speculative brainstorms
- stale intermediate outputs
- sensitive content without an explicit need

## Conversation Tree Pattern

Represent long work as:
- root thread for durable intent and accepted decisions
- volatile branches for local exploration, debugging, or option analysis
- merge summaries that move only relevant conclusions back to the root

Required merge payload:
- decision made
- reason it won
- consequences
- follow-up actions

## Compaction And Pruning

Use compaction for old conversation content:
- summarize the oldest material before token pressure becomes critical
- flush critical decisions to durable memory first

Use pruning for tool output:
- trim verbose logs from the active window
- keep full tool output in the external transcript or artifact store

## Anti-Patterns

- Append-only chat as the sole memory system
- Loading whole repos or large docs into the prompt by default
- Letting low-level debugging noise contaminate high-level design context
- Storing policy or design constraints only in ephemeral chat
- Mixing user memory, project memory, and system instructions into one undifferentiated blob
