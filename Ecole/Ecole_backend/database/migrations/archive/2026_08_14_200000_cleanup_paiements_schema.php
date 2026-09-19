<?php

use App\Models\PaiementEleve;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Nettoyage du schéma `paiements`.
 *
 * 1. Colonne morte `eleves_id`. La table portait à la fois `eleves_id`
 *    (migration d'origine, contrainte FK) et `eleve_id` (ajoutée en 2025, sans
 *    contrainte). Le modèle, les contrôleurs et les seeders ne lisent que
 *    `eleve_id` ; `eleves_id` est retirée avec sa contrainte.
 *
 * 2. Normalisation de `statut_global`. Le seeder historique écrit
 *    `'payé'`/`'partiel'`/`'impayé'` (minuscules, accentuées) — valeurs que
 *    `PaiementEleve::PAID/PARTIAL/PENDING` ne connaissent pas, et qui forçaient
 *    `ComptableController` à replier les accents avant chaque comparaison.
 *    Les lignes existantes sont réécrites sur les constantes du modèle.
 *
 * 3. Index sur `eleve_id` et `contribution_id` : les lectures comptables
 *    filtrent en permanence sur ces colonnes.
 *
 * Pas de contrainte FK ajoutée sur `eleve_id`/`contribution_id` : ajouter une
 * clé étrangère sur MySQL échoue si des lignes orphelines existent déjà en
 * production, et l'intégrité est déjà garantie en couche applicative
 * (`SchoolExistsRule` + global scope `BelongsToEcole`). La contrainte reste
 * un chantier séparé, une fois les données réconciliées.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('paiements', 'eleves_id')) {
            Schema::table('paiements', function (Blueprint $table) {
                $table->dropForeign(['eleves_id']);
                $table->dropColumn('eleves_id');
            });
        }

        $this->normaliseStatutGlobal();

        Schema::table('paiements', function (Blueprint $table) {
            $table->index('eleve_id');
            $table->index('contribution_id');
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropIndex(['eleve_id']);
            $table->dropIndex(['contribution_id']);
        });

        // Le retrait de `eleves_id` n'est pas réversible en l'état des données ;
        // la colonne récréée ne contient pas les valeurs historiques.
        if (!Schema::hasColumn('paiements', 'eleves_id')) {
            Schema::table('paiements', function (Blueprint $table) {
                $table->foreignId('eleves_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });
        }

        // La normalisation est lossy (minuscules/accentuées perdues) — elle
        // n'est volontairement pas inversée.
    }

    /**
     * Réécrit `statut_global` sur les constantes du modèle, ligne à ligne, en
     * repliant la casse et les accents comme le faisait l'ancien
     * `ComptableController::normaliseStatut()`.
     */
    private function normaliseStatutGlobal(): void
    {
        $rows = DB::table('paiements')
            ->whereNotNull('statut_global')
            ->get(['id', 'statut_global']);

        foreach ($rows as $row) {
            $norm = str_replace('É', 'E', mb_strtoupper((string) $row->statut_global));

            $target = match ($norm) {
                PaiementEleve::PAID     => PaiementEleve::PAID,
                PaiementEleve::PARTIAL  => PaiementEleve::PARTIAL,
                PaiementEleve::PENDING  => PaiementEleve::PENDING,
                default                 => PaiementEleve::PENDING,
            };

            if ($norm !== $target) {
                DB::table('paiements')->where('id', $row->id)->update(['statut_global' => $target]);
            }
        }
    }
};
