.PHONY: restart db dev db-fresh check-node studio

check-node: ## Ensure local Node matches Vercel runtime
	@node -e 'const major = Number(process.versions.node.split(".")[0]); if (major !== 24) { console.error("Node 24 required. Current: v" + process.versions.node + ". Run: nvm install 24 && nvm use 24"); process.exit(1); }'

dev: check-node ## Start local DB, run migrations, and start dev
	npm run db:dev:up
	npm run db:migrate
	npm run dev

db-fresh:   ## Delete Polar sandbox customers, reset local DB, and run migrations
	npm run db:fresh

restart: check-node ## Stop dev + start dev
	@lsof -ti:3000,8288 | xargs kill -9 2>/dev/null || true
	npm run dev

studio:     ## Start local DB and open Drizzle Studio
	npm run db:dev:up
	npm run db:studio

db:         ## Reset DB + open studio
	@lsof -ti:4983 | xargs kill -9 2>/dev/null || true
	npm run db:dev:reset && npm run db:studio
