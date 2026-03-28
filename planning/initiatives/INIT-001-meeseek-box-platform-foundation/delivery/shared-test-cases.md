# Shared Test Cases

- Artifact: Initiative Shared Test Cases
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Status: `draft`
- Last Updated: `2026-03-26`

## Cross-Feature Service Integration

- [ ] `IT-001` Preset launch -> work item -> run -> artifact version -> approval-needed state -> canonical board and inbox visibility
  Features: `FEAT-001`, `FEAT-002`, `FEAT-003`, `FEAT-004`
  Level: service integration

- [ ] `IT-002` Chat escalation -> work item -> memory write-through -> provenance visibility -> linked card continuity
  Features: `FEAT-001`, `FEAT-002`, `FEAT-003`
  Level: service integration

- [ ] `IT-003` One-shot scheduled work -> due dispatch -> failure/no-retry -> Inbox item + Slack fallback eligibility
  Features: `FEAT-001`, `FEAT-002`, `FEAT-004`
  Level: service integration

- [ ] `IT-004` Assistant contextual start -> proposal confirmation -> linked conversation summary -> Project and Board continuity
  Features: `FEAT-001`, `FEAT-002`, `FEAT-005`
  Level: service integration

- [ ] `IT-005` Candidate unresolved state -> durable open loop -> Briefing preview -> Project resolution path
  Features: `FEAT-001`, `FEAT-004`, `FEAT-005`
  Level: service integration

- [ ] `IT-006` Completed agent work -> Review Queue -> request changes -> follow-up card -> open-loop closure
  Features: `FEAT-001`, `FEAT-002`, `FEAT-005`
  Level: service integration

- [ ] `IT-007` Recurring schedule usefulness drift -> Inbox escalation -> Schedule detail recovery -> Briefing preview
  Features: `FEAT-001`, `FEAT-002`, `FEAT-004`, `FEAT-005`
  Level: service integration

## Shared UI Validation

- Use shared `ViewportProfile` definitions from `../shared-contracts.md`
- Narrow Playwright viewport is required
- Real iPhone Safari validation remains mandatory and is not replaced by emulation
- `2026-03-21` browser pass completed:
  - save draft from Work
  - promote draft into real queued work
  - create canonical conversation
  - send canonical message
  - attach conversation to existing work
  - verify attached conversation is visible from work detail
  - verify canonical shell/search no longer emit legacy `/api/crons` errors on validated pages
- `2026-03-21` browser pass extended:
  - seed canonical artifact versions through the product-state API
  - verify artifact registry renders immutable version ordering
  - verify artifact family detail preserves producer context and links back to work
  - verify work and run detail pages surface related artifact families instead of dead-end summaries
  - bootstrap workspace memory from the canonical Memory page
  - write a canonical memory entry through the browser UI
  - create a replacement memory entry and validate archive/supersede lifecycle behavior from the Memory page
  - verify canonical Schedules rows link into a dedicated schedule detail page with runtime sync state and linked work context
  - seed a canonical `missed_schedule` Inbox item in isolated local state and verify the Inbox links into schedule detail correctly
- `2026-03-22` browser pass extended:
  - create a real file inside the isolated workspace outputs directory
  - register that file from the schedule detail page as a scheduled-job artifact
  - verify the schedule detail page immediately shows the new artifact family
  - verify artifact family detail preserves the schedule producer context and original workspace path reference
- `2026-03-22` browser pass extended again:
  - report a second scheduled-job output file through the explicit producer callback path
  - verify the schedule transitions from `Missed` to `Completed`
  - verify `Last success` and `Last successful output` update immediately
  - verify the artifact family advances from `v0001` to `v0002`
- `2026-03-22` API integration coverage extended:
  - seed a missed one-shot schedule and project a `missed_schedule` Inbox item
  - report a schedule output through `/api/product-state/schedules/[id]/report-output`
  - verify the Inbox item resolves instead of staying open
  - verify repeated reports into the same output slot preserve family identity and immutable version ordering
- `2026-03-22` producer-helper validation completed:
  - run `npm run report-schedule-output` against the local dev server
  - report a third file for the same schedule/output slot
  - verify the schedule detail page shows `v0003` and preserves the same artifact family
- `2026-03-22` producer-contract UX validation extended:
  - verify the schedule detail page frames the helper command as the preferred v1 contract
  - verify the browser form is described as fallback/recovery only
  - report a fourth file through the helper and confirm the artifact family detail renders `reported by producing job`
- `2026-03-22` launch-template validation extended:
  - verify the Work page renders `Morning Ops Brief` and `Weekly System Review` starter jobs
  - install the starter jobs through the Work-page UI
  - verify installed jobs become available as launch presets
  - apply `Morning Ops Brief` and confirm the launch form is populated with the childcare-sheet prompt, including the read-only instruction and color mapping
- `2026-03-22` recurring starter-job validation completed:
  - schedule `Morning Ops Brief` directly from the Work page using the suggested daily cadence
  - verify the Work board adds a new scheduled work item and the starter-job card links to the recurring schedule
  - open the recurring schedule detail and verify the report-output helper is hydrated with the real canonical schedule id
  - schedule `Weekly System Review` with a non-default Friday `15:30` cadence
  - verify the canonical Schedules page renders both recurring starter jobs with human-readable cadence labels instead of raw `cron`
- `2026-03-22` recurring lifecycle validation completed:
  - pause an existing recurring starter-job schedule from schedule detail
  - update the weekly cadence and verify the human-readable label and cron expression both change
  - resume the paused recurring schedule and verify status returns to `Scheduled`
  - delete the recurring schedule and verify the linked standing work item is archived and removed from the main Work board
  - verify deleted schedules are hidden from the main Schedules list and the shared nav badge count
  - verify deleted schedule detail normalizes stale local lifecycle sync markers into operator-facing runtime-sync copy
- `2026-03-22` work-owned schedule validation completed:
  - open a recurring starter-job work item from the canonical Work surface at iPhone width
  - verify linked schedule summary and runtime-sync state render in-place on work detail
  - verify recurring controls are usable from work detail without forcing a jump to `/schedules`
- `2026-03-22` home-overview validation completed:
  - open the canonical Home surface at iPhone width
  - verify it shows operator-safe metrics instead of the legacy org map
  - verify open-attention, active-work, upcoming-schedule, and recent-artifact sections all link into canonical detail surfaces
  - verify quick-launch links route into `Work`, `Chat`, and `Inbox`
- `2026-03-26` Rev-A redesign validation planned:
  - open `Briefing` and verify hero selection prefers operational blockers over review items and blocking open loops
  - verify `Needs Action` previews drill into `Inbox` rather than rendering a replacement queue
  - verify `Ready for Review` previews drill into `Review Queue` rather than rendering a replacement queue
  - start new work from Assistant with no existing context and attach it to a project without navigating to `Conversations`
  - continue saved project work from the originating project surface without being forced through `Conversations`
  - create a child conversation from a specific planning turn and verify parent-child lineage appears in `Conversations`
  - open mobile-width Assistant from `Briefing`, `Project`, and `Board` and verify it behaves as a full-screen takeover instead of a split panel
  - verify mobile `Conversations` behaves as recovery/history and does not require a thread-first `New conversation` path for starting work
  - verify Project Detail remains plan-first and Board remains plan-derived after the read-model cutover
  - verify schedule list/detail lead with purpose, output, and usefulness while operational failures route into `Inbox`
