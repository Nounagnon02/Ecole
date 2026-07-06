#!/bin/bash
set -e

cd /home/prince-kangbode/Mes_projets/Ecole/Ecole/Ecole_backend

# Setup .env
if [ ! -f .env ]; then
    cp .env.example .env
    php -r "echo 'APP_KEY='.base64_encode(random_bytes(32)).PHP_EOL;" >> .env
fi

# Install composer deps
COMPOSER_POLICY_ADVISORIES_BLOCK=false composer install --no-interaction --prefer-dist 2>&1

echo "=== Setup complete ==="
