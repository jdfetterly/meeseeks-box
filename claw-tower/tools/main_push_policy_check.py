#!/usr/bin/env python3
"""Compensating control for repositories without enforceable branch protection."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from typing import List, Tuple


def parse_list(raw: str) -> set[str]:
    return {item.strip() for item in raw.split(",") if item.strip()}


def fetch_commit_pulls(owner: str, repo: str, sha: str, token: str) -> List[dict]:
    url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}/pulls"
    req = urllib.request.Request(
        url,
        headers={
          "Authorization": f"Bearer {token}",
          "Accept": "application/vnd.github+json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def fetch_pr_reviews(owner: str, repo: str, pr_number: int, token: str) -> List[dict]:
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pr_number}/reviews"
    req = urllib.request.Request(
        url,
        headers={
          "Authorization": f"Bearer {token}",
          "Accept": "application/vnd.github+json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def fetch_issue_comments(owner: str, repo: str, pr_number: int, token: str) -> List[dict]:
    url = f"https://api.github.com/repos/{owner}/{repo}/issues/{pr_number}/comments"
    req = urllib.request.Request(
        url,
        headers={
          "Authorization": f"Bearer {token}",
          "Accept": "application/vnd.github+json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8", errors="replace"))


def has_security_approval(
    owner: str, repo: str, pr_number: int, token: str, allowed_review_actors: set[str]
) -> bool:
    reviews = fetch_pr_reviews(owner, repo, pr_number, token)
    for review in reviews:
        actor = str(review.get("user", {}).get("login", ""))
        if actor in allowed_review_actors and review.get("state") == "APPROVED":
            return True

    comments = fetch_issue_comments(owner, repo, pr_number, token)
    for comment in comments:
        actor = str(comment.get("user", {}).get("login", ""))
        body = str(comment.get("body", ""))
        if actor in allowed_review_actors and "SECURITY_REVIEW: APPROVED" in body.upper():
            return True

    return False


def evaluate(
    actor: str,
    allowlist: set[str],
    denylist: set[str],
    pr_count: int,
    security_review_required: bool,
    security_review_ok: bool,
) -> Tuple[bool, str]:
    if actor in denylist:
        return False, f"violation: push to main by explicitly denied actor '{actor}'"
    if pr_count > 0 and actor in allowlist:
        if security_review_required and not security_review_ok:
            return False, f"violation: PR-linked push to main by '{actor}' without approved security review"
        return True, f"ok: PR-linked push to main by approved actor '{actor}'"
    if pr_count > 0:
        return False, f"violation: PR-linked push to main by non-allowlisted actor '{actor}'"
    if actor in allowlist:
        return True, f"ok-with-exception: direct push actor '{actor}' is allowlisted"
    return False, f"violation: direct push to main by non-allowlisted actor '{actor}'"


def main() -> int:
    repo_full = os.environ.get("GITHUB_REPOSITORY", "")
    sha = os.environ.get("GITHUB_SHA", "")
    actor = os.environ.get("GITHUB_ACTOR", "")
    token = os.environ.get("GITHUB_TOKEN", "")
    allowlist_raw = os.environ.get("ALLOWED_MAIN_PUSH_ACTORS", "jdfetterly,github-actions[bot]")
    denylist_raw = os.environ.get("DENIED_MAIN_PUSH_ACTORS", "openclaw-mini")
    review_allowlist_raw = os.environ.get("ALLOWED_SECURITY_REVIEW_ACTORS", "jdfetterly")

    if "/" not in repo_full or not sha or not actor or not token:
        print("error: missing required GitHub context env vars")
        return 1

    owner, repo = repo_full.split("/", 1)
    allowlist = parse_list(allowlist_raw)
    denylist = parse_list(denylist_raw)
    review_allowlist = parse_list(review_allowlist_raw)

    try:
        pulls = fetch_commit_pulls(owner, repo, sha, token)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"error querying commit->pull mapping: HTTP {exc.code}: {body}")
        return 1

    pr_number = None
    if pulls and isinstance(pulls[0], dict):
        pr_number = pulls[0].get("number")

    security_review_required = len(pulls) > 0
    security_review_ok = False
    if security_review_required and isinstance(pr_number, int):
        try:
            security_review_ok = has_security_approval(owner, repo, pr_number, token, review_allowlist)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            print(f"error querying PR review state: HTTP {exc.code}: {body}")
            return 1

    ok, reason = evaluate(
        actor=actor,
        allowlist=allowlist,
        denylist=denylist,
        pr_count=len(pulls),
        security_review_required=security_review_required,
        security_review_ok=security_review_ok,
    )
    print(reason)
    if pulls:
        pr_numbers = [str(p.get("number")) for p in pulls if isinstance(p, dict)]
        print("linked_prs:", ",".join(pr_numbers))
    else:
        print("linked_prs: none")
    if security_review_required:
        print("security_review_ok:", "yes" if security_review_ok else "no")
    if denylist:
        print("denied_actors:", ",".join(sorted(denylist)))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
