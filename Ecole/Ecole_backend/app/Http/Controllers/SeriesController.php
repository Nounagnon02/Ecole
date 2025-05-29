<?php

namespace App\Http\Controllers;

use App\Models\Eleves;
use App\Models\Matieres;
use App\Models\Series;
use Illuminate\Http\Request;

class SeriesController extends Controller
{

    /**
     * SeriesController constructor.
     */

    
    public function index(){
        return Series::all();
    }
    
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
    
    // Récupère les matières d'une série spécifique avec leurs coefficients
    /**
     * Récupère les matières d'une série spécifique avec leurs coefficients
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMatieresWithCoefficients($id)
    {
        $serie = Series::find($id);

        if (!$serie) {
            return response()->json(['message' => 'Serie non trouvée'], 404);
        }

        $matieres = $serie->getMatieresWithCoefficients();

        return response()->json($matieres, 200);
    }

    // Calcule la moyenne générale d'un élève dans une série spécifique
    public function calculMoyenneGenerale($id, $eleve_id)
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

    

}
