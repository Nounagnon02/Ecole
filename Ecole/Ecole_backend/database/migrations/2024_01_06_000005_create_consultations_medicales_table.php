<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('consultations_medicales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->onDelete('cascade');
            $table->string('motif');
            $table->text('diagnostic');
            $table->datetime('date');
            $table->text('traitement')->nullable();
            $table->boolean('urgence')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('consultations_medicales');
    }
};