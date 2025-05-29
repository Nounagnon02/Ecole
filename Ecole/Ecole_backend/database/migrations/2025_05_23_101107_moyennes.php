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
        Schema::create('moyennes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('eleves_id'); // Candidat associé
            $table->unsignedBigInteger('sessions_id');  // Session associée
            $table->decimal('moyenne', 5, 2);  // Moyenne du candidat
            $table->timestamps();

            // Clés étrangères
            $table->foreign('eleves_id')->references('id')->on('eleves')->onDelete('cascade');
            $table->foreign('sessions_id')->references('id')->on('sessions')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('moyennes');
    }
};
