<?php

namespace App\Http\Controllers;

use App\Models\{PaiementEleve, Bourse, Eleve};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ComptableController extends Controller
{
    /** Modes de règlement acceptés. */
    private const PAYMENT_MODES = ['ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'CHEQUE', 'CARTE'];

    public function paiements()
    {
        return PaiementEleve::with(['eleve.classe'])->latest()->get();
    }

    public function finances()
    {
        $stats = [
            // La colonne est `statut_global` : `where('statut', …)` levait
            // « Unknown column » et cet endpoint échouait en 500.
            'total_recettes' => PaiementEleve::where('statut_global', PaiementEleve::PAID)->sum('montant'),
            'total_depenses' => 0, // À implémenter selon votre logique
            'paiements_en_attente' => PaiementEleve::where('statut_global', PaiementEleve::PENDING)->count(),
            'bourses_accordees' => Bourse::where('statut', 'active')->count()
        ];

        $revenusMensuels = PaiementEleve::selectRaw('MONTH(date_paiement) as mois, SUM(montant) as total')
            ->whereYear('date_paiement', now()->year)
            ->where('statut_global', PaiementEleve::PAID)
            ->groupBy('mois')
            ->orderBy('mois')
            ->pluck('total', 'mois');

        $chart = [
            'labels' => ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
            'datasets' => [[
                'data' => collect(range(1, 12))->map(fn($m) => (int) ($revenusMensuels[$m] ?? 0))->values()
            ]]
        ];

        return response()->json([
            'stats' => $stats,
            'chart' => $chart
        ]);
    }

    public function bourses()
    {
        return Bourse::with(['eleve.classe'])->latest()->get();
    }

    /**
     * Enregistrer un paiement.
     *
     * Cet endpoint répondait 500 à chaque appel : il exigeait `type_paiement`,
     * que la table ne portait pas, et ne demandait pas `mode_paiement`, qu'elle
     * exige. Aucune interface ne l'appelle encore, donc rien ne dépendait du
     * contrat incomplet — il est ici complété plutôt que contourné.
     */
    public function storePaiement(Request $request)
    {
        $validated = $request->validate([
            'eleve_id'      => 'required|school_exists:eleves,id',
            'montant'       => 'required|numeric|min:0',
            'type_paiement' => 'required|string|max:255',
            // NOT NULL en base, et une écriture comptable sans mode de
            // règlement n'est pas rapprochable.
            'mode_paiement' => 'required|string|in:' . implode(',', self::PAYMENT_MODES),
            'date_paiement' => 'required|date',
            'reference'     => 'nullable|string|max:255',
            'parents_id'    => 'nullable|school_exists:parents,id',
        ]);

        // Le solde est dérivé, pas saisi : le laisser null rendait
        // `montant_restant` illisible pour tout ce qui calcule un reste à payer.
        $montant = (float) $validated['montant'];

        $eleve = \App\Models\Eleve::findOrFail($validated['eleve_id']);

        // `paiements.parents_id` doit nommer le parent responsable *réellement
        // lié* à l'élève : accepter n'importe quel parent permettrait
        // d'imputer un règlement à une autre famille (ou un autre
        // établissement). S'il est fourni, on vérifie la filiation ; sinon on
        // dérive du premier parent du dossier.
        if (!empty($validated['parents_id'])) {
            abort_unless(
                $eleve->parents()->where('parents.id', $validated['parents_id'])->exists(),
                422,
                'Le parent indiqué n\'est pas lié à cet élève.'
            );
        } else {
            $validated['parents_id'] = $eleve->responsibleParent()?->id;
        }

        $paiement = PaiementEleve::create($validated + [
            'montant_total'   => $montant,
            'montant_paye'    => $montant,
            'montant_restant' => 0,
            'statut_global'   => PaiementEleve::PAID,
            'reference'       => $validated['reference'] ?? $this->nextReference(),
        ]);

        return response()->json(['success' => true, 'data' => $paiement], 201);
    }

    /**
     * Référence lisible et unique par établissement.
     *
     * `paiements.reference` est unique par école depuis que les identifiants
     * émis par l'établissement ont été sortis de l'unicité plateforme.
     */
    private function nextReference(): string
    {
        return 'PAY-' . now()->format('Ymd') . '-' . strtoupper(\Illuminate\Support\Str::random(6));
    }

    public function storeBourse(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|school_exists:eleves,id',
            'type_bourse' => 'required|string',
            'montant' => 'required|numeric',
            'pourcentage' => 'required|integer',
            'periode' => 'required|string'
        ]);

        return Bourse::create($validated);
    }

    /**
     * Générer un reçu PDF (HTML format — imprimer → PDF)
     */
    public function recu($id)
    {
        $paiement = PaiementEleve::with(['eleve.user', 'eleve.classe', 'contribution'])->findOrFail($id);
        $ecole = auth()->user()?->ecole;

        $html = '<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Reçu de Paiement</title>
    <style>
        body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 14px; color: #1f2937; max-width: 700px; margin: 40px auto; padding: 0 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { margin: 4px 0; color: #6b7280; font-size: 13px; }
        .recu-title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 20px 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .info-table td { padding: 6px 12px; }
        .info-table td:first-child { font-weight: 600; width: 160px; color: #6b7280; }
        .amount { font-size: 24px; font-weight: bold; text-align: center; color: #059669; margin: 20px 0; padding: 16px; background: #f0fdf4; border-radius: 8px; }
        .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .badge.paye { background: #d1fae5; color: #065f46; }
        .badge.en_attente { background: #fef3c7; color: #92400e; }
        @media print { body { margin: 0; padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>' . e($ecole?->nom ?? 'Établissement Scolaire') . '</h1>
        <p>' . e($ecole?->adresse ?? '') . ' · ' . e($ecole?->ville ?? '') . ' ' . e($ecole?->pays ?? '') . '</p>
        <p>Tél : ' . e($ecole?->telephone ?? '') . ' · Email : ' . e($ecole?->email ?? '') . '</p>
    </div>

    <div class="recu-title">Reçu de Paiement</div>

    <p style="text-align:right;font-size:13px;color:#6b7280;">N° ' . e($paiement->reference ?? 'PAY-' . $paiement->id) . '</p>

    <table class="info-table">
        <tr><td>Élève</td><td>' . e($paiement->eleve?->user?->name ?? '') . ' ' . e($paiement->eleve?->user?->prenom ?? '') . '</td></tr>
        <tr><td>Classe</td><td>' . e($paiement->eleve?->classe?->nom_classe ?? '—') . '</td></tr>
        <tr><td>Type</td><td>' . e($paiement->type_paiement ?? '—') . '</td></tr>
        <tr><td>Date</td><td>' . e($paiement->date_paiement?->format('d/m/Y') ?? '—') . '</td></tr>
        <tr><td>Mode</td><td>' . e($paiement->mode_paiement ?? '—') . '</td></tr>
        <tr><td>Statut</td><td><span class="badge ' . ($paiement->statut === 'paye' || $paiement->statut === 'payé' ? 'paye' : 'en_attente') . '">' . e($paiement->statut) . '</span></td></tr>
    </table>

    <div class="amount">' . number_format((float) $paiement->montant, 0, ',', ' ') . ' FCFA</div>

    <div class="footer">
        <p>Reçu généré le ' . now()->format('d/m/Y à H:i') . '</p>
        <p>Ce document fait office de reçu officiel</p>
    </div>
</body>
</html>';

        return response($html, 200, [
            'Content-Type' => 'text/html',
        ]);
    }

    /**
     * Échéancier de paiement pour un élève
     */
    public function echeancier($eleveId)
    {
        $eleve = Eleve::with('user', 'classe')->findOrFail($eleveId);

        $paiements = PaiementEleve::where('eleve_id', $eleveId)
            ->orderBy('date_paiement')
            ->get();

        $total_du = (float) $paiements->sum('montant');
        $total_paye = (float) $paiements->where('statut_global', PaiementEleve::PAID)->sum('montant');

        return response()->json([
            'success' => true,
            'data' => [
                'eleve' => [
                    'id' => $eleve->id,
                    'nom' => ($eleve->user->name ?? '') . ' ' . ($eleve->user->prenom ?? ''),
                    'classe' => $eleve->classe->nom_classe ?? '—',
                    'matricule' => $eleve->numero_matricule ?? '—',
                ],
                'resume' => [
                    'total_du' => $total_du,
                    'total_paye' => $total_paye,
                    'solde' => $total_du - $total_paye,
                    'nb_echeances' => $paiements->count(),
                    'nb_payees' => $paiements->where('statut_global', PaiementEleve::PAID)->count(),
                ],
                'echeances' => $paiements->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'reference' => $p->reference ?? 'PAY-' . $p->id,
                        // `type_paiement` n'existe pas sur cette table.
                        'type' => $p->mode_paiement,
                        'montant' => (float) $p->montant,
                        'date' => $p->date_paiement?->format('d/m/Y'),
                        'statut' => $p->statut,
                        'mode' => $p->mode_paiement,
                    ];
                }),
            ],
        ]);
    }
}