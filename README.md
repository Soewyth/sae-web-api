# SAÉ BUT Informatique 2 – Projet Web & API Dockerisé

Ce dépôt constitue la **base de travail** dans le cadre de la SAÉ de 2ᵉ année BUT Informatique (développement web & API).

Les étudiants travailleront **en groupe de 3 à 5**, via **GitHub**, et devront compléter / étendre ce socle technique.

---

## 📘 Sujet de la SAÉ

### 🎯 Contexte général

Vous êtes une **équipe de développement** chargée de concevoir une application web permettant :

* de **collecter et stocker des données réelles existantes**
* de **gérer de nouveaux événements** liés à ces données
* de **produire des indicateurs ou prédictions simples** sur les résultats possibles

L’application reposera sur :

* une **API REST**
* une **base de données relationnelle**
* une **interface web PHP**

---

### 🧩 Choix du thème (libre)

Chaque groupe choisira un **domaine disposant d’un volume de données exploitable**, par exemple :

* 🎮 Tournois de jeux vidéo (e-sport)
* ⚽ Championnats sportifs (football, basket, F1, etc.)
* 🎲 Jeux de hasard (loteries, dés, cartes – sans argent réel)
* 🏆 Compétitions culturelles ou artistiques
* 📊 Classements, saisons, séries d’événements

Le thème doit permettre :

* des **résultats passés** (historique)
* des **événements à venir**
* des **comparaisons ou probabilités**

---

### 🔮 Notion de prédiction attendue

Les prédictions peuvent être **simples et explicables**, par exemple :

* probabilité de victoire basée sur l’historique
* moyenne, tendance, classement projeté
* comparaison statistique entre entités

❗ Aucun machine learning avancé n’est requis.

---

## 🧱 Attendus techniques obligatoires

### API (Node.js / TypeScript)

* API REST structurée (Express)
* Accès base de données via **Prisma**
* Documentation **Swagger** complète
* Gestion des erreurs et validations
* Tests unitaires avec **Vitest**

#### 🔬 Tests et qualité

* Couverture de code **≥ 90 %** (statements, branches, functions)
* Rapport de coverage fourni (`vitest --coverage`)
* Tests automatisés reproductibles

---

### Base de données

* Modélisation relationnelle cohérente
* Contraintes d’intégrité
* Migrations Prisma versionnées

---

### Application Web PHP

* Consommation de l’API via HTTP
* Affichage structuré des données
* Interfaces de création / consultation
* Gestion des erreurs API

---

## 📦 Livrables attendus

* Dépôt GitHub complet
* README final enrichi :
  * présentation du thème (découpes du code, structures des différentes parties, ...)
  * schéma de données
  * routes API
  * logique de prédiction
* Rapport de coverage Vitest
* Jeu de données initial documenté

Le site PHP devra : 
* Présenter votre thématique
* Présenter les membres de l'équipe (avec leurs rôles dans le projet et leurs réalisations)
* Permettre la consultation des données
* Permettre une inscription et une authentification qui donne accès à : 
  * L'ajout de novuelles données
  * La partie de prédiction

L'identification est nécessaire depuis la partie PHP mais également depuis la partie API

---

## 🎯 Objectifs pédagogiques

* Concevoir et développer une **API REST** en Node.js / TypeScript
* Manipuler une **base de données PostgreSQL** via un ORM (Prisma)
* Consommer une API depuis une application web PHP
* Travailler avec **Docker & Docker Compose**
* Structurer un projet full‑stack professionnel
* Travailler en équipe (Git, organisation, documentation)

---

## 🧱 Architecture générale

Le projet est composé de **3 services Docker**, chacun dans un sous‑répertoire dédié :

```
.
├── api/            # API Node.js (TypeScript, Express, Prisma)
├── db/             # Base de données PostgreSQL
├── web/            # Serveur Apache + PHP
├── deploy.sh       # Script d'auto déploiement avec redémarrage sur JrCanDev
├── docker-compose.jrcandev.yml    # Version pour le déploiement sur JrCanDev
├── docker-compose.yml             # Version par défaut, notamment pour le test en local
├── .env
└── README.md
```

