# Active Test Cases

- Artifact: Delivery Test Cases
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-003`
- Status: `draft`
- Last Updated: `2026-03-18`
- Source TDD Test Design: `../tdd/test-design.md`

## Test Cases

- [ ] `TC-001` Memory write-through updates file content and provenance metadata
  Requirement refs: `REQ-001`
  Task refs: pending
  Test level: integration
  Preconditions:
  - Temp memory workspace exists
  - Write-through adapter is configured for whitelisted paths
  Steps:
  1. Perform a supported memory edit through the service layer
  2. Inspect resulting file content
  3. Inspect `MemoryEntry` and `MemorySource`
  Expected result:
  - Runtime-compatible file content is updated and provenance records are created consistently
  Execution status: not-run
  Notes:
  - Do not use real runtime workspace in automated execution

- [ ] `TC-002` Archive and supersede actions are safe and explicit
  Requirement refs: `REQ-002`
  Task refs: pending
  Test level: unit + integration + Playwright
  Preconditions:
  - Existing memory entry with source metadata exists
  Steps:
  1. Archive a memory entry
  2. Supersede it with a newer entry
  3. Inspect metadata and UI state
  Expected result:
  - The UI and metadata show archive/supersede correctly without claiming the original source content was deleted
  Execution status: not-run
  Notes:
  - Includes one focused UI validation path

- [ ] `TC-003` Recurring artifact output versions are stable and ordered
  Requirement refs: `REQ-003`
  Task refs: pending
  Test level: contract + integration
  Preconditions:
  - Recurring artifact fixtures exist with deterministic timestamps
  Steps:
  1. Register multiple recurring outputs
  2. Query artifact history
  Expected result:
  - Artifact versions appear in stable chronological order with correct provenance
  Execution status: not-run
  Notes:
  - Validate stable IDs and version metadata

- [ ] `TC-004` Manual runtime smoke confirms real memory write-through touches only whitelisted paths
  Requirement refs: `REQ-001`, `REQ-002`
  Task refs: pending
  Test level: manual
  Preconditions:
  - Real runtime workspace available
  - Whitelisted path configuration confirmed
  Steps:
  1. Perform a supported memory edit through the app
  2. Inspect touched files
  Expected result:
  - Only approved runtime-owned memory paths are modified
  Execution status: not-run
  Notes:
  - Manual only because the real runtime boundary matters here
