<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `payments.transaction_id` a déjà cette garde (contrainte UNIQUE + retour
     * anticipé applicatif) ; ce second chemin de paiement (échéances élèves)
     * n'en avait aucune — écart réel trouvé en vérifiant l'idempotence des
     * paiements pendant l'audit de sécurité.
     */
    public function up(): void
    {
        // NULL ne collisionne jamais avec un autre NULL sous un index UNIQUE
        // (MySQL et SQLite) : seules les vraies valeurs dupliquées doivent
        // être traitées avant de poser la contrainte, sinon la migration
        // échoue sur toute base qui en porte déjà (celle-ci est vide
        // aujourd'hui, mais rien ne garantit qu'un autre environnement le
        // soit aussi). On garde la ligne la plus récente par référence et on
        // met les autres à NULL plutôt que de les supprimer : aucune perte
        // d'historique.
        $duplicates = DB::table('transaction_paiements')
            ->select('reference_transaction')
            ->whereNotNull('reference_transaction')
            ->groupBy('reference_transaction')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('reference_transaction');

        foreach ($duplicates as $reference) {
            $ids = DB::table('transaction_paiements')
                ->where('reference_transaction', $reference)
                ->orderByDesc('created_at')
                ->pluck('id');

            DB::table('transaction_paiements')
                ->whereIn('id', $ids->slice(1)->all())
                ->update(['reference_transaction' => null]);
        }

        Schema::table('transaction_paiements', function (Blueprint $table) {
            $table->unique('reference_transaction');
        });
    }

    public function down(): void
    {
        Schema::table('transaction_paiements', function (Blueprint $table) {
            $table->dropUnique(['reference_transaction']);
        });
    }
};
