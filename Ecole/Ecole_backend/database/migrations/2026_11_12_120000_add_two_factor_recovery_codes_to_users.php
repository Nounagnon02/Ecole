<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Codes de secours de la double authentification : une personne qui perd son
 * téléphone n'avait aucun moyen de se reconnecter. Chaque code est stocké
 * haché et ne sert qu'une fois. Table à part plutôt qu'une colonne de
 * `users` : un utilisateur sérialisé n'emporte jamais ses codes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('codes_secours_2fa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('hachage');
            $table->timestamps();
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('codes_secours_2fa');
    }
};
