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
        // Personnel de l'école (Administratif, Entretien, Securité...)
        Schema::create('personnel', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('poste');
            $table->string('type_contrat')->default('CDI');
            $table->decimal('salaire_base', 12, 2)->default(0);
            $table->date('date_embauche');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Fiches de Paie
        Schema::create('fiches_paie', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Enseignant ou Personnel
            $table->string('periode'); // ex: 04-2026
            $table->decimal('salaire_brut', 12, 2);
            $table->decimal('primes', 12, 2)->default(0);
            $table->decimal('retenues', 12, 2)->default(0);
            $table->decimal('salaire_net', 12, 2);
            $table->string('statut')->default('EN_ATTENTE'); // EN_ATTENTE, PAYE
            $table->date('date_paiement')->nullable();
            $table->timestamps();
        });

        // Dépenses de l'école (Loyer, Electricité, Fournitures...)
        Schema::create('depenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ecole_id')->constrained('ecoles')->onDelete('cascade');
            $table->string('categorie'); // Loyer, Factures, Maintenance, etc.
            $table->string('description');
            $table->decimal('montant', 12, 2);
            $table->date('date_depense');
            $table->string('justificatif_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('depenses');
        Schema::dropIfExists('fiches_paie');
        Schema::dropIfExists('personnel');
    }
};
