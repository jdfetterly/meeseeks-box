# Test Design

- Artifact: TDD Test Design
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-004`
- Last Updated: `2026-03-19`

## Strategy

Focus on contract and integration tests for approval/runtime payloads and full Inbox derivation, then use a very small manual smoke suite for the real runtime behaviors automation cannot safely prove.

## Planned Coverage

| Requirement ID | Test Level | What Will Be Verified |
| --- | --- | --- |
| `REQ-001` | Contract + Integration + E2E | Typed approvals and other supported high-signal states create the correct Inbox item, badge state, and operator resolution path |
| `REQ-002` | Unit + Contract + Integration + Manual | Conservative risk-tier classification requires approval for runtime/filesystem writes unless explicitly allowlisted |
| `REQ-003` | Integration + Manual | Slack fallback alerts trigger only for approval-required, no-retry failure, and high-signal missed-schedule conditions while the app remains the primary resolution surface |

## Tooling and Data Notes

- Use approval fixture payloads for all typed approval cases
- Use fake runtime adapter for most approval lifecycle automation
- Manual runtime smoke is required for block/resume or wrapper-gated behavior
- Slack validation can use a test channel or staging-equivalent target
