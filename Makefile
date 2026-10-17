COMPOSE := docker compose --env-file .env.local

.PHONY: up dev logs status restart rebuild down db-reset studio

up: ## Start the one private local development stack
	$(COMPOSE) up -d --build --wait

dev: up

logs: ## Follow app, Inngest, and database logs
	$(COMPOSE) logs -f app inngest db

status: ## Show service health
	$(COMPOSE) ps

restart: ## Recreate app and Inngest after environment changes
	$(COMPOSE) up -d --force-recreate --wait app inngest

rebuild: ## Rebuild and recreate app and Inngest
	$(COMPOSE) up -d --build --force-recreate --wait app inngest

down: ## Stop services but preserve data
	$(COMPOSE) down

db-reset: ## Destructively delete Saasy development volumes
	npm run db:dev:reset

studio: ## Run optional host-side Drizzle Studio (check port 4983 first)
	npm run db:studio
