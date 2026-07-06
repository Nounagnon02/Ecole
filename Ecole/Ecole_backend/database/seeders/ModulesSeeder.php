<?php

namespace Database\Seeders;

use App\Models\SaaS\Module;
use Illuminate\Database\Seeder;

class ModulesSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            [
                'slug' => 'core',
                'name' => 'Cœur',
                'description' => 'Module central : authentication, utilisateurs, rôles, dashboard',
                'is_core' => true,
            ],
            [
                'slug' => 'academique',
                'name' => 'Académique',
                'description' => 'Notes, matières, classes, bulletins, cahier de texte',
                'is_core' => true,
            ],
            [
                'slug' => 'paiements',
                'name' => 'Paiements',
                'description' => 'Frais scolaires, transactions, reçus, mobile money',
                'is_core' => true,
            ],
            [
                'slug' => 'emploidutemps',
                'name' => 'Emploi du temps',
                'description' => 'Planification des cours, salles, enseignants',
                'is_core' => true,
            ],
            [
                'slug' => 'messagerie',
                'name' => 'Messagerie',
                'description' => 'Messages internes entre utilisateurs de l\'établissement',
                'is_core' => false,
            ],
            [
                'slug' => 'bibliotheque',
                'name' => 'Bibliothèque',
                'description' => 'Gestion des livres, catalogue, emprunts',
                'is_core' => false,
            ],
            [
                'slug' => 'infirmerie',
                'name' => 'Infirmerie',
                'description' => 'Dossiers médicaux, consultations, vaccinations',
                'is_core' => false,
            ],
            [
                'slug' => 'transport',
                'name' => 'Transport',
                'description' => 'Trajets, véhicules, abonnements transport',
                'is_core' => false,
            ],
            [
                'slug' => 'universite',
                'name' => 'Université',
                'description' => 'Module enseignement supérieur (facultés, départements)',
                'is_core' => false,
            ],
            [
                'slug' => 'ia',
                'name' => 'EduPilot IA',
                'description' => 'Assistant IA, rapports automatiques, tuteur intelligent',
                'is_core' => false,
            ],
            [
                'slug' => 'api',
                'name' => 'API Publique',
                'description' => 'Accès API externe pour intégrations tierces',
                'is_core' => false,
            ],
            [
                'slug' => 'analytics',
                'name' => 'Analytics',
                'description' => 'Statistiques avancées, rapports cross-écoles',
                'is_core' => false,
            ],
        ];

        foreach ($modules as $module) {
            Module::updateOrCreate(
                ['slug' => $module['slug']],
                $module
            );
        }
    }
}
