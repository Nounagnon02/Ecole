<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('etudiant_id')->constrained('etudiants')->onDelete('cascade');
            $table->foreignId('annee_academique_id')->constrained('annee_academiques')->onDelete('cascade');
            $table->date('date_inscription');
            $table->decimal('montant_frais', 10, 2);
            $table->enum('statut', ['En cours', 'Validée', 'Annulée']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inscriptions');
    }

};
