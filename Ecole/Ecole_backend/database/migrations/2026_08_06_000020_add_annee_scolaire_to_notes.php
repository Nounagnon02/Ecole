<?php

use App\Support\AnneeScolaire;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute la dimension « année scolaire » aux notes.
     *
     * Sans elle, deux années ne peuvent pas cohabiter : les notes d'un redoublant
     * ou d'une nouvelle promotion se mélangeraient avec celles de l'année
     * précédente dès le calcul du bulletin. Les lignes existantes sont rattachées
     * à l'année scolaire en cours au moment de la migration.
     */
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->string('annee_scolaire')->nullable()->after('periode');
        });

        DB::table('notes')->whereNull('annee_scolaire')->update([
            'annee_scolaire' => AnneeScolaire::courante(),
        ]);

        Schema::table('notes', function (Blueprint $table) {
            $table->index(['classe_id', 'periode', 'annee_scolaire'], 'notes_classe_periode_annee_index');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex('notes_classe_periode_annee_index');
            $table->dropColumn('annee_scolaire');
        });
    }
};
