<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Anti-doublon DB pour les notes, compatible avec la règle métier
     * `validateNoteByType` (NotesController) : jusqu'à 4 « Interrogation » par
     * (élève, matière, période) mais 1 seule pour les autres types.
     *
     * Un index unique strict sur `type_evaluation`/`periode` casserait les
     * 4 interrogations ; en incluant `date_evaluation` et `annee_scolaire`,
     * seules les lignes strictement identiques (double soumission) sont
     * bloquées, quel que soit le type.
     */
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->unique(
                ['eleve_id', 'classe_id', 'matiere_id', 'type_evaluation', 'periode', 'date_evaluation', 'annee_scolaire'],
                'notes_unicite_note'
            );
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropUnique('notes_unicite_note');
        });
    }
};
