# === Étape 1 : Build du Frontend (React) ===
FROM node:18 AS frontend-builder
WORKDIR /app

# Copier les fichiers du frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Build React
COPY frontend/ ./
RUN npm run build  # Génère les assets dans /app/dist

# === Étape 2 : Backend (Laravel) ===
FROM php:8.2-fpm

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    nginx unzip libzip-dev libpng-dev libonig-dev libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql zip mbstring

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copier le backend Laravel
WORKDIR /var/www
COPY backend/ .

# Copier les assets compilés de React
COPY --from=frontend-builder /app/dist /var/www/public/build

# Installer les dépendances PHP
RUN composer install --no-dev --optimize-autoloader

# Configurer Nginx
COPY docker/nginx.conf /etc/nginx/sites-available/default
RUN chown -R www-data:www-data /var/www/storage

# Exposer le port 80 et démarrer
EXPOSE 80
CMD sh -c "php artisan migrate --force && php-fpm && nginx -g 'daemon off;'"