Chaque service est **indépendant**, mais communique via le réseau Docker.

---

## 🐳 Docker Compose (racine)

### `docker-compose.yml`
cf. ./docker-compose.yml

### `docker-compose.jrcandev.yml` (utilisé pour le déploiement sur JrCanDev)
cf. ./docker-compose.jrcandev.yml

---

## 🔐 Variables d'environnement

### `.env` (unique, à la racine — gitignoré, à créer à la main après le clone)
```
# Docker Compose
NAME=sae-web-but2-votrenomcompletici

# PostgreSQL
POSTGRES_USER=sae_user
POSTGRES_PASSWORD=sae_password
POSTGRES_DB=sae_db
POSTGRES_HOST=db
POSTGRES_PORT=5432

# API
API_PORT=3070
# localhost = accès depuis l'hôte (prisma, tests). Dans le conteneur api,
# docker-compose surcharge DATABASE_URL avec l'hôte "db".
DATABASE_URL=postgresql://sae_user:sae_password@localhost:5432/sae_db
JWT_SECRET=<demander à l'équipe>
JWT_EXPIRES_IN='2h'
DATATOURISME_API_KEY=<demander à l'équipe>
```

Une fois ce fichier en place, **une seule commande** construit, démarre, migre et seed tout le projet :
```bash
make up
```

