 .PHONY: help up dev down restart ps logs health env network wait-db migrate seed db-reset test clean

.DEFAULT_GOAL := help

help: ## Affiche cette aide
	@echo "Commandes disponibles :"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

up: env network ## Tout-en-un : build + démarrage + migrations + seed (si base vide)
	@# Pré-crée le point de montage du volume /app/node_modules avec les droits
	@# de l'utilisateur courant, sinon Docker le crée en root et les
	@# "npm install" lancés ensuite depuis l'hôte échouent en EACCES.
	@mkdir -p api/node_modules
	docker compose up --build -d --renew-anon-volumes
	@$(MAKE) --no-print-directory wait-db
	docker compose exec -T api npx prisma migrate deploy
	@count=$$(docker compose exec -T db sh -c 'psql -U $$POSTGRES_USER -d $$POSTGRES_DB -tAc "SELECT COUNT(*) FROM \"City\""' 2>/dev/null || echo 0); \
	if [ "$$count" = "0" ]; then \
		echo "Base vide -> lancement du seed (peut prendre un moment)..."; \
		docker compose exec -T api npm run db:seed; \
	else \
		echo "Base deja peuplee ($$count villes) -> seed ignore."; \
	fi
	@$(MAKE) --no-print-directory health
	@echo ""
	@echo "  Web PHP   : http://localhost:8080"
	@echo "  API       : http://localhost:3070/api/health"
	@echo "  Swagger   : http://localhost:3070/api-docs"

dev: ## Prépare un poste de contributeur : hooks git (husky) + dépendances hôte (eslint, prisma, tests)
	npm install
	cd api && npm install && npx prisma generate
	cd web && composer install

down: ## Arrête les conteneurs (les données sont conservées)
	docker compose down

restart: down up ## Redémarre toute la stack

ps: ## État des conteneurs (y compris arrêtés)
	docker compose ps -a

logs: ## Suit les logs de l'API (make logs s=db pour un autre service)
	docker compose logs -f $(or $(s),api)

health: ## Vérifie que l'API et la base répondent
	@curl -fsS http://localhost:3070/api/health && echo "" || (echo "L'API ne repond pas sur :3070" && exit 1)

env: ## Vérifie que le .env (racine) existe, sinon explique quoi faire
	@test -f .env || { \
		echo "ERREUR : fichier .env manquant a la racine du projet."; \
		echo "Recuperez son contenu aupres d'un membre de l'equipe"; \
		echo "(variables attendues : NAME, POSTGRES_*, API_PORT, DATABASE_URL,"; \
		echo " JWT_SECRET, JWT_EXPIRES_IN, DATATOURISME_API_KEY — voir README),"; \
		echo "placez-le dans ./.env puis relancez : make up"; \
		exit 1; \
	}

network: ## Crée le réseau Docker externe "web" s'il manque
	@docker network inspect web >/dev/null 2>&1 || docker network create web

wait-db: ## Attend que PostgreSQL accepte les connexions (max 60 s)
	@echo "Attente de PostgreSQL..."
	@i=0; until docker compose exec -T db sh -c 'pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB' >/dev/null 2>&1; do \
		i=$$((i+1)); \
		if [ $$i -gt 60 ]; then echo "PostgreSQL ne repond pas apres 60 s" && exit 1; fi; \
		sleep 1; \
	done
	@echo "PostgreSQL pret."

migrate: ## Applique les migrations Prisma (idempotent)
	docker compose exec -T api npx prisma migrate deploy

seed: ## (Re)seed : EFFACE les données existantes (users compris) puis re-remplit
	docker compose exec -T api npm run db:seed

db-reset: ## Réinitialise complètement la base (migrations + seed)
	docker compose exec api npm run db:reset

test: ## Lance les tests de l'API dans le conteneur
	docker compose exec -T api npm test

test\:web: ## Lance les tests PHPUnit de l'application web
	cd web && vendor/bin/phpunit tests/ --colors=always

clean: ## Supprime conteneurs, volumes (DONNÉES PERDUES) et images du projet
	docker compose down -v --rmi local