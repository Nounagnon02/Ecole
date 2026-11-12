<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La salle est facultative à la saisie (`nullable` dans la validation), mais la
 * colonne n'acceptait pas l'absence de valeur : un cours sans salle répondait
 * 500. Beaucoup de classes n'ont qu'une salle attitrée, qu'on ne répète pas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emplois_du_temps', function (Blueprint $table) {
            $table->string('salle', 191)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('emplois_du_temps', function (Blueprint $table) {
            $table->string('salle', 191)->nullable(false)->default('')->change();
        });
    }
};
