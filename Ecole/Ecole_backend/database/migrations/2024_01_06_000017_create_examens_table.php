<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('examens', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('type');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->json('classes')->nullable();
            $table->json('matieres')->nullable();
            $table->enum('statut', ['programmé', 'en_cours', 'terminé'])->default('programmé');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('examens');
    }
};