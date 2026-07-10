<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('statut_tranches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_paiement_eleve')->constrained('paiements')->onDelete('cascade');
            $table->string('tranche')->nullable();
            $table->string('statut')->default('EN_ATTENTE');
            $table->dateTime('date_limite')->nullable();
            $table->decimal('montant_tranche', 12, 2)->default(0);
            $table->dateTime('date_paiement')->nullable();
            $table->foreignId('ecole_id')->constrained('ecoles')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('statut_tranches');
    }
};
