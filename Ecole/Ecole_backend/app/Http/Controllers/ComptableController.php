<?php

namespace App\Http\Controllers;

use App\Models\{PaiementEleve, Bourse, Depense, Eleve, TransactionPaiement};
use App\Services\FedaPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ComptableController extends Controller
{
    /** Modes de règlement acceptés. */
    private const PAYMENT_MODES = ['ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'CHEQUE', 'CARTE'];

    /**
     * Normalisation insensible à la casse et aux accents de `statut_global`.
     *
     * Les seeders historiques écrivent `'payé'` (accentué, minuscule),
     * `'impayé'`, etc. — `strtoupper('payé')` donne `PAYÉ`, qui ne
     * correspond à aucune constante du modèle. On replie les accents avant
     * de comparer.
     */
    private function normaliseStatut(?string $global): string
    {
        return str_replace('É', 'E', mb_strtoupper((string) $global));
    }

    private function statutSlug(?string $global): string
    {
        return match ($this->normaliseStatut($global)) {
            PaiementEleve::PAID => 'payee',
            PaiementEleve::PARTIAL => 'partiel',
            default => 'en_attente',
        };
    }

    private function statutLabel(?string $global): string
    {
        return match ($this->normaliseStatut($global)) {
            PaiementEleve::PAID => 'Payée',
            PaiementEleve::PARTIAL => 'Partielle',
            default => 'En attente',
        };
    }

    /**
     * Liste des paiements pour le portail comptable.
     *
     * Le contrat consommé par `FacturesPage` et `TransactionsPage` :
     * enveloppe `{ success, data }`, une ligne par paiement avec l'identité
     * de l'élève (nom/prénom vivent sur `users`), la classe, le motif, le
     * montant et le statut en slug.
     */
    public function paiements()
    {
        $items = PaiementEleve::with(['eleve.user', 'eleve.classe'])
            ->latest('date_paiement')
            ->get()
            ->map(function (PaiementEleve $p) {
                $reference = $p->reference ?? ('PAY-' . str_pad((string) $p->id, 6, '0', STR_PAD_LEFT));
                $eleve = $p->eleve;

                return [
                    'id' => $p->id,
                    'reference' => $reference,
                    'numero' => $reference,
                    'eleve' => [
                        'id' => $eleve?->id,
                        'nom' => $eleve?->user?->name ?? $eleve?->user?->nom ?? '',
                        'prenom' => $eleve?->user?->prenom ?? '',
                        'classe' => [
                            'nom_classe' => $eleve?->classe?->nom_classe,
                        ],
                        'matricule' => $eleve?->numero_matricule,
                    ],
                    'client' => trim(($eleve?->user?->name ?? '') . ' ' . ($eleve?->user?->prenom ?? '')) ?: '—',
                    'classe' => $eleve?->classe?->nom_classe,
                    'motif' => $p->type_paiement ?: 'Frais de scolarité',
                    'type_paiement' => $p->type_paiement,
                    'montant' => (float) $p->montant,
                    'montant_paye' => (float) ($p->montant_paye ?? 0),
                    'montant_restant' => (float) ($p->montant_restant ?? 0),
                    'date_paiement' => $p->date_paiement?->format('Y-m-d'),
                    'mode_paiement' => $p->mode_paiement,
                    'statut' => $this->statutSlug($p->statut_global),
                    'statut_label' => $this->statutLabel($p->statut_global),
                    'created_at' => $p->created_at?->toISOString(),
                ];
            });

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function finances()
    {
        $stats = [
            'total_recettes' => PaiementEleve::where('statut_global', PaiementEleve::PAID)->sum('montant'),
            'total_depenses' => (float) Depense::sum('montant'),
            'paiements_en_attente' => PaiementEleve::whereIn('statut_global', [
                PaiementEleve::PENDING,
                PaiementEleve::PARTIAL,
            ])->count(),
            'bourses_accordees' => Bourse::where('statut', 'active')->count(),
        ];

        // Revenus mensuels de l'année. Calculés en PHP — `MONTH(date_paiement)`
        // n'existe pas sur SQLite (l'environnement de test) alors que
        // `date_paiement` peut être null ; le regroupement en mémoire est
        // portable et évite les deux pièges.
        $revenusParMois = PaiementEleve::whereYear('date_paiement', now()->year)
            ->where('statut_global', PaiementEleve::PAID)
            ->get(['date_paiement', 'montant'])
            ->groupBy(fn ($p) => $p->date_paiement?->format('n'))
            ->map(fn ($groupe) => (float) $groupe->sum('montant'));

        $chart = [
            'labels' => ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
            'datasets' => [[
                'data' => collect(range(1, 12))->map(fn($m) => $revenusParMois->get((string) $m, 0))->values()
            ]]
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'chart' => $chart,
            ],
        ]);
    }

    /**
     * Dépenses de l'établissement, pour alimenter le poste « Dépenses »
     * des synthèses. Scopé à l'école par le trait BelongsToEcole.
     */
    public function depenses()
    {
        $items = Depense::latest('date_depense')
            ->get()
            ->map(fn (Depense $d) => [
                'id' => $d->id,
                'categorie' => $d->categorie,
                'description' => $d->description,
                'montant' => (float) $d->montant,
                'date_depense' => $d->date_depense?->format('Y-m-d'),
            ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function storeDepense(Request $request)
    {
        $validated = $request->validate([
            'categorie' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'montant' => 'required|numeric|min:0.01',
            'date_depense' => 'required|date',
        ]);

        $depense = Depense::create($validated);

        return response()->json(['success' => true, 'data' => $depense], 201);
    }

    public function destroyDepense($id)
    {
        Depense::findOrFail($id)->delete();

        return response()->json(['success' => true]);
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

        // `statut` n'existe pas sur `paiements` — la colonne est
        // `statut_global`. Lire `$paiement->statut` renvoyait null : le
        // badge et le libellé étaient « En attente »/vide sur chaque reçu.
        $statutGlobal = $paiement->statut_global;
        $estPaye = $this->normaliseStatut($statutGlobal) === PaiementEleve::PAID;
        $statutLabel = $this->statutLabel($statutGlobal);

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
        <tr><td>Statut</td><td><span class="badge ' . ($estPaye ? 'paye' : 'en_attente') . '">' . e($statutLabel) . '</span></td></tr>
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
     * Échéancier de paiement pour un élève.
     *
     * Les soldes sont calculés sur les colonnes réelles de `paiements` :
     * `montant_total`, `montant_paye` et `montant_restant` — somme de
     * `montant` (ligne) ou de `statut` (colonne inexistante) donnait des
     * chiffres faux ou nuls.
     */
    public function echeancier($eleveId)
    {
        $eleve = Eleve::with('user', 'classe')->findOrFail($eleveId);

        $paiements = PaiementEleve::where('eleve_id', $eleveId)
            ->orderBy('date_paiement')
            ->get();

        $total_du = (float) $paiements->sum('montant_total');
        $total_paye = (float) $paiements->sum('montant_paye');
        $solde = (float) $paiements->sum('montant_restant');

        return response()->json([
            'success' => true,
            'data' => [
                'eleve' => [
                    'id' => $eleve->id,
                    'nom' => trim(($eleve->user->name ?? '') . ' ' . ($eleve->user->prenom ?? '')),
                    'classe' => $eleve->classe->nom_classe ?? '—',
                    'matricule' => $eleve->numero_matricule ?? '—',
                ],
                'resume' => [
                    'total_du' => $total_du,
                    'total_paye' => $total_paye,
                    'solde' => $solde,
                    'nb_echeances' => $paiements->count(),
                    'nb_payees' => $paiements
                        ->filter(fn ($p) => $this->normaliseStatut($p->statut_global) === PaiementEleve::PAID)
                        ->count(),
                ],
                'echeances' => $paiements->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'reference' => $p->reference ?? 'PAY-' . $p->id,
                        'type' => $p->type_paiement ?: $p->mode_paiement,
                        'montant' => (float) $p->montant,
                        'date' => $p->date_paiement?->format('d/m/Y'),
                        'statut' => $this->statutSlug($p->statut_global),
                        'statut_label' => $this->statutLabel($p->statut_global),
                        'mode' => $p->mode_paiement,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Initialiser un paiement FedaPay pour une échéance.
     *
     * Le client (frontend) appelle cet endpoint quand l'utilisateur clique
     * sur « Payer » sur une échéance non payée. On crée la transaction
     * côté FedaPay, on stocke l'id FedaPay côté serveur pour le rattacher
     * au bon paiement élève, et on renvoie l'URL de paiement.
     */
    public function initierPaiementEcheance(Request $request, $paiementId)
    {
        $paiement = PaiementEleve::with('eleve.user')->findOrFail($paiementId);

        // L'échéance doit être en attente ou partielle
        $statutNorm = $this->normaliseStatut($paiement->statut_global);
        if ($statutNorm === PaiementEleve::PAID) {
            return response()->json([
                'success' => false,
                'message' => 'Cette échéance est déjà payée.',
            ], 422);
        }

        $montantDu = (float) $paiement->montant_restant;
        if ($montantDu <= 0) {
            $montantDu = (float) $paiement->montant;
        }

        // Générer une référence unique pour Fedapay
        $reference = 'TX-' . $paiement->reference . '-' . now()->format('YmdHis');

        $eleve = $paiement->eleve;
        $parent = $eleve?->responsibleParent();
        $user = $parent?->user;

        try {
            $fedapay = app(FedaPayService::class);
            $result = $fedapay->createTransaction([
                'amount' => $montantDu,
                'description' => "Paiement échéance: {$paiement->type_paiement} - {$eleve?->user?->name} {$eleve?->user?->prenom}",
                'reference' => $reference,
                'customer_firstname' => $eleve?->user?->prenom ?? '',
                'customer_lastname' => $eleve?->user?->name ?? '',
                'customer_email' => $user?->email ?? '',
                'customer_phone' => $user?->telephone ?? $parent?->telephone ?? '',
            ]);

            // Stocker la référence de transaction pour le webhook / vérification
            TransactionPaiement::create([
                'id_paiement_eleve' => $paiement->id,
                'tranche' => $paiement->type_paiement,
                'montant_paye' => $montantDu,
                'date_paiement' => now(),
                'statut' => 'EN_ATTENTE',
                'methode_paiement' => 'FEDAPAY',
                'reference_transaction' => $result['transaction']->id,
                'recu_par' => auth()->id(),
                'observation' => "Paiement en ligne initié via Fedapay (ref: {$reference})",
                'ecole_id' => auth()->user()->ecole_id ?? 1,
            ]);

            return response()->json([
                'success' => true,
                'payment_url' => $result['payment_url'],
                'transaction_id' => $result['transaction']->id,
            ]);
        } catch (\Exception $e) {
            Log::error('Init paiement echeance failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'initialisation du paiement : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Callback FedaPay (retour navigateur après paiement).
     *
     * FedaPay redirige l'utilisateur vers cette URL après paiement.
     * On vérifie le statut côté serveur et on met à jour la transaction.
     * Ensuite on redirige vers l'interface frontend (échéancier).
     */
    public function paiementCallback(Request $request)
    {
        $transactionId = $request->query('transaction_id');

        if (!$transactionId) {
            return redirect()->route('frontend.echeancier')
                ->with('error', 'Transaction introuvable.');
        }

        try {
            $fedapay = app(FedaPayService::class);
            $result = $fedapay->verifyTransaction($transactionId);

            if ($result && $result->status === 'approved') {
                // Mettre à jour la transaction locale
                $tx = TransactionPaiement::where('reference_transaction', $transactionId)->first();
                if ($tx) {
                    $tx->update([
                        'statut' => 'APPROUVE',
                        'date_paiement' => now(),
                        'observation' => $tx->observation . ' | Confirmé via callback Fedapay (' . now()->format('d/m/Y H:i') . ')',
                    ]);

                    // Recalculer le paiement élève
                    $paiement = PaiementEleve::find($tx->id_paiement_eleve);
                    if ($paiement) {
                        $paiement->increment('montant_paye', $tx->montant_paye);
                        $paiement->decrement('montant_restant', $tx->montant_paye);
                        if ((float) $paiement->montant_restant <= 0) {
                            $paiement->update(['statut_global' => \App\Models\PaiementEleve::PAID]);
                        } elseif ((float) $paiement->montant_paye > 0) {
                            $paiement->update(['statut_global' => \App\Models\PaiementEleve::PARTIAL]);
                        }
                    }
                }

                return redirect()->route('frontend.echeancier')
                    ->with('success', 'Paiement confirmé avec succès !');
            }
        } catch (\Exception $e) {
            Log::error('FedaPay callback error: ' . $e->getMessage());
        }

        return redirect()->route('frontend.echeancier')
            ->with('error', 'Le paiement n\'a pas pu être confirmé. Veuillez réessayer.');
    }

    /**
     * Vérifier le statut d'un paiement côté serveur.
     *
     * Appelé par le frontend pour rafraîchir le statut sans attendre
     * le callback navigateur (ex: après refresh page).
     */
    public function verifierPaiement($transactionId)
    {
        try {
            $fedapay = app(FedaPayService::class);
            $result = $fedapay->verifyTransaction($transactionId);

            if (!$result) {
                return response()->json([
                    'success' => false,
                    'status' => 'inconnu',
                    'message' => 'Impossible de vérifier le paiement.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'status' => $result->status, // 'approved', 'pending', 'failed'
            ]);
        } catch (\Exception $e) {
            Log::error('Vérification paiement failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'status' => 'erreur',
                'message' => 'Erreur de vérification.',
            ], 500);
        }
    }
}