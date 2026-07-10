<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_paiement_eleve')->constrained('paiements')->onDelete('cascade');
            $table->string('tranche')->nullable();
            $table->decimal('montant_paye', 12, 2)->default(0);
            $table->dateTime('date_paiement')->nullable();
            $table->string('statut')->default('EN_ATTENTE');
            $table->string('methode_paiement')->nullable();
            $table->string('reference_transaction')->nullable();
            $table->string('recu_par')->nullable();
            $table->text('observation')->nullable();
            $table->foreignId('ecole_id')->constrained('ecoles')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_paiements');
    }
};
