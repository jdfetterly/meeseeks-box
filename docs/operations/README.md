# Operations

These docs define how Meeseeks Box is governed and served from the Mac mini.

- `mini-shared-policy.md`: shared policy inherited from the Mac mini external-agent repo model.
- `meeseeks-box-mac-mini-production-runbook.md`: concrete Meeseeks Box production branch, review, merge, and deploy workflow on the Mac mini.
- `post-deploy-validation-skill.md`: contract for the OpenClaw validation skill that runs after deploy.

Current security-review actor assumption for this repo:

- GitHub login: `jd-security-review`
- profile name: `Top Flight Security`

If the live automation signs reviews or approval comments from a different GitHub login, update `ALLOWED_SECURITY_REVIEW_ACTORS` to the actual login and keep the policy docs in sync.
