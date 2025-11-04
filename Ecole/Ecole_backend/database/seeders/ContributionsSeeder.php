<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ContributionsSeeder extends Seeder
{
    public function run()
    {
        // Récupérer toutes les classes avec leurs séries
        $classes = DB::table('classes')
            ->join('classe_series', 'classes.id', '=', 'classe_series.classe_id')
            ->select('classes.id as classe_id', 'classe_series.serie_id', 'classes.categorie_classe')
            ->get();

        $contributions = [];
        $now = Carbon::now();

        foreach ($classes as $classe) {
            // Définir les montants selon la catégorie
            $montant = match($classe->categorie_classe) {
                'maternelle' => 50000,
                'primaire' => 75000,
                'secondaire' => 100000,
                default => 60000
            };

            $contributions[] = [
                'montant' => $montant,
                'id_classe' => $classe->classe_id,
                'id_serie' => $classe->serie_id,
                'montant_premiere_tranche' => (int)($montant * 0.4),
                'date_fin_premiere_tranche' => $now->copy()->addMonths(2)->format('Y-m-d'),
                'montant_deuxieme_tranche' => (int)($montant * 0.3),
                'date_fin_deuxieme_tranche' => $now->copy()->addMonths(4)->format('Y-m-d'),
                'montant_troisieme_tranche' => (int)($montant * 0.3),
                'date_fin_troisieme_tranche' => $now->copy()->addMonths(6)->format('Y-m-d'),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Insérer par lots pour éviter les erreurs de mémoire
        foreach (array_chunk($contributions, 100) as $chunk) {
            DB::table('contributions')->insert($chunk);
        }

        $this->command->info('Contributions créées avec succès pour ' . count($contributions) . ' classes/séries.');
    }
}
