# Post-Deploy Validation Skill

## Purpose

This document defines the contract for the OpenClaw skill that validates Meeseeks Box after production deploy on the Mac mini.

This skill is not the deploy authority.

The deploy authority remains:

1. merge to `main`
2. GitHub workflow trigger
3. repo-local deploy script on the mini

The skill exists to validate the running app after deploy.

## Required Behavior

The skill should:

1. verify the Meeseeks Box app is reachable on the mini's loopback-bound production port
2. verify key routes return healthy responses
3. verify the promoted board-first control routes still render
4. report success or failure in a machine-readable way for the deploy log

## Minimum Checks

At minimum, validate:

1. `/`
2. `/projects`
3. `/work`
4. a known project detail route
5. a known project board route

If stable route fixtures exist, validate them directly.

## Output Contract

Success:

- exit code `0`
- print a short summary of routes checked

Failure:

- non-zero exit code
- print the first failing route or validation reason

## Authority Boundary

The skill may:

1. read the running app
2. call safe read-only endpoints
3. report status

The skill must not:

1. merge code
2. change GitHub branch policy
3. mutate production config as part of validation
4. silently redeploy

## Integration Point

The deploy script looks for:

- `scripts/post-deploy-validate.sh`

This script should become the repo-local wrapper that invokes the real OpenClaw validation skill on the mini.

Until that skill exists, deploy remains deterministic but validation remains limited to the basic HTTP healthcheck.

The wrapper should accept the production base URL through environment, defaulting to:

- `MEESEEKS_BOX_BASE_URL=http://127.0.0.1:3001`
