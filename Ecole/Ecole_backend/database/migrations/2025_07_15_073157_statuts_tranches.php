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
        Schema::create("statuts_tranches", function (Blueprint $table) {
            $table->increments("id");
            $table->foreignId("id_paiement_eleve")->constrained("paiements_eleves");
            $table->enum("tranche", ["PREMIERE", "DEUXIEME", "TROISIEME"]);
            $table->enum("statut", ["EN_ATTENTE", "PAYE", "RETARD"])->default("EN_ATTENTE");
            $table->date("date_limite");
            $table->integer("montant_tranche");
            $table->date("date_paiement")->nullable();
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
        Schema::dropIfExists("statuts_tranches");
    }
};
