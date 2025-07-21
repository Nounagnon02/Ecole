<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds EN_ATTENTE to statut enum in transaction_paiements.
     *
     * @return void
     */
    public function up()
    {
        // Alter the enum to include EN_ATTENTE
        DB::statement("ALTER TABLE `transaction_paiements` CHANGE `statut` `statut` ENUM('EN_ATTENTE','PAYE','ANNULE') NOT NULL DEFAULT 'EN_ATTENTE'");
    }

    /**
     * Reverse the migrations.
     * Reverts statut enum back to ['PAYE','ANNULE'] with default PAYE.
     *
     * @return void
     */
    public function down()
    {
        DB::statement("ALTER TABLE `transaction_paiements` CHANGE `statut` `statut` ENUM('PAYE','ANNULE') NOT NULL DEFAULT 'PAYE'");
    }
};
