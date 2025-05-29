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
        //
    
    Schema::create('enseignants_M_P', function (Blueprint $table) {
        $table->id();
        $table->string('role');
        $table->string('nom_de_eleve');
        $table->string('prenoms_eleve');
        $table->bigInteger('numero_de_telephone');
        $table->string('identifiant')->unique(); // <-- Ajoute cette ligne
        $table->string('password1');
        $table->string('email');
        $table->foreignId('class_id');
        $table->foreignId('serie_id');
        $table->timestamps();
    });
    }

    

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('enseignants_M_P');
    }
};
