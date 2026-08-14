#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ -z "${PROD_SPOT_Q_PG_HOST:-}" ]; then
  echo "ERROR: PROD_SPOT_Q_PG_HOST is not set — refusing to run migrations without a target database." >&2
  exit 1
fi

echo "Applying Postgres migrations (prisma/migrations) ..."

if npx prisma migrate deploy; then
  echo "Migrations applied successfully."
else
  status=$?
  echo "ERROR: migration deploy failed." >&2
  exit "$status"
fi
