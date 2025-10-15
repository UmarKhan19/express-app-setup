.PHONY: help install dev build start db-up db-down db-logs lint format clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build the application
	npm run build

start: ## Start production server
	npm run start:prod

db-up: ## Start MongoDB with Docker Compose
	docker-compose up -d mongodb mongo-express

db-down: ## Stop MongoDB
	docker-compose stop mongodb mongo-express

db-logs: ## View MongoDB logs
	docker-compose logs -f mongodb

redis-up: ## Start Redis with Docker Compose
	docker-compose up -d redis redis-commander

redis-down: ## Stop Redis
	docker-compose stop redis redis-commander

redis-logs: ## View Redis logs
	docker-compose logs -f redis

redis-cli: ## Access Redis CLI
	docker exec -it backend-redis redis-cli

kafka-up: ## Start Kafka with Docker Compose
	docker-compose up -d zookeeper kafka kafka-ui

kafka-down: ## Stop Kafka
	docker-compose stop zookeeper kafka kafka-ui

kafka-logs: ## View Kafka logs
	docker-compose logs -f kafka

infra-up: ## Start all infrastructure (MongoDB + Redis + Kafka)
	docker-compose up -d

infra-down: ## Stop all infrastructure
	docker-compose down

infra-logs: ## View all infrastructure logs
	docker-compose logs -f

lint: ## Run linter
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint:fix

format: ## Format code with Prettier
	npm run format

clean: ## Clean build artifacts
	rm -rf dist node_modules

setup: install db-up ## Complete setup (install + start DB)
	@echo "Setup complete! Run 'make dev' to start the server"
