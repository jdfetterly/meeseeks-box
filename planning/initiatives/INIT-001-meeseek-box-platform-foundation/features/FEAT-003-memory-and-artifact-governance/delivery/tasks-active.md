# Implementation Task Plan

## 1. Planning Context

- Feature / Initiative: `FEAT-003 Memory and Artifact Governance` / `INIT-001 Meeseek Box Platform Foundation`
- Source TDD: `../tdd/index.md`
- Planning Date: `2026-03-19`
- Assumptions:
  - Runtime-compatible memory content remains file-backed in v1.
  - Hard delete stays out of scope unless an adapter-owned safe source is explicitly approved later.

## 2. Delivery Strategy

Land the safety boundary first: allowlist rules, metadata schema, and adapter contracts. After that, build write-through and provenance together, then archive/supersede semantics, then artifact versioning, and finally the UI and manual smoke validations that prove the trust boundary behaves correctly.

## 3. Dependency and Sequencing Notes

- `TASK-001` is a hard prerequisite because allowlist and metadata schema define the safety envelope.
- `TASK-002` and `TASK-003` should land together or back to back because write-through without provenance is not acceptable.
- `TASK-004` depends on the memory metadata model from `TASK-003`.
- `TASK-005` is independent from memory write-through except for shared run linkage and can progress in parallel after registry schema exists.
- `TASK-006` should not ship before the manual smoke checklist is ready because the runtime path boundary matters.

## 4. Task Inventory

| Task ID | Title | Objective | Depends On | TDD References | Planned Touchpoints | Acceptance Criteria | Verification | Suggested PR Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `TASK-001` | Allowlist and registry foundation | Define the initial writable path allowlist and create memory/artifact registry schema. | `FEAT-001/TASK-002` | sections 5, 8, 11, 13; `REQ-001`, `REQ-002`, `REQ-003` | config, migrations, memory/artifact repositories | Writable path validation is explicit and narrow; registry tables exist for memory entries, memory sources, artifact families, and artifact versions. | config unit tests, migration tests | `PR-001 Allowlist + schema` |
| `TASK-002` | Controlled memory adapter | Implement adapter read/write behavior for supported runtime-compatible sources with structured results. | `TASK-001`, `FEAT-001/TASK-001` | sections 5, 7, 9, 10; `REQ-001` | memory adapter, filesystem wrapper, write result contracts | Supported edits update only whitelisted paths and return structured write results; unsupported targets fail safely. | integration tests with temp workspace, allowlist rejection tests | `PR-002 Memory adapter` |
| `TASK-003` | Memory metadata and provenance service | Implement `MemoryEntry`/`MemorySource` coordination so file writes and provenance updates succeed or fail together. | `TASK-001`, `TASK-002`, `FEAT-001/TASK-006` | sections 5, 7, 8, 10; `REQ-001`, `REQ-002` | memory service, provenance service, event hooks, repositories | Successful edits create or update memory metadata and provenance records including `manual_operator_edit`; failed edits do not leave partial state. | integration tests for file + metadata consistency | `PR-003 Provenance service` |
| `TASK-004` | Archive and supersede semantics | Implement metadata-only archive/supersede flows with explicit non-delete behavior. | `TASK-003` | sections 9, 10, 11, 14; `REQ-002` | archive/supersede service methods, APIs, query filters, UI-state flags | Archived entries leave source files untouched and disappear from default active views; superseded entries link old to new clearly. | unit tests for state transitions, integration tests for non-delete behavior | `PR-004 Archive + supersede` |
| `TASK-005` | Artifact family and version registry | Implement immutable artifact family/version registration and stable ordering rules for recurring outputs using the shared family-key contract. | `TASK-001`, `FEAT-001/TASK-006` | sections 5, 7, 8, 9, 10; `REQ-003` | artifact registry, family-key logic, version labeling, run linkage | Repeated outputs are grouped under stable artifact families using `producer_kind + producer_id + output_slot`, with immutable versions and producing-run provenance. | contract tests for registration payloads, integration tests for stable ordering | `PR-005 Artifact versions` |
| `TASK-006` | Memory/artifact UI integration and trust-boundary validation | Wire governed memory and artifact registry behavior into the UI and validate with browser plus explicit manual smoke checklists. | `TASK-003`, `TASK-004`, `TASK-005` | sections 10, 14; `REQ-001`, `REQ-002`, `REQ-003` | memory UI, artifact UI, Playwright specs, manual smoke checklist | Operators can review memory provenance, archive/supersede safely, and inspect artifact history; manual smoke confirms write-through, non-delete behavior, and provenance visibility. | Playwright memory review flow, manual runtime write-through smoke | `PR-006 UI + smoke validation` |

