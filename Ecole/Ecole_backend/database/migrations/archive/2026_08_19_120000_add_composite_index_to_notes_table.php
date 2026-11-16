<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            // Drop the existing partial composite index (eleve_id, matiere_id, periode)
            // and replace it with a wider one that also covers type_evaluation queries.
            $table->dropIndex('notes_eleve_id_matiere_id_periode_index');

            $table->index(['eleve_id', 'matiere_id', 'periode', 'type_evaluation']);
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropIndex(['eleve_id', 'matiere_id', 'periode', 'type_evaluation']);

            $table->index(['eleve_id', 'matiere_id', 'periode']);
        });
    }
};
