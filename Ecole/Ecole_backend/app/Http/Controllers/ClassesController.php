<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Eleve;
use App\Models\EnseignantMatiere;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Support\Cycles;

class ClassesController extends Controller
{
    public function store(\App\Http\Requests\StoreClasseRequest $request)
    {
        try {
            $validated = $request->validated();

            $classe = Classes::create([
                'nom_classe' => $validated['nom_classe'],
                'categorie_classe' => $validated['categorie_classe'],
                'capacite_max' => $validated['capacite_max'] ?? null,
            ]);

            // `event(new Registered($classe))` a été retiré : la classe n'était
            // pas importée (Error fatale non rattrapée par catch(\Exception) →
            // 500 systématique), et Registered est un événement d'inscription
            // d'utilisateur, sans rapport avec la création d'une classe (F4).
            \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

            return response()->json($classe, 201);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            Log::error('Erreur création classe', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'ajout',
            ], 500);
        }
    }

    public function getEffectifEcole(){
        $effectif = Classes::count();
        return response()->json($effectif);
    }

    public function getEffectifMaternelle(){
        $effectif = Classes::where('categorie_classe', Cycles::KINDERGARTEN)->count();
        return response()->json($effectif);
    }

    public function getEffectifPrimaire(){
        $effectif = Classes::where('categorie_classe', Cycles::PRIMARY)->count();
        return response()->json($effectif);
    }

    public function getEffectifSecondaire(){
        $effectif = Classes::where('categorie_classe', Cycles::SECONDARY)->count();
        return response()->json($effectif);
    }

    // NOTE: une méthode de relation Eloquent (`$this->belongsToMany(...)`)
    // avait été copiée ici depuis le modèle Classes. Dans un contrôleur elle
    // lève une Error. Elle vit désormais uniquement dans App\Models\Classes.

    public function attachMatieres(Request $request, $id)
    {
        try {
            $classe = Classes::findOrFail($id);

            $validated = $request->validate([
                'matieres' => 'required|array',
                'matieres.*.id' => 'required|school_exists:matieres,id',
                'categorie_classe' => 'required|string|' . Cycles::rule()
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
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'message' => 'Erreur lors de l\'attachement des matières',
                'error' => $this->clientErrorMessage($e)
            ], 500);
        }
    }

    /**
     * Classes d'un cycle avec leurs séries (distinctes) et matières par série.
     */
    private function classesWithSeriesAndMatieres(?string $cycle = null)
    {
        $query = Classes::query();

        if ($cycle !== null) {
            $query->where('categorie_classe', $cycle);
        }

        return $query->with(['series' => function($query) {
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

    public function getClassesWithSeriesAndMatieres()
    {
        return $this->classesWithSeriesAndMatieres();
    }

    public function getClassesWithSeriesAndMatieresMaternelle()
    {
        return $this->classesWithSeriesAndMatieres(Cycles::KINDERGARTEN);
    }

    public function getClassesWithSeriesAndMatieresPrimaire()
    {
        return $this->classesWithSeriesAndMatieres(Cycles::PRIMARY);
    }

    public function getClassesWithSeriesAndMatieresSecondaire()
    {
        return $this->classesWithSeriesAndMatieres(Cycles::SECONDARY);
    }

    /**
     * Effectifs des classes d'un cycle, avec les enseignants maternelle/primaire.
     */
    private function classesWithEffectif(string $cycle)
    {
        return Classes::where('categorie_classe', $cycle)
            ->withCount('eleves')
            ->with('enseignantsMP')
            ->get()
            ->map(function($classe) {
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
    }

    public function getClassesWithEffectifM()
    {
        return response()->json($this->classesWithEffectif(Cycles::KINDERGARTEN), 200);
    }

    public function getClassesWithEffectifP()
    {
        return response()->json($this->classesWithEffectif(Cycles::PRIMARY), 200);
    }

    public function getClassesWithEffectifS()
    {
        return response()->json($this->classesWithEffectif(Cycles::SECONDARY), 200);
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
            $this->rethrowIfMeaningful($e);
            return response()->json([
                'message' => 'Erreur lors de la récupération des matières',
                'error' => $this->clientErrorMessage($e)
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
            'series.*' => 'school_exists:series,id'
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
        return $this->index($request);
    }

    // Met à jour une matiere spécifique
    public function update(Request $request, $id)
    {
        $classe = Classes::find($id);

        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $validatedData = $request->validate([
            'nom_classe'=>'string|required',
            'capacite_max'=>'nullable|integer|min:1'
        ]);

        $classe->update($validatedData);

        return response()->json($classe, 200);
    }

    // Supprime une classe spécifique
    public function destroy($id)
    {
        $classe = Classes::find($id);
        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $elevesCount = $classe->eleves()->count();
        if ($elevesCount > 0) {
            return response()->json([
                'message' => "Impossible de supprimer : {$elevesCount} élève(s) inscrit(s) dans cette classe"
            ], 422);
        }

        $classe->delete();

        return response()->json(['message' => 'Classe supprimée']);
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
            'matieres.*' => 'school_exists:matieres,id'
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
        $request->merge(['categorie_classe' => Cycles::SECONDARY]);
        return $this->index($request);
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

    /**
     * Classes d'un cycle, avec enseignants maternelle/primaire.
     */
    private function classesParCycle(string $cycle)
    {
        $classes = Classes::where('categorie_classe', $cycle)->with('enseignantsMP')->get();

        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Aucune classe trouvée pour cette catégorie'], 404);
        }

        return response()->json($classes, 200);
    }

    public function getClassesM(Request $request)
    {
        return $this->classesParCycle(Cycles::KINDERGARTEN);
    }

    public function getClassesP(Request $request)
    {
        return $this->classesParCycle(Cycles::PRIMARY);
    }

    public function getClassesS(Request $request)
    {
        $classes = Classes::where('categorie_classe', Cycles::SECONDARY)->get();

        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Aucune classe trouvée pour cette catégorie'], 404);
        }

        return response()->json($classes, 200);
    }

    /**
     * Classes d'un cycle avec leurs types d'évaluation.
     */
    private function classesWithPeriodesAndTypes(string $cycle)
    {
        $classes = Classes::where('categorie_classe', $cycle)
            ->with(['typeEvaluations'])
            ->get();
        if ($classes->isEmpty()) {
            return response()->json(['message' => 'Aucune classe trouvée pour cette catégorie'], 404);
        }
        return response()->json($classes, 200);
    }

    public function getClassesWithPeriodesAndTypesS(Request $request)
    {
        return $this->classesWithPeriodesAndTypes(Cycles::SECONDARY);
    }

    public function getClassesWithPeriodesAndTypesP(Request $request)
    {
        return $this->classesWithPeriodesAndTypes(Cycles::PRIMARY);
    }

    public function getClassesWithPeriodesAndTypesM(Request $request)
    {
        return $this->classesWithPeriodesAndTypes(Cycles::KINDERGARTEN);
    }

    public function getEleves($id)
    {
        // `DB::table` contournait le scope BelongsToEcole, et les colonnes
        // visées n'existent pas : la clé est `classe_id`, le matricule
        // `numero_matricule`, et nom/prénom vivent sur `users`.
        $eleves = Eleve::with('user:id,name,prenom')
            ->where('classe_id', $id)
            ->get(['id', 'user_id', 'numero_matricule'])
            ->map(fn($e) => [
                'id' => $e->id,
                'nom' => $e->user->name ?? '',
                'prenom' => $e->user->prenom ?? '',
                'matricule' => $e->numero_matricule,
            ]);

        return response()->json(['success' => true, 'data' => $eleves]);
    }

    /**
     * Enseignants affectés à une classe (via le pivot enseignant_matiere),
     * avec la matière et la série couvertes.
     * GET /classes/{id}/enseignants
     */
    public function getEnseignants($id)
    {
        $classe = Classes::find($id);
        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $enseignants = EnseignantMatiere::withoutGlobalScope('ecole')
            ->where('classe_id', $id)
            ->with([
                'enseignant.user:id,name,prenom',
                'matiere:id,nom',
                'serie:id,nom',
            ])
            ->orderBy('matiere_id')
            ->get(['id', 'enseignant_id', 'matiere_id', 'serie_id']);

        return response()->json(['success' => true, 'data' => $enseignants]);
    }

}
