<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registre du courrier du secrétariat : arrivée et départ.
 *
 * Les routes existaient (`/secretaire/courriers`) mais la liste renvoyait
 * toujours une liste vide et l'enregistrement répondait 501 : il n'y avait
 * nulle part où ranger un courrier.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courriers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ecole_id')->nullable()->constrained('ecoles')->restrictOnDelete();
            $table->enum('type', ['entrant', 'sortant']);
            $table->string('reference', 50);
            $table->string('expediteur');
            $table->string('destinataire');
            $table->string('objet');
            $table->date('date_reception');
            $table->text('observation')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['ecole_id', 'reference']);
            $table->index(['ecole_id', 'date_reception']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courriers');
    }
};
