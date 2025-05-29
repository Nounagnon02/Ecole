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
        Schema::create('coefficients', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('matieres_id'); // Référence à la matière
            $table->string('serie'); // Série du candidat (ex. "S", "L", etc.)
            $table->integer('coefficient'); // Coefficient de la matière pour cette série
            $table->timestamps();

            // Clé étrangère pour assurer l'intégrité des données
            $table->foreign('matieres_id')->references('id')->on('matieres')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('coefficients');
    }
};
