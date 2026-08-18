<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Models\Notes;
use App\Models\Eleve;
use App\Models\Classes;
use App\Models\Matieres;
use Illuminate\Http\Request;

class NotesQueryController extends Controller
{
    use NotesHelpers;

    /**
     * Lister les notes d'un élève pour une période donnée
     */
    public function getNotesEleve($eleveId, $periode = null)
    {
        $eleve = Eleve::find($eleveId);
        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Élève non trouvé'], 404);
        }
        $this->authorize('view', $eleve);

        try {
            $query = Notes::where('eleve_id', $eleveId)
                        ->with(['matiere', 'classe']);

            if ($periode) {
                $query->where('periode', $periode);
            }

            $notes = $query->orderBy('date_evaluation', 'desc')->get();

            // Grouper les notes par matière
            $notesGroupees = $notes->groupBy('matiere.nom');

            return response()->json([
                'success' => true,
                'data' => $notesGroupees
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des notes',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des notes pour un élève
     */
    public function getStatistiquesEleve($eleveId, $periode)
    {
        try {
            $eleve = Eleve::with(['notes' => function($query) use ($periode) {
                $query->where('periode', $periode)->with('matiere');
            }])->find($eleveId);

            if (!$eleve) {
                return response()->json([
                    'success' => false,
                    'message' => 'Élève non trouvé'
                ], 404);
            }

            $this->authorize('view', $eleve);

            $statistiques = [
                'eleve' => $eleve->full_name,
                'classe' => $eleve->classe->nom_classe,
                'periode' => $periode,
                'moyenne_generale' => $eleve->getMoyenneGenerale($periode),
                'nombre_matieres' => $eleve->notes->groupBy('matiere_id')->count(),
                'total_notes' => $eleve->notes->count(),
                'repartition_types' => [
                    'Devoir1' => $eleve->notes->where('type_evaluation', 'Devoir1')->count(),
                    'Devoir2' => $eleve->notes->where('type_evaluation', 'Devoir2')->count(),
                    'Interrogation' => $eleve->notes->where('type_evaluation', 'Interrogation')->count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $statistiques
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    /**
     * Vérifier le nombre de notes restantes pour un type d'évaluation
     */
    public function checkNotesRestantes($eleveId, $matiereId, $typeEvaluation, $periode)
    {
        $eleve = Eleve::find($eleveId);
        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Élève non trouvé'], 404);
        }
        $this->authorize('view', $eleve);

        try {
            $nombreExistant = Notes::where('eleve_id', $eleveId)
                                ->where('matiere_id', $matiereId)
                                ->where('type_evaluation', $typeEvaluation)
                                ->where('periode', $periode)
                                ->count();

            $limiteMax = $typeEvaluation === 'Interrogation' ? 4 : 1;
            $restantes = $limiteMax - $nombreExistant;

            return response()->json([
                'success' => true,
                'data' => [
                    'type_evaluation' => $typeEvaluation,
                    'nombre_existant' => $nombreExistant,
                    'limite_max' => $limiteMax,
                    'notes_restantes' => max(0, $restantes),
                    'peut_ajouter' => $restantes > 0
                ]
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la vérification',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    // Méthodes pour obtenir les données nécessaires aux formulaires
    public function getClasses()
    {
        $classes = Classes::select('id', 'nom', 'niveau')->orderBy('niveau')->orderBy('nom')->get();
        return response()->json($classes);
    }

    public function getMatieres()
    {
        $matieres = Matieres::select('id', 'nom', 'code')->orderBy('nom')->get();
        return response()->json($matieres);
    }

    public function getElevesByClasse($classeId)
    {
        $eleves = Eleve::with('user:id,name,prenom')
            ->where('classe_id', $classeId)
            ->get(['id', 'user_id', 'numero_matricule'])
            ->map(fn($e) => [
                'id' => $e->id,
                'nom' => $e->user->name ?? '',
                'prenom' => $e->user->prenom ?? '',
                'numero_matricule' => $e->numero_matricule,
            ])
            ->sortBy([['nom', 'asc'], ['prenom', 'asc']])
            ->values();

        return response()->json($eleves);
    }
}
