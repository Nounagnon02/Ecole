<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('series_matieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('serie_id')->constrained()->onDelete('cascade');
            $table->foreignId('matiere_id')->constrained()->onDelete('cascade');
            $table->float('coefficient')->default(1);
            $table->timestamps();

            $table->unique(['serie_id', 'matiere_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('series_matieres');
    }
};