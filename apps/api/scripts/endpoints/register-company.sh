#!/usr/bin/env bash
# POST /companies/register — creates a company and its user.
source "$(dirname "$0")/_common.sh"

EMAIL="${EMAIL:-company-$(date +%s)@example.com}"
PASSWORD="${PASSWORD:-Password123!}"

request -X POST "$API_URL/companies/register" \
  -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "email": "$EMAIL",
  "password": "$PASSWORD",
  "firstName": "${FIRST_NAME:-Ada}",
  "lastName": "${LAST_NAME:-Lovelace}",
  "jobPosition": "${JOB_POSITION:-CTO}",
  "companyName": "${COMPANY_NAME:-Acme}",
  "country": "${COUNTRY:-Argentina}",
  "businessSector": "${BUSINESS_SECTOR:-Technology}",
  "interests": ["${INTEREST:-Get multiple solutions for your project}"]
}
JSON

echo "Registered with EMAIL=$EMAIL PASSWORD=$PASSWORD"
