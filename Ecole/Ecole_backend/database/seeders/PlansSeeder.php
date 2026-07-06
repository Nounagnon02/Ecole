<?php

namespace Database\Seeders;

use App\Models\SaaS\Plan;
use Illuminate\Database\Seeder;

class PlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Idéal pour les petites écoles. Fonctionnalités essentielles incluses.',
                'price_monthly' => 0,
                'price_yearly' => 0,
                'max_students' => 100,
                'max_schools' => 1,
                'features' => [
                    'Gestion des notes et bulletins',
                    'Emploi du temps',
                    'Gestion des paiements',
                    'Messagerie interne',
                ],
                'modules' => ['core', 'academique', 'paiements', 'messagerie'],
                'is_popular' => false,
            ],
            [
                'name' => 'Pro',
                'slug' => 'pro',
                'description' => 'Pour les établissements en pleine croissance. Tous les modules inclus.',
                'price_monthly' => 49.99,
                'price_yearly' => 499.99,
                'max_students' => 2000,
                'max_schools' => 1,
                'features' => [
                    'Tout le plan Starter',
                    'Module bibliothèque',
                    'Module infirmerie',
                    'Module transport',
                    'Assistant IA (500 requêtes/mois)',
                    'Personnalisation (logo, couleurs)',
                    'Support prioritaire',
                ],
                'modules' => ['core', 'academique', 'paiements', 'messagerie', 'bibliotheque', 'infirmerie', 'transport', 'ia'],
                'is_popular' => true,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'Solution complète pour les grands établissements et réseaux d\'écoles.',
                'price_monthly' => 199.99,
                'price_yearly' => 1999.99,
                'max_students' => null, // illimité
                'max_schools' => 10,
                'features' => [
                    'Tout le plan Pro',
                    'Multi-établissements',
                    'Élèves et utilisateurs illimités',
                    'EduPilot IA illimité',
                    'Domaine personnalisé',
                    'API publique',
                    'SLA 99.9%',
                    'Onboarding accompagné',
                    'Rapports IA hebdomadaires',
                ],
                'modules' => ['core', 'academique', 'paiements', 'messagerie', 'bibliotheque', 'infirmerie', 'transport', 'ia', 'api', 'analytics'],
                'is_popular' => false,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}
