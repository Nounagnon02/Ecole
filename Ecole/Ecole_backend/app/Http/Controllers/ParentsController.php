<?php

namespace App\Http\Controllers;

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

public function getDashboardData($parentId)
{
    try {
        $parent = Parents::with(['eleves' => function($query) {
            $query->with(['classe', 'serie']);
        }])->findOrFail($parentId);

        $children = $parent->eleves->map(function($eleve) {
            return [
                'id' => $eleve->id,
                'name' => $eleve->nom . ' ' . $eleve->prenom,
                'class' => $eleve->classe?->nom_classe ?? 'Classe inconnue',
                'categorie_classe' => $eleve->classe?->categorie_classe ?? 'Categorie de la classe inconnue',
                'photo' => null,
                'age' => null,
                'school' => $eleve->classe?->nom ?? 'Établissement inconnu',
                'matricule' => $eleve->numero_matricule
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

}