<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('facultes', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('sigle', 10);
            $table->foreignId('universite_id')->constrained('universites')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facultes');
    }
};
