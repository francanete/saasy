COMPOSE := docker compose --env-file .env.local

.PHONY: up dev logs status restart rebuild down db db-fresh studio

up: ## Start the local app, database, and Inngest
	$(COMPOSE) up -d --wait

dev: up

logs: ## Follow app, Inngest, and database logs
	$(COMPOSE) logs -f app inngest db

status: ## Show local service health
	$(COMPOSE) ps

restart: ## Recreate app and Inngest without resetting the database
	$(COMPOSE) up -d --force-recreate --wait app inngest

rebuild: ## Rebuild and recreate app and Inngest
	$(COMPOSE) up -d --build --force-recreate --wait app inngest

down: ## Stop the stack without deleting data
	$(COMPOSE) down

studio: ## Open Drizzle Studio using the host database URL
	npm run db:dev:up
	npm run db:studio

db: ## Reset only the local database and open Drizzle Studio
	npm run db:dev:reset
	npm run db:studio

db-fresh: ## Reset local database and Polar sandbox customers
	npm run db:fresh
