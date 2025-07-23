<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
    
    Schema::create('eleves', function (Blueprint $table) {
        $table->id();
        $table->string('role');
        $table->string('nom');           
        $table->string('prenom'); 
        $table->date('date_naissance');//pas encore migrate
        $table->string('lieu_naissance');//pas encore migrate
        $table->string('sexe');      // 'M' pour masculin, 'F' pour féminin , pas encore migrate
        $table->string('numero_de_telephone');
        $table->string('identifiant')->unique();
        $table->string('password1');
        $table->string('numero_matricule')->unique();
        $table->foreignId('class_id')->constrained('classes');
        $table->foreignId('serie_id')->constrained('series');
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('eleves');
    }
};
