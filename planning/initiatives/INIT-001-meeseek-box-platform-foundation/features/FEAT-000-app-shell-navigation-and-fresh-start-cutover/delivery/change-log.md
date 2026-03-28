# Change Log

- Artifact: Delivery Change Log
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-000`
- Status: `active`
- Last Updated: `2026-03-19`

## Entries

- `2026-03-19`: Added foundational feature for app shell, responsive navigation, and fresh-start cutover.
- `2026-03-20`: Bootstrapped the Meeseek Box app repo from the Claw-Tower shell, replaced primary shell branding and navigation targets, added placeholder routes for Inbox/Artifacts/Agents, and added a legacy-local-state feature flag plus banners for chat and work cutover staging. Verified with `npx next build --webpack`.
- `2026-03-21`: Replaced several disabled placeholder routes with starter canonical surfaces backed by product-state data, including Work, Inbox, Schedules, and Chat. The cutover now primarily remains about removing the last legacy-local Kanban and chat assumptions rather than restoring missing routes.
- `2026-03-22`: Retired the legacy `/kanban` and `/crons` pages as real application surfaces. Both now render cutover notices that point operators back to canonical `Work`, `Schedules`, and `Inbox` routes, which prevents old bookmarks from reintroducing browser-local work state or a parallel cron dashboard.
- `2026-03-22`: Removed the last `enableLegacyLocalState` fallback from `/work` and `/chat`. The canonical Work board summaries and shared conversation surfaces are now unconditional product routes, and browser validation confirmed both routes still load correctly after the cutover.
- `2026-03-22`: Removed the dead legacy-local-state shell scaffolding entirely by deleting the unused banner component and dropping the `enableLegacyLocalState` feature flag. The shell no longer suggests there is a supported environment toggle back to browser-local work/chat behavior.
- `2026-03-22`: Replaced the legacy Home org-map dashboard with a canonical Meeseek Box overview built from server-backed summaries. Home now surfaces operator-safe metrics, open attention, active work, upcoming schedules, recent artifacts, and direct links into canonical Work/Chat/Inbox flows instead of depending on legacy `/api/crons` or shell-era visualization assumptions.
