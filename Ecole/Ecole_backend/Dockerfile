# Image de production du backend Laravel.
#
# L'ancienne version ne pouvait pas se construire : une première étape Node
# lançait `npm install` sur le contexte du backend, qui n'a pas de
# `package.json`, puis copiait `/app/public/build`, jamais produit. Le
# frontend est un projet séparé, déployé sur Vercel — il n'a rien à faire
# dans l'image de l'API.
#
# Corrigé aussi : `composer install` embarquait les dépendances de
# développement, `COPY .env.example .env` suivi de `key:generate` cuisait une
# clé jetable dans l'image (identique pour tous les déploiements), et le CMD
# lançait `artisan serve`, le serveur de développement mono-processus.

FROM php:8.3-fpm AS base

WORKDIR /var/www

RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libxml2-dev libzip-dev libpng-dev libjpeg-dev libonig-dev \
    && docker-php-ext-configure gd --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get purge -y --auto-remove \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Les dépendances d'abord, le code ensuite : le cache de couche survit à toute
# modification qui ne touche pas composer.json/lock.
COPY composer.json composer.lock ./
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --prefer-dist \
        --no-interaction

COPY . .

RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Aucun `.env` ni `APP_KEY` dans l'image : ils viennent de l'environnement
# d'exécution. Une clé cuite à la construction serait partagée par tous les
# déploiements — de quoi forger les sessions de n'importe lequel.

USER www-data

EXPOSE 9000

# php-fpm, pas `artisan serve` : un serveur nginx se place devant (voir
# docker/nginx.conf).
CMD ["php-fpm"]
