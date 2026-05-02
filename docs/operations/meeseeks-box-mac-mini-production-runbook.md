# Meeseeks Box Mac Mini Production Runbook

## Purpose

This runbook defines the branch, review, merge, and deploy path for Meeseeks Box when production is served from JD's Mac mini.

It is an app-specific overlay on:

- [mini-shared-policy.md](mini-shared-policy.md)
- [external-agent-plane-framework.md](/Users/jdfetterly/Ops/iron-claw-mini/security-model/external-agent-plane-framework.md)

## Host And Paths

Mac mini runtime context:

- host: `JDs-Mac-mini`
- mini user: `agent-playground`
- preferred SSH: `ssh agent-playground@100.105.238.17`

Recommended Meeseeks Box paths on the mini:

- production checkout: `/Users/agent-playground/code/repos/meeseeks-box`
- development worktrees: `/Users/agent-playground/code/worktrees/meeseeks-box`
- production state dir: `/Users/agent-playground/.meeseeks-box-prod`
- self-hosted runner home: `/Users/agent-playground/actions-runner/meeseeks-box-deploy`

## Branching Model

1. All development starts from `main`.
2. All work is proposed through a branch + PR.
3. The mini OpenClaw agent may do branch work and push PR branches.
4. The mini OpenClaw agent must never merge `main`.
5. You remain the final merge authority.

Recommended branch prefixes:

- agent branches: `codex/...`
- operator branches: any normal feature/fix branch name

## Review Gate

Before merge, every non-draft PR must satisfy:

1. security-review signal from an actor in `ALLOWED_SECURITY_REVIEW_ACTORS`
2. your final merge decision

Accepted security-review signals:

1. PR comment containing `SECURITY_REVIEW: APPROVED` from an allowed actor
2. that same comment must include `PR_HEAD_SHA` matching the current PR head SHA

Current expected security-review actor:

- GitHub login: `jd-security-review`
- profile name: `Top Flight Security`

Set `ALLOWED_SECURITY_REVIEW_ACTORS=jd-security-review` unless the live automation is confirmed to sign from a different GitHub login.

## Production Update Gate

Production should update only when a valid merge lands on `main`.

Required sequence:

1. branch pushed
2. PR opened
3. security-review signal lands
4. you press merge
5. `main-push-policy` passes
6. deploy workflow triggers
7. mini deploy script updates the production checkout
8. deterministic healthcheck passes
9. Tailnet-served app remains reachable

## Git Setup

On every development machine:

```bash
git remote add origin git@github.com:jdfetterly/meeseeks-box.git
git fetch origin
git checkout main
```

On the mini production checkout, prefer an HTTPS clone for the public repository unless you have already configured GitHub SSH trust on the mini:

```bash
mkdir -p /Users/agent-playground/code/repos
cd /Users/agent-playground/code/repos
git clone https://github.com/jdfetterly/meeseeks-box.git meeseeks-box
cd meeseeks-box
git checkout main
```

The production checkout should track `origin/main` and should never be used for ad hoc edits.

## Mini Environment

The production `.env.local` should keep runtime state outside the repo and stay loopback-bound.

Recommended values:

```dotenv
WORKSPACE_PATH=/Users/agent-playground/.openclaw/workspace
OPENCLAW_BIN=/Users/agent-playground/.npm-global/bin/openclaw
OPENCLAW_GATEWAY_TOKEN=...
CLAWPORT_HOST=127.0.0.1
PORT=3001
MEESEEKS_BOX_STATE_DIR=/Users/agent-playground/.meeseeks-box-prod
MEESEEKS_BOX_OPENCLAW_SYNC_MODE=local
MEESEEKS_BOX_RUNTIME_SCHEDULE_SYNC_ENABLED=true
```

## Mobile Chat Runtime

The `/mobile` command bar and chat sheet are direct-response surfaces for the mini operator loop.

Canonical mobile UI contract:

1. the only supported mobile product surface is the parent-repo `/mobile` route
2. the mobile shell should use the black/green command/jobs/context experience from `components/mobile/*`
3. the retired standalone split at `/Users/jdfetterly/Products/meeseeks-box/meeseeks-mobile` must not be used for production, screenshots, QA, or local acceptance
4. old light chat-home screens with copy such as `Pick up the thread`, `Start a chat`, or `Open a new chat with OpenClaw` are historical and should be removed or replaced if rediscovered

