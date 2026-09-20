<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('certificats', function (Blueprint $table) {
            $table->id();
            $table->string('type_certificat');
            $table->foreignId('eleve_id')->constrained('eleves')->onDelete('cascade');
            $table->datetime('date_emission');
            $table->string('numero_certificat')->unique();
            $table->boolean('delivre')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('certificats');
    }
};