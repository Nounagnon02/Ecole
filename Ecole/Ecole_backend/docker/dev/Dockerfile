# Image de développement local, utilisée par docker-compose.yml (racine du
# dépôt) — distincte du Dockerfile de production (php-fpm, sans dépendances
# de dev, sans .env cuit). Ici c'est l'inverse : dépendances de dev incluses,
# serveur intégré de Laravel, code monté en volume pour l'édition à chaud.
# Ne sert jamais à construire une image déployée.

FROM php:8.3-cli

WORKDIR /var/www/html

# `calendar` : voir le Dockerfile de production — `easter_days()` en dépend.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip default-mysql-client libxml2-dev libzip-dev libpng-dev libjpeg-dev libonig-dev \
    && docker-php-ext-configure gd --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql mbstring exif pcntl bcmath gd zip calendar \
    && apt-get purge -y --auto-remove \
    && rm -rf /var/lib/apt/lists/*

# `default-mysql-client` : `php artisan migrate` shell-out vers le binaire
# `mysql` pour charger `database/schema/mysql-schema.sql` (voir le Dockerfile
# de production, même cause) — indispensable dès la première migration.

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# `default-mysql-client` installe le client MariaDB (options différentes de
# celles de MySQL — pas de `ssl-mode`). Il vérifie par défaut le certificat
# TLS du serveur et rejette celui, auto-signé, de l'image `mysql:8.0` —
# `~/.my.cnf` est lu par tout appel du binaire quel que soit le paquet qui
# l'installe (contrairement à `/etc/mysql/conf.d/`, propre aux paquets
# serveur), y compris celui que `Illuminate\Database\Schema\
# MySqlSchemaState::load()` lance pour charger database/schema/mysql-schema.sql.
# Acceptable pour une base de développement locale jamais exposée ; jamais en
# production.
RUN printf '[client]\nskip-ssl-verify-server-cert\n' > /root/.my.cnf

COPY docker/dev/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
