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
        $table->string('nom_de_eleve');
        $table->string('prenoms_eleve');
        $table->string('numero_de_telephone');
        $table->string('identifiant')->unique(); // Ajoute cette ligne
        $table->string('password1');
        $table->string('numero_matricule')->unique();;
        $table->foreignId('class_id');
        $table->foreignId('serie_id');
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
