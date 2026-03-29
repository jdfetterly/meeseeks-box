## Summary
- What changed:
- Why:

## Security Review
- Security review preparation run: `yes` / `no` / `n/a`
- Impacted controls / trust boundaries:
- Security-review actor status: expected reviewer is `jd-security-review` (`Top Flight Security`)
- Security-agent approval:
  - Add a PR comment from an allowed security-review actor containing `SECURITY_REVIEW: APPROVED`
  - Include `PR_HEAD_SHA: <current-pr-head-sha>` in that same comment

## Governance Checks
- [ ] This change was proposed through a branch + PR, not a direct push to `main`.
- [ ] The OpenClaw / mini agent actor is not being used as a merger to `main`.
- [ ] The Mac mini production checkout is not being used as an ad hoc development workspace.
- [ ] Required documentation updates are included or explicitly not needed.

## Runtime / Deploy Impact
- Mac mini production impact: `yes` / `no`
- launchd / deploy script / validation skill impact:

## Validation
- Tests / checks run:
- Residual risk:
