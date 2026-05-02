# Active Test Cases

- Artifact: Delivery Test Cases
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Status: `draft`
- Last Updated: `2026-03-26`
- Source TDD Test Design: `../tdd/test-design.md`

## Test Cases

- [ ] `TC-001` Assistant general start becomes project-linked work without forced navigation
  Requirement refs: `REQ-001`
  Task refs: `TASK-001`, `TASK-006`
  Test level: integration + Playwright
  Preconditions:
  - Assistant session API available
  - No current project context selected
  Steps:
  1. Open Assistant from Briefing with no selected object
  2. Start a new work conversation
  3. Attach the work to an existing or new project through proposal confirmation
  4. Continue the same work without navigating to Conversations
  Expected result:
  - Active work stays in Assistant, visible context updates after project attachment, and the saved conversation can later be recovered from Conversations without any required handoff
  Execution status: not-run
  Notes:
  - Core general-start regression guard

- [ ] `TC-002` Contextual Assistant start preserves current object context
  Requirement refs: `REQ-001`, `REQ-005`
  Task refs: `TASK-001`, `TASK-006`
  Test level: integration + Playwright
  Preconditions:
  - Project, card, review item, and schedule fixtures exist
  Steps:
  1. Open Assistant from each of Project, Board card, Review Queue item, and Schedule detail
  2. Inspect the visible carried context
  3. Produce a proposal and confirm it
  Expected result:
  - Assistant shows the correct project/object context each time and applies the confirmed mutation against that context
  Execution status: not-run
  Notes:
  - Can be partially automated by cycling seeded fixtures

- [ ] `TC-003` Briefing hero and previews respect canonical queue ownership
  Requirement refs: `REQ-002`
  Task refs: `TASK-002`
  Test level: integration + Playwright
  Preconditions:
  - Seeded Inbox items, Review Queue items, and open loops exist
  Steps:
  1. Open Briefing
  2. Verify hero selection order
  3. Open a Needs Action preview row
  4. Open a Ready for Review preview row
  Expected result:
  - Hero follows the documented waterfall and preview rows drill into Inbox or Review Queue instead of acting as full replacements
  Execution status: not-run
  Notes:
  - Highest-risk ownership regression

- [ ] `TC-004` Candidate unresolved state promotes to durable open loop correctly
  Requirement refs: `REQ-003`
  Task refs: `TASK-001`, `TASK-002`
  Test level: unit + integration
  Preconditions:
  - Open-loop derivation fixtures available
  Steps:
  1. Create candidate unresolved states for unconfirmed proposal, missing user answer, promised follow-up, unresolved decision, and plan-card mismatch
  2. Advance or modify the states so some remain non-blocking and some become blocking/user-owned
  3. Inspect promotion and resolution behavior
  Expected result:
  - Only the qualifying states become durable open loops, each carries owner/waiting_on/blocking metadata, and resolved states disappear from active Briefing previews
  Execution status: not-run
  Notes:
  - Primary AI-forward model test

- [ ] `TC-005` Minimal conversation branching preserves lineage without merge
  Requirement refs: `REQ-004`
  Task refs: `TASK-001`
  Test level: integration + Playwright
  Preconditions:
  - Active planning conversation exists with multiple turns
  Steps:
  1. Choose a specific message and start an alternative
  2. Inspect the new child conversation
  3. Compare parent and child metadata in Conversations
  Expected result:
  - Child conversation stores `parent_conversation_id` and `branch_from_message_id`, inherits the summary snapshot, and does not rewrite the parent conversation
  Execution status: not-run
  Notes:
  - No merge behavior expected in v1

- [ ] `TC-006` Project and Board stay plan-first while manual controls remain secondary
  Requirement refs: `REQ-006`
  Task refs: `TASK-003`
  Test level: integration + Playwright
  Preconditions:
  - Seeded project with current plan and derived cards
  Steps:
  1. Open Project Detail
  2. Verify current plan and recommended next move placement
  3. Open Board
  4. Confirm plan view is default and manual launch/setup does not dominate the first screen
  Expected result:
  - Project and Board foreground plan-derived execution rather than forms or launcher composition
  Execution status: not-run
  Notes:
  - UX regression guard against traditional app behavior

- [ ] `TC-007` Review Queue remains canonical and generates follow-up lineage
  Requirement refs: `REQ-007`
  Task refs: `TASK-002`, `TASK-004`
  Test level: integration + Playwright
  Preconditions:
  - Completed work with pending review exists
  Steps:
  1. Open Review Queue
  2. Request changes on a review item
  3. Inspect generated follow-up and related open-loop state
  4. Verify Briefing only previews the item rather than owning it
  Expected result:
  - Review Queue remains the canonical pending list and follow-up work preserves lineage to original card and review item
  Execution status: partial-pass
  Notes:
  - Automated route coverage added in `app/api/product-state/product-state-api.test.ts`
  - Browser validation of Review Queue handoff still pending

- [ ] `TC-008` Schedule surfaces emphasize purpose, output, and usefulness while failures route to Inbox
  Requirement refs: `REQ-008`
  Task refs: `TASK-005`
  Test level: integration + Playwright
  Preconditions:
  - Seeded schedules with success, unclear value, and failure states exist
  Steps:
  1. Open Schedules list and detail
  2. Verify purpose/output/usefulness ordering
  3. Trigger or inspect a failure / missed-run case
  4. Open Inbox from the related preview or alert
  Expected result:
  - Schedule surfaces lead with standing delegated work semantics and operational failures escalate into Inbox rather than staying buried in schedule admin details
  Execution status: partial-pass
  Notes:
  - Automated helper coverage added in `lib/schedules/presentation.test.ts`
  - Browser validation of list/detail ordering and Inbox escalation still pending

- [ ] `TC-009` Mobile `/mobile` command shell preserves origin continuity
  Requirement refs: `REQ-001`, `REQ-005`
  Task refs: `TASK-006`
  Test level: Playwright narrow viewport + manual
  Preconditions:
  - Narrow viewport or real device available
  Steps:
  1. Open `/mobile`, switch between command/jobs/context, and start contextual work on mobile width
  2. Continue or complete work in the mobile command flow
  3. Close any opened sheet or confirm the proposed action
  Expected result:
  - The `/mobile` shell carries project context, keeps tab/sheet navigation stable, and preserves continuation state
  Execution status: not-run
  Notes:
  - Manual real-device pass remains required
