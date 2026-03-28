# Test Design

- Artifact: TDD Test Design
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Last Updated: `2026-03-26`

## Strategy

Use service integration as the primary confidence layer for Assistant sessions, queue ownership, conversation lineage, and open-loop lifecycle. Add a small browser suite for the highest-risk interaction-model paths, then reserve real narrow-device validation for the mobile takeover and continuation flows.

## Planned Coverage

| Requirement ID | Test Level | What Will Be Verified |
| --- | --- | --- |
| `REQ-001` | Integration + E2E | General start, contextual start, visible carried context, proposal confirmation, and no forced Assistant-to-Conversations continuation |
| `REQ-002` | Integration + E2E | Briefing hero waterfall, preview-only ownership, and canonical Inbox / Review Queue drilldowns |
| `REQ-003` | Unit + Integration | candidate unresolved state creation, durable promotion, auto-resolution, and escalation rules |
| `REQ-004` | Integration + E2E | Conversation grouping, status lifecycle, summary refresh, and child-branch lineage |
| `REQ-005` | E2E + Manual | Mobile full-screen Assistant takeover, Conversations recovery role, and return-to-origin continuity |
| `REQ-006` | Integration + E2E | Project current-plan prominence, Board default plan view, and plan-to-card drift handling |
| `REQ-007` | Integration + E2E | Review Queue ownership, follow-up card generation, and lineage preservation after review actions |
| `REQ-008` | Integration + E2E | Schedule purpose/output/usefulness-first read model and Inbox escalation for operational failures |

## Tooling and Data Notes

- Use the shared `ViewportProfile` definitions for desktop and narrow mobile Playwright flows.
- Keep Playwright journeys small and action-oriented.
- Prefer seeded canonical product-state fixtures over UI-generated setup for most automated tests.
- Manual validation remains required for real phone-sized ergonomics and return-to-origin continuity.
