# Implementation Task Plan

## 1. Planning Context

- Feature / Initiative: `FEAT-000 App Shell, Navigation, and Fresh-Start Cutover` / `INIT-001 Meeseek Box Platform Foundation`
- Source TDD: `../tdd/index.md`
- Planning Date: `2026-03-19`

## 2. Delivery Strategy

Establish the shell and cutover before feature-specific UI work. This feature is the shared UI and routing dependency for the rest of the initiative.

## 3. Task Inventory

| Task ID | Title | Objective | Depends On | TDD References | Planned Touchpoints | Acceptance Criteria | Verification | Suggested PR Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TASK-001` | Route and navigation skeleton | Define shared routes and primary navigation structure. | none | Sections 3, 4, 5 | app shell, route config, nav components | Shared navigation exists for all core surfaces and is reusable by downstream features. | integration tests | `PR-001 Shell routes` |
| `TASK-002` | Responsive viewport and drawer system | Define desktop and iPhone viewport profiles plus shared drawer/sheet behavior. | `TASK-001` | Sections 3, 4, 5 | viewport config, drawer/sheet primitives, Playwright config | Shared viewport and drilldown behavior are explicit and testable. | Playwright viewport validation | `PR-002 Responsive shell` |
| `TASK-003` | Fresh-start cutover | Disable or bypass browser-local chat/Kanban truth with no import path. | `TASK-001` | Sections 3, 4, 6 | existing shell state paths, feature flags, cutover docs | Browser-local truth is not active in the v1 shell and server-backed state becomes the only supported path. | integration checks, shell smoke test | `PR-003 Cutover` |

## 4. Current Execution Notes

- `2026-03-20`: `TASK-001` is partially implemented.
  Completed:
  - bootstrapped the new Meeseek Box app repo from the `claw-tower/` shell
  - updated package metadata and shell branding
  - replaced primary navigation with `Home`, `Work`, `Chat`, `Inbox`, `Schedules`, `Artifacts`, `Memory`, `Agents`, and `Settings`
  - added starter routes for `/work`, `/schedules`, `/inbox`, `/artifacts`, and `/agents`
- `2026-03-20`: `TASK-002` is partially implemented.
  Completed:
  - preserved existing desktop sidebar/mobile drawer shell
  - validated the shell builds successfully with `npx next build --webpack`
- `2026-03-20`: `TASK-003` is partially implemented.
  Completed:
  - added `NEXT_PUBLIC_ENABLE_LEGACY_LOCAL_STATE`
  - added explicit legacy-state warnings to chat and work
  - added route-level placeholders when legacy local state is disabled
  - replaced the disabled Chat, Work, Inbox, and Schedules placeholders with starter canonical surfaces where backend contracts now exist
  - retired the legacy `/kanban` and `/crons` routes as live product surfaces and replaced them with cutover notices that link back into canonical `Work`, `Schedules`, and `Inbox`
  - browser-validated the retired-route behavior so old bookmarks no longer reopen browser-local work or a parallel cron UI
  - removed the last `/work` and `/chat` feature-flag fallback to legacy local-state routes
  - browser-validated that canonical Work and Chat still load correctly after the fallback removal
  - deleted the unused legacy-state banner component and removed the dead `enableLegacyLocalState` feature flag from the shell
  - replaced the legacy Home dashboard with a canonical overview page that reads server-backed summaries for:
    - open attention
    - active work
    - upcoming schedules
    - recent artifacts
    - operator-safe shell metrics
  - validated the new Home overview at narrow viewport and confirmed it links directly into canonical Work, Chat, Inbox, Schedules, and Artifacts routes
  Remaining:
  - continue replacing legacy route APIs once the remaining non-canonical pages are intentionally retired or rebuilt
  - keep tightening copy and surface selection on Home as real operating loops emerge from daily use
