<?php

namespace App\Http\Controllers;

use App\Models\PaiementEleve;
use App\Models\Parents;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ParentsController extends Controller
{
     // Affiche d'un Parent spécifique
    public function show($id)
    {
        try {
            $parent = Parent::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'parent' => [
                    'id' => $parent->id,
                    'nom' => $parent->nom,
                    'prenom' => $parent->prenom,
                    'email' => $parent->email,
                    'telephone' => $parent->telephone,
                    'photo' => $parent->photo,
                    // Ajoutez d'autres champs selon votre modèle
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Parent non trouvé'
            ], 404);
        }
    }

    //Affiche tous les Parents
    public function indexdesparent()
    {
        $parents = Parents::all();
        return response()->json($parents, 200); 
    }


     // Met à jour d'un Parent spécifique
    public function update(Request $request, $id)
    {
        $parent = Parents::find($id);

        if (!$parent) {
            return response()->json(['message' => 'Parent non trouvé'], 404);
        }

        $validatedData = $request->validate([
                'role' => 'required|in:parent',
                'nom' => 'required|string',
                'prenom' => 'required|string',
                'email' => 'required|email|unique:parent,email',
                'numero_de_telephone' => 'required|string',
                'identifiant' => 'required|unique:parent,identifiant',
                'password1' => 'required|string|min:8',
            ]);

        $parent->update($validatedData);

        return response()->json($parent, 200);
    }

     // Supprime un Parents  spécifique
    public function destroy($id)
    {
        $parent = Parents::find($id);

        if (!$parent) {
            return response()->json(['message' => 'Parent non trouvé'], 404);
        }

        $parent->delete();
        return response()->json(['message' => 'Parent supprimé'], 200);
    }

/*public function getDashboardData($parentId)
{
    try {
        $parent = Parents::with(['eleves' => function($query) {
            $query->with(['classe', 'serie']);
        }])->findOrFail($parentId);
        // Récupérer les contributions des enfants du parent
        $contributions = $parent->eleves()->with('contributions')->get()->pluck('contributions')->flatten()->unique('id');
        return response()->json($contributions);

        $children = $parent->eleves->map(function($eleve) {
            return [
                'id' => $eleve->id,
                'name' => $eleve->nom . ' ' . $eleve->prenom,
                'class' => $eleve->classe?->nom_classe ?? 'Classe inconnue',
                'categorie_classe' => $eleve->classe?->categorie_classe ?? 'Categorie de la classe inconnue',
                'photo' => null,
                'age' => null,
                'school' => $eleve->classe?->nom ?? 'Établissement inconnu',
                'matricule' => $eleve->numero_matricule,
                'contributions' => $eleve->contributions->map(function($contribution) {
                    return [
                        'id' => $contribution->id,
                        'date_fin_premiere_tranche' => $contribution->date_fin_premiere_tranche,
                        'date_fin_deuxieme_tranche' => $contribution->date_fin_deuxieme_tranche,
                        'date_fin_troisieme_tranche' => $contribution->date_fin_t,
                        'motant' => $contribution->montant,
                        'montant_premiere_tranche' => $contribution->montant_premiere_tranche,
                        'montant_deuxieme_tranche' => $contribution->montant_deuxieme_tranche,
                        'montant_troisieme_tranche' => $contribution->montant_troisieme_tranche,
                        /*'tranches' => $contribution->statutsTranches->map(function($tranche) {
                            return [
                                'tranche' => $tranche->tranche,
                                'status' => $tranche->statut,
                                'due_date' => $tranche->date_limite,
                                'paid_date' => $tranche->date_paiement,
                                'amount' => $tranche->montant_tranche,
                            ];
                        })->toArray(),
                        'total_paid' => $contribution->montant_total_paye,
                        'remaining_amount' => $contribution->montant_restant,
                        'status' => $contribution->statut_global,
                        'due_date' => $contribution->date_limite,
                        'status' => $contribution->pivot->statut ?? 'Non payé',
                    ];
                
            })->toArray()

             ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'parent' => [
                    'name' => $parent->nom . ' ' . $parent->prenom,
                    'email' => $parent->email,
                    'phone' => $parent->numero_de_telephone
                ],
                'children' => $children
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}*/


