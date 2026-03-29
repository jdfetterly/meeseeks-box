# Meeseeks Box Mac Mini Production Runbook

## Purpose

This runbook defines the branch, review, merge, and deploy path for Meeseeks Box when production is served from JD's Mac mini.

It is an app-specific overlay on:

- [mini-shared-policy.md](/Users/jdfetterly/Ops/meeseeks-box-main/docs/operations/mini-shared-policy.md)
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

1. approved GitHub review from an allowed actor
2. PR comment containing `SECURITY_REVIEW: APPROVED` from an allowed actor

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
8. post-deploy validation skill runs

## Git Setup

On every development machine:

```bash
git remote add origin git@github.com:jdfetterly/meeseeks-box.git
git fetch origin
git checkout main
```

On the mini production checkout:

```bash
cd /Users/agent-playground/code/repos/meeseeks-box
git remote add origin git@github.com:jdfetterly/meeseeks-box.git
git fetch origin
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

## launchd Service

Use the template at:

- [com.jd.meeseeks-box.plist.example](/Users/jdfetterly/Ops/meeseeks-box-main/ops/launchd/com.jd.meeseeks-box.plist.example)

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

The runner should be registered to the repository, not globally, and should be used only by [deploy-mac-mini.yml](/Users/jdfetterly/Ops/meeseeks-box-main/.github/workflows/deploy-mac-mini.yml).

## Deploy Script

The mini deploy script lives at:

- [deploy-mini.sh](/Users/jdfetterly/Ops/meeseeks-box-main/scripts/deploy-mini.sh)

Its job is:

1. fetch and fast-forward `main`
2. run `npm ci`
3. run `npm run build`
4. restart the `launchd` service
5. hit the healthcheck URL
6. run the optional post-deploy validation hook

## Post-Deploy Validation Skill

After deterministic deploy, the mini should run an OpenClaw validation skill.

Contract:

- [post-deploy-validation-skill.md](/Users/jdfetterly/Ops/meeseeks-box-main/docs/operations/post-deploy-validation-skill.md)

The deploy script will run:

- `scripts/post-deploy-validate.sh`

if that file exists and is executable on the mini checkout.

The tracked template for that hook is:

- [post-deploy-validate.example.sh](/Users/jdfetterly/Ops/meeseeks-box-main/scripts/post-deploy-validate.example.sh)

## Why This Deviates From `iron-claw-mini`

The governance model does not deviate.

The operational layer does, because Meeseeks Box is a production app:

1. it must be served continuously
2. it needs a service definition
3. it needs an automated deploy step after merge
4. it needs post-deploy application validation

Those are app requirements, not governance changes.