## 5. Verification Matrix

| TDD Area / Requirement | Implementing Tasks | Verification Coverage |
| --- | --- | --- |
| Controlled write-through (`REQ-001`) | `TASK-001`, `TASK-002`, `TASK-003`, `TASK-006` | allowlist tests, temp-workspace integration tests, manual runtime smoke |
| Safe archive/supersede (`REQ-002`) | `TASK-001`, `TASK-003`, `TASK-004`, `TASK-006` | unit state tests, integration non-delete tests, Playwright review flow |
| Artifact version history (`REQ-003`) | `TASK-001`, `TASK-005`, `TASK-006` | contract tests for registry input, integration tests for stable ordering and lineage |

## 6. Open Questions and Blockers

- Memory indexing source of truth remains open: filesystem scan, event-driven sync, or hybrid.
- Fallback `output_slot` behavior may need project-specific rules once real output examples exist.
- Bootstrap behavior is now partially closed:
  - Meeseek Box now models the OpenClaw-compatible workspace layout as:
    - `WORKSPACE_PATH/MEMORY.md`
    - `WORKSPACE_PATH/memory/*.md`
    - `WORKSPACE_PATH/memory/*.json`
  - auto-bootstrap remains disabled by default and requires explicit env enablement

## 7. Notes for Execution

- Do not separate write-through from provenance in shipped behavior; they are one trust contract.
- UI copy must distinguish metadata archive from file deletion explicitly.
- Keep hard delete out of active work unless a separate approved design is added.
- Manual smoke ownership for write-through, non-delete semantics, and provenance visibility lives in this feature.
- Broader impact from discovery:
  - runtime-facing memory UX now depends on a bootstrap gate
  - adapter and UI work should not assume memory paths exist
  - trust-boundary validation must include the empty-workspace case before normal write-through scenarios
- `2026-03-21`: `TASK-001` and `TASK-002` are partially implemented.
  Completed:
  - added a canonical workspace-memory allowlist helper aligned with the live mini discovery:
    - `MEMORY.md`
    - direct files under `memory/`
  - added explicit path normalization and allowlist rejection tests
  - added workspace bootstrap status inspection and a gated bootstrap route at `/api/product-state/memory/bootstrap`
  - corrected the shared test harness to mirror the real OpenClaw-compatible workspace layout instead of scope-namespaced memory subdirectories
  Remaining:
  - continue extending the registry side of the model with archive/supersede metadata semantics
- `2026-03-21`: `TASK-003` is partially implemented.
  Completed:
  - added canonical `MemoryEntry` and `MemorySource` repository support on top of the existing schema
  - implemented a memory write-through service that records file writes, memory metadata, and provenance together
  - added a server-backed canonical memory API at `/api/product-state/memory/entries`
  - added focused tests proving rejected writes do not create partial metadata
  Remaining:
  - enrich provenance with stronger run/artifact linkage once those producers are wired
- `2026-03-21`: `TASK-004` is partially implemented.
  Completed:
  - added metadata-only archive support for canonical memory entries
  - added supersede support that links older entries to replacement entries without deleting source files
  - added server-backed archive and supersede APIs under:
    - `/api/product-state/memory/entries/[id]/archive`
    - `/api/product-state/memory/entries/[id]/supersede`
  - replaced the legacy memory browser page with a canonical memory registry view that distinguishes active versus archived entries
  - added focused service and API coverage for archive/supersede lifecycle behavior
  - added operator-facing archive and supersede controls directly in the memory UI
  - browser-validated the governed lifecycle with:
    - workspace bootstrap
    - canonical write-through
    - supersede action moving an entry into the archived section
    - archived section surfacing the replacement link instead of implying deletion
  Remaining:
  - add stronger run/artifact provenance joins once those producers are wired
