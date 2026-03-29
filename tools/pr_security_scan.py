#!/usr/bin/env python3
"""Lightweight PR security scan for repository-level governance and secret hygiene."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path
from typing import Iterable, List, Sequence


REPO_ROOT = Path(__file__).resolve().parents[1]
ALLOWED_SELF_HOSTED_WORKFLOW = ".github/workflows/deploy-mac-mini.yml"
SUSPICIOUS_SECRET_PATTERNS = [
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"\bghp_[A-Za-z0-9]{20,}\b"),
    re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b"),
    re.compile(r"\bsk-[A-Za-z0-9]{20,}\b"),
    re.compile(r"OPENCLAW_GATEWAY_TOKEN=(?!your-gateway-token-here)(?!\.\.\.)\S+"),
]
SAFE_DOC_PATHS = (
    ".env.example",
    "docs/",
    "planning/",
    "README",
    ".md",
)


def run(args: Sequence[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        list(args),
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=True,
    )


def changed_files(diff_range: str) -> List[str]:
    result = run(["git", "diff", "--name-only", diff_range])
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def added_lines(diff_range: str, path: str) -> Iterable[str]:
    result = run(["git", "diff", "--unified=0", diff_range, "--", path])
    for line in result.stdout.splitlines():
        if line.startswith("+++") or line.startswith("@@"):
            continue
        if line.startswith("+"):
            yield line[1:]


def path_is_doc_like(path: str) -> bool:
    return path.endswith(".md") or path.startswith("docs/") or path.startswith("planning/") or path == ".env.example"


def check_self_hosted_runner_scope(files: Sequence[str], findings: List[str]) -> None:
    workflow_files = [path for path in files if path.startswith(".github/workflows/") and path.endswith(".yml")]
    for path in workflow_files:
        content = (REPO_ROOT / path).read_text(encoding="utf-8")
        if "self-hosted" in content or "meeseeks-box-mini-deploy" in content:
            if path != ALLOWED_SELF_HOSTED_WORKFLOW:
                findings.append(
                    f"{path}: self-hosted runner labels are only allowed in {ALLOWED_SELF_HOSTED_WORKFLOW}"
                )


def check_tracked_env_files(files: Sequence[str], findings: List[str]) -> None:
    for path in files:
        if path.endswith(".env.local") or Path(path).name == ".env.local":
            findings.append(f"{path}: .env.local must not be tracked")


def check_added_secrets(diff_range: str, files: Sequence[str], findings: List[str]) -> None:
    for path in files:
        if path_is_doc_like(path):
            continue
        for line in added_lines(diff_range, path):
            for pattern in SUSPICIOUS_SECRET_PATTERNS:
                if pattern.search(line):
                    findings.append(f"{path}: suspicious secret-like material in added line `{line[:120]}`")
                    break


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run Meeseeks Box PR security scan.")
    parser.add_argument("--range", required=True, dest="diff_range", help="git diff range, for example origin/main...HEAD")
    args = parser.parse_args(argv)

    files = changed_files(args.diff_range)
    findings: List[str] = []

    check_self_hosted_runner_scope(files, findings)
    check_tracked_env_files(files, findings)
    check_added_secrets(args.diff_range, files, findings)

    if findings:
        print("PR security scan failed:")
        for finding in findings:
            print(f"- {finding}")
        return 1

    print("PR security scan passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
