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
        Schema::create("transaction_paiements", function (Blueprint $table) {
            $table->increments("id");
            $table->foreignId("id_paiement_eleve")->constrained("paiements_eleves");
            $table->enum("tranche", ["PREMIERE", "DEUXIEME", "TROISIEME", "INTEGRAL"]);
            $table->integer("montant_paye");
            $table->date("date_paiement");
            $table->enum("statut", ["PAYE", "ANNULE"])->default("PAYE");
            $table->enum("methode_paiement", ["ESPECES", "CHEQUE", "VIREMENT", "MOBILE_MONEY"]);
            $table->string("reference_transaction")->nullable();
            $table->string("recu_par"); // Nom du responsable qui a reçu le paiement
            $table->text("observation")->nullable();
            $table->string("cinetpay_transaction_id")->nullable();
            $table->string("cinetpay_payment_url")->nullable();
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
        Schema::dropIfExists("transactions_paiement");
    }
};
