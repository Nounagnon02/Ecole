<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Rattache au tenant les tables oubliées par 2025_11_01_041712_ecole_add_id.
 *
 * Sans colonne `ecole_id`, ces tables ne peuvent pas être filtrées par le
 * global scope BelongsToEcole : elles formaient un espace de données global
 * partagé par tous les établissements. Le module universitaire entier était
 * concerné — un recteur lisait les étudiants, notes et diplômes des autres
 * universités (cf. audit S6).
 */
return new class extends Migration
{
    /** Tables métier généralistes. */
    private array $tables = [
        'cahier_de_textes',
        'evenements',
        'payment_histories',
        'vehicules',
        'trajets_transport',
        'abonnements_transport',
        'coefficient_matieres',
        'fiches_paie',
        'depenses',
        'exercices',
    ];

    /** Tables du module universitaire. */
    private array $tablesUniversite = [
        'universites',
        'facultes',
        'departements',
        'filieres',
        'etudiants',
        'inscriptions',
        'semestres',
        'diplomes',
        'annee_academiques',
        'uni_enseignants',
        'uni_matieres',
        'uni_notes',
        'uni_paiements',
        'personnels',
        'utilisateurs',
    ];

    public function up(): void
    {
        $ajoutees = [];

        foreach ([...$this->tables, ...$this->tablesUniversite] as $table) {
            if (!Schema::hasTable($table) || Schema::hasColumn($table, 'ecole_id')) {
                continue;
            }

            // Trois opérations séparées : SQLite reconstruit la table pour
            // ajouter une contrainte de clé étrangère, et mélanger l'ajout de
            // colonne, la contrainte et l'index dans un même Blueprint rend le
            // résultat dépendant du driver.
            Schema::table($table, function (Blueprint $blueprint) {
                // Nullable : la colonne est ajoutée sur des tables qui
                // contiennent peut-être déjà des données.
                $blueprint->foreignId('ecole_id')->nullable();
            });

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->index('ecole_id', $table . '_ecole_id_index');
            });

            // La contrainte n'est posée que là où l'ALTER la supporte
            // proprement ; sur SQLite (tests) la colonne et l'index suffisent.
            if (Schema::getConnection()->getDriverName() !== 'sqlite') {
                Schema::table($table, function (Blueprint $blueprint) {
                    $blueprint->foreign('ecole_id')
                        ->references('id')->on('ecoles')
                        ->cascadeOnDelete();
                });
            }

            $ajoutees[] = $table;
        }

        $this->backfill($ajoutees);
    }

    /**
     * Rattache les lignes existantes à un établissement.
     *
     * Indispensable : le global scope BelongsToEcole filtre sur `ecole_id = X`,
     * et NULL ne satisfait jamais cette comparaison. Sans backfill, les données
     * déjà en base deviendraient invisibles dès l'ajout de la colonne.
     *
     * Le rattachement n'est automatisable que s'il n'existe qu'un seul
     * établissement — sinon l'affectation est un choix métier.
     */
    private function backfill(array $tables): void
    {
        if (empty($tables) || !Schema::hasTable('ecoles')) {
            return;
        }

        // `ecoles` porte SoftDeletes : une école supprimée ne doit pas compter,
        // sinon le cas courant (un seul établissement active) serait bloqué.
        $ecoles = DB::table('ecoles')
            ->when(
                Schema::hasColumn('ecoles', 'deleted_at'),
                fn($q) => $q->whereNull('deleted_at')
            )
            ->pluck('id');

        if ($ecoles->count() !== 1) {
            $restantes = [];

            foreach ($tables as $table) {
                $n = DB::table($table)->whereNull('ecole_id')->count();
                if ($n > 0) {
                    $restantes[$table] = $n;
                }
            }

            if (!empty($restantes)) {
                $message = sprintf(
                    'Migration ecole_id : %d ligne(s) non rattachée(s) sur %d table(s) — '
                    . '%d école(s) active(s) trouvée(s), le rattachement est un choix métier. '
                    . 'Ces lignes restent invisibles derrière le scope tenant jusqu\'à '
                    . 'affectation manuelle de leur ecole_id.',
                    array_sum($restantes),
                    count($restantes),
                    $ecoles->count()
                );

                Log::warning($message, ['tables' => $restantes]);

                // Un avertissement en log passe inaperçu pendant une migration
                // interactive : on le remonte aussi sur la sortie console.
                if (app()->runningInConsole()) {
                    fwrite(STDERR, PHP_EOL . '  ⚠  ' . $message . PHP_EOL);
                    foreach ($restantes as $table => $n) {
                        fwrite(STDERR, sprintf('     - %s : %d ligne(s)%s', $table, $n, PHP_EOL));
                    }
                    fwrite(STDERR, PHP_EOL);
                }
            }

            return;
        }

        $ecoleId = $ecoles->first();

        foreach ($tables as $table) {
            DB::table($table)->whereNull('ecole_id')->update(['ecole_id' => $ecoleId]);
        }
    }

    public function down(): void
    {
        foreach ([...$this->tables, ...$this->tablesUniversite] as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'ecole_id')) {
                continue;
            }

            // La contrainte n'existe que sur les drivers où up() l'a posée.
            if (Schema::getConnection()->getDriverName() !== 'sqlite') {
                Schema::table($table, function (Blueprint $blueprint) use ($table) {
                    $blueprint->dropForeign($table . '_ecole_id_foreign');
                });
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                $blueprint->dropIndex($table . '_ecole_id_index');
            });

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropColumn('ecole_id');
            });
        }
    }
};
