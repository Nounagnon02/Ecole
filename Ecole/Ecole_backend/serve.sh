#!/bin/bash
# Relance automatiquement Laravel si il crashe
echo "Démarrage du serveur Laravel (auto-restart activé)..."
while true; do
    php artisan serve --host=127.0.0.1 --port=8000
    echo "[$(date)] Laravel a crashé, redémarrage dans 1s..."
    sleep 1
done
