.PHONY: restart db

restart:    ## Stop dev + start dev
	@lsof -ti:3000,8288 | xargs kill -9 2>/dev/null || true
	npm run dev

db:         ## Reset DB + open studio
	@lsof -ti:4983 | xargs kill -9 2>/dev/null || true
	npm run db:dev:reset && npm run db:studio
