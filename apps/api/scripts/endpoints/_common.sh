#!/usr/bin/env bash
# Shared settings for the endpoint scripts. Override any value through the environment.
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"

# Prints the response status line, headers and body; exits non-zero on HTTP errors.
request() {
  curl --silent --show-error --include --fail-with-body "$@"
  echo
}
