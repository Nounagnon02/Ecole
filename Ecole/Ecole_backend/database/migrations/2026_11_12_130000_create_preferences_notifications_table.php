<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Ce que chaque parent veut recevoir par SMS, et dans quelle langue (lot 7.2). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('preferences_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('absences')->default(true);
            $table->boolean('notes')->default(true);
            $table->boolean('echeances')->default(true);
            $table->boolean('recus')->default(true);
            $table->boolean('convocations')->default(true);
            $table->string('langue', 5)->default('fr');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preferences_notifications');
    }
};
