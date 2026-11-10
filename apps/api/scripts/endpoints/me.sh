#!/usr/bin/env bash
# GET /api/auth/me — logs in, then asks who owns the access_token cookie: answers 200 { user }.
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

request "$API_URL/auth/me" --cookie "$COOKIES"
