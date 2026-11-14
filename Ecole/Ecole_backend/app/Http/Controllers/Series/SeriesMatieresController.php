<?php

namespace App\Http\Controllers\Series;

use App\Http\Controllers\Controller;
use App\Http\Requests\Series\AttachMatiereRequest;
use App\Http\Requests\Series\SyncMatieresRequest;
use App\Http\Requests\Series\UpdateEnseignantsMPRequest;
use App\Http\Requests\Series\UpdateEnseignantsRequest;
use App\Http\Requests\Series\UpdateMatiereCoefficientRequest;
use App\Models\Classes;
use App\Models\EnseignantMatiere;
use App\Models\EnseignantsMaternellePrimaire;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SeriesMatieresController extends Controller
{
    public function detachMatiere(Request $request, $id, $matiere_id)
    {
        $serie = Series::find($id);

        if (! $serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        // Avec `classe_id`, la matière ne quitte que cette classe : sans lui,
        // retirer les maths de la 6ème les retirait de toutes les classes de
        // la série (audit du 14/11, N-08). Sans `classe_id`, comportement
        // inchangé pour les appels existants.
        $relation = $serie->matieres();
        if ($classeId = $request->query('classe_id')) {
            $relation->wherePivot('classe_id', $classeId);
        }

        // Vérifier si la matière est attachée à la série
        if (! (clone $relation)->where('matiere_id', $matiere_id)->exists()) {
            return response()->json(['message' => 'Cette matière n\'est pas associée à cette série'], 404);
        }

        $relation->detach($matiere_id);

        return response()->json(['message' => 'Matière retirée de la série avec succès'], 200);
    }

    /**
     * Programme d'une classe : pour chaque série, ses matières et leur
     * coefficient (audit du 14/11, N-08). La direction le configurait sans
     * pouvoir le relire ailleurs qu'en base. La classe est cherchée dans
     * l'école de l'utilisateur (404 sinon).
     */
    public function programmeClasse($classeId)
    {
        $classe = Classes::findOrFail($classeId);

        $lignes = DB::table('serie_matieres')
            ->join('series', 'series.id', '=', 'serie_matieres.serie_id')
            ->join('matieres', 'matieres.id', '=', 'serie_matieres.matiere_id')
            ->where('serie_matieres.classe_id', $classe->id)
            ->where('series.ecole_id', $classe->ecole_id)
            ->orderBy('series.nom')
            ->orderBy('matieres.nom')
            ->get(['series.id as serie_id', 'series.nom as serie_nom', 'matieres.id as matiere_id', 'matieres.nom as matiere_nom', 'serie_matieres.coefficient']);

        return response()->json([
            'success' => true,
            'classe' => ['id' => $classe->id, 'nom' => $classe->nom_classe],
            'data' => $lignes->map(fn ($l) => [
                'serie_id' => (int) $l->serie_id,
                'serie_nom' => $l->serie_nom,
                'matiere_id' => (int) $l->matiere_id,
                'matiere_nom' => $l->matiere_nom,
                'coefficient' => (float) $l->coefficient,
            ])->values(),
        ]);
    }

    public function syncMatieres(SyncMatieresRequest $request, $id)
    {
        $serie = Series::find($id);

        if (! $serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validated = $request->validated();

        $syncData = [];
        foreach ($validated['matieres'] as $matiere) {
            // Vérification supplémentaire pour s'assurer que classe_id existe
            if (! isset($matiere['classe_id'])) {
                continue; // Ou retourner une erreur
            }

            $syncData[$matiere['matiere_id']] = [
                'classe_id' => $matiere['classe_id'],
                'coefficient' => $matiere['coefficient'],
            ];
        }

        try {
            $serie->matieres()->sync($syncData);

            return response()->json([
                'success' => true,
                'message' => 'Matières synchronisées avec succès',
            ], 200);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'error' => $this->clientErrorMessage($e),
            ], 500);
        }
    }

    // Méthode pour récupérer les matières avec coefficients par classe
    public function getMatieresWithCoefficients(Request $request, $id)
    {
        $serie = Series::find($id);

        if (! $serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $classeId = $request->query('classe_id');

        // Pas de `->when()` ici : son callback reçoit le query builder brut
        // de la relation, pas l'objet `BelongsToMany` — `wherePivot()` n'y
        // existe pas, et l'appel manquant est réinterprété par le magic
        // `__call` de Laravel comme une clause dynamique `where('pivot', ...)`
        // sur une colonne qui n'existe pas. Le filtre `classe_id` ne
        // retournait donc jamais aucune ligne. `wherePivot()` appelé
        // directement sur la relation, elle, fonctionne.
        // Pas de `->when()` ici : son callback reçoit le query builder brut
        // de la relation, pas l'objet `BelongsToMany` — `wherePivot()` n'y
        // existe pas, et l'appel manquant est réinterprété par le magic
        // `__call` de Laravel comme une clause dynamique `where('pivot', ...)`
        // sur une colonne qui n'existe pas. Le filtre `classe_id` ne
        // retournait donc jamais aucune ligne. `wherePivot()` appelé
        // directement sur la relation, elle, fonctionne.
        $query = $serie->matieres()->select('matieres.id', 'matieres.nom', 'serie_matieres.coefficient');

        if ($classeId) {
            $query->wherePivot('classe_id', $classeId);
        }

        $matieres = $query->get();

        return response()->json($matieres, 200);
    }

    // Récupère les matières d'une série dans une classe avec leurs enseignants
    public function getMatieresSC($classeId, $serieId)
    {
        $classe = Classes::with(['series' => function ($query) use ($serieId) {
            $query->where('series.id', $serieId)
                ->with('matieres.enseignants');
        }])->findOrFail($classeId);

        $serie = $classe->series->first();

        if (! $serie) {
            return response()->json(['message' => 'Série non trouvée'], 404);
        }

        return response()->json($serie->matieres);
    }

    // Met à jour les enseignants pour les matières d'une série dans une classe
    public function updateEnseignants(UpdateEnseignantsRequest $request, $classeId, $serieId)
    {
        $classe = Classes::findOrFail($classeId);
        $serie = $classe->series()->findOrFail($serieId);

        // Remplacer les enseignants de CETTE classe et de CETTE série seulement.
        // Un `sync()` sur la matière, toutes classes confondues, effaçait les
        // affectations des autres classes (affecter en 5ème retirait
        // l'enseignant de 6ème) et interdisait à un enseignant de tenir la
        // même matière dans deux classes. La classe est celle de l'adresse,
        // pas celle du corps de la requête.
        DB::transaction(function () use ($request, $serie, $classe) {
            foreach ($request->matieres as $matiereData) {
                $matiere = $serie->matieres()->findOrFail($matiereData['matiere_id']);

                EnseignantMatiere::where('matiere_id', $matiere->id)
                    ->where('classe_id', $classe->id)
                    ->where('serie_id', $serie->id)
                    ->delete();

                foreach (array_unique($matiereData['enseignants'] ?? []) as $enseignantId) {
                    EnseignantMatiere::create([
                        'enseignant_id' => $enseignantId,
                        'matiere_id' => $matiere->id,
                        'classe_id' => $classe->id,
                        'serie_id' => $serie->id,
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Enseignants mis à jour avec succès',
        ]);
    }

    public function updateEnseignantsMP(UpdateEnseignantsMPRequest $request, $classeId)
    {
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
            'message' => 'Enseignants mis à jour avec succès',
        ]);
    }

    public function attachMatiere(AttachMatiereRequest $request, $id)
    {
        $serie = Series::find($id);

        if (! $serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validated = $request->validated();

        // Vérifier si la matière est déjà attachée à cette classe dans cette série
        if ($serie->matieres()
            ->where('matiere_id', $validated['matiere_id'])
            ->wherePivot('classe_id', $validated['classe_id'])
            ->exists()) {
            return response()->json(['message' => 'Cette matière est déjà associée à cette classe dans cette série'], 409);
        }

        $serie->matieres()->attach($validated['matiere_id'], [
            'classe_id' => $validated['classe_id'],
            'coefficient' => $validated['coefficient'],
        ]);

        return response()->json(['message' => 'Matière ajoutée à la série avec succès'], 201);
    }

    public function updateMatiereCoefficient(UpdateMatiereCoefficientRequest $request, $id, $matiere_id)
    {
        $serie = Series::find($id);

        if (! $serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validated = $request->validated();

        // Mettre à jour le coefficient pour la classe spécifique
        $serie->matieres()
            ->where('matiere_id', $matiere_id)
            ->wherePivot('classe_id', $validated['classe_id'])
            ->updateExistingPivot($matiere_id, [
                'coefficient' => $validated['coefficient'],
            ]);

        return response()->json(['message' => 'Coefficient mis à jour avec succès'], 200);
    }

    public function getAllClassesWithSeriesAndMatieres()
    {
        return Classes::with(['series' => function ($query) {
            $query->with(['matieres' => function ($q) {
                $q->select('matieres.id', 'matieres.nom')
                    ->withPivot('coefficient');
            }]);
        }])->get()->map(function ($classe) {
            return [
                'id' => $classe->id,
                'nom' => $classe->nom_classe,
                'series' => $classe->series->map(function ($serie) {
                    return [
                        'id' => $serie->id,
                        'nom' => $serie->nom,
                        'matieres' => $serie->matieres->map(function ($matiere) {
                            return [
                                'id' => $matiere->id,
                                'nom' => $matiere->nom,
                                'coefficient' => $matiere->pivot->coefficient,
                            ];
                        }),
                    ];
                }),
            ];
        });
    }
}
