<?php

namespace App\Http\Controllers;

use App\Models\Enseignants;
use App\Models\Enseignants_Martenel_Primaire;
use App\Models\Classe;
use App\Models\Note;
use App\Models\EmploiDuTemps;
use Illuminate\Http\Request;

/**
 * Contrôleur unifié pour la gestion des enseignants (listes et fonctionnalités individuelles)
 */
class EnseignantController extends Controller
{
    /**
     * Récupérer la liste des enseignants (Secondaire)
     */
    public function index(Request $request)
    {
        $query = Enseignants::query();

        if ($request->has('with_matieres')) {
            $query->with('matieres');
        }

        $enseignants = $query->get();

        return response()->json($enseignants);
    }

    /**
     * Récupérer la liste des enseignants (Maternelle/Primaire)
     */
    public function getEnseignantsMP(Request $request)
    {
        $query = Enseignants_Martenel_Primaire::query();

        if ($request->has('with_classes')) {
            $query->with('classes');
        }

        $enseignants = $query->get();

        return response()->json($enseignants);
    }
    
    /**
     * Effectifs des enseignants par niveau
     */
    public function getEffectifMaternelle() {
        return response()->json(
            Enseignants_Martenel_Primaire::where('role', 'enseignementM')->count()
        );
    }
    
    public function getEffectifPrimaire() {
        return response()->json(
            Enseignants_Martenel_Primaire::where('role', 'enseignementP')->count()
        );
    }
    
    public function getEffectifSecondaire() {
        return response()->json(Enseignants::count());
    }
    /**
     * Récupérer les classes d'un enseignant
     */
    public function getClasses($id)
    {
        try {
            $enseignant = Enseignants::with('classes.eleves')->findOrFail($id);
            return response()->json([
                'success' => true,
                'data' => $enseignant->classes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Enseignant non trouvé'
            ], 404);
        }
    }

    /**
     * Récupérer l'emploi du temps d'un enseignant
     */
    public function getEmploiTemps($id)
    {
        try {
            $emploiDuTemps = EmploiDuTemps::where('enseignant_id', $id)
                ->with(['classe', 'matiere'])
                ->orderBy('jour')
                ->orderBy('heure_debut')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $emploiDuTemps
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'emploi du temps'
            ], 500);
        }
    }

    /**
     * Récupérer les classes de l'enseignant connecté
     */
    public function classes(Request $request)
    {
        $user = $request->user();
        
        if (!$user || !$user->enseignant) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non authentifié ou n\'est pas un enseignant'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data' => $user->enseignant->classes()->with('eleves')->get()
        ]);
    }

    /**
     * Récupérer les notes saisies par l'enseignant connecté
     */
    public function notes(Request $request)
    {
        $user = $request->user();
        
        if (!$user || !$user->enseignant) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non authentifié ou n\'est pas un enseignant'
            ], 401);
        }

        $notes = Note::where('enseignant_id', $user->enseignant->id)
            ->with(['eleve', 'matiere', 'classe'])
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notes
        ]);
    }
}
