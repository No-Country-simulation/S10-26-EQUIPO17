#!/usr/bin/env bash
# GET /api — health check.
source "$(dirname "$0")/_common.sh"

request "$API_URL/"
