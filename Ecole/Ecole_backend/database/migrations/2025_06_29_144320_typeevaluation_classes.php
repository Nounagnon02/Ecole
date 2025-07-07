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
        Schema::create('typeevaluation_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('serie_id')->constrained()->onDelete('cascade');
            $table->foreignId('typeevaluation_id')->constrained()->onDelete('cascade');
            $table->foreignId('classe_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['serie_id', 'typeevaluation_id', 'classe_id']);
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
        Schema::dropIfExists('typeevaluation_classes');
    }
};
