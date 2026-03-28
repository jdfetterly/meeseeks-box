# Technical Design Document

## 1. Document Control

- Feature / Initiative: `FEAT-003 Memory and Artifact Governance` / `INIT-001 Meeseek Box Platform Foundation`
- Author: Codex
- Date: `2026-03-18`
- Status: `draft`
- Source FDD: `../fdd.md`

## 2. Context and Inputs

This design implements governed memory and artifact behavior while preserving compatibility with the runtime's file-backed memory layer. The driving requirements are:
- `REQ-001` controlled memory write-through updates runtime-compatible sources and provenance
- `REQ-002` archive and supersede behavior remains safe and distinct from deletion
- `REQ-003` recurring artifacts retain stable version history and provenance

Constraints carried from the product plan:
- canonical memory content truth stays in whitelisted workspace files in v1
- Meeseek Box owns metadata and provenance, not a total memory engine replacement
- unsupported deletes must not be implied by metadata actions

## 3. Technical Goals

- Introduce a memory adapter that can safely read and write only whitelisted runtime-compatible paths.
- Model `MemoryEntry` and `MemorySource` explicitly enough to support provenance, archive, supersede, and review behavior.
- Preserve artifact version history as a first-class registry linked back to the producing run and artifact family.

## 4. Non-Goals

- General-purpose filesystem editing
- Hard-delete support for arbitrary runtime-backed memory content
- Vector memory/search system design

## 5. Architecture Overview

`FEAT-003` adds two governed registries:
- a `memory registry` backed by `MemoryEntry` and `MemorySource` metadata plus a controlled write-through adapter for compatible source files
- an `artifact registry` that groups repeated outputs into logical families and records immutable versions

The memory registry is split by design:
- content truth stays in whitelisted workspace paths used by the CLI/runtime
- metadata truth stays in SQLite for scope, provenance, review state, archive state, and supersede links

The artifact registry treats each produced output as an immutable version entry and groups them by a stable artifact family key.

## 6. System Boundaries and Ownership

| Component / System | Responsibility | Owner / Boundary Notes |
| --- | --- | --- |
| Memory Adapter | Read/write compatible runtime memory files via explicit allowlist | In-scope backend, constrained boundary |
| Memory Registry Service | Manage `MemoryEntry` and `MemorySource` metadata | In-scope backend |
| Artifact Registry Service | Register immutable artifact versions and family lineage | In-scope backend |
| Runtime Workspace Files | Canonical v1 memory content source | External-but-local runtime boundary |
| Memory UI | Display entries, provenance, archive, supersede, and controlled edit actions | In-scope client |
| Artifact UI | Display version history and producing provenance | In-scope client |

## 7. Component and Module Responsibilities

| Unit | Responsibility | Depends On |
| --- | --- | --- |
| `memory/allowlist` | Validate path eligibility for read/write/delete semantics | config, security policy |
| `memory/adapter` | Read and write compatible source files | allowlist, filesystem |
| `memory/service` | Coordinate UI actions with adapter and metadata updates | repositories, adapter |
| `memory/provenance` | Create `MemorySource` rows for file sync, run events, manual edits | event ingestion, repositories |
| `artifacts/service` | Register artifact families and immutable versions | repositories, run linkage |
| `artifacts/versioning` | Derive stable family/version labels and ordering | deterministic timestamp/version logic |

## 8. Data Model and Storage Changes

| Change | Affected Store / Schema | Migration / Compatibility Notes |
| --- | --- | --- |
| Add `memory_entries` table | SQLite | Metadata only; points to canonical file refs |
| Add `memory_sources` table | SQLite | Provenance rows tied to memory entries |
| Add `artifact_families` table | SQLite | Groups recurring outputs by logical family |
| Add `artifact_versions` table | SQLite | Immutable versions linked to producing run |
| Add optional `superseded_by_id` / `archived_at` fields | SQLite | Metadata state only; does not imply source deletion |

Recommended memory fields:
- `memory_entries`: `id`, `scope`, `entry_type`, `title`, `summary`, `canonical_path`, `content_ref`, `status`, `archived_at`, `superseded_by_id`, `reviewed_at`, `last_used_at`
- `memory_sources`: `id`, `memory_entry_id`, `source_kind`, `source_ref`, `source_path`, `excerpt_hash`, `observed_at`, `derived_by`, `notes`

Recommended artifact fields:
- `artifact_families`: `id`, `family_key`, `title`, `scope`, `created_at`
- `artifact_versions`: `id`, `artifact_family_id`, `version_label`, `run_id`, `path_ref`, `created_at`, `metadata_json`

## 9. Interfaces, APIs, Events, and Contracts

| Interface | Direction | Contract Summary | Error Cases |
| --- | --- | --- | --- |
| `GET /api/memory` | client <- memory service | list entries with filters for scope, status, freshness | invalid filters |
| `POST /api/memory/:id/edit` | client -> memory service | apply supported edit to whitelisted source and update metadata | unsupported target, allowlist violation |
| `POST /api/memory/:id/archive` | client -> memory service | archive entry in metadata only | missing entry |
| `POST /api/memory/:id/supersede` | client -> memory service | link old entry to new replacement entry | invalid replacement target |
| `POST /api/artifacts/register` | service/adapter -> artifact registry | register immutable output version under artifact family | missing run linkage, invalid family key |
| `MemoryWriteResult` | internal | `{ entry_id, canonical_path, content_hash, source_record_ids[] }` | failure if write incomplete |
| `ArtifactVersionRecord` | internal | `{ family_id, version_id, version_label, run_id, path_ref }` | ordering ambiguity if timestamp missing |

