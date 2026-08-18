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

    public function index()
    {
        return Matieres::paginate(50);
    }

    public function Serie_avec_matieres()
    {
        return Series::with('matieres')->get();
    }

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

    public function store(Request $request)
    {
        $this->authorize('create', Matieres::class);

        $validated = $request->validate([
            'nom' => 'required|string|unique:matieres,nom',
            'volume_horaire' => 'nullable|integer|min:1'
        ]);

        try {
            $matiere = Matieres::create($validated);
            return response()->json($matiere, 201);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    public function show($id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        return response()->json($matiere);
    }

    public function update(Request $request, $id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $this->authorize('update', $matiere);

        $validated = $request->validate([
            'nom' => 'required|string|unique:matieres,nom,' . $id,
            'volume_horaire' => 'nullable|integer|min:1'
        ]);

        try {
            $matiere->update($validated);
            return response()->json($matiere);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    public function destroy($id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $this->authorize('delete', $matiere);

        $hasCoefficients = Coefficients::where('matiere_id', $id)->exists();
        $hasSeries = $matiere->series()->exists();

        if ($hasCoefficients || $hasSeries) {
            return response()->json([
                'message' => 'Impossible de supprimer : la matière a des coefficients ou des séries associées'
            ], 422);
        }

        try {
            $matiere->delete();
            return response()->json(['message' => 'Matière supprimée']);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            return response()->json(['message' => 'Erreur lors de la suppression', 'error' => $this->clientErrorMessage($e)], 500);
        }
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

        return response()->json($series);
    }

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
        ]);
    }

    public function getMatieresM()
    {
        return $this->matieresParNiveau('maternelle', flatten: true);
    }

    public function getMatieresP()
    {
        return $this->matieresParNiveau('primaire');
    }

    public function getMatieresS()
    {
        return $this->matieresParNiveau('secondaire');
    }

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
        ]);
    }

    public function detachSeries($id, $serieId)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $matiere->series()->detach($serieId);
        Coefficients::where('matiere_id', $id)->where('serie_id', $serieId)->delete();

        return response()->json(['success' => true, 'message' => 'Matière retirée de la série']);
    }

    public function getCoefficients($id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $coefficients = Coefficients::where('matiere_id', $id)
            ->with(['matiere'])
            ->get(['id', 'serie_id', 'classe_id', 'coefficient']);

        return response()->json(['success' => true, 'data' => $coefficients]);
    }
}
