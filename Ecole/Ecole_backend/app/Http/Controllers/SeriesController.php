<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Eleves;
use App\Models\Matieres;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SeriesController extends Controller
{

    /**
     * SeriesController constructor.
     */


    public function index(){
        return Series::all();
    }

    /**
     * @property \Illuminate\Database\Eloquent\Collection|\App\Models\Series[] $series
     */

    // Récupérer toutes les classes avec leurs séries
    /*public function Classe_avec_series()
    {
        // Récupère toutes les classes avec leurs séries associées
        return Classes::with('series')->get();

    }*/


public function Classe_avec_series()
{
    // Récupérer toutes les classes
    $classes = \App\Models\Classes::all();

    // Pour chaque classe, récupérer les séries distinctes via la table pivot
    $result = $classes->map(function($classe) {
        $series = DB::table('serie_matieres')
            ->join('series', 'serie_matieres.serie_id', '=', 'series.id')
            ->where('serie_matieres.classe_id', $classe->id)
            ->select('series.id', 'series.nom')
            ->distinct()
            ->get();

        return [
            'id' => $classe->id,
            'nom_classe' => $classe->nom_classe,
            'categorie_classe' => $classe->categorie_classe,
            'series' => $series
        ];
    });

    return response()->json($result);
}

    //Recuperer toutes les series assciées à une classe spécifique

    // Crée une nouvelle série
    /**
     * Store a newly created series in storage.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request) {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:series,nom'
        ]);

        try {
            $serie = Series::create($validated);
            return response()->json($serie, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => "Erreur lors de la création de la série",
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // Affiche une serie spécifique
    public function show($id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        return response()->json($serie, 200);
    }

    // Met à jour une serie spécifique
    public function update(Request $request, $id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validatedData = $request->validate([
            'nom'=>'string|required'
        ]);

        $serie->update($validatedData);

        return response()->json($serie, 200);
    }

    // Supprime une serie spécifique
    public function destroy($id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $serie->delete();

        return response()->json(['message' => 'Serie supprimée'], 200);
    }


    // Récupère les eleves d'une série spécifique
    public function getEleves($id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $eleves = $serie->eleves;

        return response()->json($eleves, 200);
    }

    // Récupère les matières d'une série spécifique
    public function getMatieres($id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $matieres = $serie->matieres;

        return response()->json($matieres, 200);
    }

    // Récupère les élèves d'une série spécifique par matière
    public function getElevesByMatiere($id, $matiere_id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $eleves = $serie->eleves()->whereHas('matieres', function ($query) use ($matiere_id) {
            $query->where('matiere_id', $matiere_id);
        })->get();

        return response()->json($eleves, 200);
    }

    // Récupère les matières d'une série spécifique par élève
    public function getMatieresByEleve($id, $eleve_id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $matieres = $serie->matieres()->whereHas('eleves', function ($query) use ($eleve_id) {
            $query->where('eleve_id', $eleve_id);
        })->get();

        return response()->json($matieres, 200);
    }

    // Récupère les élèves d'une série spécifique par classe
    public function getElevesByClasse($id, $classe_id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $eleves = $serie->eleves()->where('class_id', $classe_id)->get();

        return response()->json($eleves, 200);
    }

    // Récupère la moyenne générale d'un élève dans une série spécifique
    public function getMoyenneGeneraleByEleve($id, $eleve_id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $moyenne = $serie->calculMoyenneGenerale($eleve_id);

        if ($moyenne === null) {
            return response()->json(['message' => 'Aucune note trouvée pour cet élève dans cette série'], 404);
        }

        return response()->json(['moyenne' => $moyenne], 200);
    }

    // Récupère les élèves associés à une série spécifique
    public function getElevesBySerie($id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $eleves = $serie->eleves;

        return response()->json($eleves, 200);
    }

    // Récupère les matières associées à une série spécifique
    public function getMatieresBySerie($id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $matieres = $serie->matieres;

        return response()->json($matieres, 200);
    }

    // Récupère les séries associées à un élève spécifique
    public function getSeriesByEleve($eleve_id)
    {
        $eleve = Eleves::find($eleve_id);

        if (!$eleve) {
            return response()->json(['message' => 'Élève non trouvé'], 404);
        }

        $series = $eleve->serie;

        return response()->json($series, 200);
    }

    // Récupère les séries associées à une classe spécifique
    public function getSeriesByClasse($classe_id)
    {
        $eleves = Eleves::where('class_id', $classe_id)->get();

        if ($eleves->isEmpty()) {
            return response()->json(['message' => 'Aucun élève trouvé dans cette classe'], 404);
        }

        $series = Series::whereIn('id', $eleves->pluck('serie_id'))->distinct()->get();

        return response()->json($series, 200);
    }

    // Récupère les séries associées à une matière spécifique
    public function getSeriesByMatiere($matiere_id)
    {
        $matieres = Matieres::find($matiere_id);

        if (!$matieres) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $series = $matieres->series;

        return response()->json($series, 200);
    }


    /*public function attachMatiere(Request $request, $id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validated = $request->validate([
            'matiere_id' => 'required|exists:matieres,id',
            'coefficient' => 'required|numeric|min:0.1|max:10'
        ]);

        // Vérifier si la matière est déjà attachée
        if ($serie->matieres()->where('matiere_id', $validated['matiere_id'])->exists()) {
            return response()->json(['message' => 'Cette matière est déjà associée à cette série'], 409);
        }

        $serie->matieres()->attach($validated['matiere_id'], [
            'coefficient' => $validated['coefficient']
        ]);

        return response()->json(['message' => 'Matière ajoutée à la série avec succès'], 201);
    }*/

    /**
     * Met à jour le coefficient d'une matière dans une série
     *
     * @param Request $request
     * @param int $id
     * @param int $matiere_id
     * @return \Illuminate\Http\JsonResponse
     */
    /*public function updateMatiereCoefficient(Request $request, $id, $matiere_id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validated = $request->validate([
            'coefficient' => 'required|numeric|min:0.1|max:10'
        ]);

        // Vérifier si la matière est attachée à la série
        if (!$serie->matieres()->where('matiere_id', $matiere_id)->exists()) {
            return response()->json(['message' => 'Cette matière n\'est pas associée à cette série'], 404);
        }

        $serie->matieres()->updateExistingPivot($matiere_id, [
            'coefficient' => $validated['coefficient']
        ]);

        return response()->json(['message' => 'Coefficient mis à jour avec succès'], 200);
    }*/

    /**
     * Détache une matière d'une série
     *
     * @param int $id
     * @param int $matiere_id
     * @return \Illuminate\Http\JsonResponse
     */
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

    /**
     * Synchronise les matières d'une série (remplace toutes les associations)
     *
     * @param Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function syncMatieres(Request $request, $id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $validated = $request->validate([
            'matieres' => 'required|array',
            'matieres.*.matiere_id' => 'required|exists:matieres,id',
            'matieres.*.classe_id' => 'required|exists:classes,id', // Ajout de la validation
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
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'error' => $e->getMessage()
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
        $classe = Classes::with(['series.matieres.enseignants' => function($query) use ($serieId) {
            $query->where('series.id', $serieId);
        }])->findOrFail($classeId);

        $serie = $classe->series->find($serieId);

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
            'matieres.*.classe_id' => 'required|exists:classes,id',
            'matieres.*.serie_id' => 'required|exists:series,id',
            'matieres.*.matiere_id' => 'required|exists:matieres,id',
            'matieres.*.enseignants' => 'array',
            'matieres.*.enseignants.*' => 'exists:enseignants,id'
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
            'classes.*.classe_id' => 'required|exists:classes,id',
            'classes.*.enseignants_martenel_primaire' => 'array',
            'classes.*.enseignants.*' => 'exists:enseignants_martenel_primaire,id'
        ]);

        $classe = Classes::findOrFail($classeId);
        //$serie = $classe->series()->findOrFail($serieId);

        // On suppose qu'il n'y a qu'une entrée dans le tableau classes
        $enseignants = $request->classes[0]['enseignants'] ?? [];

        $classe->enseignantsMP()->sync($enseignants);

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
            'matiere_id' => 'required|exists:matieres,id',
            'classe_id' => 'required|exists:classes,id',
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
        'classe_id' => 'required|exists:classes,id',
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


