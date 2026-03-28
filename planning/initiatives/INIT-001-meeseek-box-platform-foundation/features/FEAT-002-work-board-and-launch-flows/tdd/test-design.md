# Test Design

- Artifact: TDD Test Design
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-002`
- Last Updated: `2026-03-19`

## Strategy

Use service integration as the main confidence layer for board/run/conversation behavior, then add a small Playwright suite for critical operator journeys.

## Planned Coverage

| Requirement ID | Test Level | What Will Be Verified |
| --- | --- | --- |
| `REQ-001` | Integration + E2E | A saved preset launch creates a work item, run, and expected default state |
| `REQ-002` | Integration + E2E | A one-shot scheduled launch appears in Work and Schedules with source labeling and minimum schedule-health fields and becomes actionable at the correct time |
| `REQ-003` | Integration + E2E | Chat escalation creates or links tracked work without losing conversation/run linkage |

## Tooling and Data Notes

- Use the shared `ViewportProfile` definitions for desktop and iPhone-first Playwright flows
- Keep Playwright scope to the shortest meaningful journeys
- Use fake runtime and seeded DB fixtures for automated tests
- Validate Tailnet/mobile ergonomics manually rather than overfitting emulation
