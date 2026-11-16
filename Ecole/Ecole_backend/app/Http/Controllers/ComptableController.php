<?php

namespace App\Http\Controllers;

use App\Models\{PaiementEleve, Bourse, Depense, Eleve, TransactionPaiement};
use App\Support\Reglement;
use App\Services\FedaPayService;
use App\Services\Comptabilite\RecuService;
use App\Http\Requests\Comptable\StoreDepenseRequest;
use App\Http\Requests\Comptable\StorePaiementRequest;
use App\Http\Requests\Comptable\StoreBourseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ComptableController extends Controller
{
    public function __construct(private RecuService $recus)
    {
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
                    'statut' => Reglement::slug($p->statut_global),
                    'statut_label' => Reglement::libelle($p->statut_global),
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

    public function storeDepense(StoreDepenseRequest $request)
    {
        $depense = Depense::create($request->validated());

        \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

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
    public function storePaiement(StorePaiementRequest $request)
    {
        $validated = $request->validated();

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
            'reference'       => $validated['reference'] ?? Reglement::nouvelleReference(),
        ]);

        \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

        return response()->json(['success' => true, 'data' => $paiement], 201);
    }

    /**
     * Référence lisible et unique par établissement.
     *
     * `paiements.reference` est unique par école depuis que les identifiants
     * émis par l'établissement ont été sortis de l'unicité plateforme.
     */
    public function storeBourse(StoreBourseRequest $request)
    {
        return Bourse::create($request->validated());
    }

    /**
     * Générer un reçu PDF (HTML format — imprimer → PDF)
     */
    public function recu($id)
    {
        $paiement = PaiementEleve::with(['eleve.user', 'eleve.classe', 'contribution'])->findOrFail($id);

        return response($this->recus->html($paiement, auth()->user()?->ecole), 200, [
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
                        ->filter(fn ($p) => $p->statut_global === PaiementEleve::PAID)
                        ->count(),
                ],
                'echeances' => $paiements->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'reference' => $p->reference ?? 'PAY-' . $p->id,
                        'type' => $p->type_paiement ?: $p->mode_paiement,
                        'montant' => (float) $p->montant,
                        'date' => $p->date_paiement?->format('d/m/Y'),
                        'statut' => Reglement::slug($p->statut_global),
                        'statut_label' => Reglement::libelle($p->statut_global),
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
        if ($paiement->statut_global === PaiementEleve::PAID) {
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
                'statut' => TransactionPaiement::EN_ATTENTE,
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
            $this->rethrowIfMeaningful($e);
            Log::error('Init paiement echeance failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'initialisation du paiement : ' . $this->clientErrorMessage($e),
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
                        'statut' => TransactionPaiement::APPROUVE,
                        'date_paiement' => now(),
                        'observation' => $tx->observation . ' | Confirmé via callback Fedapay (' . now()->format('d/m/Y H:i') . ')',
                    ]);

                    // Recalculer le paiement élève — écriture comptable unique
                    // (crédite le payé, débite le restant borné à 0, bascule
                    // le statut global) : voir PaiementEleve::credit().
                    $paiement = PaiementEleve::find($tx->id_paiement_eleve);
                    if ($paiement) {
                        $paiement->credit((float) $tx->montant_paye);
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