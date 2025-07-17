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
        Schema::create("paiement_eleves", function (Blueprint $table) {
            $table->increments("id");
            $table->foreignId("id_eleve")->constrained("eleves");
            $table->foreignId("id_contribution")->constrained("contributions");
            $table->enum("mode_paiement", ["INTEGRAL", "TRANCHE"])->default("TRANCHE");
            $table->integer("montant_total_paye")->default(0);
            $table->integer("montant_restant");
            $table->enum("statut_global", ["EN_ATTENTE", "EN_COURS", "TERMINE"])->default("EN_ATTENTE");
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
        Schema::dropIfExists("paiement_eleves");
    }
};
