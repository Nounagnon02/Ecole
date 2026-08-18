<?php

namespace App\Http\Controllers\Series;

use App\Http\Controllers\Controller;
use App\Models\Classes;
use App\Models\EnseignantsMaternellePrimaire;
use App\Models\Series;
use Illuminate\Http\Request;

class SeriesMatieresController extends Controller
{
    public function detachMatiere($id, $matiere_id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        // Vérifier si la matière est attachée à la série
        if (!$serie->matieres()->where('matiere_id', $matiere_id)->exists()) {
            return response()->json(['message' => 'Cette matière n\'est pas associée à cette série'], 404);
        }

        $serie->matieres()->detach($matiere_id);

        return response()->json(['message' => 'Matière retirée de la série avec succès'], 200);
    }

    public function syncMatieres(Request $request, $id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validated = $request->validate([
            'matieres' => 'required|array',
            'matieres.*.matiere_id' => 'required|school_exists:matieres,id',
            'matieres.*.classe_id' => 'required|school_exists:classes,id', // Ajout de la validation
            'matieres.*.coefficient' => 'required|numeric|min:0.1|max:10'
        ]);

        $syncData = [];
        foreach ($validated['matieres'] as $matiere) {
            // Vérification supplémentaire pour s'assurer que classe_id existe
            if (!isset($matiere['classe_id'])) {
                continue; // Ou retourner une erreur
            }

            $syncData[$matiere['matiere_id']] = [
                'classe_id' => $matiere['classe_id'],
                'coefficient' => $matiere['coefficient']
            ];
        }

        try {
            $serie->matieres()->sync($syncData);

            return response()->json([
                'success' => true,
                'message' => 'Matières synchronisées avec succès'
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    // Méthode pour récupérer les matières avec coefficients par classe
    public function getMatieresWithCoefficients(Request $request, $id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $classeId = $request->query('classe_id');

        $query = $serie->matieres()
            ->when($classeId, function($query) use ($classeId) {
                return $query->wherePivot('classe_id', $classeId);
            })
            ->select('matieres.id', 'matieres.nom', 'serie_matieres.coefficient');

        $matieres = $query->get();

        return response()->json($matieres, 200);
    }

    // Récupère les matières d'une série dans une classe avec leurs enseignants
    public function getMatieresSC($classeId, $serieId)
    {
        $classe = Classes::with(['series' => function($query) use ($serieId) {
            $query->where('series.id', $serieId)
                ->with('matieres.enseignants');
        }])->findOrFail($classeId);

        $serie = $classe->series->first();

        if (!$serie) {
            return response()->json(['message' => 'Série non trouvée'], 404);
        }

        return response()->json($serie->matieres);
    }

    // Met à jour les enseignants pour les matières d'une série dans une classe
    public function updateEnseignants(Request $request, $classeId, $serieId)
    {
        $request->validate([
            'matieres' => 'required|array',
            'matieres.*.classe_id' => 'required|school_exists:classes,id',
            'matieres.*.serie_id' => 'required|school_exists:series,id',
            'matieres.*.matiere_id' => 'required|school_exists:matieres,id',
            'matieres.*.enseignants' => 'array',
            'matieres.*.enseignants.*' => 'school_exists:enseignants,id'
        ]);

        $classe = Classes::findOrFail($classeId);
        $serie = $classe->series()->findOrFail($serieId);

        

        foreach ($request->matieres as $matiereData) {
            $matiere = $serie->matieres()->findOrFail($matiereData['matiere_id']);

            // Préparer le tableau pour sync avec données pivot
            $syncData = [];
            foreach ($matiereData['enseignants'] ?? [] as $enseignantId) {
                $syncData[$enseignantId] = [
                    'classe_id' => $matiereData['classe_id'],
                    'serie_id' => $matiereData['serie_id'],
                ];
            }

            $matiere->enseignants()->sync($syncData);
        }

        return response()->json([
            'success' => true,
            'message' => 'Enseignants mis à jour avec succès'
        ]);
    }

    public function updateEnseignantsMP(Request $request, $classeId)
    {
        $request->validate([
            'classes' => 'required|array',
            'classes.*.classe_id' => 'required|school_exists:classes,id',
            'classes.*.enseignants' => 'array',
            'classes.*.enseignants.*' => 'school_exists:enseignants_maternelle_primaire,id'
        ]);

        $classe = Classes::findOrFail($classeId);

        // On suppose qu'il n'y a qu'une entrée dans le tableau classes
        $enseignants = $request->classes[0]['enseignants'] ?? [];

        // Source de vérité : `classe_id` du profil M/P. L'ancien pivot
        // `enseignantmp_classe` pointe (migration défectueuse) vers la table
        // `enseignants` et ne peut jamais contenir un enseignant M/P (même
        // contrat que EnseignantsMaternellePrimaireController::storeAffectation).
        EnseignantsMaternellePrimaire::whereKey($enseignants)
            ->where('classe_id', '!=', $classe->id)
            ->update(['classe_id' => $classe->id]);

        return response()->json([
            'success' => true,
            'message' => 'Enseignants mis à jour avec succès'
        ]);
    }

    public function attachMatiere(Request $request, $id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validated = $request->validate([
            'matiere_id' => 'required|school_exists:matieres,id',
            'classe_id' => 'required|school_exists:classes,id',
            'coefficient' => 'required|numeric|min:0.1|max:10'
        ]);

        // Vérifier si la matière est déjà attachée à cette classe dans cette série
        if ($serie->matieres()
            ->where('matiere_id', $validated['matiere_id'])
            ->wherePivot('classe_id', $validated['classe_id'])
            ->exists()) {
            return response()->json(['message' => 'Cette matière est déjà associée à cette classe dans cette série'], 409);
        }

        $serie->matieres()->attach($validated['matiere_id'], [
            'classe_id' => $validated['classe_id'],
            'coefficient' => $validated['coefficient']
        ]);

        return response()->json(['message' => 'Matière ajoutée à la série avec succès'], 201);
    }

    public function updateMatiereCoefficient(Request $request, $id, $matiere_id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validated = $request->validate([
            'classe_id' => 'required|school_exists:classes,id',
            'coefficient' => 'required|numeric|min:0.1|max:10'
        ]);

        // Mettre à jour le coefficient pour la classe spécifique
        $serie->matieres()
            ->where('matiere_id', $matiere_id)
            ->wherePivot('classe_id', $validated['classe_id'])
            ->updateExistingPivot($matiere_id, [
                'coefficient' => $validated['coefficient']
            ]);

        return response()->json(['message' => 'Coefficient mis à jour avec succès'], 200);
    }

    public function getAllClassesWithSeriesAndMatieres()
    {
        return Classes::with(['series' => function($query) {
            $query->with(['matieres' => function($q) {
                $q->select('matieres.id', 'matieres.nom')
                ->withPivot('coefficient');
            }]);
        }])->get()->map(function($classe) {
            return [
                'id' => $classe->id,
                'nom' => $classe->nom_classe,
                'series' => $classe->series->map(function($serie) use ($classe) {
                    return [
                        'id' => $serie->id,
                        'nom' => $serie->nom,
                        'matieres' => $serie->matieres->map(function($matiere) {
                            return [
                                'id' => $matiere->id,
                                'nom' => $matiere->nom,
                                'coefficient' => $matiere->pivot->coefficient
                            ];
                        })
                    ];
                })
            ];
        });
    }
}
