<?php

namespace App\Support;

use App\Models\PaiementEleve;
use App\Models\Payment;
use App\Models\TransactionPaiement;
use Carbon\CarbonInterface;

/**
 * Ce qui a réellement été encaissé sur une période, pour tous les tableaux
 * de bord (directeur, comptable) — une seule définition (R-41, 16/11/2026).
 *
 * Trois chemins d'encaissement existent :
 *   - « Encaisser » une échéance crée un `TransactionPaiement` approuvé ;
 *   - un paiement en ligne confirmé (`Payment` completed) crédite l'échéance
 *     sans créer de transaction ;
 *   - « Nouveau paiement » (`storePaiement`) crée une échéance déjà payée,
 *     sans transaction ni paiement en ligne.
 *
 * Le troisième n'est visible que par le `montant_paye` de l'échéance : on en
 * retient la part que les deux premiers n'expliquent pas, datée par
 * `date_paiement`. Un versement n'est ainsi jamais compté deux fois.
 */
final class Encaissements
{
    public static function entre(CarbonInterface $debut, CarbonInterface $fin): float
    {
        $enCaisse = (float) TransactionPaiement::where('statut', TransactionPaiement::APPROUVE)
            ->whereBetween('date_paiement', [$debut, $fin])
            ->sum('montant_paye');
        $enLigne = (float) Payment::where('status', 'completed')
            ->whereBetween('paid_at', [$debut, $fin])
            ->sum('amount');

        return $enCaisse + $enLigne + self::saisisDirectement($debut, $fin);
    }

    /** Part du payé des échéances de la période qu'aucune transaction ni aucun paiement en ligne n'explique. */
    private static function saisisDirectement(CarbonInterface $debut, CarbonInterface $fin): float
    {
        $echeances = PaiementEleve::whereBetween('date_paiement', [$debut, $fin])
            ->where('montant_paye', '>', 0)
            ->withSum(['transactions as deja_en_caisse' => fn ($q) => $q->where('statut', TransactionPaiement::APPROUVE)], 'montant_paye')
            ->get(['id', 'montant_paye']);

        if ($echeances->isEmpty()) {
            return 0.0;
        }

        $enLigne = Payment::where('status', 'completed')
            ->whereIn('paiement_eleve_id', $echeances->pluck('id'))
            ->groupBy('paiement_eleve_id')
            ->selectRaw('paiement_eleve_id, SUM(amount) as total')
            ->pluck('total', 'paiement_eleve_id');

        return (float) $echeances->sum(fn ($e) => max(0.0,
            (float) $e->montant_paye - (float) $e->deja_en_caisse - (float) ($enLigne[$e->id] ?? 0)));
    }
}
