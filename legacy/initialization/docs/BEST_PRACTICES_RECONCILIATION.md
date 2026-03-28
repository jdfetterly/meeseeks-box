# ClawPort Best Practices Reconciliation

Audit date: March 9, 2026

Compared sources:

- Live page: `https://www.clawport.dev/best-practices`
- In-app docs page: `app/docs/page.tsx` + `components/docs/BestPracticesSection.tsx`
- Current repo implementation in this checkout

Status legend:

- `Confirmed`: implemented and described accurately
- `Partial`: feature exists, but docs overstate or simplify it
- `Docs-only`: guidance/policy, not something the repo enforces
- `Mismatch`: current repo behavior conflicts with the page

## Summary

The page is useful as an operating model, but not all of it is product-accurate. Hierarchy, SOUL loading, org-map relationships, agent metadata, and cron monitoring are real. The largest drift is in memory and voice:

- memory docs mix conceptual team-memory patterns with a narrower on-disk layout that the repo actually reads
- voice docs imply a chat TTS control tied to `voiceId`, but the current chat UI does not render that control

## Claim Matrix

| Area | Page claim | Status | Repo evidence | Notes |
| --- | --- | --- | --- | --- |
| Best-practices page exists in product | Best practices are part of current docs | Confirmed | `app/docs/page.tsx`, `components/docs/BestPracticesSection.tsx` | The live page content is mirrored from the repo's docs components. |
| Bundled registry count | Bundled registry ships 22 agents in five teams | Mismatch | `lib/agents.json` | The bundled fallback registry currently contains 20 agents. The topology is one root, three managed teams, and six solo agents. |
| Hierarchy rendering | Org structure depends on `reportsTo` and `directReports` | Confirmed | `lib/types.ts`, `components/OrgMap.tsx` | The org map edges and team layout are built from those fields. |
| One root / max depth / keep direct reports small | Organizational rules on the page | Docs-only | `components/docs/BestPracticesSection.tsx` | These are good policy, but the repo does not validate or enforce them. |
| SOUL documents | Each agent has a `SOUL.md` and ClawPort displays it | Confirmed | `lib/agents.ts`, `app/agents/[id]/page.tsx` | `getAgents()` loads `soulPath` content, and the agent detail page renders it. |
| Naming conventions | Uppercase for pipeline agents, Title Case for person-like agents | Docs-only | `components/docs/BestPracticesSection.tsx`, `lib/agents.json` | The convention is visible in bundled data, but there is no enforcement. |
| Tool assignment | Use least privilege by tool type | Partial | `lib/types.ts`, `lib/agents.json`, `app/agents/[id]/page.tsx` | Tool lists are stored and shown in UI, but ClawPort does not enforce permissions itself. |
| Shared memory path | Shared team files live in `$WORKSPACE_PATH/team-memory/` | Mismatch | `lib/memory.ts`, `docs/API.md`, `app/memory/page.tsx`, `lib/memory.test.ts` | Current code reads root `MEMORY.md` and files inside `$WORKSPACE_PATH/memory/`. The docs page's `team-memory/` directory is not what the current memory API surfaces. |
| Daily log path | Daily logs live at `agents/<agent-id>/logs/YYYY-MM-DD.md` | Mismatch | `lib/memory.ts`, `docs/API.md`, `app/memory/page.tsx` | The current memory browser/API expects daily files in `$WORKSPACE_PATH/memory/YYYY-MM-DD.md`. Agent-local log folders are not scanned by ClawPort's memory UI. |
| `MEMORY.md` compression by SCRIBE | SCRIBE curates long-term memory weekly | Docs-only | `components/docs/BestPracticesSection.tsx` | This is an operating pattern, not repo behavior. ClawPort reads files; it does not run memory compression. |
| File-first communication | Agents communicate through files, with messages only for urgency | Docs-only | `components/docs/BestPracticesSection.tsx` | This is a recommended agent-system pattern, not something ClawPort enforces. |
| Cron examples | ECHO, Pulse, KAZE, SCRIBE, LUMEN cron examples are available as described | Docs-only | `lib/crons.ts`, `app/api/crons/route.ts` | ClawPort reads external cron config from `openclaw cron list --json`. Example jobs on the page are illustrative, not bundled repo data. |
| Cron monitoring | ClawPort can list and monitor cron jobs | Confirmed | `lib/crons.ts`, `app/api/crons/route.ts`, `app/crons/page.tsx` | Cron monitoring is a real product feature. |
| Voice metadata | Agents can have `voiceId` metadata | Confirmed | `lib/types.ts`, `lib/agents.json`, `app/agents/[id]/page.tsx` | The model and detail view support voice metadata. |
| Chat TTS | Agents with voice can play spoken replies in chat | Partial | `app/api/tts/route.ts`, `components/chat/ConversationView.tsx` | A TTS route exists and chat contains unused TTS playback logic, but the current chat renderer does not expose a TTS button. |
| `voiceId` controls TTS button visibility | UI hides TTS when `voiceId` is null | Mismatch | `components/chat/ConversationView.tsx` | No TTS button is rendered in the current chat UI, so this behavior is not currently true. |
| Auto-discovery | Agent data can be discovered from workspace files | Confirmed | `lib/agents-registry.ts`, `SETUP.md` | Registry resolution supports workspace override, filesystem discovery, CLI merge, then bundled fallback. |

## Recommended Baseline Adjustments

Use these adjustments if this repo is your reference implementation:

1. Treat hierarchy, SOUL loading, registry metadata, org-map rendering, and cron monitoring as implemented baseline.
2. Treat naming, least privilege, file-first communication, and memory compression as operating policy rather than shipped enforcement.
3. Standardize on `$WORKSPACE_PATH/MEMORY.md` plus `$WORKSPACE_PATH/memory/*` if you need compatibility with the current memory browser and API.
4. Do not rely on the page's `team-memory/` directory example unless you plan to add support for it in the new build.
5. Do not rely on per-agent chat TTS until the chat UI actually wires `voiceId` into playback controls and the TTS request payload.
6. Update any downstream planning docs to use "20 bundled fallback agents" unless the registry is expanded.

## Highest-Value Follow-Up Work

If you want the repo to match the documentation more closely, these are the most important fixes:

1. Decide whether shared memory should live in `memory/` or `team-memory/`, then align docs, tests, and UI around one canonical layout.
2. Either finish wiring chat TTS to `voiceId` or remove that claim from the best-practices docs.
3. Correct the bundled agent count and team description on the docs page.