Pour **contribuer** (les hooks git husky/eslint s'exécutent sur la machine, pas dans Docker), installez aussi les dépendances hôte :
```bash
make dev
```
(`make help` liste toutes les commandes disponibles : logs, test, db-reset, clean, ...)

---

## 🗄️ Base de données (db)

Aucun Dockerfile spécifique n’est requis ici. La base PostgreSQL est fournie via l’image officielle.

Vous utiliserez **Prisma** côté API pour gérer le schéma et les migrations.

---

## 🚀 API Node.js / TypeScript

### `Dockerfile`
cf. ./api/Dockerfile

### `Dockerfile.jrcandev`
cf. ./api/Dockerfile.jrcandev

### `package.json`
cf. ./api/package.json

### `tsconfig.json`
cf. ./api/tsconfig.json

### `index.ts`
cf. ./api/src/index.ts

---

## 🌐 Serveur Web PHP

### `Dockerfile`
cf. ./web/Dockerfile

### `index.php`
cf. ./web/src/index.php

---

## ▶️ Lancer le projet

À la racine du projet, commencez par créer votre .env en le complétant correctement, et ensuite vérifiez qu'il est bien considéré par docker avec la commande : 
```bash
docker compose config
```
Vous devriez voir les informations de vos differents conteneurs, et notamment l'interpretation de votre NAME dans les différents ``container_name``. si vous voyez encore apparaitre ``${NAME}_postgres``, ``${NAME}_api``, et ``${NAME}_web``, alors votre ``.env`` n'est pas correct et doit être ajusté avant d'aller plus loin.

A présent, le réseau web pour vos conteneurs dockers doit être présent sur votre machine. Si il ne l'est pas encore, vous pouvez le créer avec la commande : 
```bash
docker network create web
```

Si tout est OK, vous pouvez construire et lancer votre projet en l'état pour vérifier que la base est opérationnelle avec la commande : 
```bash
docker compose up --build
```

Accès aux services :
### En version locale
* 🌍 Application PHP : [http://localhost:8080](http://localhost:8080)
* 🔌 API : [http://localhost:3070/api](http://localhost:3070/api)
* ❤️ Healthcheck API : [http://localhost:3070/api/health](http://localhost:3070/api/health)
* 🐘 PostgreSQL : localhost:5432

Lors du premier lancement du projet, vérifiez ces 2 éléments
* http://localhost:8080/ --> Devrait afficher "SAÉ BUT2 – Application Web PHP"
* http://localhost:3070/api/health --> Devrait afficher "{"status":"ok","api":"up","database":"up"}"

La partie déploiement sur un environnement jrcandev est détaillée un peu plus bas dans ce document, mais dans tous les cas, l'environnement local doit **TOUJOURS** être opérationnel (il pourra être utilisé pour l'évaluation de votre travail).

---

## 📚 Travail attendu 

Chaque groupe devra notamment :
* Concevoir le **schéma de base de données**
* Implémenter des **routes API REST documentées (Swagger)**
* Ajouter des **tests unitaires** (Vitest)
* Consommer l’API depuis le site PHP
* Gérer les erreurs, les validations, la sécurité
* Documenter son travail

## Note complémentaire !
Assurez-vous que lorsque **quelqu'un d'autre que vous** télécharge votre dépôt final, il est complet, avec les données et est executable en l'état pour pouvoir vous évaluer ;-)

## Déploiement JrCanDev 
Le projet devra être déployé sur JrCanDev pour être accessible pour les enseignants chargés de l’évaluation de la SAE. 
Vous solliciterez donc un environnement spécifique sur JrCanDev. Ce dernier sera en lien avec la branche ``jrcandev`` (que vous devrez donc **impérativement** avoir sur votre dépôt gitHub) par le biais d’un webhook.

Un (**et 1 seul**) étudiant de chaque groupe fera la demande sur [le discord de JrCanDev](https://discord.gg/hmfnabKSUB) dans le salon ``#hébergement-projets`` , et si vous avez des demandes techniques particulières, vous passerez par le salon ``#demande-assistance`` sur ce même serveur.

**IMPORTANT**
Un certain nombre d'éléments devront être ajustés sur votre dépot gitHub pour que le process de CI/CD soit pleinement fonctionnel, et vous aurez besoin de valider les éléments avec les personnes de JrCanDev (qui ne sont pas à disposition H24) donc assurez-vous que cette mise en place soit opérationnel **au plus tôt** durant votre projet.

Vous documenterez la procédure permettant de déployer votre projet à partir des sources (paramétrage du dépôt, étapes d’initialisation, quel déclencheur, dans quel contexte, …).

### Sur votre version hébergée sur JrCanDev, vous devriez donc avoir 
* 🌍 Application PHP : [https://nomDeVotreProjet.jrcan.dev/](https://nomDeVotreProjet.jrcan.dev)
* 🔌 API : [https://nomDeVotreProjet.jrcan.dev/api](https://nomDeVotreProjet.jrcan.dev/api)
* ❤️ Healthcheck API : [https://nomDeVotreProjet.jrcan.dev/api/health](https://nomDeVotreProjet.jrcan.dev/api/health)
* 🐘 PostgreSQL : [https://nomDeVotreProjet.jrcan.dev:5432](https://nomDeVotreProjet.jrcan.dev:5432)

Lors du premier déploiement de votre projet sur JrCanDev, vérifiez ces 2 éléments
* https://nomDeVotreProjet.jrcan.dev/ --> Devrait afficher "SAÉ BUT2 – Application Web PHP"
* https://nomDeVotreProjet.jrcan.dev/api/health --> Devrait afficher "{"status":"ok","api":"up","database":"up"}"

---

## 🧠 Quelques conseils pédagogiques
* Bien identifier votre sujet, les données dont vous aurez besoin
* Vous assurer de pouvoir créer / récupérer un jeu de données suffisant pour vos prédictions
* Réaliser votre schema pour Prisma (sans oublier la migration et le generate)
* Ajouter vos données (idealement d'une manière propre via le seed ^_^ )
* Tester l’API indépendamment (Postman, Swagger)
* Versionner régulièrement (1 nouvelle fonctionnalité = 1 commit)
* Tout cela bien évidemment en se répartissant clairement les rôles

Bon courage et bon dev 🚀


---


