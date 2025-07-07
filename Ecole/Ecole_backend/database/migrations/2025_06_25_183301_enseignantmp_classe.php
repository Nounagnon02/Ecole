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
        Schema::create('enseignantmp_classe', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enseignants_id')->constrained();
            $table->foreignId('classe_id')->constrained();
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
        Schema::dropIfExists('enseignantmp_classe');
    }
};
