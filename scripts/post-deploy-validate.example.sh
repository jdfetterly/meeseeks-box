#!/usr/bin/env bash

set -euo pipefail

# Copy this file to scripts/post-deploy-validate.sh on the Mac mini production
# checkout, then replace the placeholder block with the real OpenClaw skill
# invocation used for Meeseeks Box post-deploy validation.

BASE_URL="${MEESEEKS_BOX_BASE_URL:-http://127.0.0.1:3001}"

echo "Running placeholder post-deploy validation against ${BASE_URL}"
curl -fsS "${BASE_URL}/" >/dev/null
curl -fsS "${BASE_URL}/work" >/dev/null

echo "Placeholder validation passed. Replace this script with the real OpenClaw skill wrapper."
