<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use App\Models\Series;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

use Illuminate\Http\Request;

class ClassesController extends Controller
{
    //
    public function store(Request $request)
    {
        try {
                $validated = $request->validate([
                    'nom_classe' => 'required|string',
                    'categorie_classe' => 'required|string',
                    ]);

                $classe = Classes::create([
                    'nom_classe' => $validated['nom_classe'],
                    'categorie_classe' => $validated['categorie_classe']

                ]);

                event(new Registered($classe));
                return response()->json($classe, 201);

            }
            catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'ajout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getEffectifEcole(){
        $effectif = Classes::count();
        return response()->json($effectif);
    }

    public function getEffectifMaternelle(){
        $effectif = Classes::where('categorie_classe', 'Maternelle')->count();
        return response()->json($effectif);
    }

    public function getEffectifPrimaire(){
        $effectif = Classes::where('categorie_classe', 'Primaire')->count();
        return response()->json($effectif);
    }

    public function getEffectifSecondaire(){
        $effectif = Classes::where('categorie_classe', 'Secondaire')->count();
        return response()->json($effectif);
    }

    public function series():  \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Series::class, 'classe_series', 'classe_id', 'serie_id');
    }


public function attachMatieres(Request $request, $id)
{
    try {
        $classe = Classes::findOrFail($id);

        $validated = $request->validate([
            'matieres' => 'required|array',
            'matieres.*.id' => 'required|exists:matieres,id',
            'categorie_classe' => 'required|string'
        ]);

        $matieresData = collect($validated['matieres'])->mapWithKeys(function ($matiere) use ($validated) {
            return [$matiere['id'] => ['categorie_classe' => $validated['categorie_classe']]];
        });

        $classe->matieres()->sync($matieresData);

        return response()->json([
            'message' => 'Matières attachées avec succès',
            'classe' => $classe->load('matieres')
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de l\'attachement des matières',
            'error' => $e->getMessage()
        ], 500);
    }
}

//Récupérer toutes les classes avec leurs séries et matières
public function getClassesWithSeriesAndMatieres()
{
    return Classes::with(['series' => function($query) {
        $query->select('series.id', 'series.nom')
                ->distinct()
                ->with(['matieres' => function($q) {
                    $q->select('matieres.id', 'matieres.nom')
                    ->withPivot('coefficient');
                }]);
    }])->get()->map(function($classe) {
        return [
            'id' => $classe->id,
            'nom_classe' => $classe->nom_classe,
            'series' => $classe->series->unique('id')->map(function($serie) {
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
            })->values()
        ];
    });
}
//Récupérer les classes de la maternelle avec leurs séries et matières
public function getClassesWithSeriesAndMatieresMaternelle()
{
    return Classes::where('categorie_classe', 'Maternelle')->with(['series' => function($query) {
        $query->select('series.id', 'series.nom')
                ->distinct()
                ->with(['matieres' => function($q) {
                    $q->select('matieres.id', 'matieres.nom')
                    ->withPivot('coefficient');
                }]);
    }])->get()->map(function($classe) {
        return [
            'id' => $classe->id,
            'nom' => $classe->nom_classe,
            'series' => $classe->series->unique('id')->map(function($serie) {
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
            })->values()
        ];
    });
}

public function getClassesWithSeriesAndMatieresPrimaire()
{
    return Classes::where('categorie_classe', 'Primaire')->with(['series' => function($query) {
        $query->select('series.id', 'series.nom')
                ->distinct()
                ->with(['matieres' => function($q) {
                    $q->select('matieres.id', 'matieres.nom')
                    ->withPivot('coefficient');
                }]);
    }])->get()->map(function($classe) {
        return [
            'id' => $classe->id,
            'nom' => $classe->nom_classe,
            'series' => $classe->series->unique('id')->map(function($serie) {
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
            })->values()
        ];
    });
}

public function getClassesWithSeriesAndMatieresSecondaire()
{
    return Classes::where('categorie_classe', 'Secondaire')->with(['series' => function($query) {
        $query->select('series.id', 'series.nom')
                ->distinct()
                ->with(['matieres' => function($q) {
                    $q->select('matieres.id', 'matieres.nom')
                    ->withPivot('coefficient');
                }]);
    }])->get()->map(function($classe) {
        return [
            'id' => $classe->id,
            'nom' => $classe->nom_classe,
            'series' => $classe->series->unique('id')->map(function($serie) {
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
            })->values()
        ];
    });
}