Current production path:

1. the browser posts to `POST /api/mobile/chat`
2. the API persists the user message in product-state conversations
3. the API calls OpenClaw through the server-side gateway token using the selected agent context, currently `mini-ops`
4. the API persists the assistant response and returns the refreshed message list

This is intentionally separate from `POST /api/product-state/launch`. The launch route remains the canonical work/run creation contract, but it does not provide live mobile chat responses unless a queue worker is running. Do not route the mobile command bar back through queued launch behavior when the desired user experience is an immediate OpenClaw answer.

Required runtime values for direct mobile chat:

- `OPENCLAW_BIN`
- `OPENCLAW_GATEWAY_TOKEN`
- `MEESEEKS_BOX_OPENCLAW_SYNC_MODE=local`

## GitHub Variables And Secrets

Governance variables:

- `ALLOWED_MAIN_PUSH_ACTORS`
- `DENIED_MAIN_PUSH_ACTORS`
- `ALLOWED_SECURITY_REVIEW_ACTORS`

Recommended:

- `ALLOWED_MAIN_PUSH_ACTORS=jdfetterly,github-actions[bot]`
- `DENIED_MAIN_PUSH_ACTORS=openclaw-mini`
- `ALLOWED_SECURITY_REVIEW_ACTORS=jd-security-review`

Deploy variables used by the self-hosted deploy workflow:

- `MINI_DEPLOY_REPO_PATH` recommended: `/Users/agent-playground/code/repos/meeseeks-box`
- `MINI_DEPLOY_SERVICE_LABEL` recommended: `com.jd.meeseeks-box`
- `MINI_DEPLOY_HEALTHCHECK_URL` recommended: `http://127.0.0.1:3001/`

Context variables that remain useful for operator visibility, even though the self-hosted workflow does not require them:

- `MINI_DEPLOY_HOST` recommended: `100.105.238.17`
- `MINI_DEPLOY_USER` recommended: `agent-playground`

The self-hosted deploy workflow does not require SSH deploy secrets.
`MINI_DEPLOY_SSH_KEY` and `MINI_DEPLOY_KNOWN_HOSTS` can be removed later if you fully commit to the self-hosted runner transport.

Additional GitHub secret required for automated security approval comments:

- `JD_SECURITY_REVIEW_TOKEN`

This token must belong to the `jd-security-review` account so the approval comment is posted by the allowlisted security-review actor rather than `github-actions[bot]`.

Credential contract:

1. the token authenticates as `jd-security-review`
2. the authenticated actor has write-or-better access to `jdfetterly/meeseeks-box`
3. the token can create, update, and delete issue comments on this repository

Canonical verification step:

1. open GitHub Actions for this repo
2. run `Security Review Token Diagnostics`
3. pass the current PR number or another safe issue number as `issue_number`
4. confirm the workflow reports:
   - authenticated actor: `jd-security-review`
   - repository permission: `write` or better
   - create / update / delete comment checks all succeed

Do not treat token type as the source of truth. The diagnostics workflow is the source of truth.

## Deploy Transport Prerequisite

The checked-in deploy workflow is intended to run on a dedicated self-hosted runner on the mini with label `meeseeks-box-mini-deploy`.

Recommended runner properties:

1. host: `JDs-Mac-mini`
2. user: `agent-playground`
3. labels:
   - `self-hosted`
   - `macOS`
   - `meeseeks-box-mini-deploy`
4. checkout/work directory stays under `/Users/agent-playground`

Because this repository is public, keep the self-hosted runner narrowly scoped to merge-to-main deploy jobs only. Do not add self-hosted labels to PR workflows.

## Automated Security Review

The intended PR flow is:

1. `PR Security Scan` runs on a GitHub-hosted runner for every non-draft PR update.
2. If the scan passes, `PR Security Review Approval` posts or refreshes a SHA-bound approval comment as `jd-security-review`.
3. `PR Governance Review` reruns on matching PR comment updates, evaluates the current PR state, and writes the required `PR Governance Review / require-security-review` result directly onto the PR head SHA.
4. That governance result only passes when the PR checklist is present and the `jd-security-review` approval comment contains a `PR_HEAD_SHA` that exactly matches the current PR head commit.

