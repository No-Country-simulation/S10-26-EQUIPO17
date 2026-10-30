#!/usr/bin/env bash
# POST /auth/login — returns the session and sets the access_token/refresh_token cookies.
source "$(dirname "$0")/_common.sh"

: "${EMAIL:?Set EMAIL (e.g. the one printed by register-company.sh)}"
PASSWORD="${PASSWORD:-Password123!}"

request -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "email": "$EMAIL",
  "password": "$PASSWORD"
}
JSON
