<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Aligner les dernières clés étrangères `ecole_id` sur RESTRICT.
 *
 * `2026_..._restrict_school_deletion` avait posé RESTRICT sur 55 tables : une
 * école ne se supprime pas en dur, elle se désactive (cf.
 * `SchoolDeactivationTest`, « deleting a school through the api deactivates it
 * and keeps its data »). 22 tables avaient été oubliées — pour l'essentiel le
 * module universitaire, arrivé après — et cascadaient toujours.
 *
 * Le garde-fou censé l'interdire, `no_table_cascades_on_the_school_foreign_key`,
 * passait au vert : il s'appuie sur `Schema::getForeignKeys()`, qui ne rapporte
 * pas les actions de suppression sur SQLite. Le test ne vérifiait donc rien, et
 * c'est le passage de la CI sur MySQL qui l'a montré (cf. audit P2.1).
 *
 * Migration limitée à MySQL : SQLite ne sait pas modifier une contrainte sans
 * reconstruire la table, et n'applique de toute façon pas les clés étrangères
 * par défaut.
 */
return new class extends Migration
{
    /** Tables dont `ecole_id` cascadait encore. */
    private const TABLES = [
        'abonnements_transport', 'annee_academiques', 'cahier_de_textes',
        'coefficient_matieres', 'departements', 'diplomes', 'etudiants',
        'evenements', 'facultes', 'fiches_paie', 'filieres', 'inscriptions',
        'payment_histories', 'personnels', 'semestres', 'trajets_transport',
        'uni_enseignants', 'uni_matieres', 'uni_notes', 'universites',
        'utilisateurs', 'vehicules',
    ];

    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'ecole_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['ecole_id']);
                $blueprint->foreign('ecole_id')
                    ->references('id')->on('ecoles')
                    ->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        foreach (self::TABLES as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'ecole_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['ecole_id']);
                $blueprint->foreign('ecole_id')
                    ->references('id')->on('ecoles')
                    ->cascadeOnDelete();
            });
        }
    }
};
