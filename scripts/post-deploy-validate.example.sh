#!/usr/bin/env bash

set -euo pipefail

# This file is intentionally only an example.
#
# Do not install it as scripts/post-deploy-validate.sh until the app routes,
# fixture project, and expected UI states are stable enough to validate.
#
# When that readiness gate is met, this example can be replaced with a small
# deterministic shell validator or the later OpenClaw-driven validator.

BASE_URL="${MEESEEKS_BOX_BASE_URL:-http://127.0.0.1:3001}"

echo "Running example post-deploy validation against ${BASE_URL}"
curl -fsS "${BASE_URL}/" >/dev/null
curl -fsS "${BASE_URL}/work" >/dev/null

echo "Example validation passed. Keep this file non-executable in git; install a real hook only when the validation contract is stable."
