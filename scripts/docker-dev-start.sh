#!/bin/sh
set -eu

lock_hash=$(sha256sum package-lock.json | cut -d ' ' -f 1)
installed_hash=$(cat node_modules/.saasy-lock-hash 2>/dev/null || true)

if [ "$installed_hash" != "$lock_hash" ]; then
  npm ci --no-audit --no-fund
  printf '%s\n' "$lock_hash" > node_modules/.saasy-lock-hash
fi

npm run db:migrate:deploy
exec npm run dev:next -- --hostname 0.0.0.0 --port 3000
