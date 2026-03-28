# Active Test Cases

- Artifact: Delivery Test Cases
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-004`
- Status: `draft`
- Last Updated: `2026-03-19`
- Source TDD Test Design: `../tdd/test-design.md`

## Test Cases

- [ ] `TC-001` Typed approval fixture produces correct Inbox item and card badge
  Requirement refs: `REQ-001`
  Task refs: pending
  Test level: contract + integration

- [ ] `TC-002` Runtime or filesystem write requires approval by default
  Requirement refs: `REQ-002`
  Task refs: pending
  Test level: unit + integration

- [ ] `TC-003` Approval resolution updates run state and audit trail consistently
  Requirement refs: `REQ-001`, `REQ-002`
  Task refs: pending
  Test level: integration + Playwright smoke

- [ ] `TC-003A` Failed run, blocked work, missed schedule, and explicit memory review prompt derive Inbox items correctly
  Requirement refs: `REQ-001`
  Task refs: pending
  Test level: integration

- [ ] `TC-004` Slack fallback alert arrives for approval-required, no-retry failure, or high-signal missed-schedule condition
  Requirement refs: `REQ-003`
  Task refs: pending
  Test level: manual

- [ ] `TC-005` Real runtime block/resume or wrapper-gate behaves correctly
  Requirement refs: `REQ-001`, `REQ-002`
  Task refs: pending
  Test level: manual
