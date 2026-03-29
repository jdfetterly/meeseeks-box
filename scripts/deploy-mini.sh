#!/usr/bin/env bash

set -euo pipefail

REPO_PATH=""
SERVICE_LABEL=""
HEALTHCHECK_URL=""
HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-20}"
HEALTHCHECK_SLEEP_SECONDS="${HEALTHCHECK_SLEEP_SECONDS:-3}"
POST_DEPLOY_HOOK="scripts/post-deploy-validate.sh"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/deploy-mini.sh --repo-path <path> --service-label <label> --healthcheck-url <url>

Options:
  --repo-path <path>        Absolute path to the production checkout.
  --service-label <label>   launchd label to restart after build.
  --healthcheck-url <url>   URL checked after restart.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-path)
      REPO_PATH="${2:-}"
      shift 2
      ;;
    --service-label)
      SERVICE_LABEL="${2:-}"
      shift 2
      ;;
    --healthcheck-url)
      HEALTHCHECK_URL="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$REPO_PATH" || -z "$SERVICE_LABEL" || -z "$HEALTHCHECK_URL" ]]; then
  echo "Missing required arguments" >&2
  usage >&2
  exit 1
fi

if [[ ! -d "$REPO_PATH" ]]; then
  echo "Repository path does not exist: $REPO_PATH" >&2
  exit 1
fi

cd "$REPO_PATH"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Production checkout is dirty: $REPO_PATH" >&2
  echo "Refusing to deploy over local changes." >&2
  git status --short >&2
  exit 1
fi

echo "==> Updating production checkout"
git fetch origin
git checkout main
git pull --ff-only origin main

echo "==> Installing dependencies"
npm ci

echo "==> Building production bundle"
npm run build

PLIST_SOURCE="$REPO_PATH/ops/launchd/${SERVICE_LABEL}.plist.example"
PLIST_DEST="$HOME/Library/LaunchAgents/${SERVICE_LABEL}.plist"
LAUNCHCTL_TARGET="gui/$(id -u)/$SERVICE_LABEL"

if [[ -f "$PLIST_SOURCE" ]]; then
  echo "==> Refreshing launchd plist"
  mkdir -p "$HOME/Library/LaunchAgents"
  cp "$PLIST_SOURCE" "$PLIST_DEST"
fi

if launchctl print "$LAUNCHCTL_TARGET" >/dev/null 2>&1; then
  echo "==> Restarting launchd service"
  launchctl kickstart -k "$LAUNCHCTL_TARGET"
else
  if [[ ! -f "$PLIST_DEST" ]]; then
    echo "Launchd plist missing: $PLIST_DEST" >&2
    exit 1
  fi
  echo "==> Bootstrapping launchd service"
  launchctl bootstrap "gui/$(id -u)" "$PLIST_DEST"
  launchctl kickstart -k "$LAUNCHCTL_TARGET"
fi

echo "==> Waiting for healthcheck: $HEALTHCHECK_URL"
attempt=1
until curl -fsS "$HEALTHCHECK_URL" >/dev/null; do
  if [[ "$attempt" -ge "$HEALTHCHECK_ATTEMPTS" ]]; then
    echo "Healthcheck failed after $attempt attempts: $HEALTHCHECK_URL" >&2
    exit 1
  fi
  sleep "$HEALTHCHECK_SLEEP_SECONDS"
  attempt=$((attempt + 1))
done

echo "==> Healthcheck passed"

if [[ -x "$POST_DEPLOY_HOOK" ]]; then
  echo "==> Running post-deploy validation hook"
  "./$POST_DEPLOY_HOOK"
else
  echo "==> No executable post-deploy validation hook found at $POST_DEPLOY_HOOK"
fi

echo "==> Deploy complete"
