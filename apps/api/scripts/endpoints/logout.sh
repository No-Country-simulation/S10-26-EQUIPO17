#!/usr/bin/env bash
# POST /api/auth/logout — logs in, then closes that session: answers 204 and clears both cookies.
source "$(dirname "$0")/_common.sh"

: "${EMAIL:?Set EMAIL (e.g. the one printed by register-company.sh)}"
PASSWORD="${PASSWORD:-Password123!}"

COOKIES="$(mktemp)"
trap 'rm -f "$COOKIES"' EXIT

curl --silent --show-error --fail-with-body --output /dev/null --cookie-jar "$COOKIES" \
  -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "email": "$EMAIL",
  "password": "$PASSWORD"
}
JSON

request -X POST "$API_URL/auth/logout" --cookie "$COOKIES"
