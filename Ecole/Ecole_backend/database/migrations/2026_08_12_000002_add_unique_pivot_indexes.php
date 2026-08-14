<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Garantit qu'un couple (X, Y) ne peut apparaître qu'une seule fois dans
     * chaque table pivot : empêche les doublons introduits par double
     * soumission (ou bug applicatif) et sert d'index d'accès.
     *
     * Toutes ces tables sont sans données sensibles (purgées en dev) ; un
     * éventuel doublon en production ferait échouer la migration sur
     * `duplicate entry`. Si c'est le cas : `DELETE d FROM table d JOIN
     * (SELECT MIN(id) id, ... GROUP BY ...) k ON ...` avant de rejouer.
     */
    public function up(): void
    {
        Schema::table('classe_matieres', function (Blueprint $table) {
            $table->unique(['classe_id', 'matiere_id'], 'classe_matieres_unique');
        });

        Schema::table('eleves_matieres', function (Blueprint $table) {
            $table->unique(['eleves_id', 'matieres_id'], 'eleves_matieres_unique');
        });

        Schema::table('sessions_matieres', function (Blueprint $table) {
            $table->unique(['session_id', 'matiere_id'], 'sessions_matieres_unique');
        });

        Schema::table('sessions_candidats', function (Blueprint $table) {
            $table->unique(['session_id', 'eleve_id'], 'sessions_candidats_unique');
        });

        Schema::table('enseignantmp_classe', function (Blueprint $table) {
            $table->unique(['enseignants_id', 'classe_id'], 'enseignantmp_classe_unique');
        });
    }

    public function down(): void
    {
        Schema::table('classe_matieres', function (Blueprint $table) {
            $table->dropUnique('classe_matieres_unique');
        });

        Schema::table('eleves_matieres', function (Blueprint $table) {
            $table->dropUnique('eleves_matieres_unique');
        });

        Schema::table('sessions_matieres', function (Blueprint $table) {
            $table->dropUnique('sessions_matieres_unique');
        });

        Schema::table('sessions_candidats', function (Blueprint $table) {
            $table->dropUnique('sessions_candidats_unique');
        });

        Schema::table('enseignantmp_classe', function (Blueprint $table) {
            $table->dropUnique('enseignantmp_classe_unique');
        });
    }
};