//Récupérer les classes avec leur effectif, catégorie

public function getClassesWithEffectifM()
{
    // Récupère l'effectif de chaque classe de la maternelle
    $classes = Classes::withCount('eleves')
        ->get()
        ->map(function($classe) {
            return [
                'id' => $classe->id,
                'nom_classe' => $classe->nom_classe,
                'categorie_classe' => $classe->categorie_classe,
                'effectif' => $classe->eleves_count,
                // Ajout  du nom  de l'enseignants
                'enseignants' => $classe->enseignantsMP->map(function($enseignant) {
                    return [
                        'id' => $enseignant->id,
                        'nom' => $enseignant->nom,
                        'prenom' => $enseignant->prenom
                    ];
                })->values()
            ];
        });

    Log::info('Toutes les Classes avec effectif', ['classes' => $classes]);

    return response()->json($classes, 200);
}

public function getClassesWithEffectifP(){
    //recuper l'effectif de chaque classe du primaire
    $classes = Classes::where('categorie_classe', 'Primaire')->withCount('eleves')->get()->map(function($classe) {
        return [
            'id' => $classe->id,
            'nom_classe' => $classe->nom_classe,
            'categorie_classe' => $classe->categorie_classe,
            'effectif' => $classe->eleves_count,
            'enseignants' => $classe->enseignantsMP->map(function($enseignant) {
                    return [
                        'id' => $enseignant->id,
                        'nom' => $enseignant->nom,
                        'prenom' => $enseignant->prenom
                    ];
                })->values()
        ];
    });

    Log::info($classes);

    return response()->json($classes);


}

public function getClassesWithEffectifS(){
    //recuper l'effectif de chaque classe du secondaire
    $classes = Classes::where('categorie_classe', 'Secondaire')->withCount('eleves')->get()->map(function($classe) {
        return [
            'id' => $classe->id,
            'nom_classe' => $classe->nom_classe,
            'categorie_classe' => $classe->categorie_classe,
            'effectif' => $classe->eleves_count,
            'enseignants' =>$classe->enseignants_count,
        ];
    });

    return response()->json($classes);

    Log::info($classes);
}







public function getMatieres($id)
{
    try {
        $classe = Classes::with('matieres')->findOrFail($id);
        return response()->json([
            'classe' => $classe->nom_classe,
            'categorie' => $classe->categorie_classe,
            'matieres' => $classe->matieres
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Erreur lors de la récupération des matières',
            'error' => $e->getMessage()
        ], 404);
    }
}


public function getSeries($id)
{
    $class = Classes::with('series')->find($id);
    if (!$class) {
        return response()->json(['message' => 'Classe non trouvée'], 404);
    }
    return response()->json($class->series, 200);
}

