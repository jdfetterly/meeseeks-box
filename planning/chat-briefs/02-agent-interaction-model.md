# Chat Brief: Agent Interaction Model

You are helping define how the AI control plane should work in Meeseek Box.

## Product Direction

Meeseek Box should feel like an AI-forward workspace where the agent drives setup and delegation through conversation, not through large manual forms.

The desired interaction pattern is:

- user states intent
- agent asks only for missing information
- agent drafts a structured proposal
- user confirms once
- app creates the underlying records and runtime actions

## Locked Decisions

- Chat is the primary control plane.
- Persistent right-side copilot panel on desktop.
- Full-page chat may still exist, but it is not the primary setup/control surface.
- Forms can remain as advanced fallback surfaces.
- Project creation should start as planning-first.
- Existing repo and new build projects both use the same project model, but differ in workspace binding/bootstrap.
- Schedule setup should be agent-led and confirm-once.
- Review Queue is separate from Inbox.

## What This Chat Should Produce

Define the interaction model for AI-driven control:

- how contextual chat works
- what intents the app should support
- what the agent should ask
- what the agent should infer
- how proposal and confirmation flows work
- when the app should fall back to forms

## Please Cover

- chat invocation from Home, Projects, Board, Review, Schedules, Work Detail
- intent types:
  - project planning
  - create work
  - create schedule
  - edit existing
  - review output
- proposal cards
- confirmation model
- planning-only project behavior
- workspace-ready project behavior
- when execution should be blocked pending bind/bootstrap

## Constraints

- The interaction should reduce setup burden, not hide important decisions.
- The agent should not silently create repos/directories/workspaces.
- The agent should not ask repetitive questions if the playbook or project memory already answers them.
- The user should be able to inspect what the system is about to do before confirming.

## Output Format

Return:

1. Interaction principles
2. Canonical conversation flows
3. Proposal and confirmation model
4. Fallback/manual-edit rules
5. Acceptance criteria

If helpful, include example prompt/response patterns.
