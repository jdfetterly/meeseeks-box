# Change Log

- Artifact: Delivery Change Log
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-005`
- Status: `active`
- Last Updated: `2026-03-26`

## Entries

- `2026-03-26`: Created the initial `FEAT-005` feature bundle to track the cross-cutting intent-to-outcome redesign.
- `2026-03-26`: Created `meeseek-box-functional-spec-rev-a.md` and set it as the active product contract while preserving the original functional spec unchanged.
- `2026-03-26`: Locked the product-language and queue-ownership decisions for Rev A:
  - `Briefing` replaces `Home`
  - `Inbox` remains canonical for operational attention
  - `Review Queue` remains canonical for completed outputs awaiting judgment
  - `Assistant` is active work
  - `Conversations` is history/recovery/search
- `2026-03-26`: Moved minimal branching, candidate unresolved state vs durable open loops, and minimum schedule usefulness signal into v1 because they are load-bearing to the interaction model.
- `2026-03-26`: Implemented the new Assistant / Conversations substrate in the app:
  - canonical conversation metadata, grouping, and branching APIs
  - open-loop persistence and Briefing ranking
  - navigation naming cutover to `Briefing`, `Review Queue`, and `Conversations`
  - mobile `/mobile` command shell through the current command/jobs/context shell
- `2026-03-26`: Upgraded Review Queue and schedule surfaces:
  - Review Queue now supports decision actions that either accept output or create follow-up work with lineage
  - schedule list/detail surfaces now foreground purpose, output usefulness, and next delivery ahead of runtime diagnostics
- `2026-03-26`: Added focused regression coverage for:
  - review decision API follow-up creation
  - schedule purpose/usefulness helper behavior