Delete semantics contract:
- `archive` is metadata-only
- `supersede` creates lineage from older to newer entry
- `hard_delete` is not exposed generally in v1 and is allowed only for adapter-owned safe sources if later approved

## 10. Primary Flows and Sequence Logic

### 10.1 Main Flow

1. The operator opens a memory entry from the app.
2. The memory service checks whether the underlying source path is writable through the allowlist.
3. If writable, the adapter writes updated content to the runtime-compatible file.
4. The memory service updates the `MemoryEntry` metadata and appends one or more `MemorySource` provenance rows, including `manual_operator_edit`.
5. If the operator archives or supersedes an entry, the service updates metadata only and preserves provenance.
6. When a recurring artifact is registered, the artifact registry assigns it to an artifact family and appends a new immutable version row.

### 10.2 Failure / Alternate Flows

- Scenario: Non-writable memory target
  Handling: reject edit before any file mutation and return a clear unsupported-target error.
- Scenario: Write path escapes allowlist
  Handling: hard fail, log attempted path, do not write, and surface an operator-safe error.
- Scenario: Archive action on shared source content
  Handling: mark `archived_at` and remove from default active views only; underlying file remains untouched.
- Scenario: Two artifact versions arrive close together
  Handling: order by explicit timestamp and deterministic tiebreaker (version sequence or canonical ID).

## 11. Security, Privacy, and Authorization

- Write-through is restricted to runtime-owned whitelisted paths only.
- No access to human-home paths or arbitrary filesystem traversal is permitted.
- Every successful or rejected edit should emit auditable metadata including actor, path, and source.
- Metadata actions must not be labeled in the UI as deletions unless the source truly supports safe delete.
- Artifact storage paths should be registry-managed references, not user-supplied arbitrary paths.

## 12. Observability and Operational Readiness

| Signal Type | What to Capture | Why It Matters |
| --- | --- | --- |
| Log | memory edit attempts with allowlist decision | debug safety boundary behavior |
| Metric | memory edit success/failure by source kind | detect adapter issues |
| Metric | archive/supersede counts | understand governance usage |
| Log | artifact version registration with family key and run ID | debug lineage issues |
| Alert | repeated allowlist violation attempts or registry write failures | indicates misconfiguration or misuse |
| Trace | memory edit request -> file write -> provenance update | debug split-truth consistency |

## 13. Migration, Backfill, or Rollout Strategy

- Feature flags:
  - `memory_registry_enabled`
  - `memory_write_through_enabled`
  - `artifact_version_registry_enabled`
- Migration steps:
  1. create memory and artifact registry schema
  2. index existing known runtime memory files into `memory_entries` as read-only where needed
  3. enable controlled write-through for explicit allowlisted targets
  4. enable archive/supersede UI actions
  5. register new recurring artifacts under immutable version records
- Rollback approach:
  - disable write-through and registry-backed UI actions
  - preserve metadata tables for auditability; do not attempt destructive rollback of history

## 14. Test Strategy

| Test Level | Coverage | Notes |
| --- | --- | --- |
| Unit | allowlist decisions, archive/supersede state transitions, artifact version label ordering | pure logic only |
| Contract | file diff/input -> `MemoryWriteResult`, artifact register payloads | fixture-driven |
| Integration | supported memory edit updates file + metadata together | temp workspace only |
| Integration | archive and supersede preserve provenance and do not modify file content | verifies split truth |
| Integration | recurring outputs become stable artifact history | deterministic timestamps |
| Playwright | memory review/archive-supersede path | one focused UI journey |
| Manual | real runtime write-through smoke on whitelisted paths | required for trust boundary |

## 15. Risks and Tradeoffs

| Risk / Tradeoff | Impact | Mitigation / Decision |
| --- | --- | --- |
| Split truth between files and DB confuses operators | High | make file source vs metadata state explicit in UI and docs |
| Overly broad allowlist becomes a security risk | High | keep allowlist narrow and config-driven with audit logs |
| Artifact family grouping is ambiguous | Medium | require stable family key generation rules from source context |
| Hard-delete remains unresolved for some source kinds | Medium | keep it out of v1 UI and document archive/supersede instead |

## 16. Traceability Matrix

| FDD Requirement ID | Technical Design Coverage | Planned Tests |
| --- | --- | --- |
| `REQ-001` | memory allowlist, write-through adapter, `memory_entries` + `memory_sources`, edit API | integration: file + provenance update; manual runtime smoke |
| `REQ-002` | archive/supersede APIs, `archived_at`, `superseded_by_id`, delete-semantics contract | unit: state transitions; integration/UI: no false delete implications |
| `REQ-003` | `artifact_families`, `artifact_versions`, versioning rules, registry API | contract/integration: stable ordering and provenance |

## 17. Open Questions

- Which exact workspace paths are in the initial write-through allowlist?
- Should runtime file indexing happen through filesystem scanning, runtime event ingestion, or both?
- What is the fallback family-key strategy for artifacts when upstream jobs do not provide a stable logical output name?
