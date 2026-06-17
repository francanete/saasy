.PHONY: restart db dev db-fresh

dev:        ## Start local DB, run migrations, and start dev
	npm run db:dev:up
	npm run db:migrate
	npm run dev

db-fresh:   ## Delete Polar sandbox customers, reset local DB, and run migrations
	npm run db:fresh

restart:    ## Stop dev + start dev
	@lsof -ti:3000,8288 | xargs kill -9 2>/dev/null || true
	npm run dev

db:         ## Reset DB + open studio
	@lsof -ti:4983 | xargs kill -9 2>/dev/null || true
	npm run db:dev:reset && npm run db:studio
