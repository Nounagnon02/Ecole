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
        Schema::create("contributions", function (Blueprint $table) {
            $table->increments("id");
            $table->integer("montant");
            $table->date("date_fin_premiere_tranche");
            $table->integer("montant_premiere_tranche");
            $table->date("date_fin_deuxieme_tranche");
            $table->integer("montant_deuxieme_tranche");
            $table->date("date_fin_troisieme_tranche");
            $table->integer("montant_troisieme_tranche");
            $table->foreignId("id_classe")->constrained("classes");
            $table->foreignId("id_serie")->constrained("series");
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
        Schema::dropIfExists("contributions");
    }
};
