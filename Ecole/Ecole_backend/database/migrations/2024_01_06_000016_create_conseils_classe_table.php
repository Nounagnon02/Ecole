<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('conseils_classe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classe_id')->constrained('classes')->onDelete('cascade');
            $table->date('date');
            $table->string('trimestre');
            $table->json('participants')->nullable();
            $table->json('decisions')->nullable();
            $table->enum('statut', ['programmé', 'en_cours', 'terminé'])->default('programmé');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('conseils_classe');
    }
};