This keeps the merge step human-only while removing the need for manual security-comment entry on every PR revision.

Required branch protection checks on `main` should include:

- `PR Security Scan / security-scan`
- `PR Governance Review / require-security-review`

Bootstrap note:

- The first PR that introduces `PR Security Review Approval` cannot approve itself automatically, because that secret-bearing workflow only becomes active after it lands on `main`.
- Merge that bootstrap PR with a manual `jd-security-review` comment once, then future PRs can rely on the automated approval path.

## launchd Service

Use the template at:

- [com.jd.meeseeks-box.plist.example](../../ops/launchd/com.jd.meeseeks-box.plist.example)

Install on the mini by copying and editing paths:

```bash
mkdir -p ~/Library/LaunchAgents
cp ops/launchd/com.jd.meeseeks-box.plist.example ~/Library/LaunchAgents/com.jd.meeseeks-box.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.jd.meeseeks-box.plist
launchctl kickstart -k gui/$(id -u)/com.jd.meeseeks-box
```

## Self-Hosted Runner Setup

Recommended runner install path on the mini:

- `/Users/agent-playground/actions-runner/meeseeks-box-deploy`

Recommended runner labels:

- `self-hosted`
- `macOS`
- `meeseeks-box-mini-deploy`

The runner should be registered to the repository, not globally, and should be used only by [deploy-mac-mini.yml](../../.github/workflows/deploy-mac-mini.yml).

## Deploy Script

The mini deploy script lives at:

- [deploy-mini.sh](../../scripts/deploy-mini.sh)

Its job is:

1. fetch and fast-forward `main`
2. run `npm ci`
3. run `npm run build`
4. refresh or install the `launchd` plist from the checked-in template
5. unload the existing `launchd` service if it is loaded
6. stop any stale listener still bound to the healthcheck port
7. bootstrap the refreshed `launchd` service
8. hit the healthcheck URL
9. run the optional post-deploy validation hook

## Current Deploy Validation

The current production safety floor is deterministic and non-agent:

1. build succeeds
2. launchd service restarts
3. healthcheck URL responds
4. Tailnet-served Meeseeks Box URL responds

Current production URL:

- [https://jds-mac-mini.tail13d577.ts.net/](https://jds-mac-mini.tail13d577.ts.net/)
- [https://jds-mac-mini.tail13d577.ts.net/mobile](https://jds-mac-mini.tail13d577.ts.net/mobile)

Tailnet Serve proxies the HTTPS origin to the loopback Next.js process on the mini.

Manual mobile chat smoke after a deploy:

1. open `/mobile` from a real iPhone browser, Chrome or Safari
2. send a short message to the selected project or General Chat
3. confirm an assistant response appears without a `Launch agentId is required` toast
4. refresh and confirm the conversation history still includes the response

The deploy script may run a repo-local `scripts/post-deploy-validate.sh` hook if one exists, but the intended steady state right now is that no OpenClaw validation hook is installed yet.

The deploy script also requires explicit opt-in before it will run any post-deploy hook:

- `POST_DEPLOY_VALIDATION_ENABLED=1`

## Deferred OpenClaw Validation

The OpenClaw post-deploy validator is intentionally deferred until the app contract stabilizes.

Future-phase contract:

- [post-deploy-validation-skill.md](post-deploy-validation-skill.md)

Readiness gate before enabling it:

1. deploys succeed consistently
2. canonical production routes are stable
3. one fixture or demo project is intentionally stabilized for validation
4. success and failure semantics for those routes are known
5. the team agrees the validator is checking a real contract, not moving targets

Until those conditions are met:

1. do not install an executable `scripts/post-deploy-validate.sh` on the mini production checkout
2. leave `POST_DEPLOY_VALIDATION_ENABLED` unset or set to `0`

## Why This Deviates From `iron-claw-mini`

The governance model does not deviate.

The operational layer does, because Meeseeks Box is a production app:

1. it must be served continuously
2. it needs a service definition
3. it needs an automated deploy step after merge
4. it needs post-deploy application validation

Those are app requirements, not governance changes.
