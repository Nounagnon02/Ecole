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
        //
        Schema::create('enseignants', function(Blueprint $table){
        $table->id();
        $table->string('role');
        $table->string('nom');
        $table->string('prenom');
        $table->string('email')->unique();
        $table->string('numero_de_telephone')->unique();
        $table->string('identifiant')->unique();
        $table->foreignId('class_id');
        $table->string('password1');
        $table->foreignId('matiere_id');
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
        //
        Schema::dropIfExists('enseignants');
    }
};