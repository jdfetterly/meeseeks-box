#!/usr/bin/env bash

set -euo pipefail

REPO_PATH=""
SERVICE_LABEL=""
HEALTHCHECK_URL=""
HEALTHCHECK_ATTEMPTS="${HEALTHCHECK_ATTEMPTS:-20}"
HEALTHCHECK_SLEEP_SECONDS="${HEALTHCHECK_SLEEP_SECONDS:-3}"
POST_DEPLOY_HOOK="scripts/post-deploy-validate.sh"
POST_DEPLOY_VALIDATION_ENABLED="${POST_DEPLOY_VALIDATION_ENABLED:-0}"

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

echo "==> Clearing previous production build output"
rm -rf .next

echo "==> Building production bundle"
npm run build

PLIST_SOURCE="$REPO_PATH/ops/launchd/${SERVICE_LABEL}.plist.example"
PLIST_DEST="$HOME/Library/LaunchAgents/${SERVICE_LABEL}.plist"
LAUNCHCTL_DOMAIN="gui/$(id -u)"
LAUNCHCTL_TARGET="$LAUNCHCTL_DOMAIN/$SERVICE_LABEL"
HEALTHCHECK_HOSTPORT="${HEALTHCHECK_URL#*://}"
HEALTHCHECK_HOSTPORT="${HEALTHCHECK_HOSTPORT%%/*}"
HEALTHCHECK_PORT="${HEALTHCHECK_HOSTPORT##*:}"

stop_port_listeners() {
  if [[ ! "$HEALTHCHECK_PORT" =~ ^[0-9]+$ ]]; then
    return
  fi

  local listeners
  listeners="$(lsof -tiTCP:"$HEALTHCHECK_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$listeners" ]]; then
    return
  fi

  echo "==> Stopping existing listeners on port $HEALTHCHECK_PORT"
  kill $listeners 2>/dev/null || true
  sleep 2

  listeners="$(lsof -tiTCP:"$HEALTHCHECK_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$listeners" ]]; then
    echo "==> Forcing listener shutdown on port $HEALTHCHECK_PORT"
    kill -9 $listeners 2>/dev/null || true
    sleep 1
  fi
}

if launchctl print "$LAUNCHCTL_TARGET" >/dev/null 2>&1; then
  echo "==> Unloading launchd service"
  launchctl bootout "$LAUNCHCTL_TARGET"
fi

if [[ -f "$PLIST_SOURCE" ]]; then
  echo "==> Refreshing launchd plist"
  mkdir -p "$HOME/Library/LaunchAgents"
  cp "$PLIST_SOURCE" "$PLIST_DEST"
fi

stop_port_listeners

if [[ ! -f "$PLIST_DEST" ]]; then
  echo "Launchd plist missing: $PLIST_DEST" >&2
  exit 1
fi

echo "==> Bootstrapping launchd service"
launchctl bootstrap "$LAUNCHCTL_DOMAIN" "$PLIST_DEST"

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

if [[ "$POST_DEPLOY_VALIDATION_ENABLED" == "1" && -x "$POST_DEPLOY_HOOK" ]]; then
  echo "==> Running post-deploy validation hook"
  "./$POST_DEPLOY_HOOK"
elif [[ "$POST_DEPLOY_VALIDATION_ENABLED" == "1" ]]; then
  echo "==> Post-deploy validation enabled, but no executable hook found at $POST_DEPLOY_HOOK"
  echo "==> Deterministic deploy completed without post-deploy validation"
else
  echo "==> Post-deploy validation is disabled for this rollout"
  echo "==> Deterministic deploy completed without agent validation"
fi

echo "==> Deploy complete"
