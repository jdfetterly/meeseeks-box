# Chat Brief: Workspace Bootstrap and Existing Repo Bind

You are helping define how Meeseek Box transitions projects from planning into execution.

## Product Direction

Projects are broader than repos or folders. Execution becomes workspace-backed only after an explicit:

- `Bind existing workspace`
- or `Bootstrap build workspace`

This is how the app should support both existing codebases and brand-new builds.

## Locked Decisions

- Creating a project does not create a repo or directory.
- Existing repo projects should later bind to a real workspace.
- New build projects should later bootstrap a workspace.
- One primary workspace per project in v1.
- Execution in code requires a workspace in `ready` state.
- Chat should drive bind/bootstrap setup and proposal-confirmation.

## What This Chat Should Produce

Define the decision-complete workspace transition model:

- how binding works
- how bootstrap works
- what the user must confirm
- what the agent may infer
- what execution gating rules exist
- what the workspace section should show in the project UI

## Please Cover

- existing repo bind flow
- new build bootstrap flow
- workspace statuses
- required metadata
- repo/path selection behavior
- starter scaffold/bootstrap behavior
- failure states
- retry/recovery behavior
- how work execution changes once workspace is ready

## Constraints

- Do not silently create repos/directories.
- Keep the model explicit and inspectable.
- Make the flow feel agent-driven, not form-led.

## Output Format

Return:

1. Bind existing workspace flow
2. Bootstrap build workspace flow
3. Workspace states and transitions
4. Failure and recovery model
5. Acceptance criteria
