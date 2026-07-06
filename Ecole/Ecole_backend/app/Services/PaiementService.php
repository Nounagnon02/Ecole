<?php

namespace App\Services;

use App\Models\Classe;
use App\Models\Paiement;
use Illuminate\Support\Facades\DB;

/**
 * PaiementService — Gestion des paiements et finances
 */
class PaiementService extends BaseService
{
    protected function model(): string
    {
        return Paiement::class;
    }

    protected function creationRules(): array
    {
        return [
            'eleve_id' => 'required|exists:eleves,id',
            'montant' => 'required|numeric|min:0',
            'type' => 'required|in:frais_scolarite,inscription,tenue,transport,autre',
            'mode_paiement' => 'required|in:espece,cheque,virement,mobile_money,carte',
            'reference' => 'nullable|string|max:255',
            'date_paiement' => 'required|date',
            'notes' => 'nullable|string',
        ];
    }

    protected function defaultRelations(): array
    {
        return ['eleve', 'eleve.classe'];
    }

    /**
     * Montant total collecté pour une période
     */
    public function totalCollecte(?int $ecoleId = null, ?string $dateDebut = null, ?string $dateFin = null): float
    {
        $query = Paiement::query();
        if ($dateDebut) $query->whereDate('date_paiement', '>=', $dateDebut);
        if ($dateFin) $query->whereDate('date_paiement', '<=', $dateFin);
        return $query->sum('montant');
    }

    /**
     * Statistiques de paiement agrégées
     */
    public function statistiques(?int $anneeId = null): array
    {
        $query = Paiement::query();
        if ($anneeId) {
            $query->whereHas('eleve.classe', fn($q) => $q->where('annee_scolaire_id', $anneeId));
        }

        return [
            'total' => (float) $query->sum('montant'),
            'nombre_paiements' => $query->count(),
            'par_methode' => (clone $query)
                ->select('mode_paiement', DB::raw('SUM(montant) as total'), DB::raw('COUNT(*) as count'))
                ->groupBy('mode_paiement')
                ->get()
                ->toArray(),
            'recettes_mensuelles' => (clone $query)
                ->select(DB::raw('MONTH(date_paiement) as mois'), DB::raw('SUM(montant) as total'))
                ->groupBy(DB::raw('MONTH(date_paiement)'))
                ->orderBy('mois')
                ->get()
                ->toArray(),
        ];
    }
}