public function getDashboardData($parentId)
    {
        try {
            // Eager-load élèves → classe → contributions
            $parent = Parents::with([
                'eleves.classe.contributions'
            ])->findOrFail($parentId);

            // Construire la réponse "children" avec contributions récupérées via la classe
            $children = $parent->eleves->map(function ($eleve) {
                $classe = $eleve->classe;

                // Récupérer contributions de la classe (ou [] si aucune)
                $contribs = $classe
                    ? $classe->contributions->map(function ($contribution) {
                        return [
                            'id'                             => $contribution->id,
                            'date_fin_premiere_tranche'      => $contribution->date_fin_premiere_tranche,
                            'date_fin_deuxieme_tranche'      => $contribution->date_fin_deuxieme_tranche,
                            'date_fin_troisieme_tranche'     => $contribution->date_fin_troisieme_tranche,
                            'montant'                        => $contribution->montant,
                            'montant_premiere_tranche'       => $contribution->montant_premiere_tranche,
                            'montant_deuxieme_tranche'       => $contribution->montant_deuxieme_tranche,
                            'montant_troisieme_tranche'      => $contribution->montant_troisieme_tranche,
                            // ... autres champs selon besoin ...
                        ];
                    })->toArray()
                    : [];
                //Recuperer les paiements de l'élève*
                $paiement =   PaiementEleve::where('id_eleve', $eleve->id)
                    ->get();
                /*$paiements = PaiementEleve::where('id_eleve', $eleve->id)
                    ->get()? ->map(function ($paiement) {
                    return [
                        'id' => $paiement->id,
                        'mode_paiement' => $paiement->mode_paiement,
                        'montant_total_paye' => $paiement->montant_total_paye,
                        'montant_restant' => $paiement->montant_restant,
                        'statut_global' => $paiement->statut_global,
                        'statuts_tranches' => $paiement->statutsTranches->map(function ($tranche) {
                            return [
                                'tranche' => $tranche->tranche,
                                'statut' => $tranche->statut,
                                'date_limite' => $tranche->date_limite,
                                'montant_tranche' => $tranche->montant_tranche,
                                'date_paiement' => $tranche->date_paiement,
                            ];
                        })->toArray(),
                    ];
                })->toArray(),
                : [];*/

                return [
                    'id'                => $eleve->id,
                    'name'              => $eleve->nom . ' ' . $eleve->prenom,
                    'class'             => $classe?->nom_classe ?? 'Classe inconnue',
                    'categorie_classe'  => $classe?->categorie_classe ?? 'Catégorie inconnue',
                    'photo'             => null,
                    'age'               => null,
                    'school'            => $classe?->nom ?? 'Établissement inconnu',
                    'matricule'         => $eleve->numero_matricule,
                    'contributions'     => $contribs,
                    'paiements'          => $paiement,
                ];
            })->toArray();

            // Réponse finale
            return response()->json([
                'success' => true,
                'data'    => [
                    'parent'   => [
                        'name'  => $parent->nom . ' ' . $parent->prenom,
                        'email' => $parent->email,
                        'phone' => $parent->numero_de_telephone,
                    ],
                    'children' => $children,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }


public function getChildBulletin($parentId, $eleveId, $periode)
{
    try {
        $parent = Parents::findOrFail($parentId);
        
        // Vérifier si l'élève appartient à ce parent
        $eleve = $parent->eleves()->findOrFail($eleveId);
        
        // Utiliser le BulletinController pour générer le bulletin
        $bulletinController = new BulletinController();
        return $bulletinController->genererBulletin($eleveId, $periode);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}
public function index(Request $request) 
{
    try {
        $withEleves = $request->query('with_eleves', false);
        
        if ($withEleves) {
            $parents = Parents::with('eleves.classe')->get();
        } else {
            $parents = Parents::all();
        }
        
        return response()->json($parents); // Retourner directement les données
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération des parents: ' . $e->getMessage()
        ], 500);
    }
}

// Récupérer élèves d'un parent spécifique
public function getElevesByParent($id) 
{
    try {
        $parent = Parents::findOrFail($id);
        $eleves = $parent->eleves()->with('classe')->get();
        
        return response()->json($eleves); // Retourner directement les élèves
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération des élèves du parent: ' . $e->getMessage()
        ], 500);
    }
}

// Mettre à jour les élèves d'un parent
public function updateEleves(Request $request, $parentId)
{
    try {
        // Validation des données
        $request->validate([
            'eleve_ids' => 'required|array',
            'eleve_ids.*' => 'exists:eleves,id'
        ]);
        
        $eleveIds = $request->input('eleve_ids', []);
        
        // Vérifier que le parent existe
        $parent = Parents::findOrFail($parentId);
        
        // Utiliser la méthode sync() pour une meilleure gestion des relations
        $parent->eleves()->sync($eleveIds);
        
        return response()->json([
            'success' => true,
            'message' => 'Relations mises à jour avec succès'
        ]);
        
    } catch (\Illuminate\Validation\ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => 'Données invalides',
            'errors' => $e->errors()
        ], 422);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la mise à jour des élèves: ' . $e->getMessage()
        ], 500);
    }
}

//Recuperer les contribution des enfants d'un parent
public function getContributionsByParent($parentId)
{
    try {
        $parent = Parents::findOrFail($parentId);
        $contributions = $parent->eleves()->with('contributions')->get()->pluck('contributions')->flatten()->unique('id');
        return response()->json($contributions);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération des contributions: ' . $e->getMessage()
        ], 500);
    }
}   

}