# Mac Mini Shared Policy

## Purpose

This document defines the policy Meeseeks Box shares with the Mac mini external-agent repo model used by `iron-claw-mini`.

The canonical overlap policy remains:

- [external-agent-plane-framework.md](/Users/jdfetterly/Ops/iron-claw-mini/security-model/external-agent-plane-framework.md)

Use this document as the Meeseeks Box overlay, not as a replacement for that source of truth.

## Shared Rules

These rules should match `iron-claw-mini` unless an explicit deviation is documented.

1. GitHub is the control plane.
2. `main` is human-merged only.
3. Agents may read repos, create branches, push branch updates, and open or update PRs.
4. Agents must never be granted merge authority to `main`.
5. Non-draft PRs require a security-review signal from an actor in `ALLOWED_SECURITY_REVIEW_ACTORS`.
6. Pushes to `main` are checked by compensating-control workflows, not trust.
7. Agent identities that can author PRs should appear in `DENIED_MAIN_PUSH_ACTORS`.
8. Runtime services on the mini should bind to loopback unless a documented exception is approved.
9. Tailnet-only exposure remains the default network posture.
10. Production service checkouts and active development checkouts must stay separate.
11. Mutable runtime state must live outside the git checkout.

## Meeseeks Box-Specific Overlay

Meeseeks Box follows the same governance model, with these app-specific extensions:

1. The mini hosts a production web app, not only governance automation.
2. Merge to `main` should trigger an automated production update on the mini.
3. Production update is deterministic first:
   - pull `main`
   - install deps
   - build
   - restart the service
   - run smoke checks
4. After deterministic deploy, an OpenClaw post-deploy validation skill should run on the mini.

## Allowed Deviations

These deviations are intentional and should stay narrow.

### Service start command

Meeseeks Box should use `npm run start` under `launchd`, not `clawport start`.

Why:

- `clawport start` builds and starts.
- `launchd` should restart an already-built app, not trigger a fresh build on every process restart.
- Build belongs in the deploy step, not the steady-state process manager.

### Deployment transport

`iron-claw-mini` is primarily governance automation. Meeseeks Box needs a production deployment transport.

The preferred shape is:

1. GitHub Actions detects a valid push to `main`.
2. A dedicated self-hosted runner on the mini picks up the deploy job.
3. The mini runs the repo-local deploy script in the production checkout.
4. The mini then runs the post-deploy validation skill.

The policy requirement is:

- deploy happens only after a valid merge to `main`
- deploy remains auditable
- deploy is not a hidden side effect of a branch push
- deploy execution stays on the mini, not on a public GitHub-hosted runner

## Required GitHub Variables

Meeseeks Box should use the same policy knobs as `iron-claw-mini`.

- `ALLOWED_MAIN_PUSH_ACTORS`
- `DENIED_MAIN_PUSH_ACTORS`
- `ALLOWED_SECURITY_REVIEW_ACTORS`

Recommended values:

- `DENIED_MAIN_PUSH_ACTORS` should include `openclaw-mini`
- `ALLOWED_MAIN_PUSH_ACTORS` should stay limited to approved human merger identities and any explicitly approved GitHub merge actor
- `ALLOWED_SECURITY_REVIEW_ACTORS` should include the GitHub login used by the security-review automation

Minimum recommended main-push allowlist for this repo:

- `jdfetterly`
- `github-actions[bot]`

`github-actions[bot]` is required because the compensating-control auto-revert workflow pushes the revert commit back to `main`. Leaving it out creates a policy loop where the repair commit violates the same policy.

Current expected security-review actor for Meeseeks Box:

- GitHub login: `jd-security-review`
- profile name: `Top Flight Security`

If the live GitHub automation uses a different login than `jd-security-review`, treat the live login as authoritative and update both the repository variable and this document.

## Mini Checkout Model

Recommended on the mini:

1. Production checkout:
   - `/Users/agent-playground/code/repos/meeseeks-box`
2. Development worktrees or clones:
   - `/Users/agent-playground/code/workspaces/meeseeks-box-*`

Do not develop in the production checkout.

## Review Gate

The Meeseeks Box PR review gate should match the `iron-claw-mini` mechanism:

1. Approved review from an allowed security-review actor, or
2. PR comment from an allowed security-review actor containing `SECURITY_REVIEW: APPROVED`

This is the required gate before human merge.
