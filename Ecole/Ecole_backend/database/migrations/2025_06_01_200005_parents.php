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
        Schema::create('parents', function(Blueprint $table){
        $table->id();
        $table->string('role');
        $table->string('nom');
        $table->string('prenom');
        $table->string('email')->unique();
        $table->string('numero_de_telephone')->unique();
        $table->string('identifiant')->unique();
        $table->string('password1');
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
        Schema::dropIfExists('parents');
    }
};
