# Claw-Tower Audit

- Artifact: Discovery Output
- Initiative ID: `INIT-001`
- Last Updated: `2026-03-20`
- Status: `complete`

## Questions To Answer

- Where is chat state browser-local today?
- Where is Kanban/work board state browser-local today?
- What are the current routing entrypoints?
- What app-shell/navigation primitives already exist?
- Which paths or modules must be disabled or bypassed for fresh-start cutover?

## Evidence Sources

- repo path: `/Users/jdfetterly/Documents/projects-folder/meeseeks-box`
- command(s) run:
  - `find . -maxdepth 2 -mindepth 1 -type d | sort`
  - `find . -maxdepth 2 -mindepth 1 -type f | sort`
  - `find claw-tower -maxdepth 2 -type f ...`
  - `find claw-tower/app -maxdepth 2 -type f | sort`
  - `rg -n "localStorage|sessionStorage|indexedDB|zustand|create\\(|persist\\(|kanban|board|chat" claw-tower --glob '!**/node_modules/**' --glob '!**/dist/**'`
- files inspected:
  - `claw-tower/app/layout.tsx`
  - `claw-tower/components/Sidebar.tsx`
  - `claw-tower/components/NavLinks.tsx`
  - `claw-tower/components/MobileSidebar.tsx`
  - `claw-tower/app/chat/page.tsx`
  - `claw-tower/lib/conversations.ts`
  - `claw-tower/app/kanban/page.tsx`
  - `claw-tower/lib/kanban/store.ts`
  - `claw-tower/lib/kanban/chat-store.ts`
  - `claw-tower/app/settings-provider.tsx`
  - `claw-tower/lib/settings.ts`
- files inspected:
  - repo root planning and legacy docs
  - `claw-tower/` implementation repo

## Findings Table

| Question | Evidence | Finding | Confidence | Notes |
| --- | --- | --- | --- | --- |
| Browser-local chat state | `app/chat/page.tsx`, `lib/conversations.ts` | confirmed browser-local | high | chat loads and saves `clawport-conversations` in `localStorage`; cross-device sync does not exist |
| Browser-local board state | `app/kanban/page.tsx`, `lib/kanban/store.ts` | confirmed browser-local | high | Kanban loads and saves `clawport-kanban` in `localStorage`; this is the primary board truth today |
| Routing entrypoints | `app/layout.tsx`, `app/*/page.tsx`, `app/chat/[id]/page.tsx` | confirmed Next.js app-router shell | high | current route set is usable as a baseline for `FEAT-000` shell planning |
| Shell/navigation primitives | `components/Sidebar.tsx`, `components/NavLinks.tsx`, `components/MobileSidebar.tsx` | confirmed reusable shell primitives exist | high | desktop sidebar plus mobile slide-out nav already exist and can be preserved or adapted |
| Cutover targets | chat, kanban, settings modules named directly | actionable | high | cutover can target specific modules rather than broad page rewrites |

## Findings

- The implementation repo is now present under `claw-tower/` and is a Next.js app-router application with `app/`, `components/`, and `lib/` structure.
- Current top-level routes are:
  - `/`
  - `/activity`
  - `/chat`
  - `/chat/[id]` redirect shell
  - `/costs`
  - `/crons`
  - `/docs`
  - `/kanban`
  - `/memory`
  - `/settings`
- App shell is centralized in `claw-tower/app/layout.tsx` with shared desktop and mobile navigation primitives via:
  - `components/Sidebar.tsx`
  - `components/NavLinks.tsx`
  - `components/MobileSidebar.tsx`
- Chat page is explicitly browser-local today:
  - `claw-tower/app/chat/page.tsx` hydrates from `loadConversations()`
  - `claw-tower/lib/conversations.ts` reads/writes `localStorage('clawport-conversations')`
- Kanban board is explicitly browser-local today:
  - `claw-tower/app/kanban/page.tsx` hydrates from `loadTickets()`
  - `claw-tower/lib/kanban/store.ts` reads/writes `localStorage('clawport-kanban')`
- Settings and shell personalization are also browser-local:
  - `claw-tower/app/settings-provider.tsx`
  - `claw-tower/lib/settings.ts` reads/writes `localStorage('clawport-settings')`
- There is one partial exception: Kanban side-panel chat history is file-backed through API routes:
  - `claw-tower/app/api/kanban/chat-history/[ticketId]/route.ts`
  - `claw-tower/lib/kanban/chat-store.ts`
  This is useful precedent for workspace-backed persistence, but it does not change the fact that ticket/card truth is still browser-local.

## Recommended Cutover Actions

- Disable:
  - direct use of `loadConversations()` / `saveConversations()` as canonical chat truth
  - direct use of `loadTickets()` / `saveTickets()` as canonical board truth
- Bypass:
  - page-level hydration in `app/chat/page.tsx` and `app/kanban/page.tsx` should move to server-backed queries once product-state APIs exist
  - local settings hydration should be limited to device-local preferences only after scope review
- Replace:
  - `lib/conversations.ts` with canonical conversation/message services backed by the product-state layer
  - `lib/kanban/store.ts` with canonical work-item/card services backed by the product-state layer
  - navigation labels and route structure in `NavLinks.tsx` to match the Meeseek Box IA (`Home`, `Work`, `Chat`, `Inbox`, `More`)

## Downstream Updates Required

- `FEAT-000/TASK-003`
- `FEAT-001/TASK-001`
- `FEAT-002/TASK-001`

## Open Questions

- Should Meeseek Box implementation happen in `claw-tower/` directly or after copying this code into the Meeseek Box root?
- Which existing settings should remain device-local versus move into canonical shared state?
- Does the existing Kanban side-chat filesystem path align with the intended runtime workspace security constraints, or should it also move behind the new adapter boundary?

## Impacted Features

- `FEAT-000`
- `FEAT-001`
