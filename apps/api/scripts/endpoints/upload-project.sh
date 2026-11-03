#!/usr/bin/env bash
# POST /api/projects — logs in and uploads a project for that company.
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

request -X POST "$API_URL/projects" \
  --cookie "$COOKIES" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "title": "Marketplace",
  "description": "A platform to connect buyers and sellers",
  "vertical": "E-commerce",
  "businessSectors": ["Product", "IT"],
  "projectStage": "MVP"
}
JSON
