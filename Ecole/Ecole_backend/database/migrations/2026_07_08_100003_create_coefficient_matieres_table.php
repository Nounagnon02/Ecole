<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coefficient_matieres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('matiere_id')->constrained('matieres')->onDelete('cascade');
            $table->foreignId('classe_id')->nullable()->constrained('classes')->onDelete('cascade');
            $table->foreignId('serie_id')->nullable()->constrained('series')->onDelete('cascade');
            $table->decimal('coefficient', 5, 2)->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coefficient_matieres');
    }
};
