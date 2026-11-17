<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Clé envoyée par le guichet à chaque encaissement (audit du 14/11,
     * N-01) : un même envoi rejoué — double clic, deux onglets, réseau qui
     * renvoie — ne crée qu'un versement. Nullable : les versements anciens
     * et ceux des autres chemins n'en ont pas, et NULL ne collisionne pas.
     */
    public function up(): void
    {
        Schema::table('transaction_paiements', function (Blueprint $table) {
            $table->string('cle_idempotence', 64)->nullable()->unique()->after('reference_transaction');
        });
    }

    public function down(): void
    {
        Schema::table('transaction_paiements', function (Blueprint $table) {
            $table->dropUnique(['cle_idempotence']);
            $table->dropColumn('cle_idempotence');
        });
    }
};
