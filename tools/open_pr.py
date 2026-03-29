#!/usr/bin/env python3
"""Create or update GitHub PRs with the repository governance template."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional, Sequence


REPO_ROOT = Path(__file__).resolve().parents[1]


def format_bullets(items: Sequence[str], fallback: str) -> str:
    cleaned = [item.strip() for item in items if item.strip()]
    if not cleaned:
        return f"- {fallback}"
    return "\n".join(f"- {item}" for item in cleaned)


def render_pr_body(
    *,
    changes: Sequence[str],
    why: Sequence[str],
    security_review_prep: str,
    impacted_controls: Sequence[str],
    security_actor_status: str,
    deploy_impact: str,
    deploy_details: Sequence[str],
    validations: Sequence[str],
    residual_risk: Sequence[str],
) -> str:
    return "\n".join(
        [
            "## Summary",
            "- What changed:",
            format_bullets(changes, "fill in changes"),
            "- Why:",
            format_bullets(why, "fill in rationale"),
            "",
            "## Security Review",
            f"- Security review preparation run: `{security_review_prep}`",
            "- Impacted controls / trust boundaries:",
            format_bullets(impacted_controls, "none"),
            f"- Security-review actor status: {security_actor_status}",
            "- Security-agent approval:",
            "  - Add an APPROVED review from an allowed security-review actor, or",
            "  - Add a PR comment from an allowed security-review actor containing `SECURITY_REVIEW: APPROVED`",
            "",
            "## Governance Checks",
            "- [x] This change was proposed through a branch + PR, not a direct push to `main`.",
            "- [x] The OpenClaw / mini agent actor is not being used as a merger to `main`.",
            "- [x] The Mac mini production checkout is not being used as an ad hoc development workspace.",
            "- [x] Required documentation updates are included or explicitly not needed.",
            "",
            "## Runtime / Deploy Impact",
            f"- Mac mini production impact: `{deploy_impact}`",
            "- launchd / deploy script / validation skill impact:",
            format_bullets(deploy_details, "none"),
            "",
            "## Validation",
            "- Tests / checks run:",
            format_bullets(validations, "not run"),
            "- Residual risk:",
            format_bullets(residual_risk, "none"),
            "",
        ]
    )


def run(
    args: Sequence[str],
    *,
    capture_output: bool = True,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(args),
        cwd=REPO_ROOT,
        text=True,
        capture_output=capture_output,
        check=check,
    )


def git_current_branch() -> str:
    result = run(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    return result.stdout.strip()


def existing_pr_number(branch: str) -> Optional[int]:
    result = run(["gh", "pr", "list", "--head", branch, "--state", "open", "--json", "number"])
    data = json.loads(result.stdout or "[]")
    if not data:
        return None
    return int(data[0]["number"])


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="open_pr.py",
        description="Create or update a PR using the repository governance template.",
    )
    parser.add_argument("--title", required=True, help="PR title")
    parser.add_argument("--base", default="main", help="base branch (default: main)")
    parser.add_argument("--head", default=None, help="head branch (default: current branch)")
    parser.add_argument("--change", action="append", default=[], help="summary item under What changed")
    parser.add_argument("--why", action="append", default=[], help="summary item under Why")
    parser.add_argument(
        "--security-review-prep",
        default="n/a",
        choices=["yes", "no", "n/a"],
        help="value for Security review preparation run",
    )
    parser.add_argument(
        "--control",
        action="append",
        default=[],
        help="impacted control or trust-boundary note",
    )
    parser.add_argument(
        "--security-actor-status",
        default="pending with `jd-security-review` (`Top Flight Security`)",
        help="status line for the expected security-review actor",
    )
    parser.add_argument(
        "--deploy-impact",
        default="no",
        choices=["yes", "no"],
        help="whether the change affects the Mac mini production runtime or deploy path",
    )
    parser.add_argument(
        "--deploy-detail",
        action="append",
        default=[],
        help="detail line for Runtime / Deploy Impact",
    )
    parser.add_argument("--validation", action="append", default=[], help="test/check line")
    parser.add_argument("--residual-risk", action="append", default=[], help="residual risk line")
    parser.add_argument("--dry-run", action="store_true", help="print the rendered body without mutating GitHub")
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    head = args.head or git_current_branch()
    body = render_pr_body(
        changes=args.change,
        why=args.why,
        security_review_prep=args.security_review_prep,
        impacted_controls=args.control,
        security_actor_status=args.security_actor_status,
        deploy_impact=args.deploy_impact,
        deploy_details=args.deploy_detail,
        validations=args.validation,
        residual_risk=args.residual_risk,
    )

    if args.dry_run:
        gh_args = ["gh", "pr", "create", "--base", args.base, "--head", head, "--title", args.title]
    else:
        pr_number = existing_pr_number(head)
        if pr_number is None:
            gh_args = ["gh", "pr", "create", "--base", args.base, "--head", head, "--title", args.title]
        else:
            gh_args = ["gh", "pr", "edit", str(pr_number), "--title", args.title]

    if args.dry_run:
        print(body)
        print("\n---")
        print("command:", " ".join(gh_args + ["--body-file", "<tempfile>"]))
        return 0

    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as tmp:
        tmp.write(body)
        tmp_path = tmp.name

    try:
        result = run([*gh_args, "--body-file", tmp_path], capture_output=True, check=True)
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    if result.stdout.strip():
        print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
