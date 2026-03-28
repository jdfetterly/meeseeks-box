# Change Log

- Artifact: Delivery Change Log
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-004`
- Status: `active`
- Last Updated: `2026-03-21`

## Entries

- `2026-03-18`: Created initial full TDD for runtime approvals, inbox attention, and Slack fallback behavior; added delivery task scaffolds.
- `2026-03-19`: Replaced high-level task list with dependency-ordered implementation task plan and verification matrix.
- `2026-03-19`: Expanded Inbox ownership beyond approvals and narrowed Slack fallback categories to explicit high-signal defaults.
- `2026-03-21`: Locked the conservative v1 approval posture to an empty allowlist, implemented a read-only runtime approval-policy snapshot path with socket-token redaction, and added focused tests to prove Meeseek Box never surfaces the raw local approvals token.
- `2026-03-21`: Implemented the first approval ingest and projection slice: canonical approval persistence, gateway-event normalization for `exec.approval.requested` and `exec.approval.resolved`, approval-driven Inbox items, and run/work summary updates for `waiting_approval`, `needs_approval`, and `blocked` states. Revalidated with focused `vitest` coverage and `npx next build --webpack`.
- `2026-03-21`: Added canonical notification delivery logging and narrow Slack fallback routing from the shared Inbox model, kept fallback disabled by default behind explicit env flags, and exposed delivery state in the server-backed Inbox surface. Revalidated with focused `vitest` coverage and `npx next build --webpack`.
- `2026-03-21`: Closed the first runtime-backed approval action loop by resolving pending approvals through `openclaw gateway call exec.approval.resolve`, added the typed resolve API, and wired approve-once / deny actions into the Inbox UI. Revalidated with focused `vitest` coverage and `npx next build --webpack`.
- `2026-03-21`: Extended the Inbox surface with direct schedule drilldowns for missed schedules and validated the path in-browser against isolated canonical local state. Missed schedule attention can now send operators into the dedicated schedule detail page instead of trapping them on a summary row.
- `2026-03-22`: Tightened the Inbox surface after explicit schedule-output reporting proved that “resolved” attention still lingered in the main operator list. Added API integration coverage for missed-schedule resolution on output report and split the UI into `Open attention` versus `Resolved recently`, so cleared attention no longer reads like active operator work.
- `2026-03-22`: Tightened Inbox operator ergonomics on the canonical surface: corrected stale copy that still treated schedule attention as future scope, and preserved direct source links for resolved items so history remains drillable instead of collapsing into static text. Revalidated in-browser at narrow viewport after the copy/link cleanup.
