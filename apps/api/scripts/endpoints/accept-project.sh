#!/usr/bin/env bash
# PATCH /api/projects/:id/accept — logs in as an admin and accepts a pending project.
source "$(dirname "$0")/_common.sh"

: "${ADMIN_EMAIL:?Set ADMIN_EMAIL (a user whose app_metadata.role is admin)}"
: "${PROJECT_ID:?Set PROJECT_ID (the id returned by upload-project.sh)}"
PASSWORD="${PASSWORD:-Password123!}"

COOKIES="$(mktemp)"
trap 'rm -f "$COOKIES"' EXIT

curl --silent --show-error --fail-with-body --output /dev/null --cookie-jar "$COOKIES" \
  -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "email": "$ADMIN_EMAIL",
  "password": "$PASSWORD"
}
JSON

request -X PATCH "$API_URL/projects/$PROJECT_ID/accept" --cookie "$COOKIES"