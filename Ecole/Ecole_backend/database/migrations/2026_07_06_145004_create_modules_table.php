<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name'); // Core, Academique, Paiements, Messagerie, etc.
            $table->text('description')->nullable();
            $table->boolean('is_core')->default(false); // Modules obligatoires
            $table->boolean('is_active')->default(true);
            $table->json('required_roles')->nullable(); // Roles needed to access
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};
