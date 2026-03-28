# Chat Brief: Core Model

You are helping define the core product model for Meeseek Box, an AI-forward project operating system built on top of OpenClaw.

## Product Direction

The app should support the real work loop:

`brief -> plan -> bind/bootstrap workspace -> delegate -> review -> iterate`

The app should feel AI-forward and agent-driven, not like a traditional dashboard or setup-heavy admin tool.

## Locked Decisions

- `Project` is the durable planning and memory container.
- `Workspace` is the execution environment attached to a project when work is ready to happen in code.
- A project is broader than a repo or folder.
- Creating a project does not automatically create a repo or directory.
- New build projects use a two-stage model:
  - create project as planning-only
  - later explicitly `Bootstrap workspace`
- Existing repo projects use:
  - create/open project
  - then `Bind existing workspace`
- Chat is the control plane.
- Review Queue is separate from Inbox.
- Board is project-first by default.
- Project learning must be visible, editable, and inspectable.
- OpenClaw CLI is an internal adapter, not the product interface.

## What This Chat Should Produce

Define the decision-complete core product model:

- domain objects
- relationships
- lifecycle states
- state transitions
- what requires a workspace vs what does not
- how planning, execution, review, and scheduling attach to the model

Do not focus on one page. Focus on the system model all pages rely on.

## Please Cover

- `Project`
- `ProjectPlaybook`
- `ProjectContextSummary`
- `ProjectLearningSuggestion`
- `ProjectWorkspace`
- `WorkItem`
- `ReviewItem`
- `InboxItem`
- `Schedule`
- `Artifact` or output relationship

Also define:

- planning-only project behavior
- workspace-ready project behavior
- code execution eligibility rules
- review-ready state rules
- schedule linkage rules

## Constraints

- Keep the model practical for v1.
- Prefer one primary workspace per project in v1.
- Do not assume hidden AI memory.
- Do not assume every project is code-backed.
- Avoid inventing unnecessary enterprise complexity.

## Output Format

Return:

1. Core object model
2. State model and transitions
3. Behavioral rules
4. Edge cases and failure states
5. Acceptance criteria

If you see unresolved tradeoffs, make a recommendation and explain why.