- `2026-03-21`: `TASK-005` is partially implemented.
  Completed:
  - added canonical `artifact_families` and `artifact_versions` tables
  - implemented stable family-key derivation using:
    - `producer_kind + producer_id + output_slot`
  - implemented immutable artifact version registration with deterministic labels:
    - `v0001`, `v0002`, ...
  - added a server-backed artifact registry API at `/api/product-state/artifacts`
  - replaced the artifacts placeholder page with a canonical family/version registry view
  - added focused repository, service, and API coverage for family grouping and version ordering
  - added artifact family detail pages and reusable producer-aware artifact panels
  - linked artifact families and versions back into work and run detail views so outputs remain navigable from their producers
  - browser-validated seeded canonical artifact families and versions across:
    - artifact registry
    - artifact family detail
    - work detail related-artifact panel
    - run detail related-artifact panel
  - implemented the first light v1 producer path:
    - scheduled jobs only
    - real files on disk only
    - original workspace paths referenced in place, not copied
  - added `/api/product-state/schedules/[id]/artifacts` for schedule-output registration with workspace-path validation
  - added schedule-detail artifact registration UI and browser-validated:
    - registering an existing workspace file
    - version creation under the schedule producer
    - artifact family drilldown back to the producing schedule
  - refined the producer contract from manual registration to explicit producer reporting:
    - added `/api/product-state/schedules/[id]/report-output`
    - reporting a file now:
      - reuses canonical artifact family/version registration
      - updates canonical schedule health to `completed`
      - clears the missed-run flag
      - preserves original workspace file references instead of copying content
  - added a local helper entrypoint for producing jobs:
    - `npm run report-schedule-output -- --schedule <id> --file <path> ...`
    - validated that the helper can report a new schedule-produced file and advance the same family to `v0003`
  - updated the schedule detail page to show the helper command as the preferred v1 contract and demoted the browser form to fallback/recovery language
  - split artifact version provenance metadata between:
    - `schedule_manual_registration`
    - `schedule_reported_output`
  - browser-validated a fresh helper-reported version advancing the family to `v0004` and rendering `reported by producing job` in the artifact family detail view
  - added API-level integration coverage proving:
    - a previously missed one-shot schedule produces a `missed_schedule` Inbox item
    - explicit output reporting resolves that Inbox item
    - repeated reports into the same output slot advance the version family from `v0001` to `v0002`
  Remaining:
  - wire runtime-emitted schedule outputs into the explicit report-output path instead of browser/operator submission
  - expose richer provenance detail once run/work/artifact producers are linked end to end
  - decide whether ad hoc/manual run outputs should become producers after observing v1 usage
- `2026-03-21`: broader impact from the memory foundation slice.
  - the previous scope-to-subdirectory memory model was wrong for the live runtime and is now replaced by product-level scope metadata over a shared workspace-compatible file layout
  - memory bootstrap is now an explicit operational gate with disabled-by-default automation, which preserves the security frame while still letting the app fix the missing-path condition deliberately
  - canonical memory writes now depend on both the workspace allowlist and the product-state DB, so future memory features must treat file mutation and provenance updates as one atomic contract
  - artifact registry is now separate from raw artifact storage, so future output producers should register immutable versions through the canonical service rather than writing directly to page-local lists
  - v1 artifact producer scope is now intentionally narrow: schedule-produced workspace files only, which keeps the registry concrete and avoids turning every run or response into an output object prematurely
  - explicit producer reporting is now the canonical v1 output contract, which avoids filesystem-guessing heuristics and keeps provenance tied to declared producer intent rather than incidental file changes
  - the producer contract is now reachable from both browser and local-job contexts, so future runtime integration work should treat the schedule output callback as a shared boundary instead of inventing separate UI and automation registration flows
  - artifact provenance now distinguishes fallback/manual registration from true producer-reported output, which gives later retention and trust decisions a concrete signal instead of treating every registered file as equally authoritative
  - referencing original workspace paths avoids duplicate copies, but it also means artifact availability depends on the underlying workspace file continuing to exist; future retention decisions should be explicit rather than accidental
  - archive is now a true metadata-only action in the product model, which means future UI copy and automation flows must avoid implying file deletion unless a source-specific safe-delete contract is explicitly introduced
  - artifact families are now a first-class navigation surface rather than a reporting-only list, so future producer views should link to family detail instead of inventing parallel output cards
  - browser validation showed the supersede lifecycle needs explicit directional copy in the UI, so future governed actions should bias toward action labels that make source-versus-replacement relationships obvious
  - schedule output reporting now has cross-feature projection impact: artifact registration alone is not enough, because the same callback must also reconcile schedule health and resolve stale missed-schedule attention or the operator-facing Inbox becomes misleading
