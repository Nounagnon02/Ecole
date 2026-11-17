<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `initializePayment()` recevait l'URL de paiement FedaPay dans sa réponse
 * mais ne la gardait nulle part -- un doublon rapide de la requête (double
 * clic, retry réseau côté client) ne pouvait donc être servi qu'en rouvrant
 * une deuxième transaction chez FedaPay, faute de pouvoir retrouver la
 * première URL. La persister permet de rendre l'ouverture d'un paiement
 * idempotente côté application (cf. PaymentController::initializePayment).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('checkout_url')->nullable()->after('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('checkout_url');
        });
    }
};
