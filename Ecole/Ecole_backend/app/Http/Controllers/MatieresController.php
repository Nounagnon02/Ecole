<?php

namespace App\Http\Controllers;

use App\Models\Matieres;
use App\Models\Series;
use Illuminate\Http\Request;

class MatieresController extends Controller
{
    public function index(){
        return Matieres::all();
    }


    public function Serie_avec_matieres()
    {
        return Series::with('matieres')->get();
    }

    /**
     * Affiche toutes les matières avec leurs séries et coefficients.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function indexWithSeries()
    {
        // Charger les matières avec leurs séries et les coefficients
        $matieres = Matieres::with(['series' => function($query) {
            $query->select('series.id', 'series.nom')
                ->withPivot('coefficient','classe_id');
        }])->get();

        return response()->json($matieres->map(function($matiere) {
            return [
                'id' => $matiere->id,
                'nom' => $matiere->nom,
                'classe_id' =>$matiere->classe_id,
                'series' => $matiere->series->map(function($serie) {
                    return [
                        'id' => $serie->id,
                        'nom' => $serie->nom,
                        'coefficient' => $serie->pivot->coefficient
                    ];
                })
            ];
        }));
    }


    public function store(Request $request){
        $validated = $request->validate([
            'nom' => 'string|required'
        ]);
        $matieres = Matieres::create($validated);

        return response()->json($matieres, 201);
}
    // Affiche une matiere spécifique
    public function show($id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        return response()->json($matiere, 200);
    }

    // Met à jour une matiere spécifique
    public function update(Request $request, $id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $validatedData = $request->validate([
            'nom'=>'string|required'
        ]);

        $matiere->update($validatedData);

        return response()->json($matiere, 200);
    }

    // Supprime une matiere spécifique
    public function destroy($id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $matiere->delete();

        return response()->json(['message' => 'Matière supprimée'], 200);
    }

        public function getSeries($id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $series = $matiere->series()->get()->map(function ($serie) {
            return [
                'id' => $serie->id,
                'nom' => $serie->nom,
                'coefficient' => $serie->pivot->coefficient
            ];
        });

        return response()->json($series, 200);
    }

    //Recuperer les matieres des classe de la maternelle

    public function getMatieresM()
{
    try {
        $maternelleSeries = Series::whereIn('nom', ['Maternelle 1', 'Maternelle 2', 'Maternelle'])
            ->with(['matieres' => function($query) {
                $query->select('matieres.id', 'matieres.nom')
                    ->withPivot('coefficient');
            }])
            ->get();

        if ($maternelleSeries->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune série de maternelle trouvée'
            ], 404);
        }

        // Créer un tableau plat de toutes les matières
        $allMatieres = $maternelleSeries->flatMap(function($serie) {
            return $serie->matieres->map(function($matiere) use ($serie) {
                return [
                    'id' => $matiere->id,
                    'nom' => $matiere->nom,
                    'coefficient' => $matiere->pivot->coefficient,
                    'classe' => $serie->nom // Optionnel: garder l'info de la classe
                ];
            });
        })->unique('id')->values(); // Éviter les doublons

        return response()->json([
            'success' => true,
            'data' => $allMatieres
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la récupération des matières: ' . $e->getMessage()
        ], 500);
    }
}

    //Recuperer les matieres des classes du primaire


    //Recuperer les matieres des classes du primaire
    public function getMatieresP()
    {
        try {
            // Récupérer toutes les matieres du primaire
            $primaireSeries = Series::whereIn('nom', ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'])
                ->with(['matieres' => function($query) {
                    $query->select('matieres.id', 'matieres.nom')
                        ->withPivot('coefficient');
                }])
                ->get();

            if ($primaireSeries->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Aucune série de primaire trouvée'
                ], 404);
            }

            // Formater la réponse
            $result = $primaireSeries->map(function($serie) {
                return $serie->matieres->map(function($matiere) use ($serie) {
                return [
                    'id' => $matiere->id,
                    'nom' => $matiere->nom,
                    'coefficient' => $matiere->pivot->coefficient,
                    'classe' => $serie->nom // Optionnel: garder l'info de la classe
                ];
            });
            });

            return response()->json([
                'success' => true,
                'data' => $result
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des matières: ' . $e->getMessage()
            ], 500);
        }
    }

    //Recuperer les matieres des classes du secondaire
    public function getMatieresS()
    {
        try {
            // Récupérer toutes les séries du secondaire
            $secondaireSeries = Series::whereIn('nom', ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale','Tle'])
                ->with(['matieres' => function($query) {
                    $query->select('matieres.id', 'matieres.nom')
                        ->withPivot('coefficient');
                }])
                ->get();

            if ($secondaireSeries->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune série de secondaire trouvée'
                ], 404);
            }

            // Formater la réponse
            $result = $secondaireSeries->map(function($serie) {
                return $serie->matieres->map(function($matiere) use ($serie) {
                return [
                    'id' => $matiere->id,
                    'nom' => $matiere->nom,
                    'coefficient' => $matiere->pivot->coefficient,
                    'classe' => $serie->nom // Optionnel: garder l'info de la classe
                ];
            });
            });

            return response()->json([
                'success' => true,
                'data' => $result
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des matières: ' . $e->getMessage()
            ], 500);
        }
    }

}
