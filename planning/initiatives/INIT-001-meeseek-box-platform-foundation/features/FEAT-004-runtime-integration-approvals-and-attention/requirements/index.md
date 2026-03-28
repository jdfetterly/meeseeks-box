# Requirements Index

- Artifact: Requirements Index
- Project: `PROJ-001 Meeseek Box`
- Initiative ID: `INIT-001`
- Feature ID: `FEAT-004`
- Status: `draft`
- Last Updated: `2026-03-19`
- Source Inputs:
  - `meeseeks-box-plan-draft-v3.md`
  - `planning/plan-v3-review-feedback.md`

## Requirements

| Requirement ID | Title | Status | Priority | Notes |
| --- | --- | --- | --- | --- |
| `REQ-001` | Inbox derivation and typed approval events create correct attention state and resolution paths | draft | High | Covers approvals, failures, blocked work, missed schedules, and explicit memory review prompts |
| `REQ-002` | Runtime or filesystem writes require approval unless explicitly allowlisted | draft | High | Conservative alignment with `iron-claw-mini` |
| `REQ-003` | Slack fallback alerts appear only for narrow high-signal conditions without becoming the primary operator surface | draft | High | Approval required, no-retry failure, or high-signal missed schedule only |
