<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\EnseignantsMaternellePrimaire;
use Illuminate\Http\Request;

/**
 * Affectations Maternelle / Primaire.
 *
 * Un enseignant M/P enseigne une classe entière : pas de « matière » ni de
 * « série » au sens du secondaire. Le modèle porte déjà sa classe (`class_id`,
 * non nullable) — le même contrat qu'`EnseignantController::affectations`,
 * réduit à l'essentiel : lister les enseignants avec leur classe, et
 * affecter/déplacer un enseignant vers une classe.
 */
class EnseignantsMaternellePrimaireController extends Controller
{
    /**
     * Liste des enseignants M/P avec leur classe.
     * GET /enseignants-mp
     */
    public function index()
    {
        $enseignants = EnseignantsMaternellePrimaire::with([
            'user:id,name,prenom',
            'classe:id,nom_classe,categorie_classe',
        ])->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => $enseignants,
        ]);
    }

    /**
     * Détail d'un enseignant M/P.
     * GET /enseignants-mp/{id}
     */
    public function show($id)
    {
        $enseignant = EnseignantsMaternellePrimaire::with([
            'user:id,name,prenom,email',
            'classe:id,nom_classe,categorie_classe',
        ])->find($id);

        if (!$enseignant) {
            return response()->json(['message' => 'Enseignant non trouvé'], 404);
        }

        return response()->json(['success' => true, 'data' => $enseignant]);
    }

    /**
     * Affecter (ou déplacer) un enseignant M/P vers une classe.
     * POST /enseignants-mp/{id}/affectation — body { class_id }
     */
    public function storeAffectation(Request $request, $id)
    {
        $enseignant = EnseignantsMaternellePrimaire::find($id);
        if (!$enseignant) {
            return response()->json(['message' => 'Enseignant non trouvé'], 404);
        }

        $validated = $request->validate([
            'class_id' => 'required|school_exists:classes,id',
        ]);

        // Source de vérité : `class_id` du profil. L'ancien pivot
        // `enseignantmp_classe` pointe (migration défectueuse) vers la table
        // `enseignants` et ne peut jamais contenir un enseignant M/P : on ne
        // le synchronise pas.
        $classe = Classes::find($validated['class_id']);

        $enseignant->class_id = $classe->id;
        $enseignant->save();

        return response()->json([
            'success' => true,
            'message' => 'Affectation enregistrée',
            'data' => $enseignant->fresh([
                'user:id,name,prenom',
                'classe:id,nom_classe,categorie_classe',
            ]),
        ], 201);
    }
}
