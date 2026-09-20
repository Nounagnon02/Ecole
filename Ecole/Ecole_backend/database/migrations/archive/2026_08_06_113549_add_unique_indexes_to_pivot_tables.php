<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // eleves_parents : un parent ne peut être lié qu'une fois au même élève
        if (Schema::hasTable('eleves_parents')) {
            Schema::table('eleves_parents', function (Blueprint $table) {
                $table->unique(['eleve_id', 'parent_id'], 'eleves_parents_eleve_parent_unique');
            });
        }

        // enseignant_matiere : un enseignant ne peut enseigner la même matière
        // dans la même classe/série qu'une seule fois
        if (Schema::hasTable('enseignant_matiere')) {
            Schema::table('enseignant_matiere', function (Blueprint $table) {
                $table->unique(
                    ['enseignant_id', 'matiere_id', 'classe_id', 'serie_id'],
                    'enseignant_matiere_unique'
                );
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('eleves_parents')) {
            Schema::table('eleves_parents', function (Blueprint $table) {
                $table->dropUnique('eleves_parents_eleve_parent_unique');
            });
        }

        if (Schema::hasTable('enseignant_matiere')) {
            Schema::table('enseignant_matiere', function (Blueprint $table) {
                $table->dropUnique('enseignant_matiere_unique');
            });
        }
    }
};