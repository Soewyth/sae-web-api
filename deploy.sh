#!/bin/bash

###  A deployment script that updates the local Git repository from the remote,
###  preserving any local changes, and then rebuilds the Docker stack.

### Warning: Don't run this script if you have uncommitted changes that you don't want to risk losing.
### Don't use locally and refer to README.md for running a test deployment.


set -e
cd "$(dirname "$0")"

BRANCH="jrcandev"

echo "=== Deploy script started at $(date) ==="

# Check if this is a Git repository
if [ ! -d .git ]; then
  echo "This directory is not a Git repository."
  exit 1
fi

# Detect local changes
if ! git diff-index --quiet HEAD --; then
  echo "Local changes detected."
  echo "They will be preserved; no hard reset will be performed."
  echo "(Run 'git stash' or commit your work if you want to isolate it.)"
  LOCAL_CHANGES=true
else
  LOCAL_CHANGES=false
fi

echo "=== Fetching latest changes ==="
git fetch origin "$BRANCH"

if [ "$LOCAL_CHANGES" = false ]; then
  echo "=== Fast-forward merge with remote ==="
  git merge --ff-only "origin/$BRANCH" || {
    echo "Automatic merge not possible. Deployment aborted."
    exit 1
  }
else
  echo "=== Pulling with rebase (preserving local changes) ==="
  git pull --rebase origin "$BRANCH" || {
    echo "Rebase failed. Deployment aborted."
    exit 1
  }
fi

COMPOSE="docker compose -f docker-compose.jrcandev.yml"

echo "=== Rebuilding stack ==="
# Le réseau externe "web" (traefik) doit exister avant le up
docker network inspect web >/dev/null 2>&1 || docker network create web
$COMPOSE down
$COMPOSE build --no-cache
$COMPOSE up -d

echo "=== Waiting for PostgreSQL ==="
i=0
until $COMPOSE exec -T db sh -c 'pg_isready -U $POSTGRES_USER -d $POSTGRES_DB' >/dev/null 2>&1; do
  i=$((i+1))
  if [ "$i" -gt 60 ]; then
    echo "PostgreSQL is not responding after 60s. Deployment aborted."
    exit 1
  fi
  sleep 1
done

echo "=== Applying Prisma migrations ==="
$COMPOSE exec -T api npx prisma migrate deploy

# Seed only if the database is empty: the seed script wipes existing data
# (deleteMany), so re-running it on every deploy would erase user accounts.
count=$($COMPOSE exec -T db sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB -tAc "SELECT COUNT(*) FROM \"City\""' 2>/dev/null || echo 0)
if [ "$count" = "0" ]; then
  echo "=== Empty database: seeding ==="
  $COMPOSE exec -T api npx prisma db seed
else
  echo "=== Database already populated ($count cities): seed skipped ==="
fi

echo "=== Healthcheck ==="
$COMPOSE exec -T api wget -qO- http://localhost:3070/api/health || {
  echo "API healthcheck failed. Check logs with: $COMPOSE logs api"
  exit 1
}
echo ""

echo "Deployment completed at $(date)"