public function updateSeries(Request $request, $id)
{
    $class = Classes::find($id);
    if (!$class) {
        return response()->json(['message' => 'Classe non trouvée'], 404);
    }

    $validated = $request->validate([
        'series' => 'required|array',
        'series.*' => 'exists:series,id'
    ]);

    $class->series()->sync($validated['series']);

    // Retourner la classe mise à jour avec ses séries
    return response()->json([
        'message' => 'Séries mises à jour avec succès',
        'class' => Classes::with('series')->find($id)
    ], 200);
}

    public function index1(Request $request)
{
    $query = Classes::query();

    if ($request->has('with_series')) {
        $query->with('series');
    }

    return $query->get();
}



    // Met à jour une matiere spécifique
    public function update(Request $request, $id)
    {
        $classe = Classes::find($id);

        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $validatedData = $request->validate([
            'nom_classe'=>'string|required'
        ]);

        $classe->update($validatedData);

        return response()->json($classe, 200);
    }

    // Supprime une matiere spécifique
    public function destroy($id)
    {
        $classe = Classes::find($id);
        // Vérifie si la matière existe
        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $classe->delete();

        return response()->json(['message' => 'Matière supprimée'], 200);
    }

    // Nouvelle méthode pour lier les matières aux séries d'une classe
    public function updateSeriesMatieres(Request $request, $classId, $serieId)
    {
        $class = Classes::find($classId);
        if (!$class) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $serie = $class->series()->find($serieId);
        if (!$serie) {
            return response()->json(['message' => 'Série non trouvée pour cette classe'], 404);
        }

        $validated = $request->validate([
            'matieres' => 'required|array',
            'matieres.*' => 'exists:matieres,id'
        ]);

        // Synchroniser les matières pour cette série spécifique
        $serie->matieres()->sync($validated ['matieres']);

        return response()->json([
            'message' => 'Matières mises à jour avec succès',
            'serie' => $serie->load('matieres')
        ], 200);
    }


    //Recuperer un classe specifique avec leur series
    public function getClasseWithSeries($id)
    {
        $classe = Classes::with('series')->find($id);
        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }
        return response()->json($classe, 200);
    }





    // Récupère toutes les classes avec leurs séries, matières et enseignants
    public function index(Request $request)
    {
        $query = Classes::query();
        // Filtrage par catégorie de classe
        if ($request->has('categorie_classe')) {
            $query->where('categorie_classe', $request->input('categorie_classe'));
        }
        // Chargement des relations selon les paramètres
        if ($request->has('with_series')) {
            $query->with('series');
        }

        if ($request->has('with_matieres')) {
            $query->with('series.matieres');
        }

        if ($request->has('with_enseignants')) {
            $query->with('series.matieres.enseignants');
        }

        $classes = $query->get();

        return response()->json($classes);
    }
    public function indexS(Request $request)
    {
        $query = Classes::where('categorie_classe', "Secondaire");

        // Chargement des relations selon les paramètres
        if ($request->has('with_series')) {
            $query->with('series');
        }


        if ($request->has('with_matieres')) {
            $query->with('series.matieres');
        }

        if ($request->has('with_enseignants')) {
            $query->with('series.matieres.enseignants');
        }

        $classes = $query->get();

        return response()->json($classes);
    }




    // Récupère une classe spécifique
    public function show($id)
    {
        $classe = Classes::findOrFail($id);
        return response()->json($classe);
    }


// Récupérer les matières d'une série dans une classe
    public function getSeriesMatieres($classId, $serieId)
    {
        $class = Classes::find($classId);
        if (!$class) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $serie = $class->series()->find($serieId);
        if (!$serie) {
            return response()->json(['message' => 'Série non trouvée pour cette classe'], 404);
        }

        return response()->json($serie->matieres, 200);
    }

    //Recuperer les classes de la maternelle
    public function getClassesM(Request $request)
    {
        $classes = Classes::where('categorie_classe', 'Maternelle')->with('enseignantsMP')->get();

        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Aucune classe trouvée pour cette catégorie'], 404);
        }

        return response()->json($classes, 200);
    }

    //Recuperer les classes du Primaire
    public function getClassesP(Request $request)
    {
        $classes = Classes::where('categorie_classe', 'Primaire')->with('enseignantsMP')->get();

        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Aucune classe trouvée pour cette catégorie'], 404);
        }

        return response()->json($classes, 200);
    }


    //recuperer les classes du Secondaire avec les periodes et les types d'evaluation
    public function getClassesWithPeriodesAndTypesS(Request $request)
    {
        $classes = Classes::where('categorie_classe', 'Secondaire')
            ->with(['typeEvaluations'])
            ->get();
        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Aucune classe trouvée pour cette catégorie'], 404);
        }
        return response()->json($classes, 200);
    }

    //recuperer les classes du Secondaire avec les periodes et les types d'evaluation
    public function getClassesWithPeriodesAndTypesP(Request $request)
    {
        $classes = Classes::where('categorie_classe', 'Primaire')
            ->with(['typeEvaluations'])
            ->get();
        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Aucune classe trouvée pour cette catégorie'], 404);
        }
        return response()->json($classes, 200);
    }

    //recuperer les classes du Maternelle avec les periodes et les types d'evaluation
    public function getClassesWithPeriodesAndTypesM(Request $request)
    {
        $classes = Classes::where('categorie_classe', 'Matrnelle')
            ->with(['typeEvaluations'])
            ->get();
        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Aucune classe trouvée pour cette catégorie'], 404);
        }
        return response()->json($classes, 200);
    }

    //Recuperer les classes du Secondaire
    public function getClassesS(Request $request)
    {
        $classes = Classes::where('categorie_classe', 'Secondaire')->get();

        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Aucune classe trouvée pour cette catégorie'], 404);
        }

        return response()->json($classes, 200);
    }

    public function getEleves($id)
    {
        $eleves = DB::table('eleves')
            ->where('classe_id', $id)
            ->select('id', 'nom', 'prenom', 'matricule')
            ->get();

        return response()->json(['success' => true, 'data' => $eleves]);
    }

}
