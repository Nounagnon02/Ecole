<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('paiements', function (Blueprint $table) {
            // Vérifier et ajouter les colonnes manquantes
            if (!Schema::hasColumn('paiements', 'eleve_id')) {
                $table->unsignedBigInteger('eleve_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('paiements', 'contribution_id')) {
                $table->unsignedBigInteger('contribution_id')->nullable()->after('eleve_id');
            }
            if (!Schema::hasColumn('paiements', 'montant_total')) {
                $table->decimal('montant_total', 10, 2)->default(0)->after('contribution_id');
            }
            if (!Schema::hasColumn('paiements', 'montant_paye')) {
                $table->decimal('montant_paye', 10, 2)->default(0)->after('montant_total');
            }
            if (!Schema::hasColumn('paiements', 'montant_restant')) {
                $table->decimal('montant_restant', 10, 2)->default(0)->after('montant_paye');
            }
            if (!Schema::hasColumn('paiements', 'statut_global')) {
                $table->string('statut_global')->default('EN_ATTENTE')->after('montant_restant');
            }
        });
    }

    public function down()
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropColumn(['eleve_id', 'contribution_id', 'montant_total', 'montant_paye', 'montant_restant', 'statut_global']);
        });
    }
};
