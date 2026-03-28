# Change Log

- Artifact: Delivery Change Log
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-003`
- Status: `active`
- Last Updated: `2026-03-21`

## Entries

- `2026-03-18`: Created initial full TDD for memory governance, write-through adapter behavior, and artifact version registry; added delivery task scaffolds.
- `2026-03-19`: Replaced high-level task list with dependency-ordered implementation task plan and verification matrix.
- `2026-03-19`: Added explicit artifact family-key contract and manual smoke ownership for trust-boundary validation.
- `2026-03-21`: Implemented the first controlled workspace-memory foundation slice: OpenClaw-compatible path normalization, narrow allowlist enforcement, gated bootstrap status/creation helpers, and a product-state memory bootstrap API. Updated the shared harness to match the live mini memory layout and revalidated with focused `vitest` coverage and `npx next build --webpack`.
- `2026-03-21`: Implemented the first canonical memory provenance slice: repository support for `MemoryEntry` and `MemorySource`, atomic local write-through plus metadata recording, and a server-backed memory entries API. Revalidated with focused `vitest` coverage and `npx next build --webpack`.
- `2026-03-21`: Added canonical artifact family/version registry tables, immutable version registration with the shared family-key contract, a server-backed artifact registry API, and the first real artifacts registry page. Revalidated with focused `vitest` coverage and `npx next build --webpack`.
- `2026-03-21`: Added metadata-only archive and supersede support for canonical memory entries, server-backed lifecycle APIs, and the first real memory registry page that distinguishes active entries from archived ones without implying source deletion. Revalidated with focused `vitest` coverage and `npx next build --webpack`.
- `2026-03-21`: Added artifact-family drilldowns, producer-aware artifact panels, and related-artifact sections on work and run detail pages so outputs are no longer dead-end registry rows. Revalidated with focused `vitest` coverage, `npx next build --webpack`, and live browser validation against seeded canonical artifact versions.
- `2026-03-21`: Upgraded the memory UI from write-only to governed lifecycle control by adding workspace bootstrap, browser-validated write-through, and operator-facing archive/supersede actions. Revalidated with focused `vitest` coverage, `npx next build --webpack`, and live browser validation of memory bootstrap, write-through, and supersede/archive behavior.
- `2026-03-22`: Implemented the first real producer registration path for artifacts: scheduled-job file outputs only, referenced in place from the workspace without copying. Added a schedule-specific artifact registration API and schedule-detail form, validated workspace-path enforcement in tests, and browser-validated the end-to-end schedule -> artifact family flow against the local dev state.
- `2026-03-22`: Narrowed the v1 producer contract further from “operator registers a file” to “the producing scheduled job reports its output file explicitly.” Added `/api/product-state/schedules/[id]/report-output`, reused the schedule artifact registry path underneath it, and browser-validated that explicit reporting clears missed schedule state, marks the schedule completed, and advances the artifact family from `v0001` to `v0002` without copying files into app-managed storage.
- `2026-03-22`: Added a local `npm run report-schedule-output` helper so scheduled jobs have a concrete non-browser path into the explicit producer contract. Validated the helper against the local dev server by reporting `mobile-schedule-brief-v3.md` and confirming the family advanced to `v0003` on the schedule detail page.
- `2026-03-22`: Updated the schedule detail surface and environment docs to frame the browser form as a fallback, not the default producer path. Also split artifact metadata between `schedule_manual_registration` and `schedule_reported_output`, then validated in-browser that a fresh helper-reported version renders as `reported by producing job`.
