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
        //
        Schema::create('enseignant_matiere', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enseignants_id')->constrained();
            $table->foreignId('matieres_id')->constrained();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {   
        //
        Schema::dropIfExists('enseignant_matiere');
    }
};
