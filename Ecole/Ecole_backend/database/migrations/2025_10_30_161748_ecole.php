<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ecoles', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('email')->unique();
            $table->string('adresse');
            $table->string('phone')->nullable();
            $table->string('logo')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('active'); // active|inactive|archived
            $table->string('pays')->nullable();
            $table->string('ville')->nullable();
            $table->string('code_postal')->nullable();

            // Optionnel: multi-tenant (domaine/sous-domaine)
            $table->string('slug')->nullable()->unique();
            $table->string('domain')->nullable()->unique();

            $table->softDeletes();
            $table->timestamps();

            // Index utiles pour la recherche
            $table->index(['status']);
            $table->index(['ville', 'pays']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ecoles');
    }
};
