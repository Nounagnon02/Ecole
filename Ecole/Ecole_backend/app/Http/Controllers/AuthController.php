<?php

namespace App\Http\Controllers;

use Illuminate\Auth\Events\Registered;
use App\Models\Eleves;
use App\Models\Enseignants;
use App\Models\Parents;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Database\QueryException;
use Smalot\PdfParser\Parser as PdfParser;
use App\Models\PaiementEleve;
use App\Models\StatutTranche;
use App\Models\Contributions;
use App\Models\TransactionPaiement;
use Illuminate\Support\Facades\Log;




class AuthController extends Controller
{
    




protected function getRedirectRouteBasedOnRole($role)
{
    $routes = [
        'eleve' => '/dashboard-eleve',
        'parent' => '/dashboard-parent',
        'enseignement' => '/dashboard-enseignant',
        'enseignementM' => '/dashboard-enseignantM',
        'enseignementP' => '/dashboard-enseignantP',
        'directeur' => '/dashboard-admin',
        'directeurM' => '/dashboard-maternelle',
        'directeurP' => '/dashboard-primaire',
        'directeurS' => '/dashboard-secondaire',
        'censeur' => '/dashboard-censeur',
        'secretaire' => '/dashboard-secretaire',
        'comptable' => '/dashboard-comptable',
        'surveillant' => '/dashboard-surveillant'
    ];

    return $routes[$role] ?? '/';
}

public function inscription(Request $request)
{
    try {
        
        if ($request->role === 'eleve') {
            $validated = $request->validate([
                'role' => 'required|in:eleve',
                'nom' => 'required|string',
                'datedeNaissance' => 'required|date',
                'lieudeNaissance' => 'required|string',
                'sexe'  => 'required|in:M,F',
                'prenom' => 'required|string',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:eleves,identifiant',
                'password1' => 'required|string|min:8',
                'classe' => 'required|string', // nom de la classe
                'serie' => 'required|string',  // nom de la série
                'numero_matricule' => 'required|string|unique:eleves',
            ]);

            // Chercher l'id de la classe et de la série
            $classe = \App\Models\Classes::where('nom_classe', $validated['classe'])->first();
            $serie = \App\Models\Series::where('nom', $validated['serie'])->first();
            $contribution = \App\Models\Contributions::where('id_classe', $classe->id)->where('id_serie', $serie->id)->first();
            if (!$classe || !$serie) {
                return response()->json(['message' => 'Classe ou série invalide'], 422);
            }
            if (!$contribution) {
                return response()->json(['message' => 'Aucune contribution trouvée pour cette classe'], 422);
            }

            $eleve = Eleves::create([
                'role' => $validated['role'],
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'lieu_naissance' => $validated['lieudeNaissance'],
                'date_naissance' => $validated['datedeNaissance'],
                'sexe' => $validated['sexe'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'password1' => bcrypt($validated['password1']),
                'numero_matricule' => $validated['numero_matricule'],
                'class_id' => $classe->id,
                'serie_id' => $serie->id,
            ]);

            // Création du paiement élève
            $paiementEleve = \App\Models\PaiementEleve::create([
                'id_eleve' => $eleve->id,
                'id_contribution' => $contribution->id,
                'mode_paiement' => 'TRANCHE',
                'montant_total_paye' => 0,
                'montant_restant' => $contribution->montant,
                'statut_global' => 'EN_ATTENTE',
            ]);

            event(new Registered($paiementEleve));

            event(new Registered($eleve));
            return response()->json([
                'message' => 'Inscription réussie ! Veuillez vous connecter.',
                'redirect_to' => '/connexion'
            ], 201);

        }elseif ($request->role === 'parent') {
            $validated = $request->validate([
                'role' => 'required|in:parent',
                'nom' => 'required|string',
                'datedeNaissance' => 'required|date',
                'lieudeNaissance' => 'required|string',
                'sexe'  => 'required|in:M,F',
                'prenom' => 'required|string',
                'email' => 'required|email|unique:parents,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:parents,identifiant',
                'password1' => 'required|string|min:8',
            ]);


            $parent = Parents::create([
                'role' => $validated['role'],
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'lieu_naissance' => $validated['lieudeNaissance'],
                'date_naissance' => $validated['datedeNaissance'],
                'sexe' => $validated['sexe'],
                'email' => $validated['email'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'password1' => bcrypt($validated['password1']),
            ]);

            event(new Registered($parent));
            return response()->json([
                'message' => 'Inscription réussie ! Veuillez vous connecter.',
                'redirect_to' => '/connexion'
            ], 201);

        }elseif ($request->role === 'enseignement') {
            $validated = $request->validate([
                'role' => 'required|in:enseignement',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'datedeNaissance' => 'required|date',
                'lieudeNaissance' => 'required|string',
                'sexe'  => 'required|in:M,F',
                'email' => 'required|email|unique:enseignants,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:enseignants,identifiant',
                'matiere' => 'required|string',
                'classe' => 'required|string',
                'password1' => 'required|string|min:8',
            ]);

            $classe = \App\Models\Classes::where('nom_classe', $validated['classe'])->firstOrFail();
            $matiere = \App\Models\Matieres::where('nom', $validated['matiere'])->firstOrFail();

            $enseignant = Enseignants::create([
                'role' => $validated['role'],
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'lieu_naissance' => $validated['lieudeNaissance'],
                'date_naissance' => $validated['datedeNaissance'],
                'sexe' => $validated['sexe'],
                'email' => $validated['email'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'matiere_id' => $matiere->id,
                'class_id' => $classe->id,
                'password1' => bcrypt($validated['password1']),
            ]);

            event(new Registered($enseignant));
            return response()->json([
                'message' => 'Inscription réussie ! Veuillez vous connecter.',
                'redirect_to' => '/connexion'
            ], 201);

        } elseif (in_array($request->role, ['enseignementM', 'enseignementP'])) {
            $validated = $request->validate([
                'role' => 'required|in:enseignementM,enseignementP',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'datedeNaissance' => 'required|date',
                'lieudeNaissance' => 'required|string',
                'sexe'  => 'required|in:M,F',
                'email' => 'required|email|unique:enseignants_martenel_primaire,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:enseignants_martenel_primaire,identifiant',
                'classe' => 'required|string',
                'password1' => 'required|string|min:8',
            ]);

            $classe = \App\Models\Classes::where('nom_classe', $validated['classe'])->firstOrFail();

            $enseignant = \App\Models\Enseignants_Martenel_Primaire::create([
                'role' => $validated['role'],
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'],
                'lieu_naissance' => $validated['lieudeNaissance'],
                'date_naissance' => $validated['datedeNaissance'],
                'sexe' => $validated['sexe'],
                'email' => $validated['email'],
                'numero_de_telephone' => $validated['numero_de_telephone'],
                'identifiant' => $validated['identifiant'],
                'class_id' => $classe->id,
                'password1' => bcrypt($validated['password1']),
            ]);

            event(new Registered($enseignant));
            return response()->json([
                'message' => 'Inscription réussie ! Veuillez vous connecter.',
                'redirect_to' => '/connexion'
            ], 201);
        }

        return response()->json(['message' => 'Rôle non reconnu'], 400);

    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return response()->json([
            'message' => 'Classe ou matière non trouvée',
            'error' => $e->getMessage()
        ], 422);
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'message' => 'Erreur de validation',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de l\'inscription',
            'error' => $e->getMessage()
        ], 500);
    }
}


    /**
     * Permet de se connecter à l'application avec un identifiant et un mot de passe.
     * 
     * @param \Illuminate\Http\Request $request
     * 
     * @return \Illuminate\Http\JsonResponse
     */
public function connexion(Request $request)
{
    $request->validate([
        'identifiant' => 'required',
        'password' => 'required',
    ]);

    $identifiant = $request->identifiant;
    $password = $request->password;

    // Vérification pour l'élève
    $eleve = Eleves::where('identifiant', $identifiant)->first();
    if ($eleve && Hash::check($request->password, $eleve->password1)) {
        $token = $eleve->createToken('api-token')->plainTextToken;
        return response()->json([
            'user' => $eleve,
            'token' => $token,
            'role' => 'eleve',
            'redirect_to' => $this->getRedirectRouteBasedOnRole('eleve')
        ]);
    }

    // Vérification pour le parent
    $parent = Parents::where('identifiant', $identifiant)->first();
    if ($parent && Hash::check($request->password, $parent->password1)) {
        $token = $parent->createToken('api-token')->plainTextToken;
        return response()->json([
            'user' => $parent,
            'token' => $token,
            'role' => 'parent',
            'redirect_to' => $this->getRedirectRouteBasedOnRole('parent')
        ]);
    }

    // Vérification pour l'enseignant secondaire
    $enseignant = Enseignants::where('identifiant', $identifiant)->first();
    if ($enseignant && Hash::check($request->password, $enseignant->password1)) {
        $token = $enseignant->createToken('api-token')->plainTextToken;
        return response()->json([
            'user' => $enseignant,
            'token' => $token,
            'role' => 'enseignement',
            'redirect_to' => $this->getRedirectRouteBasedOnRole('enseignement')
        ]);
    }

    // Vérification pour les enseignants maternelle/primaire
    $enseignantMP = \App\Models\Enseignants_Martenel_Primaire::where('identifiant', $identifiant)->first();
    if ($enseignantMP && Hash::check($request->password, $enseignantMP->password1)) {
        $token = $enseignantMP->createToken('api-token')->plainTextToken;
        return response()->json([
            'user' => $enseignantMP,
            'token' => $token,
            'role' => $enseignantMP->role, // 'enseignementM' ou 'enseignementP'
            'redirect_to' => $this->getRedirectRouteBasedOnRole($enseignantMP->role)
        ]);
    }

    // Vérification des comptes spéciaux
    $specialAccounts = [
        "directeurecoleA@gmail.cj" => [
            'password' => "director'spassword1234567@",
            'role' => 'directeur',
            'nom' => 'Directeur',
            'prenom' => 'École'
        ],
        "directeurMecoleA@gmail.cj" => [
            'password' => "directorM'spassword1234567@",
            'role' => 'directeurM',
            'nom' => 'Directeur',
            'prenom' => 'École'
        ],
        "directeurPecoleA@gmail.cj" => [
            'password' => "directorP'spassword1234567@",
            'role' => 'directeurP',
            'nom' => 'Directeur',
            'prenom' => 'École'
        ],
        "directeurSecoleA@gmail.cj" => [
            'password' => "directorS'spassword1234567@",
            'role' => 'directeurS',
            'nom' => 'Directeur',
            'prenom' => 'École'
        ],
        "censeurecoleA@gmail.cj" => [
            'password' => "censeur'spassword1234567@",
            'role' => 'censeur',
            'nom' => 'Censeur',
            'prenom' => 'École'
        ],
        "secretaireecoleA@gmail.cj" => [
            'password' => "secretaire'spassword1234567@",
            'role' => 'secretaire',
            'nom' => 'Secrétaire',
            'prenom' => 'École'
        ],
        "comptablecoleA@gmail.cj" => [
            'password' => "comptable'spassword1234567@",
            'role' => 'comptable',
            'nom' => 'Comptable',
            'prenom' => 'École'
        ],
        "surveillantecoleA@gmail.cj" => [
            'password' => "surveillant'spassword1234567@",
            'role' => 'surveillant',
            'nom' => 'Surveillant',
            'prenom' => 'École'
        ]
    ];

    if (isset($specialAccounts[$identifiant])) {
        $account = $specialAccounts[$identifiant];
        if ($password === $account['password']) {
            // Créer un token pour les comptes spéciaux
            $user = new User([
                'identifiant' => $identifiant,
                'nom' => $account['nom'],
                'prenom' => $account['prenom'],
                'role' => $account['role']
            ]);
            
            return response()->json([
                'user' => [
                    'identifiant' => $identifiant,
                    'nom' => $account['nom'],
                    'prenom' => $account['prenom'],
                    'role' => $account['role']
                ],
                'role' => $account['role'],
                'redirect_to' => $this->getRedirectRouteBasedOnRole($account['role'])
            ]);
        }
    }

    return response()->json([
        'message' => 'Identifiants incorrects'
    ], 401);
}


public function logout(Request $request)
{
    Auth::logout(); // Déconnexion de l'utilisateur
    session()->forget('user'); // Effacez les données de l'utilisateur de la session
    return response()->json(['message' => 'Logged out successfully'], 200);
}

private function processExcelFile($file)
    {
        $spreadsheet = IOFactory::load($file->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();
        $data = [];

        $highestRow = $worksheet->getHighestRow();
        
        for ($row = 2; $row <= $highestRow; $row++) {
            $eleve = $worksheet->getCell('A' . $row)->getValue();
            $note = $worksheet->getCell('B' . $row)->getValue();
            $noteSur = $worksheet->getCell('C' . $row)->getValue();
            $commentaire = $worksheet->getCell('D' . $row)->getValue();

            if ($eleve && $note !== null) {
                $data[] = [
                    'eleve' => trim($eleve),
                    'note' => floatval($note),
                    'note_sur' => $noteSur ? floatval($noteSur) : 20,
                    'commentaire' => $commentaire ? trim($commentaire) : null
                ];
            }
        }

        return $data;
    }

    private function processPdfFile($file)
    {
        $parser = new PdfParser();
        $pdf = $parser->parseFile($file->getPathname());
        $text = $pdf->getText();
        
        // Logique simple pour extraire les notes du PDF
        // À adapter selon le format de vos PDFs
        $lines = explode("\n", $text);
        $data = [];

        foreach ($lines as $line) {
            // Exemple de regex pour extraire nom et note
            if (preg_match('/^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/', trim($line), $matches)) {
                $data[] = [
                    'eleve' => trim($matches[1]),
                    'note' => floatval($matches[2]),
                    'note_sur' => isset($matches[3]) ? floatval($matches[3]) : 20,
                    'commentaire' => null
                ];
            }
        }

        return $data;
    }

    private function creerStatutsTranches($paiementEleve, $contribution)
    {
        $tranches = [
            'PREMIERE' => [
                'date_limite' => $contribution->date_fin_premiere_tranche,
                'montant' => $contribution->montant_premiere_tranche
            ],
            'DEUXIEME' => [
                'date_limite' => $contribution->date_fin_deuxieme_tranche,
                'montant' => $contribution->montant_deuxieme_tranche
            ],
            'TROISIEME' => [
                'date_limite' => $contribution->date_fin_troisieme_tranche,
                'montant' => $contribution->montant_troisieme_tranche
            ]
        ];

        foreach ($tranches as $tranche => $info) {
            StatutTranche::create([
                'id_paiement_eleve' => $paiementEleve->id,
                'tranche' => $tranche,
                'statut' => 'EN_ATTENTE',
                'date_limite' => $info['date_limite'],
                'montant_tranche' => $info['montant']
            ]);
        }
    }

    public function changerModePaiement($paiementEleveId, $nouveauMode)
    {
        try {
            $paiementEleve = PaiementEleve::find($paiementEleveId);
            
            if (!$paiementEleve) {
                throw new \Exception('Paiement non trouvé');
            }

            $paiementEleve->update(['mode_paiement' => $nouveauMode]);

            return [
                'success' => true,
                'message' => 'Mode de paiement mis à jour'
            ];

        } catch (\Exception $e) {
            Log::error('Erreur changement mode paiement: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur lors du changement de mode',
                'error' => $e->getMessage()
            ];
        }
    }


     public function verifierPaiementsEnRetard()
    {
        try {
            $tranchesEnRetard = StatutTranche::where('statut', 'EN_ATTENTE')
                                           ->where('date_limite', '<', now())
                                           ->get();

            foreach ($tranchesEnRetard as $tranche) {
                $tranche->update(['statut' => 'RETARD']);
            }

            return [
                'success' => true,
                'tranches_mises_a_jour' => $tranchesEnRetard->count()
            ];

        } catch (\Exception $e) {
            Log::error('Erreur vérification retards: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }



    /**
     * Obtenir les statistiques de paiement pour un élève
     */
    public function getStatistiquesPaiement($eleveId)
    {
        try {
            $paiementEleve = PaiementEleve::with(['transactions', 'statutsTranches', 'contribution'])
                                        ->where('id_eleve', $eleveId)
                                        ->first();

            if (!$paiementEleve) {
                return [
                    'success' => false,
                    'message' => 'Aucun paiement trouvé pour cet élève'
                ];
            }

            $stats = [
                'montant_total' => $paiementEleve->contribution->montant,
                'montant_paye' => $paiementEleve->montant_total_paye,
                'montant_restant' => $paiementEleve->montant_restant,
                'pourcentage_paye' => $paiementEleve->pourcentage_paiement,
                'statut_global' => $paiementEleve->statut_global,
                'mode_paiement' => $paiementEleve->mode_paiement,
                'tranches' => $paiementEleve->statutsTranches->map(function($tranche) {
                    return [
                        'tranche' => $tranche->tranche,
                        'montant' => $tranche->montant_tranche,
                        'statut' => $tranche->statut,
                        'date_limite' => $tranche->date_limite,
                        'date_paiement' => $tranche->date_paiement,
                        'est_en_retard' => $tranche->est_en_retard
                    ];
                }),
                'transactions' => $paiementEleve->transactions->map(function($transaction) {
                    return [
                        'tranche' => $transaction->tranche,
                        'montant' => $transaction->montant_paye,
                        'date' => $transaction->date_paiement,
                        'methode' => $transaction->methode_paiement,
                        'reference' => $transaction->reference_transaction
                    ];
                })
            ];

            return [
                'success' => true,
                'statistiques' => $stats
            ];

        } catch (\Exception $e) {
            Log::error('Erreur statistiques paiement: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }


     /**
     * Changer le mode de paiement d'un élève
     */
    /*public function changerModePaiement(Request $request, $paiementEleveId)
    {
        $request->validate([
            'mode_paiement' => 'required|in:INTEGRAL,TRANCHE'
        ]);

        try {
            $resultat = $this->inscriptionService->changerModePaiement(
                $paiementEleveId,
                $request->mode_paiement
            );

            if ($resultat['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $resultat['message']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $resultat['message']
                ], 400);
            }

        } catch (\Exception $e) {
            Log::error('Erreur changement mode paiement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de mode'
            ], 500);
        }
    }*/

    /**
     * Obtenir les statistiques de paiement d'un élève
     */
    /*public function getStatistiquesPaiement($eleveId)
    {
        try {
            $resultat = $this->inscriptionService->getStatistiquesPaiement($eleveId);

            if ($resultat['success']) {
                return response()->json([
                    'success' => true,
                    'statistiques' => $resultat['statistiques']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $resultat['message']
                ], 404);
            }

        } catch (\Exception $e) {
            Log::error('Erreur statistiques paiement: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }*/

    /**
     * Lister les élèves avec leurs statuts de paiement
     */
    public function listerElevesAvecPaiements(Request $request)
    {
        try {
            $query = \App\Models\Eleves::with(['paiementEleve.contribution', 'paiementEleve.statutsTranches']);

            // Filtres optionnels
            if ($request->has('classe_id')) {
                $query->where('id_classe', $request->classe_id);
            }

            if ($request->has('serie_id')) {
                $query->where('id_serie', $request->serie_id);
            }

            if ($request->has('statut_paiement')) {
                $query->whereHas('paiementEleve', function($q) use ($request) {
                    $q->where('statut_global', $request->statut_paiement);
                });
            }

            $eleves = $query->paginate(20);

            return response()->json([
                'success' => true,
                'eleves' => $eleves
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur liste élèves: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des élèves'
            ], 500);
        }
    }

    /**
     * Tableau de bord des paiements
     */
    public function tableauDeBord()
    {
        try {
            $stats = [
                'total_eleves' => \App\Models\Eleves::count(),
                'paiements_termines' => \App\Models\PaiementEleve::where('statut_global', 'TERMINE')->count(),
                'paiements_en_cours' => \App\Models\PaiementEleve::where('statut_global', 'EN_COURS')->count(),
                'paiements_en_attente' => \App\Models\PaiementEleve::where('statut_global', 'EN_ATTENTE')->count(),
                'montant_total_attendu' => \App\Models\PaiementEleve::join('contributions', 'paiement_eleves.id_contribution', '=', 'contributions.id')
                                                                  ->sum('contributions.montant'),
                'montant_total_collecte' => \App\Models\PaiementEleve::sum('montant_total_paye'),
                'tranches_en_retard' => \App\Models\StatutTranche::where('statut', 'RETARD')->count(),
            ];

            // Pourcentage de recouvrement
            $stats['pourcentage_recouvrement'] = $stats['montant_total_attendu'] > 0 
                ? ($stats['montant_total_collecte'] / $stats['montant_total_attendu']) * 100 
                : 0;

            return response()->json([
                'success' => true,
                'statistiques' => $stats
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur tableau de bord: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du tableau de bord'
            ], 500);
        }
    }


}
