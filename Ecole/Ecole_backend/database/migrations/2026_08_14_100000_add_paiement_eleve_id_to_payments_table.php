<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Relie le journal de passage (`payments`) à la vérité comptable (`paiements`).
 *
 * Jusqu'ici un paiement encaissé via la passerelle n'était jamais rapproché
 * des échéances : `PaymentController` créditait la table `payments`, mais
 * `montant_paye`/`montant_restant`/`statut_global` de `paiements` restaient
 * inchangés. Le comptable pouvait encaisser en ligne un montant qui ne
 * figurait jamais dans ses recettes (`finances()`).
 *
 * `paiement_eleve_id` désigne l'échéance concernée (nullable : les types
 * cantine/transport/autre n'ont pas d'échéance dans `paiements`). Suppression
 * de l'échéance → lien mis à null, le journal (fiduciaire) est conservé.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'paiement_eleve_id')) {
                $table->foreignId('paiement_eleve_id')
                    ->nullable()
                    ->after('eleve_id')
                    ->constrained('paiements')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'paiement_eleve_id')) {
                $table->dropConstrainedForeignId('paiement_eleve_id');
            }
        });
    }
};
