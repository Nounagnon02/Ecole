<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devoirs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enseignant_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('matiere_id')->nullable()->constrained('matieres')->nullOnDelete();
            $table->string('titre');
            $table->text('description')->nullable();
            $table->dateTime('date_limite')->nullable();
            $table->string('fichier')->nullable();
            $table->string('type')->default('devoir'); // devoir, exercice, projet
            $table->boolean('publie')->default(false);
            $table->foreignId('ecole_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('devoir_eleve', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devoir_id')->constrained()->cascadeOnDelete();
            $table->foreignId('eleve_id')->constrained('users')->cascadeOnDelete();
            $table->text('reponse')->nullable();
            $table->string('fichier')->nullable();
            $table->boolean('rendu')->default(false);
            $table->dateTime('date_remise')->nullable();
            $table->decimal('note', 5, 2)->nullable();
            $table->text('commentaire')->nullable();
            $table->timestamps();

            $table->unique(['devoir_id', 'eleve_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devoir_eleve');
        Schema::dropIfExists('devoirs');
    }
};
