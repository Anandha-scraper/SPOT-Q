#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ -z "${PROD_SPOT_Q_DATABASE_URL:-}" ]; then
  echo "ERROR: PROD_SPOT_Q_DATABASE_URL is not set — refusing to run migrations without a target database." >&2
  exit 1
fi

echo "Applying SQL Server migrations (prisma/migrations) ..."

if npx prisma migrate deploy; then
  echo "Migrations applied successfully."
else
  status=$?
  echo "ERROR: migration deploy failed." >&2
  exit "$status"
fi
