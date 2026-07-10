<?php

namespace App\Http\Controllers;

use App\Models\{PaiementEleve, Bourse, Eleve};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ComptableController extends Controller
{
    public function paiements()
    {
        return PaiementEleve::with(['eleve.classe'])->latest()->get();
    }

    public function finances()
    {
        $stats = [
            'total_recettes' => PaiementEleve::where('statut', 'paye')->sum('montant'),
            'total_depenses' => 0, // À implémenter selon votre logique
            'paiements_en_attente' => PaiementEleve::where('statut', 'en_attente')->count(),
            'bourses_accordees' => Bourse::where('statut', 'active')->count()
        ];

        $revenusMensuels = PaiementEleve::selectRaw('MONTH(date_paiement) as mois, SUM(montant) as total')
            ->whereYear('date_paiement', now()->year)
            ->where('statut', 'paye')
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

    public function storePaiement(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'montant' => 'required|numeric',
            'type_paiement' => 'required|string',
            'date_paiement' => 'required|date'
        ]);

        return PaiementEleve::create($validated);
    }

    public function storeBourse(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
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
        $total_paye = (float) $paiements->whereIn('statut', ['paye', 'payé'])->sum('montant');

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
                    'nb_payees' => $paiements->whereIn('statut', ['paye', 'payé'])->count(),
                ],
                'echeances' => $paiements->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'reference' => $p->reference ?? 'PAY-' . $p->id,
                        'type' => $p->type_paiement,
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