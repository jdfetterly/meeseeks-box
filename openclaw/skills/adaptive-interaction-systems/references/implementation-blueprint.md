# Implementation Blueprint

Use this reference when translating product intent into a system design.

## Recommended Baseline Topology

### Frontend

- React or equivalent component system
- structured workspace, not chat-only
- semantic design tokens as the styling source of truth
- stream-aware state model for partial updates

### Orchestration Backend

- request assembly layer for prompt/context construction
- planner or coordinator for multi-step work
- tool router with explicit schemas
- retrieval layer for docs, specs, and prior decisions
- memory service with scoped reads and writes
- event stream service for token and state updates

### External Systems

- APIs described with explicit schemas
- MCP-compatible tool servers when tool sprawl grows
- vector or indexed search for targeted retrieval
- durable store for decisions, artifacts, and transcripts

## Contract Requirements

Define machine-readable contracts for:
- tool inputs and outputs
- error shapes
- stream event types
- artifact metadata
- approval requests
- memory write formats

If a contract is fuzzy, the agent will compensate with guesses.

## C4-Oriented Framing

At minimum, specify:

### L1

- users and operators
- adjacent business systems
- compliance and trust boundaries

### L2

- frontend app
- orchestration service
- retrieval/index service
- memory store
- tool servers
- primary data systems

### L3

- intent interpreter
- plan manager
- execution engine
- state synchronizer
- memory manager
- retrieval policy
- approval handler

## Streaming Choice

Prefer SSE when:
- output is mostly server-to-client token and event delivery
- the system does not require active interruption on the same connection

Prefer WebSockets when:
- the user must stop or redirect work mid-stream
- multiple participants or canvases update in real time
- the client needs to push live control events during execution

## Delivery Sequence

1. Build a narrow vertical slice with one real user workflow.
2. Add structured plan and execution state before expanding autonomy.
3. Add scoped memory only after the core loop is stable.
4. Add retrieval and tool breadth gradually.
5. Add evaluation harnesses before scaling workflows.

## Evaluation Harness

Test with scenarios that measure:
- ambiguous requests
- interrupted runs
- failed tool calls
- stale memory
- long-horizon work across multiple sessions
- UI trust and recoverability
