# Makefile for Docker-based workflow

up: ## Start all services
	docker-compose up

build: ## Build containers
	docker-compose build

setup: ## Install backend dependencies, migrate db
	docker-compose run backend bundle install
	docker-compose run backend rails db:prepare

console: ## Rails console
	docker-compose exec backend rails console

bash: ## Rails bash shell
	docker-compose exec backend bash

logs: ## Tail logs
	docker-compose logs -f

seed: ## Seed the database
	docker-compose exec backend rails db:seed

stop: ## Stop containers
	docker-compose down