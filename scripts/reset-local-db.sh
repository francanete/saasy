#!/bin/sh
set -eu

db_volume=$(
  docker compose --env-file .env.local config --format json |
    node -e '
      let config = "";
      process.stdin.on("data", (chunk) => (config += chunk));
      process.stdin.on("end", () => {
        const name = JSON.parse(config).volumes?.db_data?.name;
        if (!name) process.exit(1);
        process.stdout.write(name);
      });
    '
)

docker compose --env-file .env.local down
if docker volume inspect "$db_volume" >/dev/null 2>&1; then
  docker volume rm "$db_volume"
fi
docker compose --env-file .env.local up -d --wait db
npm run db:migrate
