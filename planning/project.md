# Project Planning Manifest

- Artifact: Project
- Project ID: `PROJ-001`
- Project Name: `Meeseek Box`
- Status: `active`
- Last Updated: `2026-05-02`
- Owner: `JD`

## Purpose

Meeseek Box is the operator-facing command center for JD's Mac mini OpenClaw runtime. The project aims to provide a shared responsive shell, discovery-backed runtime integration, cross-device state, a Kanban-first work model, governed memory/artifact handling, and safe runtime-aware approvals while preserving the `iron-claw-mini` security posture.

Current mobile note: the production phone surface is the black/green parent-repo `/mobile` route, backed by `app/mobile/page.tsx` and `components/mobile/*`. The retired standalone `meeseeks-mobile` split is historical and should not guide current mobile implementation.

Current product priority:

1. `/mobile` is the primary active surface for the solo operator loop.
2. Desktop remains a secondary surface and should stay usable, but it should not drive near-term product decisions unless a desktop-specific workflow proves stronger.
3. The retired standalone `meeseeks-mobile` split should remain outside the active product tree while we verify nothing depends on it. If no breakage appears, delete the archived copy later.

## Scope Summary

- In scope:
  - responsive web app shell, navigation, and viewport system
  - discovery gate for Claw-Tower and OpenClaw implementation truth
  - product-state layer and event ingestion
  - server-backed conversations and work board
  - iPhone-first launch and operational flows
  - memory and artifact governance
  - runtime integration, approvals, and attention model
  - structured test planning for unit through UI and manual runtime validation
- Out of scope:
  - native iOS app
  - public internet access
  - multi-user or RBAC
  - full OpenClaw admin replacement
  - semantic/vector memory as system of record

## Workflow Overrides

- Existing draft plans at repo root and under `legacy/` are source inputs, not approved workflow artifacts.
- The project now starts with one foundational shell/cutover feature plus four broad platform features.
- Testing artifacts are established early so implementation can follow a clear validation strategy.
- Notifications are `in-app first, Slack fallback`.
- Soft scoping is a product-level organization model, not a security boundary.
- Memory delete behavior defaults to archive/supersede/curated edit semantics unless the source is adapter-owned and safely deletable.
- Chat and Kanban start fresh from server-backed state; there is no browser-local import or migration path in v1.
- One shared `OpenClaw Integration Adapter` subsystem owns event, approval, and workspace bridges.

## Initiative Inventory

| Initiative ID | Name | Status | Notes |
| --- | --- | --- | --- |
| `INIT-001` | Meeseek Box Platform Foundation | active | Foundation covering shell, discovery, product state, UX, governance, and runtime integration |

## Active Features

| Feature ID | Initiative ID | Status | Current Stage |
| --- | --- | --- | --- |
| `FEAT-000` | `INIT-001` | draft | requirements + FDD + TDD |
| `FEAT-001` | `INIT-001` | draft | requirements + TDD + delivery planning |
| `FEAT-002` | `INIT-001` | draft | requirements + TDD + delivery planning |
| `FEAT-003` | `INIT-001` | draft | requirements + TDD + delivery planning |
| `FEAT-004` | `INIT-001` | draft | requirements + TDD + delivery planning |

## Project Constraints

- Must remain aligned with `iron-claw-mini`
- Tailnet-only access
- Single trusted operator model in v1
- OpenClaw remains the execution substrate
- The adapter boundary is the least stable interface and must be treated as a primary testing target
- Mobile UI coverage must stay right-sized and focus on golden-path flows
- Mobile QA must distinguish the current `/mobile` command shell from older responsive-shell or split-app screenshots
- Desktop work is secondary: keep the parent desktop routes functional, but prioritize mobile reliability and direct OpenClaw usefulness first
- Real OpenClaw and Claw-Tower discovery must happen before implementation decisions harden around events, approvals, schedules, and workspace paths

## Key Links

- Local workflow: `planning/_workflow/`
- Local templates: `planning/_templates/`
- AI-first north star: `planning/ai-first-north-star.md`
- AI-first reality framework: `planning/ai-first-reality-framework.md`
- Initiatives: `planning/initiatives/`
- Current source plan: `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/meeseeks-box-plan-draft-v3.md`
- Review feedback: `/Users/jdfetterly/Documents/projects-folder/meeseeks-box/planning/plan-v3-review-feedback.md`
- Discovery gate: `planning/initiatives/INIT-001-meeseek-box-platform-foundation/discovery-gate.md`
- Shared contracts: `planning/initiatives/INIT-001-meeseek-box-platform-foundation/shared-contracts.md`

## Open Questions

- What does OpenClaw actually emit for run completion, tool failure, and schedule trigger events?
- Which parts of one-shot scheduling map directly to native OpenClaw scheduling versus product-managed delayed execution?
- How much of approval blocking/resume can be supported natively by OpenClaw versus a wrapper layer?
- What is the actual runtime workspace file layout for writable memory paths?

## Near-Term Roadmap

1. Confirm no active workflow depends on the retired local split after moving it out of `/Users/jdfetterly/Products/meeseeks-box/`.
2. Delete the archived split copy if no breakage appears.
3. Keep improving `/mobile` as the primary phone-first command, jobs, and context surface.
4. Decide whether queued launch records need a real queue worker, or whether launch should remain a tracked-work creation contract separate from direct chat.
5. Preserve desktop as a secondary route family and revisit it only when a desktop workflow has clear pull.
