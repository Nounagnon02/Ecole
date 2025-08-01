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
    
    Schema::create('enseignants_martenel_primaire', function (Blueprint $table) {
        $table->id();
        $table->string('role');
        $table->string('nom');
        $table->string('prenom');  // Changé de 'prenoms' à 'prenom'
        $table->string('numero_de_telephone');  // Changé de bigInteger à string
        $table->string('identifiant')->unique();
        $table->string('password1');
        $table->string('email')->unique();
        $table->foreignId('class_id')->constrained('classes');
        $table->timestamps();
    });
    }

    

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('enseignants_martenel_primaire');
    }
};
