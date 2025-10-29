#!/bin/bash

echo "Configuration complète du système scolaire..."

# Exécuter les migrations
echo "Exécution des migrations..."
php artisan migrate --force

# Exécuter les seeders
echo "Insertion des données de test..."
php artisan db:seed --class=CompleteDataSeeder

# Optimiser l'application
echo "⚡ Optimisation de l'application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Créer le lien symbolique pour le stockage
echo "🔗 Création du lien symbolique..."
php artisan storage:link

echo "✅ Configuration terminée avec succès!"
echo ""
echo "🎯 Endpoints API disponibles:"
echo "   - /api/directeur/*"
echo "   - /api/enseignant/*"
echo "   - /api/eleve/*"
echo "   - /api/parent/*"
echo "   - /api/comptable/*"
echo "   - /api/surveillant/*"
echo "   - /api/censeur/*"
echo "   - /api/infirmier/*"
echo "   - /api/bibliothecaire/*"
echo "   - /api/secretaire/*"
echo ""
echo "📱 L'application mobile peut maintenant se connecter au backend!"
