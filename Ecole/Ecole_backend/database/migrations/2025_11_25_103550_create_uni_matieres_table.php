<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uni_matieres', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20);
            $table->string('intitule');
            $table->integer('credit')->nullable();
            $table->foreignId('enseignant_id')->constrained('uni_enseignants')->onDelete('cascade');
            $table->foreignId('semestre_id')->constrained('semestres')->onDelete('cascade');
            $table->foreignId('filiere_id')->constrained('filieres')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uni_matieres');
    }
};
