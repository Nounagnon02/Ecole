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
        Schema::table('matieres', function (Blueprint $table) {
            $table->integer('volume_horaire')->nullable();
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->integer('capacite_max')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matieres', function (Blueprint $table) {
            $table->dropColumn('volume_horaire');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn('capacite_max');
        });
    }
};
