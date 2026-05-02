# Active Test Cases

- Artifact: Delivery Test Cases
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-002`
- Status: `draft`
- Last Updated: `2026-05-02`
- Source TDD Test Design: `../tdd/test-design.md`

## Test Cases

- [ ] `TC-001` Launching from a saved preset creates the expected work card and run
  Requirement refs: `REQ-001`
  Task refs: pending
  Test level: integration + Playwright smoke
  Preconditions:
  - Saved preset exists
  - Fake runtime adapter is active
  Steps:
  1. Open Home
  2. Launch work from a pinned preset
  3. Inspect created board card and linked run
  Expected result:
  - Work item and run are created with the preset's expected defaults
  Execution status: not-run
  Notes:
  - One of the 1-2 PR gate browser journeys

- [ ] `TC-002` One-shot scheduled launch appears in Work and Schedules
  Requirement refs: `REQ-002`
  Task refs: pending
  Test level: integration + Playwright
  Preconditions:
  - Deterministic clock is available
  Steps:
  1. Create a one-shot scheduled launch
  2. Inspect Work and Schedules views
  3. Advance time to the scheduled window
  Expected result:
  - The item appears in both surfaces and transitions correctly when due
  Execution status: not-run
  Notes:
  - Service integration should verify correctness before UI assertions

- [ ] `TC-003` Chat escalation creates linked tracked work
  Requirement refs: `REQ-003`
  Task refs: pending
  Test level: integration + Playwright
  Preconditions:
  - Existing conversation thread exists
  Steps:
  1. Open conversation
  2. Use escalation action to create or attach work
  3. Open resulting card and linked run
  Expected result:
  - Conversation, card, and run remain linked with shared canonical IDs
  Execution status: not-run
  Notes:
  - Golden-path E2E only

- [ ] `TC-004` Real iPhone browser can launch and inspect work comfortably
  Requirement refs: `REQ-001`, `REQ-002`
  Task refs: pending
  Test level: manual
  Preconditions:
  - App is reachable over Tailnet
  - Real iPhone browser available
  Steps:
  1. Launch work from Home
  2. Open the resulting card
  3. Inspect schedule or run state
  Expected result:
  - Launch and inspection are usable without desktop fallback
  Execution status: not-run
  Notes:
  - Manual smoke, not part of PR gate

- [ ] `TC-005` Mobile command bar returns a direct OpenClaw response
  Requirement refs: `REQ-003`
  Task refs: `TASK-007`
  Test level: manual + integration
  Preconditions:
  - App is reachable over Tailnet
  - Real iPhone browser, Chrome or Safari, is available
  - Production has `OPENCLAW_BIN`, `OPENCLAW_GATEWAY_TOKEN`, and local OpenClaw sync mode configured
  Steps:
  1. Open `/mobile`
  2. Send a short command from the command bar or chat sheet
  3. Refresh the mobile page
  Expected result:
  - Assistant response appears inline and remains in conversation history after refresh
  Execution status: passed in production on `2026-05-02`
  Notes:
  - This validates the direct `/api/mobile/chat` path. It should not be replaced by queued-only launch behavior unless a queue worker is intentionally added and validated.
