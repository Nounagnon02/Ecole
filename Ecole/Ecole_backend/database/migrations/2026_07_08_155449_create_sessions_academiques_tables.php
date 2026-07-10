<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Table des sessions académiques (examen, concours, etc.)
        Schema::create('sessions_academiques', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('statut')->default('planifiee'); // planifiee, en_cours, terminee
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->foreignId('ecole_id')->nullable()->constrained('ecoles')->onDelete('cascade');
            $table->timestamps();
        });

        // Pivot session ↔ matiere
        Schema::create('sessions_matieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sessions_academiques')->onDelete('cascade');
            $table->foreignId('matiere_id')->constrained('matieres')->onDelete('cascade');
            $table->timestamps();
        });

        // Pivot session ↔ eleve (candidats)
        Schema::create('sessions_candidats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('sessions_academiques')->onDelete('cascade');
            $table->foreignId('eleve_id')->constrained('eleves')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions_candidats');
        Schema::dropIfExists('sessions_matieres');
        Schema::dropIfExists('sessions_academiques');
    }
};
