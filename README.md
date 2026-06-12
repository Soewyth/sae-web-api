# EventSpot — Plateforme de recommandation d'événements touristiques

> SAÉ BUT2 Informatique · IUT de Calais · Juin 2026  
> Groupe : Dhesdin Valentin · Gobfert Frédéric · Molinaro Antoine · Regnault Alex · Vanbaelinghem-Dezitter Willem

Plateforme web permettant de recommander les meilleures villes françaises pour organiser un événement, en croisant données météo historiques, disponibilité des lieux et concurrence événementielle.

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose v2
- [Make](https://www.gnu.org/software/make/) (`sudo apt install make` sur Debian/Ubuntu)
- Git
- **Pour les tests PHP uniquement** : PHP 8.3 CLI + extensions xml + Composer
  ```bash
  sudo apt install php8.3-cli php8.3-xml composer
  ```

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Soewyth/sae-web-api
cd sae-web-api
```

### 2. Créer le fichier d'environnement

Créer le fichier `.env` à la racine du dossier `sae-web-api` avec le contenu suivant :

```env
# Docker Compose
NAME=sae-web-but2-eventspot

# PostgreSQL
POSTGRES_USER=sae_user
POSTGRES_PASSWORD=sae_password
POSTGRES_DB=sae_db
POSTGRES_HOST=db
POSTGRES_PORT=5432

# API
API_PORT=3070
DATABASE_URL=postgresql://sae_user:sae_password@localhost:5432/sae_db
JWT_SECRET=sae_but2_tourisme_2026_super_secret_key_tres_longue
JWT_EXPIRES_IN='2h'
DATATOURISME_API_KEY=27092812-3064-4c22-93aa-227bb8a81ec9
```

> **Note :** La clé à été fourni volontairement pour éviter à la correction d'en regénérer une !

### 3. Lancer la stack

#### Si ce n'est pas la première fois, ou si vous avez besoin d'un environnement propre : `docker compose down -v --rmi local`

```bash
make up
```

Cette commande fait tout automatiquement :

1. Crée le réseau Docker si absent
2. Build les images (API Node.js + frontend PHP)
3. Démarre les conteneurs (PostgreSQL, API, Web)
4. Attend que PostgreSQL soit prêt
5. Applique les migrations Prisma
6. Lance le seed si la base est vide (**attention : ~10-15 min** pour les données météo)
7. Vérifie que l'API répond

### 4. Vérifier que tout fonctionne

```bash
make health
```

Doit retourner : `{"status":"ok","api":"up","database":"up"}`

---

## Accès

| Service               | URL locale                       |
| --------------------- | -------------------------------- |
| Frontend PHP          | http://localhost:8080            |
| API REST              | http://localhost:3070/api/health |
| Documentation Swagger | http://localhost:3070/api-docs   |

### Comptes de test (créés par le seed)

| Rôle        | Email           | Mot de passe |
| ----------- | --------------- | ------------ |
| Admin       | admin@gmail.com | admin        |
| Utilisateur | user@gmail.com  | user         |

---

## Commandes disponibles

```bash
make up        # Tout-en-un : build + démarrage + migrations + seed (si base vide)
make down      # Arrêter les conteneurs (données conservées)
make restart   # Redémarrer toute la stack (down + up)
make dev       # Préparer un poste contributeur (husky + npm install + composer install)
make logs      # Suivre les logs de l'API en temps réel
make logs s=db # Suivre les logs d'un autre service (ex: db)
make migrate   # Appliquer les migrations Prisma (idempotent)
make seed      # Réinitialiser et reseed la base (EFFACE les données)
make test      # Lancer les tests Jest (API) dans le conteneur
make test:web  # Lancer les tests PHPUnit (web) en local
make health    # Vérifier que l'API et la base répondent
make ps        # État des conteneurs
make clean     # Supprimer conteneurs + volumes (DONNÉES PERDUES)
```

---

## Structure du projet

```
sae-web-api/
├── api/
│   ├── prisma/
│   │   ├── schema.prisma           # Modèle de données (6 tables)
│   │   ├── seed.ts                 # Seed DataTourisme + météo Open-Meteo
│   │   └── migrations/             # Migrations versionnées
│   ├── src/
│   │   ├── auth/                   # JWT — login / register
│   │   ├── city/                   # CRUD villes
│   │   ├── event/                  # CRUD événements
│   │   ├── review/                 # CRUD avis (rating 1-5)
│   │   ├── log/                    # Journal d'activité (auto via triggers)
│   │   ├── recommendation/         # Moteur de score Top 3 villes
│   │   ├── user/                   # CRUD utilisateurs
│   │   ├── common/jwt.middleware.ts
│   │   ├── client.ts               # PrismaClient singleton
│   │   └── index.ts                # Point d'entrée Express
│   ├── tests/                      # Tests Jest (8 suites, 136 tests)
│   ├── Dockerfile                  # Image de développement
│   └── Dockerfile.jrcandev         # Image de production (multi-stage)
├── web/
│   ├── src/
│   │   ├── pages/                  # Pages PHP (home, explore, login, dashboard…)
│   │   ├── class/                  # ApiClient PHP
│   │   ├── config/                 # Configuration
│   │   ├── css/                    # Styles
│   │   ├── js/                     # JavaScript (calendrier, interactions)
│   │   ├── index.php
│   │   └── main.inc.php
│   ├── tests/                      # Tests PHPUnit (2 suites, 46 tests)
│   ├── composer.json
│   └── phpunit.xml
├── docker-compose.yml              # Stack de développement local
├── docker-compose.jrcandev.yml     # Stack de production (JrCanDev + Traefik)
├── Makefile                        # Commandes simplifiées
└── deploy.sh                       # Script CI/CD déclenché par webhook GitHub
```

---

## API REST — Routes principales

| Méthode | Endpoint               | Auth | Description                   |
| ------- | ---------------------- | ---- | ----------------------------- |
| POST    | `/auth/register`       | —    | Créer un compte               |
| POST    | `/auth/login`          | —    | Connexion, retourne un JWT    |
| GET     | `/city/`               | —    | Lister toutes les villes      |
| GET     | `/city/:cityId/events` | —    | Événements d'une ville        |
| GET     | `/event/`              | —    | Lister tous les événements    |
| POST    | `/event/`              | JWT  | Créer un événement            |
| GET     | `/review/`             | —    | Lister tous les avis          |
| POST    | `/review/`             | JWT  | Créer un avis (rating 1-5)    |
| GET     | `/logs/`               | JWT  | Journal d'activité            |
| GET     | `/user/`               | JWT  | Lister les utilisateurs       |
| GET     | `/recommendations`     | —    | **Top 3 villes recommandées** |
| GET     | `/api/health`          | —    | Statut API + BDD              |

Documentation complète : **http://localhost:3070/api-docs** (Swagger UI)

---

## Moteur de recommandation

`GET /recommendations?month=6&duration=10&isOutdoor=true&nbGuests=500`

| Paramètre   | Type       | Description            |
| ----------- | ---------- | ---------------------- |
| `month`     | 1–12       | Mois cible             |
| `duration`  | ≥ 1        | Durée en jours         |
| `isOutdoor` | true/false | Plein air ou intérieur |
| `nbGuests`  | ≥ 1        | Nombre de participants |

**Score outdoor** : `50% météo + 30% capacité + 20% concurrence événementielle`  
**Score indoor** : `40% capacité + 60% concurrence événementielle`

Les données météo sont pré-calculées en base (table `CityWeather`, 269 villes × 12 mois) pour garantir des résultats déterministes à chaque appel.

---

## Tests

### API (Jest — dans le conteneur Docker)

```bash
make test
# ou directement :
docker compose exec api npx jest tests/ --coverage
```

Couverture actuelle : **97,06% statements** — 8 suites, 136 tests.

### Web PHP (PHPUnit — en local)

> Prérequis : `sudo apt install php8.3-cli php8.3-xml composer`

```bash
# Installer PHPUnit une seule fois (comme npm install)
cd web && composer install

# Lancer les tests
make test:web
# ou directement :
cd web && vendor/bin/phpunit tests/ --colors=always
```

**46 tests, 64 assertions** — `ApiClient` (appels HTTP mockés) + helpers de `main.inc.php`.

---

## Dépannage

**La commande `make up` échoue sur `make env`**  
→ Le fichier `api/.env` est absent. Créez-le avec les variables listées ci-dessus.

**Le seed prend très longtemps**  
→ Normal. Le seed météo fait ~3 228 appels HTTP vers Open-Meteo par batches de 10, avec 500ms de délai entre chaque batch. Comptez 10-15 minutes.

**`make up` dit "Base déjà peuplée"**  
→ Le seed est ignoré automatiquement si la base contient déjà des villes. Utilisez `make seed` pour forcer un reseed (EFFACE les données existantes).

**Erreur `EACCES` sur `api/node_modules`**  
→ `make up` crée le dossier avec les droits corrects automatiquement. Si le problème persiste : `sudo chown -R $USER:$USER api/node_modules`

**L'API ne répond pas après `make up`**  
→ Vérifiez les logs : `make logs`. Si l'erreur est liée à Prisma, relancez : `make migrate`
