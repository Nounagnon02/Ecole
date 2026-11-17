#!/bin/sh
# Amorçage du conteneur de développement.
#
# `backend` et `queue-worker` partagent la même image et le même volume
# `vendor/` : seul `backend` (PRIMARY=1 dans docker-compose.yml) installe les
# dépendances et migre. `queue-worker` attend juste que ce travail soit fini
# — le refaire en double sur un volume partagé corromprait `vendor/`.
#
# Rejouable sans effet de bord destructeur : jamais de seed automatique, un
# `docker compose up` répété ne doit pas effacer des données de test.
set -e

cd /var/www/html

if [ ! -f .env ]; then
  echo "[entrypoint] .env absent — copie depuis .env.example"
  cp .env.example .env
fi

if [ "$PRIMARY" != "1" ]; then
  echo "[entrypoint] conteneur secondaire — attente de vendor/autoload.php (installé par le service backend)"
  i=0
  until [ -f vendor/autoload.php ]; do
    i=$((i + 1))
    if [ "$i" -gt 120 ]; then
      echo "[entrypoint] vendor/autoload.php toujours absent après 2 min — abandon."
      exit 1
    fi
    sleep 1
  done
  exec "$@"
fi

if [ ! -f vendor/autoload.php ]; then
  echo "[entrypoint] installation composer (première fois — plus rapide ensuite, vendor/ vit dans un volume nommé)"
  composer install --no-interaction --prefer-dist
fi

if ! grep -q "^APP_KEY=base64:" .env; then
  echo "[entrypoint] génération de APP_KEY"
  php artisan key:generate --force
fi

echo "[entrypoint] attente de MySQL (${DB_HOST:-mysql}:${DB_PORT:-3306})..."
i=0
until php -r "new PDO('mysql:host=${DB_HOST:-mysql};port=${DB_PORT:-3306}', '${DB_USERNAME:-root}', '${DB_PASSWORD:-root}');" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "[entrypoint] MySQL ne répond toujours pas après 60 tentatives — abandon."
    exit 1
  fi
  sleep 1
done
echo "[entrypoint] MySQL prêt."

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

echo "[entrypoint] migrations..."
php artisan migrate --force

echo "[entrypoint] base à jour. Peupler les données de démonstration : docker compose exec backend php artisan db:seed"

exec "$@"
