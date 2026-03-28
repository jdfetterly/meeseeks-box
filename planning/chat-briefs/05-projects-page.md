# Chat Brief: Projects Page

You are helping define the Projects page and Project Detail page for Meeseek Box.

## Product Direction

Projects are the long-lived container for goals, playbook, memory, workspace state, and delegated work.

The user should understand:

- how to set up a project
- what information matters
- whether the project is planning-only or workspace-ready
- how to move from planning to execution

## Locked Decisions

- Creating a project does not create a repo or directory.
- Existing repo projects later use `Bind existing workspace`.
- Brand-new build projects later use `Bootstrap workspace`.
- Project learning must be visible and editable.
- Playbook is the working program for the project.
- Chat should drive setup.

## What This Chat Should Produce

Define:

- Projects list page
- project creation entry model
- project detail page
- playbook editing behavior
- learning suggestion behavior
- workspace-state presentation

## Please Cover

- empty state
- setup by example
- the minimum information the agent needs to set up a project
- planning-only vs workspace-ready state
- workspace section behavior
- playbook section behavior
- learning suggestion section behavior
- actions:
  - set up project
  - bind existing workspace
  - bootstrap workspace
  - plan in copilot
  - open board

## Constraints

- The page must teach the mental model clearly.
- It should not assume all projects already have repos.
- It should not feel like a CRUD form.

## Output Format

Return:

1. Projects list spec
2. Project detail spec
3. Setup and transition flows
4. Key states and edge cases
5. Acceptance criteria
