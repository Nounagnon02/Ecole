<?php

namespace App\Http\Controllers;

use App\Models\Coefficients;
use App\Models\Matieres;
use App\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MatieresController extends Controller
{
    private const SERIES_MAP = [
        'maternelle' => ['Maternelle 1', 'Maternelle 2', 'Maternelle'],
        'primaire'   => ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'],
        'secondaire' => ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale', 'Tle'],
    ];

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
        $matieres = Matieres::with(['series' => function($query) {
            $query->select('series.id', 'series.nom')
                ->withPivot('coefficient','classe_id');
        }])->get();

        return response()->json($matieres->map(function($matiere) {
            return [
                'id' => $matiere->id,
                'nom' => $matiere->nom,
                'classe_id' => $matiere->classe_id,
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
            'nom' => 'string|required',
            'volume_horaire' => 'nullable|integer|min:1'
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
            'nom'=>'string|required',
            'volume_horaire'=>'nullable|integer|min:1'
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

    /**
     * Logique commune aux trois niveaux (maternelle/primaire/secondaire).
     * Regroupe les matières des séries d'un niveau, sans doublons.
     */
    private function matieresParNiveau(string $niveau, bool $flatten = false)
    {
        if (!isset(self::SERIES_MAP[$niveau])) {
            return response()->json([
                'success' => false,
                'message' => 'Niveau invalide'
            ], 404);
        }

        $series = Series::whereIn('nom', self::SERIES_MAP[$niveau])
            ->with(['matieres' => function($query) {
                $query->select('matieres.id', 'matieres.nom')
                    ->withPivot('coefficient');
            }])
            ->get();

        if ($series->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => "Aucune série de $niveau trouvée"
            ], 404);
        }

        $data = $series->map(function($serie) {
            return $serie->matieres->map(function($matiere) use ($serie) {
                return [
                    'id' => $matiere->id,
                    'nom' => $matiere->nom,
                    'coefficient' => $matiere->pivot->coefficient,
                    'classe' => $serie->nom
                ];
            });
        });

        if ($flatten) {
            $data = $data->flatten(1)->unique('id')->values();
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ], 200);
    }

    // Matières des classes de la maternelle
    public function getMatieresM()
    {
        return $this->matieresParNiveau('maternelle', flatten: true);
    }

    // Matières des classes du primaire
    public function getMatieresP()
    {
        return $this->matieresParNiveau('primaire');
    }

    // Matières des classes du secondaire
    public function getMatieresS()
    {
        return $this->matieresParNiveau('secondaire');
    }

    /**
     * Get subjects filtered by education level (niveau).
     * GET /matieres/niveaux/{niveau}
     */
    public function getByNiveau($niveau)
    {
        $niveau = strtolower($niveau);

        if (!isset(self::SERIES_MAP[$niveau])) {
            return response()->json(['success' => false, 'message' => 'Niveau invalide'], 404);
        }

        $matieres = Matieres::whereHas('series', function ($q) use ($niveau) {
            $q->whereIn('nom', self::SERIES_MAP[$niveau]);
        })->get(['id', 'nom']);

        return response()->json(['success' => true, 'data' => $matieres]);
    }

    /**
     * Affecte une matière à une série/classe avec un coefficient.
     * Ligne pivot `serie_matieres` + ligne `coefficient_matieres` (si coefficient fourni).
     *
     * POST /matieres/{id}/series
     * Body : { "series": [{ "serie_id": 1, "coefficient": 3, "classe_id": 4 }] }
     */
    public function attachSeries(Request $request, $id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $validated = $request->validate([
            'series' => 'required|array',
            'series.*.serie_id' => ['required', Rule::exists('series', 'id')],
            'series.*.coefficient' => 'nullable|numeric|min:0.5|max:20',
            'series.*.classe_id' => ['required', Rule::exists('classes', 'id')],
        ]);

        foreach ($validated['series'] as $lien) {
            $matiere->series()->syncWithoutDetaching([
                $lien['serie_id'] => [
                    'coefficient' => $lien['coefficient'] ?? 1,
                    'classe_id' => $lien['classe_id'],
                ]
            ]);

            if (isset($lien['coefficient'])) {
                Coefficients::updateOrCreate(
                    [
                        'matiere_id' => $matiere->id,
                        'serie_id' => $lien['serie_id'],
                        'classe_id' => $lien['classe_id'],
                    ],
                    ['coefficient' => $lien['coefficient']]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Matières affectées',
            'data' => $matiere->series()->withPivot('coefficient', 'classe_id')->get()
        ], 200);
    }

    /**
     * Retire une matière d'une série.
     * DELETE /matieres/{id}/series/{serieId}
     */
    public function detachSeries($id, $serieId)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $matiere->series()->detach($serieId);
        Coefficients::where('matiere_id', $id)->where('serie_id', $serieId)->delete();

        return response()->json(['success' => true, 'message' => 'Matière retirée de la série'], 200);
    }

    /**
     * Coefficients (par classe/série) d'une matière.
     * GET /matieres/{id}/coefficients
     */
    public function getCoefficients($id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $coefficients = Coefficients::where('matiere_id', $id)
            ->with(['matiere'])
            ->get(['id', 'serie_id', 'classe_id', 'coefficient']);

        return response()->json(['success' => true, 'data' => $coefficients], 200);
    }
}
