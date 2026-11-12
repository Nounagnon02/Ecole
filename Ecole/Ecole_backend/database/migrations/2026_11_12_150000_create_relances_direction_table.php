<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Relances du tableau « À décider » de la direction : une par cible et par
 * jour. La clé unique empêche un double clic de doubler les SMS, quel que soit
 * le cache configuré, et garde la trace de qui a relancé quoi.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('relances_direction', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ecole_id')->constrained('ecoles')->cascadeOnDelete();
            $table->string('type', 20);
            $table->unsignedBigInteger('cible_id');
            $table->date('jour');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('envoyes')->default(0);
            $table->timestamps();
            $table->unique(['ecole_id', 'type', 'cible_id', 'jour'], 'relances_direction_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relances_direction');
    }
};
