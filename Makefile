# Makefile for Docker-based workflow

up: ## Start all services
	docker-compose up

build: ## Build containers
	docker-compose build

setup: ## Install backend dependencies, migrate db
	docker-compose run --rm backend bundle install
	docker-compose run --rm backend bin/rails db:prepare

console: ## Rails console
	docker-compose exec backend rails console

bash: ## Rails bash shell
	docker-compose exec backend bash

logs: ## Tail logs
	docker-compose logs -f

seed: ## Seed the database
	docker-compose run --rm backend bin/rails db:seed

check: ## Lint, typecheck and test backend and client
	docker-compose run --rm -e RAILS_ENV=test -e DATABASE_URL=postgres://postgres:postgres@db:5432/mapstash_test backend sh -c "bin/rails db:prepare && bundle exec rspec"
	docker-compose run --rm frontend sh -c "npm install --no-audit --no-fund && npm run lint && npx tsc -b && npm test"

stop: ## Stop containers
	docker-compose down