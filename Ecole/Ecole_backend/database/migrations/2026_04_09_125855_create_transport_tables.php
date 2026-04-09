<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Véhicules de transport scolaire
        Schema::create('vehicules', function (Blueprint $table) {
            $table->id();
            $table->string('immatriculation')->unique();
            $table->string('modele');
            $table->integer('capacite');
            $table->string('chauffeur_nom')->nullable();
            $table->string('chauffeur_tel')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Trajets et zones de transport
        Schema::create('trajets_transport', function (Blueprint $table) {
            $table->id();
            $table->string('nom_trajet'); // ex: Cotonou - Calavi
            $table->text('zones'); // Liste des arrêts
            $table->decimal('prix_mensuel', 12, 2);
            $table->timestamps();
        });

        // Abonnements des élèves
        Schema::create('abonnements_transport', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->onDelete('cascade');
            $table->foreignId('trajet_id')->constrained('trajets_transport')->onDelete('cascade');
            $table->foreignId('vehicule_id')->nullable()->constrained('vehicules')->onDelete('set null');
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->enum('statut', ['actif', 'suspendu', 'termine'])->default('actif');
            $table->decimal('montant_paye', 12, 2)->default(0); // Gestion séparée des frais
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('abonnements_transport');
        Schema::dropIfExists('trajets_transport');
        Schema::dropIfExists('vehicules');
    }
};
